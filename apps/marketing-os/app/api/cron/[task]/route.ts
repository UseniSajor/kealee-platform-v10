import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { enqueueMarketingJob } from '@/lib/queue'
import { JOB_TYPES } from '@/lib/domain'

const TaskSchema = z.enum(JOB_TYPES)

export async function POST(
  request: NextRequest,
  { params }: { params: { task: string } },
) {
  const configuredSecret = process.env.MARKETING_OS_CRON_SECRET
  const provided = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!configuredSecret || provided !== configuredSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const task = TaskSchema.safeParse(params.task)
  if (!task.success) return NextResponse.json({ error: 'Unknown task' }, { status: 404 })
  const body = await request.json().catch(() => ({})) as Record<string, unknown>
  try {
    const bucket = new Date().toISOString().slice(0, task.data === 'analytics.rollup' ? 13 : 10)
    const queued = await enqueueMarketingJob({
      type: task.data,
      actorId: 'scheduler',
      input: body,
      idempotencyKey: `${task.data}:${bucket}`,
      approvalMode: 'risk_based',
    })
    return NextResponse.json(queued, { status: 202 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 503 })
  }
}
