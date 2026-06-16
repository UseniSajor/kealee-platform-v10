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
    let ghlContactId: string | undefined
    let message: string | undefined
    let fromPhone: string | undefined

    const contentType = req.headers.get('content-type') || ''
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData()
      message = (formData.get('Body') as string) || undefined
      fromPhone = (formData.get('From') as string) || undefined
    } else {
      try {
        const body = await req.json()
        ghlContactId = body.ghlContactId
        message = body.message
        if (!message && body.Body) message = body.Body
        if (!fromPhone && body.From) fromPhone = body.From
      } catch {
        return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
      }
    }

    if (!message) {
      return NextResponse.json(
        { error: 'Missing message body' },
        { status: 400 }
      )
    }

    let intake: { id: string; name: string; service_type: string } | null = null

    // ── Look up lead by GHL Contact ID ──────────────────────────────────
    if (ghlContactId) {
      const { data: intakes, error: findErr } = await supabase
        .from('public_intake_leads')
        .select('id, name, service_type')
        .eq('ghl_contact_id', ghlContactId)
        .limit(1)

      if (findErr) throw new Error(`Find intake by GHL: ${findErr.message}`)
      if (intakes && intakes.length > 0) {
        intake = intakes[0]
      }
    }

    // ── Fallback: Look up lead by sender phone number ──────────────────
    if (!intake && fromPhone) {
      const cleanPhone = fromPhone.replace(/\D/g, '')
      const orQuery = `contact_phone.eq.${fromPhone},phone_number.eq.${fromPhone}` + 
                      (cleanPhone ? `,contact_phone.ilike.%${cleanPhone}%,phone_number.ilike.%${cleanPhone}%` : '')

      const { data: intakes, error: findErr } = await supabase
        .from('public_intake_leads')
        .select('id, name, service_type')
        .or(orQuery)
        .order('created_at', { ascending: false })
        .limit(1)

      if (findErr) throw new Error(`Find intake by Phone: ${findErr.message}`)
      if (intakes && intakes.length > 0) {
        intake = intakes[0]
      }
    }

    if (!intake) {
      console.log(`SMS received from unattributed sender. Phone: ${fromPhone}, GHL Contact: ${ghlContactId}`)
      return NextResponse.json({ linked: false })
    }

    // Classify SMS reply
    const classification = await classifySmsReply(client, message)

    // Store in lead_notes
    const { error: noteErr } = await supabase
      .from('lead_notes')
      .insert({
        intake_id: intake.id,
        note: message,
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
        ghlLink: ghlContactId ? `https://app.leadconnectorhq.com/contacts/${ghlContactId}` : undefined,
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
