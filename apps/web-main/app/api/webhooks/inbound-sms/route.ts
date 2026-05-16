/**
 * Inbound SMS Reply Handler (Phase 3)
 *
 * Receives SMS replies from GHL (or Twilio webhook)
 * Classifies urgency and stores in lead_notes
 * Escalates urgent replies to Slack
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendLeadToSlack } from '@/lib/marketing/slack-client'
import { ClaudeCachedClient } from '@/lib/anthropic/claude-cached-client'
import { AI_MODELS } from '@kealee/core-rules'

export const dynamic = 'force-dynamic'


export interface InboundSmsInput {
  ghlContactId: string
  message: string
  timestamp?: string
}

export interface SmsClassification {
  urgency: 'urgent' | 'followup' | 'closed' | 'escalate'
  confidence: number         // 0–100
  reasoning: string
  suggestedAction?: string
}

/**
 * POST /api/webhooks/inbound-sms
 *
 * Receives SMS replies and classifies them
 */
export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const client = new ClaudeCachedClient()

  try {
    const body = (await req.json()) as InboundSmsInput

    if (!body.ghlContactId || !body.message) {
      return NextResponse.json(
        { error: 'Missing ghlContactId or message' },
        { status: 400 }
      )
    }

    // Find intake by GHL contact ID
    const { data: intakes, error: findErr } = await supabase
      .from('public_intake_leads')
      .select('id, name, service_type')
      .eq('ghl_contact_id', body.ghlContactId)
      .limit(1)

    if (findErr) throw new Error(`Find intake: ${findErr.message}`)

    if (!intakes || intakes.length === 0) {
      console.log(`SMS received for unknown GHL contact: ${body.ghlContactId}`)
      return NextResponse.json({ linked: false })
    }

    const intake = intakes[0]

    // Classify SMS reply
    const classification = await classifySmsReply(client, body.message)

    // Store in lead_notes
    const { error: noteErr } = await supabase
      .from('lead_notes')
      .insert({
        intake_id: intake.id,
        note: body.message,
        note_type: 'sms_reply',
        ai_classified_as: classification.urgency,
      })
    if (noteErr) console.error('Lead note insert error:', noteErr)

    // Escalate urgent replies to Slack
    if (classification.urgency === 'urgent' || classification.urgency === 'escalate') {
      await sendLeadToSlack({
        leadId: intake.id,
        leadName: intake.name,
        leadService: intake.service_type,
        leadBudget: 'N/A',
        leadScore: 90,
        routingTag: 'urgent-reply',
        ghlLink: `https://app.leadconnectorhq.com/contacts/${body.ghlContactId}`,
      })
    }

    return NextResponse.json({
      processed: true,
      intakeId: intake.id,
      classification,
    })
  } catch (err) {
    console.error('SMS classification error:', err)
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    )
  }
}

/**
 * Classify inbound SMS using Claude
 */
async function classifySmsReply(client: ClaudeCachedClient, message: string): Promise<SmsClassification> {
  const systemPrompt = `You are an SMS classification expert for a construction services platform.

Classify user SMS replies based on urgency:

1. URGENT: Immediate action required (complaining, ready to book call today, critical issue)
2. ESCALATE: Needs manager attention (confused about terms, wants refund, complaint)
3. FOLLOWUP: Normal engagement (asking questions, needs more info, positive but not ready)
4. CLOSED: Conversation complete (thanks, goodbye, no thanks)

Output JSON:
{
  "urgency": "urgent|escalate|followup|closed",
  "confidence": 0-100,
  "reasoning": "Brief explanation",
  "suggestedAction": "What sales/support should do"
}`

  const userPrompt = `Classify this SMS reply:
"${message}"

Provide JSON response with urgency level, confidence (0-100), reasoning, and suggested action.`

  try {
    const response = await client.message({
      model: AI_MODELS.conceptText,
      max_tokens: 200,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type')
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found')
    }

    return JSON.parse(jsonMatch[0]) as SmsClassification
  } catch (err) {
    console.error('SMS classification failed:', err)
    return {
      urgency: 'followup',
      confidence: 50,
      reasoning: 'Classification failed, defaulting to followup',
    }
  }
}
