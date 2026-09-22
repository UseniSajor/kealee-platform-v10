/**
 * GET   /api/admin/site-plan/:workflowId  — stages, queue rows, review state, order record
 * PATCH /api/admin/site-plan/:workflowId  — { countyComments: [{sheet?, reviewer, comment, receivedAt?}] }
 *                                           appends the County's review comments to the ORDER
 *
 * Comments are appended, never rewritten: the engine's ingest_comments stage
 * reads `form_data.sitePlanCountyComments` and tracks which ids it consumed
 * in `sitePlanCountyCommentsIngested`. Staff then run ingest_comments via
 * the sibling /run route.
 */
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { requireCommandCenterApi } from '@/lib/command-center-api-auth'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { prisma } from '@kealee/database'
import { Workflow } from '@kealee/pascal-agents/engine'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: { workflowId: string } },
) {
  const denied = await requireCommandCenterApi(req)
  if (denied) return denied

  const wf = await prisma.sitePlanWorkflow.findUnique({
    where: { id: params.workflowId },
    select: {
      id: true, orderId: true, productId: true, currentStage: true, status: true,
      definitionVersion: true, createdAt: true, updatedAt: true,
    },
  })
  if (!wf) return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })

  const [executions, queue, assignments, approvals, evidence] = await Promise.all([
    prisma.sitePlanStageExecution.findMany({
      where: { workflowId: wf.id },
      select: { job: true, stage: true, status: true, attempt: true, blockers: true, completedAt: true, updatedAt: true },
      orderBy: { updatedAt: 'asc' },
    }),
    prisma.jobQueue.findMany({
      where: { queueName: Workflow.SITE_PLAN_QUEUE, data: { path: ['workflowId'], equals: wf.id } },
      select: { jobId: true, jobName: true, status: true, attempts: true, error: true, result: true, createdAt: true, completedAt: true },
      orderBy: { createdAt: 'asc' },
    }),
    // One per discipline — the engineer's and the architect's, side by side.
    prisma.sitePlanReviewAssignment.findMany({ where: { workflowId: wf.id }, orderBy: { assignedAt: 'asc' } }),
    prisma.sitePlanScopedApproval.findMany({
      where: { workflowId: wf.id, supersededById: null },
      select: { id: true, subject: true, discipline: true, decision: true, comment: true, decidedByName: true, decidedAt: true },
    }),
    prisma.sitePlanEvidence.count({ where: { workflowId: wf.id, revokedAt: null } }),
  ])

  // The snapshot the runner would see, and what it could run next.
  const snapshot: Workflow.WorkflowSnapshot = {
    workflowId: wf.id,
    definitionVersion: wf.definitionVersion,
    stages: executions.flatMap(e =>
      e.job ? [{ job: e.job as Workflow.SitePlanJobName, status: e.status as never, attempt: e.attempt }] : []),
  }
  const runnable = Workflow.nextJobs(snapshot)
  const declared = Workflow.SITE_PLAN_STAGES.map(s => {
    const row = executions.find(e => e.job === s.job)
    return {
      job: s.job, group: s.group, inFirstRelease: s.inFirstRelease, deliverable: Boolean(s.deliverable),
      status: row?.status ?? 'NOT_STARTED', attempt: row?.attempt ?? 0,
      blockers: (row?.blockers as unknown[]) ?? [], completedAt: row?.completedAt ?? null,
      runnable: runnable.includes(s.job),
    }
  })

  const supabase = getSupabaseAdmin()
  const { data: order } = await supabase
    .from('public_intake_leads')
    .select('id, project_path, client_name, contact_email, project_address, status, form_data')
    .eq('id', wf.orderId)
    .maybeSingle()
  const fd = ((order?.form_data ?? {}) as Record<string, unknown>)

  return NextResponse.json({
    workflow: wf,
    stages: declared,
    queue,
    review: {
      assignment: assignments.find(a => a.discipline === 'professional_engineer') ?? assignments[0] ?? null,
      assignments, approvals, evidenceCount: evidence,
      redlines: approvals.filter(a => a.decision === 'CHANGES_REQUESTED' || a.decision === 'REJECTED'),
    },
    order: order ? {
      intakeId: order.id, productKey: order.project_path, clientName: order.client_name,
      contactEmail: order.contact_email, projectAddress: order.project_address, status: order.status,
      orderStatus: fd.orderStatus ?? null, orderStatusReason: fd.orderStatusReason ?? null,
      fulfillmentStatus: fd.fulfillmentStatus ?? null,
      deliverable: fd.sitePlanDeliverable ?? null,
      review: fd.sitePlanReview ?? null,
      submission: fd.sitePlanSubmission ?? null,
      countyReview: fd.sitePlanCountyReview ?? null,
      countyComments: fd.sitePlanCountyComments ?? [],
      countyCommentsIngested: fd.sitePlanCountyCommentsIngested ?? [],
    } : null,
    staffRunnable: ['siteplan.compose_sheets', 'siteplan.route_review', 'siteplan.ingest_comments', 'siteplan.run_issuance_qc'],
  })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { workflowId: string } },
) {
  const denied = await requireCommandCenterApi(req)
  if (denied) return denied

  const wf = await prisma.sitePlanWorkflow.findUnique({
    where: { id: params.workflowId }, select: { id: true, orderId: true },
  })
  if (!wf) return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
  if (!wf.orderId) {
    return NextResponse.json({ error: 'Workflow has no order; comments are recorded against the order.' }, { status: 409 })
  }
  const orderId = wf.orderId

  const body = (await req.json().catch(() => ({}))) as { countyComments?: unknown }
  const incoming = Array.isArray(body.countyComments) ? body.countyComments : []
  const now = new Date().toISOString()
  const comments = incoming.flatMap((c) => {
    if (!c || typeof c !== 'object') return []
    const r = c as Record<string, unknown>
    const comment = typeof r.comment === 'string' ? r.comment.trim() : ''
    if (!comment) return []
    return [{
      id: randomUUID(),
      sheet: typeof r.sheet === 'string' && r.sheet.trim() ? r.sheet.trim() : undefined,
      reviewer: typeof r.reviewer === 'string' && r.reviewer.trim() ? r.reviewer.trim() : 'County reviewer',
      comment,
      receivedAt: typeof r.receivedAt === 'string' && r.receivedAt ? r.receivedAt : now,
      enteredAt: now,
    }]
  })
  if (comments.length === 0) {
    return NextResponse.json({ error: 'countyComments must contain at least one comment' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  const { data: order } = await supabase
    .from('public_intake_leads').select('form_data').eq('id', orderId).maybeSingle()
  const fd = ((order?.form_data ?? {}) as Record<string, unknown>)
  const existing = Array.isArray(fd.sitePlanCountyComments) ? fd.sitePlanCountyComments : []

  const { error } = await supabase
    .from('public_intake_leads')
    .update({ form_data: { ...fd, sitePlanCountyComments: [...existing, ...comments] } })
    .eq('id', orderId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await prisma.sitePlanAuditEvent.create({
    data: {
      workflowId: wf.id, sequence: BigInt(Date.now()), occurredAt: new Date(),
      actorType: 'STAFF', eventType: 'county.comments.entered',
      entityTable: 'public_intake_leads', entityId: orderId,
      summary: `${comments.length} county comment(s) entered by staff.`,
    },
  }).catch(() => undefined)

  return NextResponse.json({ added: comments.length, total: existing.length + comments.length, next: 'POST ./run { job: "siteplan.ingest_comments" }' })
}
