import { prisma } from '@kealee/database';
import { SITE_PLAN_STAGES, applySitePlanEvent, createSitePlanWorkflow } from '@kealee/workflow-engine';
import type { SitePlanWorkflowEvent } from '@kealee/workflow-engine';
import { AuthorizationError, NotFoundError, ValidationError } from '../../errors/app.error';

const db = prisma as any;
async function assertProjectAccess(projectId: string, userId: string) {
  const project = await db.project.findUnique({ where: { id: projectId }, select: {
    id: true, orgId: true, ownerId: true, memberships: { where: { userId }, select: { id: true } },
  } });
  if (!project) throw new NotFoundError('Project', projectId);
  if (project.ownerId !== userId && !project.memberships.length) throw new AuthorizationError('Project access denied');
  return project;
}
export async function createSitePlan(projectId: string, userId: string, input: {
  organizationId: string; propertyId?: string; parcelId?: string; productId?: string;
}) {
  const project = await assertProjectAccess(projectId, userId);
  if (project.orgId && project.orgId !== input.organizationId) throw new AuthorizationError('Organization mismatch');
  const existing = await db.sitePlanWorkflow.findUnique({ where: {
    organizationId_projectId: { organizationId: input.organizationId, projectId },
  } });
  if (existing) return getSitePlan(existing.id, userId);
  return db.$transaction(async (tx: any) => {
    const workflow = await tx.sitePlanWorkflow.create({ data: { organizationId: input.organizationId,
      projectId, propertyId: input.propertyId, parcelId: input.parcelId, productId: input.productId,
      professionalReviewRequired: true } });
    const snapshot = createSitePlanWorkflow(workflow.id);
    await tx.sitePlanStageExecution.createMany({ data: snapshot.stages.map((stage) => ({
      workflowId: workflow.id, stage: stage.stage, status: stage.state, attempt: stage.attempt,
      prerequisites: stage.prerequisites, blockers: stage.blockers, outputs: { refs: stage.outputRefs },
    })) });
    return { ...workflow, stages: snapshot.stages };
  });
}
export async function getSitePlan(workflowId: string, userId: string) {
  const workflow = await db.sitePlanWorkflow.findUnique({ where: { id: workflowId } });
  if (!workflow) throw new NotFoundError('SitePlanWorkflow', workflowId);
  await assertProjectAccess(workflow.projectId, userId);
  const [stages, compliance, reviews, corrections] = await Promise.all([
    db.sitePlanStageExecution.findMany({ where: { workflowId }, orderBy: [{ stage: 'asc' }, { attempt: 'asc' }] }),
    db.sitePlanComplianceResult.findMany({ where: { workflowId }, orderBy: { createdAt: 'asc' } }),
    db.professionalReviewRecord.findMany({ where: { workflowId }, orderBy: { createdAt: 'desc' } }),
    db.permitCorrectionCycle.findMany({ where: { workflowId }, orderBy: { cycleNumber: 'asc' } }),
  ]);
  return { ...workflow, stages, compliance, professionalReviews: reviews, correctionCycles: corrections };
}
export async function applySitePlanWorkflowEvent(workflowId: string, userId: string,
  expectedVersion: number, event: SitePlanWorkflowEvent) {
  const workflow = await db.sitePlanWorkflow.findUnique({ where: { id: workflowId } });
  if (!workflow) throw new NotFoundError('SitePlanWorkflow', workflowId);
  await assertProjectAccess(workflow.projectId, userId);
  if (workflow.version !== expectedVersion) throw new ValidationError('Workflow version conflict');
  const rows = await db.sitePlanStageExecution.findMany({ where: { workflowId }, orderBy: { attempt: 'asc' } });
  const latest = new Map<string, any>();
  for (const row of rows) latest.set(row.stage, row);
  const snapshot = createSitePlanWorkflow(workflowId);
  snapshot.version = workflow.version;
  snapshot.appliedEventIds = Array.isArray(workflow.metadata?.appliedEventIds) ? workflow.metadata.appliedEventIds : [];
  snapshot.professionalApprovalId = workflow.metadata?.professionalApprovalId;
  snapshot.sealedDocumentId = workflow.metadata?.sealedDocumentId;
  snapshot.releasedAt = workflow.releasedAt?.toISOString();
  snapshot.stages = SITE_PLAN_STAGES.map((stage) => {
    const row = latest.get(stage);
    const base = createSitePlanWorkflow(workflowId).stages.find((item) => item.stage === stage)!;
    return row ? { ...base, state: row.status, prerequisites: row.prerequisites ?? [], blockers: row.blockers ?? [],
      outputRefs: row.outputs?.refs ?? [], assignedPartyId: row.assignedPartyId, attempt: row.attempt } : base;
  });
  if (snapshot.appliedEventIds.includes(event.id)) return getSitePlan(workflowId, userId);
  const next = applySitePlanEvent(snapshot, event);
  await db.$transaction(async (tx: any) => {
    const updated = await tx.sitePlanWorkflow.updateMany({ where: { id: workflowId, version: expectedVersion }, data: {
      version: { increment: 1 }, currentStage: event.stage, releasedAt: next.releasedAt ? new Date(next.releasedAt) : null,
      metadata: { ...(workflow.metadata ?? {}), appliedEventIds: next.appliedEventIds,
        professionalApprovalId: next.professionalApprovalId, sealedDocumentId: next.sealedDocumentId },
    } });
    if (updated.count !== 1) throw new ValidationError('Workflow version conflict');
    for (const stage of next.stages) {
      await tx.sitePlanStageExecution.upsert({ where: { workflowId_stage_attempt: {
        workflowId, stage: stage.stage, attempt: stage.attempt } }, create: {
        workflowId, stage: stage.stage, status: stage.state, attempt: stage.attempt,
        prerequisites: stage.prerequisites, blockers: stage.blockers, outputs: { refs: stage.outputRefs },
        assignedPartyId: stage.assignedPartyId,
      }, update: { status: stage.state, blockers: stage.blockers, outputs: { refs: stage.outputRefs },
        assignedPartyId: stage.assignedPartyId,
        startedAt: stage.state === 'IN_PROGRESS' ? new Date() : undefined,
        completedAt: ['COMPLETED', 'APPROVED'].includes(stage.state) ? new Date() : undefined } });
    }
    await tx.workflowEvent.upsert({ where: { idempotencyKey: event.id }, create: {
      eventType: `SITE_PLAN_${event.type}`, subjectType: 'PROJECT', subjectId: workflow.projectId,
      payload: event, idempotencyKey: event.id, processedAt: new Date(),
    }, update: {} });
  });
  return getSitePlan(workflowId, userId);
}
