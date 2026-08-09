import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireMarketingAdmin } from '@/lib/auth'
import { JOB_TYPES } from '@/lib/domain'
import { enqueueMarketingJob } from '@/lib/queue'
import { getSupabaseAdmin } from '@/lib/supabase'

const JobRequestSchema = z.object({
  type: z.enum(JOB_TYPES),
  input: z.record(z.string(), z.unknown()).default({}),
  idempotencyKey: z.string().min(8).max(200),
  approvalMode: z.enum(['automatic', 'risk_based', 'required']).default('risk_based'),
  scheduledAt: z.string().datetime().optional(),
  priority: z.number().int().min(0).max(100).default(0),
})

export async function POST(request: NextRequest) {
  const auth = await requireMarketingAdmin()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = JobRequestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const delayMs = parsed.data.scheduledAt
    ? Math.max(0, new Date(parsed.data.scheduledAt).getTime() - Date.now())
    : undefined

  try {
    const queued = await enqueueMarketingJob({
      type: parsed.data.type,
      actorId: auth.user.id,
      input: parsed.data.input,
      idempotencyKey: parsed.data.idempotencyKey,
      approvalMode: parsed.data.approvalMode,
      delayMs,
      priority: parsed.data.priority,
    })
    const { error } = await getSupabaseAdmin().from('marketing_os_jobs').insert({
      job_type: parsed.data.type,
      queue_name: 'kealee-marketing-os',
      external_job_id: String(queued.jobId),
      idempotency_key: parsed.data.idempotencyKey,
      status: 'queued',
      priority: parsed.data.priority,
      payload: queued.payload,
      scheduled_at: parsed.data.scheduledAt ?? null,
      created_by: auth.user.id,
    })
    if (error) throw error
    return NextResponse.json(queued, { status: 202 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 503 })
  }
}
