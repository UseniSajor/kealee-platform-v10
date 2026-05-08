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
import { getSupabaseAdmin }          from '@/lib/supabase-server'
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
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  // Auth — Vercel sends Authorization: Bearer <CRON_SECRET>
  if (CRON_SECRET) {
    const auth = req.headers.get('authorization') ?? ''
    if (auth !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
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

  const processed: string[] = []
  const failed:    string[] = []

  for (const row of (rows ?? []) as QueueRow[]) {
    try {
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

  console.log(`[cron/sequences] Processed ${processed.length}, Failed ${failed.length}`)

  return NextResponse.json({
    processed: processed.length,
    failed:    failed.length,
    total:     (rows ?? []).length,
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
