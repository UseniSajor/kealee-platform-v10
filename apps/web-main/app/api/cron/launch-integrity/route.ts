import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return req.headers.get('authorization') === `Bearer ${secret}`
}

type IntakeHealthRow = {
  id: string
  status: string
  project_path: string
  stripe_session_id: string | null
  paid_at: string | null
  created_at: string
  form_data: Record<string, unknown> | null
}

export async function GET(req: NextRequest) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 })
  }
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await supabase
    .from('public_intake_leads')
    .select('id,status,project_path,stripe_session_id,paid_at,created_at,form_data')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(1000)

  if (error) {
    Sentry.captureMessage('Launch integrity monitor database failure', {
      level: 'error',
      tags: { area: 'launch-integrity', stage: 'monitor-query' },
      extra: { databaseError: error.message },
    })
    return NextResponse.json({ error: 'Database query failed' }, { status: 503 })
  }

  const rows = (data ?? []) as IntakeHealthRow[]
  const paidWithoutStripeSession = rows.filter(
    (row) => ['paid', 'processing', 'concept_ready'].includes(row.status) && !row.stripe_session_id,
  )
  const failedFulfillment = rows.filter((row) => {
    const status = String(row.form_data?.fulfillmentStatus ?? '').toLowerCase()
    return ['failed', 'error', 'retryable'].includes(status)
  })
  const paidWithoutQueuedFulfillment = rows.filter((row) => {
    if (row.status !== 'paid' || !row.paid_at) return false
    if (Date.now() - new Date(row.paid_at).getTime() < 15 * 60 * 1000) return false
    const form = row.form_data ?? {}
    return Boolean(form.workflowTemplateId) && !form.fulfillmentQueuedAt
  })

  const issues = {
    paidWithoutStripeSession: paidWithoutStripeSession.map((row) => row.id),
    failedFulfillment: failedFulfillment.map((row) => row.id),
    paidWithoutQueuedFulfillment: paidWithoutQueuedFulfillment.map((row) => row.id),
  }
  const issueCount = Object.values(issues).reduce((sum, ids) => sum + ids.length, 0)

  if (issueCount > 0) {
    Sentry.captureMessage('Launch integrity monitor found paid-order issues', {
      level: 'error',
      tags: { area: 'launch-integrity', stage: 'paid-order-audit' },
      extra: { issueCount, issues },
    })
  }

  return NextResponse.json({
    ok: issueCount === 0,
    checkedAt: new Date().toISOString(),
    lookbackHours: 24,
    rowsChecked: rows.length,
    issueCount,
    issues,
  })
}
