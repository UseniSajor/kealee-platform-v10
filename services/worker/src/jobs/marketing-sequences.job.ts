/**
 * services/worker/src/jobs/marketing-sequences.job.ts
 *
 * Runs every 15 minutes. Two jobs in one:
 *
 * 1. ABANDONED CHECKOUT WATCHER
 *    Polls public_intake_leads with status='new' older than 45 minutes
 *    that haven't been queued for follow-up yet.
 *    Enqueues the 3-touch abandoned checkout sequence (1h → 24h → 72h).
 *
 * 2. SOFT CAPTURE NURTURE WATCHER
 *    Polls contact_inquiries with source='soft_capture' older than 30 minutes
 *    that haven't been queued for nurture yet.
 *    Enqueues the 4-touch nurture sequence (1h → 24h → 72h → 7d).
 *
 * Both jobs mark the records so they are not re-queued on subsequent runs.
 */

import type { CronJobResult } from '../types/cron.types'
import { leadFollowupQueue } from '../queues/lead-followup.queue'
import { intakeProcessingQueue } from '../queues/intake-processing.queue'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// Threshold: intakes older than this are considered abandoned
const ABANDONED_THRESHOLD_MINUTES = 45

// Threshold: soft captures older than this get queued for nurture
const SOFT_CAPTURE_THRESHOLD_MINUTES = 30

// ── Supabase REST helper ───────────────────────────────────────────────────────

async function supabaseQuery(path: string, options: RequestInit = {}) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required')
  }
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Prefer': 'return=minimal',
      ...(options.headers ?? {}),
    },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Supabase ${options.method ?? 'GET'} ${path} → ${res.status}: ${text}`)
  }
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

// ── Abandoned checkout watcher ────────────────────────────────────────────────

async function watchAbandonedCheckouts(): Promise<number> {
  const cutoff = new Date(Date.now() - ABANDONED_THRESHOLD_MINUTES * 60 * 1000).toISOString()

  // Fetch new leads older than threshold that haven't been queued
  // We use metadata->>'followupQueued' as the idempotency flag
  const leads: any[] = await supabaseQuery(
    `public_intake_leads?status=eq.new&created_at=lt.${cutoff}&select=id,contact_email,client_name,project_type,metadata`,
    { method: 'GET', headers: { 'Prefer': 'return=representation' } }
  ).catch((err) => {
    console.warn('[marketing-sequences] abandoned checkout fetch failed (non-fatal):', err.message)
    return []
  })

  if (!leads || leads.length === 0) return 0

  let queued = 0
  for (const lead of leads) {
    const meta = (lead.metadata as Record<string, any>) ?? {}
    if (meta.followupQueued) continue // already queued

    try {
      await leadFollowupQueue.enqueueSequence({
        leadId: lead.id,
        email: lead.contact_email,
        firstName: lead.client_name?.split(' ')[0] ?? '',
        projectType: lead.project_type ?? 'your project',
        stage: 'ABANDONED_CHECKOUT',
        source: 'abandoned_checkout',
      })

      // Mark as queued so this cron doesn't re-queue on next run
      await supabaseQuery(
        `public_intake_leads?id=eq.${lead.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            metadata: { ...meta, followupQueued: true, followupQueuedAt: new Date().toISOString() },
          }),
        }
      )

      queued++
      console.log(`[marketing-sequences] abandoned checkout queued: ${lead.id} (${lead.contact_email})`)
    } catch (err: any) {
      console.warn(`[marketing-sequences] failed to queue abandoned checkout for ${lead.id}:`, err.message)
    }
  }

  return queued
}

// ── Soft capture nurture watcher ──────────────────────────────────────────────

