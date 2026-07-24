/**
 * GET /api/cron/sequences
 *
 * Vercel Cron job — runs every 5 minutes.
 * Queries ghl_sequence_queue for pending rows with scheduled_at <= now()
 * and processes each step via ghl-client functions.
 *
 * Vercel cron config (vercel.json):
 * schedule: every-5-minutes  ("*\/5 * * * *")
 */

import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAdmin }          from '@/lib/supabase-server'
import { isGhlEnabled } from '@/lib/marketing/ghl-enabled'
import { verifyCronRequest } from '@/lib/cron-auth'
import {

  sendSMS,
  sendEmail,
  tagContact,
  triggerWorkflow,
  createOpportunity,
  moveOpportunityStage,
} from '@/lib/marketing/ghl-client'

export const dynamic = 'force-dynamic'

const CRON_SECRET = process.env.CRON_SECRET ?? ''
const BATCH_LIMIT = 50

interface QueueRow {
  id:             string
  ghl_contact_id: string
  contact_id:     string
  sequence_id:    string
  step_index:     number
  step_type:      string
  payload:        Record<string, unknown>
  scheduled_at:   string
  status:         string
  normalized_email: string | null
  normalized_phone: string | null
}

/**
 * Suppression check for the legacy ghl_sequence_queue send path.
 *
 * Scope note: this only enforces marketing_suppressions (opt-out, hard
 * bounce, complaint, privacy request, manual/legal holds) — the unambiguous
 * "stop contacting this person" signals. It deliberately does NOT run the
 * full evaluateOutreachPolicy SMS-consent gate: that requires an affirmative
 * 'granted' marketing_consents record, which isn't backfilled for contacts
 * captured before the canonical consent pipeline existed. Wiring that in here
 * today would silently block ~all legacy SMS sends. Consent-gated enforcement
 * belongs to the canonical marketing_enrollments send path once capture
 * routes persist consent at intake (tracked separately).
 */
async function isSuppressed(
  supabase: SupabaseClient,
  identity: { email: string | null; phone: string | null },
): Promise<boolean> {
  if (!identity.email && !identity.phone) return false
  const now = new Date().toISOString()
  const orFilters: string[] = []
  if (identity.email) orFilters.push(`normalized_email.eq.${identity.email}`)
  if (identity.phone) orFilters.push(`normalized_phone.eq.${identity.phone}`)
  const { data, error } = await supabase
    .from('marketing_suppressions')
    .select('id, expires_at')
    .or(orFilters.join(','))
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .limit(1)
  if (error) {
    console.error('[cron/sequences] suppression lookup failed:', error.message)
    return false
  }
  return Boolean(data && data.length > 0)
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const cronDenied = verifyCronRequest(req)
  if (cronDenied) return cronDenied

  if (!isGhlEnabled()) {
    return NextResponse.json({
      skipped: true,
      reason: 'GHL disabled — using Kealee native drip (marketing_drip_queue)',
      processed: 0,
    })
  }

  const supabase = getSupabaseAdmin()

  // Fetch pending rows
  const { data: rows, error: fetchError } = await supabase
    .from('ghl_sequence_queue')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(BATCH_LIMIT)

  if (fetchError) {
    console.error('[cron/sequences] Fetch error:', fetchError.message)
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  const processed:  string[] = []
  const failed:     string[] = []
  const suppressed: string[] = []

  for (const row of (rows ?? []) as QueueRow[]) {
    try {
      if (row.step_type === 'sms' || row.step_type === 'email') {
        const blocked = await isSuppressed(supabase, {
          email: row.normalized_email,
          phone: row.normalized_phone,
        })
        if (blocked) {
          suppressed.push(row.id)
          await supabase
            .from('ghl_sequence_queue')
            .update({ status: 'suppressed', processed_at: new Date().toISOString() })
            .eq('id', row.id)
          continue
        }
      }

      await processStep(row)
      processed.push(row.id)

      await supabase
        .from('ghl_sequence_queue')
        .update({ status: 'processed', processed_at: new Date().toISOString() })
        .eq('id', row.id)
    } catch (e: any) {
      console.error(`[cron/sequences] Step failed: id=${row.id} type=${row.step_type} error=${e?.message}`)
      failed.push(row.id)

      await supabase
        .from('ghl_sequence_queue')
        .update({ status: 'failed', error_message: e?.message ?? 'Unknown error' })
        .eq('id', row.id)
    }
  }

  console.log(`[cron/sequences] Processed ${processed.length}, Suppressed ${suppressed.length}, Failed ${failed.length}`)

  return NextResponse.json({
    processed:  processed.length,
    suppressed: suppressed.length,
    failed:     failed.length,
    total:      (rows ?? []).length,
  })
}

// ── Step processor ────────────────────────────────────────────────────────────

async function processStep(row: QueueRow): Promise<void> {
  const { ghl_contact_id: contactId, step_type: type, payload } = row

  switch (type) {
    case 'sms': {
      const message = String(payload.message ?? '')
      if (!message) throw new Error('SMS step missing message')
      await sendSMS({ contactId, message })
      break
    }

    case 'email': {
      const subject = String(payload.subject ?? '')
      const html    = String(payload.html ?? '')
      if (!subject || !html) throw new Error('Email step missing subject or html')
      await sendEmail({ contactId, subject, html })
      break
    }

    case 'tag': {
      const tags = payload.tags as string[] | undefined
      if (!tags?.length) throw new Error('Tag step missing tags array')
      await tagContact(contactId, tags)
      break
    }

    case 'workflow': {
      const workflowId = String(payload.workflowId ?? '')
      if (!workflowId) throw new Error('Workflow step missing workflowId')
      await triggerWorkflow({
        contactId,
        workflowId,
        eventData: (payload.eventData ?? {}) as Record<string, string>,
      })
      break
    }

    case 'opportunity': {
      const pipelineId      = String(payload.pipelineId ?? '')
      const pipelineStageId = String(payload.pipelineStageId ?? '')
      const name            = String(payload.name ?? 'New Opportunity')
      if (!pipelineId || !pipelineStageId) throw new Error('Opportunity step missing pipelineId or pipelineStageId')
      await createOpportunity({
        contactId,
        name,
        pipelineId,
        pipelineStageId,
        monetaryValue: payload.monetaryValue as number | undefined,
      })
      break
    }

    case 'move_stage': {
      const opportunityId = String(payload.opportunityId ?? '')
      const newStageId    = String(payload.newStageId ?? '')
      if (!opportunityId || !newStageId) throw new Error('move_stage step missing opportunityId or newStageId')
      await moveOpportunityStage(opportunityId, newStageId)
      break
    }

    default:
      throw new Error(`Unknown step type: ${type}`)
  }
}
