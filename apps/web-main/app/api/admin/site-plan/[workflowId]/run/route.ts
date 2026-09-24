/**
 * POST /api/admin/site-plan/:workflowId/run   { job }
 *
 * A person re-runs a stage: a drafter who has revised the inputs after
 * engineer redlines or county comments resumes at compose_sheets; staff who
 * entered the County's letter run ingest_comments; a coordinator who
 * attached evidence re-runs issuance QC.
 *
 * Only the stages in STAFF_RUNNABLE_STAGES are accepted. The worker's guard
 * still decides whether the stage may run — a stage whose prerequisites are
 * not satisfied is rejected there and reported on the JobQueue row.
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireCommandCenterApi } from '@/lib/command-center-api-auth'
import { prisma } from '@kealee/database'
import {
  enqueueSitePlanStage, isStaffRunnableStage, STAFF_RUNNABLE_STAGES,
} from '@/lib/site-plan-workflow'

export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: { workflowId: string } },
) {
  const denied = await requireCommandCenterApi(req)
  if (denied) return denied

  const body = (await req.json().catch(() => ({}))) as { job?: unknown }
  const job = typeof body.job === 'string' ? body.job : ''
  if (!isStaffRunnableStage(job)) {
    return NextResponse.json(
      { error: `job must be one of ${STAFF_RUNNABLE_STAGES.join(', ')}` },
      { status: 400 },
    )
  }

  const wf = await prisma.sitePlanWorkflow.findUnique({
    where: { id: params.workflowId }, select: { id: true, orderId: true, status: true, organizationId: true },
  })
  if (!wf) return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })

  const r = await enqueueSitePlanStage(wf.id, job)
  if (!r.enqueued) return NextResponse.json({ error: r.error ?? 'Could not enqueue' }, { status: 500 })

  await prisma.sitePlanAuditEvent.create({
    data: {
      organizationId: wf.organizationId,
      workflowId: wf.id,
      sequence: BigInt(Date.now()),
      occurredAt: new Date(),
      actorType: 'STAFF',
      eventType: 'stage.enqueued_by_staff',
      entityTable: 'job_queue',
      entityId: r.jobKey ?? job,
      summary: `${job} enqueued by staff.`,
    },
  }).catch(() => undefined)

  return NextResponse.json({ enqueued: true, job, jobKey: r.jobKey, orderId: wf.orderId })
}