async function watchSoftCaptures(): Promise<number> {
  const cutoff = new Date(Date.now() - SOFT_CAPTURE_THRESHOLD_MINUTES * 60 * 1000).toISOString()

  // Fetch soft capture rows not yet queued for nurture
  const captures: any[] = await supabaseQuery(
    `contact_inquiries?source=eq.soft_capture&created_at=lt.${cutoff}&select=id,email,name,metadata`,
    { method: 'GET', headers: { 'Prefer': 'return=representation' } }
  ).catch((err) => {
    console.warn('[marketing-sequences] soft capture fetch failed (non-fatal):', err.message)
    return []
  })

  if (!captures || captures.length === 0) return 0

  let queued = 0
  for (const capture of captures) {
    const meta = (capture.metadata as Record<string, any>) ?? {}
    if (meta.nurtureQueued) continue // already queued

    try {
      await leadFollowupQueue.enqueueNurtureSequence({
        leadId: capture.id,
        email: capture.email,
        firstName: capture.name?.split(' ')[0] ?? '',
        projectType: meta.service || meta.source || 'your project',
        stage: 'SOFT_CAPTURE',
        source: 'soft_capture',
      })

      // Mark as queued
      await supabaseQuery(
        `contact_inquiries?id=eq.${capture.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            metadata: { ...meta, nurtureQueued: true, nurtureQueuedAt: new Date().toISOString() },
          }),
        }
      )

      queued++
      console.log(`[marketing-sequences] soft capture nurture queued: ${capture.id} (${capture.email})`)
    } catch (err: any) {
      console.warn(`[marketing-sequences] failed to queue nurture for ${capture.id}:`, err.message)
    }
  }

  return queued
}

// ── Paid intake watcher ───────────────────────────────────────────────────────
// Bridges Stripe webhook → intake-processing queue.
// The Stripe webhook marks records as 'paid' in Supabase.
// This job picks them up and enqueues processing jobs.

async function watchPaidIntakes(): Promise<number> {
  const leads: any[] = await supabaseQuery(
    `public_intake_leads?status=eq.paid&select=id,project_type,contact_email,amount_paid,stripe_session_id,metadata`,
    { method: 'GET', headers: { 'Prefer': 'return=representation' } }
  ).catch((err) => {
    console.warn('[marketing-sequences] paid intake fetch failed (non-fatal):', err.message)
    return []
  })

  if (!leads || leads.length === 0) return 0

  let queued = 0
  for (const lead of leads) {
    const meta = (lead.metadata as Record<string, any>) ?? {}
    if (meta.processingQueued) continue // already in queue

    try {
      await intakeProcessingQueue.processIntake({
        intakeId: lead.id,
        projectPath: lead.project_type ?? 'unknown',
        amount: lead.amount_paid ?? 0,
        customerEmail: lead.contact_email,
        stripeSessionId: lead.stripe_session_id ?? 'unknown',
      })

      // Mark as queued
      await supabaseQuery(
        `public_intake_leads?id=eq.${lead.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            status: 'processing',
            metadata: { ...meta, processingQueued: true, processingQueuedAt: new Date().toISOString() },
          }),
        }
      )

      queued++
      console.log(`[marketing-sequences] paid intake queued for processing: ${lead.id}`)
    } catch (err: any) {
      console.warn(`[marketing-sequences] failed to queue paid intake ${lead.id}:`, err.message)
    }
  }

  return queued
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function executeMarketingSequences(): Promise<CronJobResult> {
  const start = Date.now()
  console.log('[marketing-sequences] Starting run')

  try {
    const [abandonedCount, nurtureCount, paidIntakeCount] = await Promise.all([
      watchAbandonedCheckouts(),
      watchSoftCaptures(),
      watchPaidIntakes(),
    ])

    const duration = Date.now() - start
    console.log(
      `[marketing-sequences] Done in ${duration}ms — abandoned=${abandonedCount} nurture=${nurtureCount} paidIntakes=${paidIntakeCount}`
    )

    return {
      success: true,
      jobType: 'marketing_sequences',
      executedAt: new Date(),
      duration,
      result: {
        abandonedCheckoutsQueued: abandonedCount,
        softCapturesQueued: nurtureCount,
        paidIntakesQueued: paidIntakeCount,
      },
    }
  } catch (err: any) {
    const duration = Date.now() - start
    console.error('[marketing-sequences] Run failed:', err.message)

    return {
      success: false,
      jobType: 'marketing_sequences',
      executedAt: new Date(),
      duration,
      error: err.message,
    }
  }
}
