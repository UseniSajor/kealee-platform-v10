/**
 * POST /api/webhooks/ghl
 *
 * Receives webhooks from GoHighLevel for:
 * - Contact stage changes
 * - Opportunity updates
 * - Other GHL events
 *
 * Verifies webhook signature and updates Supabase accordingly
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

const GHL_WEBHOOK_SECRET = process.env.GHL_WEBHOOK_SECRET || ''

/**
 * Verify GHL webhook signature
 */
function verifyGhlWebhook(body: string, signature: string): boolean {
  if (!GHL_WEBHOOK_SECRET) {
    console.warn('GHL_WEBHOOK_SECRET not set; skipping signature verification')
    return true
  }

  const hash = crypto
    .createHmac('sha256', GHL_WEBHOOK_SECRET)
    .update(body)
    .digest('hex')

  return hash === signature
}

export async function POST(req: NextRequest) {
  try {
    // ── Get raw body and signature ────────────────────────────────────────
    const rawBody = await req.text()
    const signature = req.headers.get('x-ghl-signature') || ''

    // ── Verify webhook ──────────────────────────────────────────────────
    if (!verifyGhlWebhook(rawBody, signature)) {
      console.warn('GHL webhook signature mismatch')
      return NextResponse.json(
        { error: 'Signature mismatch' },
        { status: 401 }
      )
    }

    const payload = JSON.parse(rawBody)

    // ── Route by event type ─────────────────────────────────────────────
    const { type, data } = payload

    switch (type) {
      case 'contact.updated':
      case 'contact.status_changed':
        return handleContactUpdate(data)

      case 'opportunity.stage_changed':
      case 'opportunity.updated':
        return handleOpportunityUpdate(data)

      default:
        console.log(`Unhandled GHL event type: ${type}`)
        return NextResponse.json({ received: true })
    }
  } catch (err) {
    console.error('GHL webhook error:', err)
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    )
  }
}

/**
 * Handle contact update from GHL
 */
async function handleContactUpdate(data: any) {
  try {
    const { id: ghlContactId, email } = data

    if (!ghlContactId) {
      return NextResponse.json({ error: 'Missing ghl contact id' }, { status: 400 })
    }

    // Find intake by GHL contact ID
    const { data: intakes, error: findErr } = await supabase
      .from('public_intake_leads')
      .select('id')
      .eq('ghl_contact_id', ghlContactId)
      .limit(1)

    if (findErr) throw new Error(`Find intake: ${findErr.message}`)

    if (!intakes || intakes.length === 0) {
      // Contact not yet linked to an intake; optionally create a new one
      console.log(`GHL contact ${ghlContactId} not linked to intake`)
      return NextResponse.json({ linked: false })
    }

    const intakeId = intakes[0].id

    // Log sync
    const { error: syncLogErr } = await supabase
      .from('ghl_sync_log')
      .insert({
        intake_id: intakeId,
        ghl_contact_id: ghlContactId,
        action: 'update',
        ghl_response: data,
      })
    if (syncLogErr) console.error('GHL sync log error:', syncLogErr)

    return NextResponse.json({
      processed: true,
      intakeId,
      ghlContactId,
    })
  } catch (err) {
    console.error('Contact update error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}

/**
 * Handle opportunity update from GHL
 */
async function handleOpportunityUpdate(data: any) {
  try {
    const { id: oppId, contactId, pipelineStageId, status } = data

    if (!contactId) {
      return NextResponse.json(
        { error: 'Missing contact id' },
        { status: 400 }
      )
    }

    // Find intake by GHL contact ID
    const { data: intakes, error: findErr } = await supabase
      .from('public_intake_leads')
      .select('id')
      .eq('ghl_contact_id', contactId)
      .limit(1)

    if (findErr) throw new Error(`Find intake: ${findErr.message}`)

    if (!intakes || intakes.length === 0) {
      console.log(`GHL contact ${contactId} not linked to intake`)
      return NextResponse.json({ linked: false })
    }

    const intakeId = intakes[0].id

    // Optionally update routing_tag based on opportunity status
    let newTag: string | null = null
    if (status === 'won') {
      newTag = 'won'
    } else if (status === 'lost') {
      newTag = 'lost'
    }

    if (newTag) {
      const { error: tagErr } = await supabase
        .from('public_intake_leads')
        .update({ routing_tag: newTag })
        .eq('id', intakeId)
      if (tagErr) console.error('Update routing tag error:', tagErr)
    }

    // Log sync
    const { error: stageLogErr } = await supabase
      .from('ghl_sync_log')
      .insert({
        intake_id: intakeId,
        ghl_contact_id: contactId,
        action: 'stage_move',
        ghl_response: data,
      })
    if (stageLogErr) console.error('GHL sync log error:', stageLogErr)

    return NextResponse.json({
      processed: true,
      intakeId,
      contactId,
      newStatus: newTag,
    })
  } catch (err) {
    console.error('Opportunity update error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}
