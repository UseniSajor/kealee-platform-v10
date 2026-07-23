import { prisma } from '@kealee/database';
import { SITE_PLAN_STAGES, applySitePlanEvent, createSitePlanWorkflow } from '@kealee/workflow-engine';
import type { SitePlanWorkflowEvent } from '@kealee/workflow-engine';
import { generateCivilSitePlan } from '@kealee/concept-engine';
import type { CivilSitePlanInput } from '@kealee/concept-engine';
import { getAiAutomationConfig } from '@kealee/core-config';
import { createHash } from 'node:crypto';
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

const OPERATIONS_ROLES = new Set(['admin', 'super_admin', 'pm', 'operations']);

export async function listProfessionalReviews(userId: string) {
  const profile = await db.marketplaceProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) return [];

  const assignments = await db.professionalAssignment.findMany({
    where: { profileId: profile.id },
    select: { id: true },
  });
  const assignmentIds = assignments.map((assignment: { id: string }) => assignment.id);
  if (!assignmentIds.length) return [];

  const reviews = await db.professionalReviewRecord.findMany({
    where: { professionalAssignmentId: { in: assignmentIds } },
    orderBy: [{ decision: 'asc' }, { updatedAt: 'desc' }],
  });
  const workflowIds = [...new Set(reviews.map((review: { workflowId: string }) => review.workflowId))];
  const [workflows, stages, compliance] = await Promise.all([
    db.sitePlanWorkflow.findMany({ where: { id: { in: workflowIds } } }),
    db.sitePlanStageExecution.findMany({ where: { workflowId: { in: workflowIds } }, orderBy: { updatedAt: 'desc' } }),
    db.sitePlanComplianceResult.findMany({ where: { workflowId: { in: workflowIds }, blocksSubmission: true } }),
  ]);
  const workflowById = new Map(workflows.map((workflow: any) => [workflow.id, workflow]));
  return reviews.map((review: any) => ({
    ...review,
    workflow: workflowById.get(review.workflowId) ?? null,
    stages: stages.filter((stage: any) => stage.workflowId === review.workflowId),
    blockingComplianceCount: compliance.filter((result: any) => result.workflowId === review.workflowId).length,
  }));
}

export async function recordProfessionalReviewDecision(userId: string, reviewId: string, input: {
  decision: 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED';
  declaration: string;
  licenseNumber: string;
  sourceDocumentId?: string;
  sealedDocumentId?: string;
  sourceContentHash?: string;
  sealedContentHash?: string;
  redlines?: string[];
}) {
  const review = await db.professionalReviewRecord.findUnique({ where: { id: reviewId } });
  if (!review) throw new NotFoundError('ProfessionalReviewRecord', reviewId);
  if (review.decision !== 'PENDING') throw new ValidationError('This professional review already has a final decision');
  const assignment = await db.professionalAssignment.findFirst({
    where: { id: review.professionalAssignmentId, profile: { userId } },
    select: { id: true },
  });
  if (!assignment) throw new AuthorizationError('Professional assignment access denied');
  if (review.licenseNumber !== input.licenseNumber) throw new ValidationError('License number does not match the assignment');
  if (!review.licenseVerifiedAt || (review.expiresAt && review.expiresAt <= new Date())) {
    throw new ValidationError('A current verified professional license is required');
  }
  if (input.decision === 'APPROVED') {
    if (!input.sourceDocumentId || !input.sealedDocumentId || !input.sourceContentHash || !input.sealedContentHash) {
      throw new ValidationError('Approval requires source and sealed document evidence');
    }
    if (input.sourceContentHash === input.sealedContentHash) {
      throw new ValidationError('The sealed deliverable must be a separately signed, version-locked artifact');
    }
    const blockers = await db.sitePlanComplianceResult.count({ where: { workflowId: review.workflowId, blocksSubmission: true } });
    if (blockers) throw new ValidationError('Blocking compliance findings must be resolved before approval');
  }
  if (input.decision === 'REVISION_REQUESTED' && !input.redlines?.length) {
    throw new ValidationError('Revision requests require at least one redline');
  }
  const updated = await db.professionalReviewRecord.updateMany({
    where: { id: reviewId, decision: 'PENDING' },
    data: {
      decision: input.decision,
      declaration: input.declaration,
      sourceDocumentId: input.sourceDocumentId,
      sealedDocumentId: input.sealedDocumentId,
      sourceContentHash: input.sourceContentHash,
      sealedContentHash: input.sealedContentHash,
      decidedAt: new Date(),
      metadata: { ...(typeof review.metadata === 'object' && review.metadata ? review.metadata : {}), redlines: input.redlines ?? [] },
    },
  });
  if (updated.count !== 1) throw new ValidationError('This professional review already has a final decision');
  return db.professionalReviewRecord.findUnique({ where: { id: reviewId } });
}

export async function listOperationsQueue(user: { role: string; organizationId?: string | null }) {
  if (!OPERATIONS_ROLES.has(user.role.toLowerCase())) throw new AuthorizationError('Operations access denied');
  const where = ['admin', 'super_admin'].includes(user.role.toLowerCase())
    ? {}
    : { organizationId: user.organizationId ?? '__no_organization__' };
  const workflows = await db.sitePlanWorkflow.findMany({ where, orderBy: { updatedAt: 'desc' }, take: 200 });
  const workflowIds = workflows.map((workflow: { id: string }) => workflow.id);
  const [stages, compliance, reviews, corrections] = await Promise.all([
    db.sitePlanStageExecution.findMany({ where: { workflowId: { in: workflowIds } }, orderBy: { updatedAt: 'desc' } }),
    db.sitePlanComplianceResult.findMany({ where: { workflowId: { in: workflowIds }, blocksSubmission: true } }),
    db.professionalReviewRecord.findMany({ where: { workflowId: { in: workflowIds } }, orderBy: { updatedAt: 'desc' } }),
    db.permitCorrectionCycle.findMany({ where: { workflowId: { in: workflowIds }, status: { not: 'CLOSED' } } }),
  ]);
  return workflows.map((workflow: any) => ({
    ...workflow,
    stages: stages.filter((stage: any) => stage.workflowId === workflow.id),
    blockingComplianceCount: compliance.filter((result: any) => result.workflowId === workflow.id).length,
    pendingReviewCount: reviews.filter((review: any) => review.workflowId === workflow.id && review.decision === 'PENDING').length,
    openCorrectionCount: corrections.filter((cycle: any) => cycle.workflowId === workflow.id).length,
  }));
}

export async function generateSitePlanArtifact(user: { id: string; role: string; organizationId?: string | null },
  workflowId: string, idempotencyKey: string, input: Omit<CivilSitePlanInput, 'id'>) {
  const config = getAiAutomationConfig();
  if (!config.sitePlanAutomationEnabled) throw new ValidationError('Site-plan automation is disabled');
  if (!OPERATIONS_ROLES.has(user.role.toLowerCase())) throw new AuthorizationError('Operations access denied');
  const workflow = await db.sitePlanWorkflow.findUnique({ where: { id: workflowId } });
  if (!workflow) throw new NotFoundError('SitePlanWorkflow', workflowId);
  if (!['admin', 'super_admin'].includes(user.role.toLowerCase()) && workflow.organizationId !== user.organizationId) {
    throw new AuthorizationError('Site-plan workflow access denied');
  }
  if (workflow.currentStage !== 'PLAN_GENERATION') {
    throw new ValidationError('Site-plan artifacts can only be generated during the plan generation stage');
  }
  const stage = await db.sitePlanStageExecution.findFirst({
    where: { workflowId, stage: 'PLAN_GENERATION' }, orderBy: { attempt: 'desc' },
  });
  if (!stage || !['IN_PROGRESS', 'UNDER_REVIEW'].includes(stage.status)) {
    throw new ValidationError('The plan generation stage must be started before generating an artifact');
  }
  if (input.requestedClassification === 'PERMIT_READY') {
    const [blockingFindings, approval] = await Promise.all([
      db.sitePlanComplianceResult.count({ where: { workflowId, blocksSubmission: true } }),
      input.professionalApprovalId ? db.professionalReviewRecord.findFirst({ where: {
        id: input.professionalApprovalId, workflowId, decision: 'APPROVED',
      } }) : null,
    ]);
    if (blockingFindings) throw new ValidationError('Blocking compliance findings must be resolved before permit-ready generation');
    if (!approval || !approval.licenseVerifiedAt || (approval.expiresAt && approval.expiresAt <= new Date())) {
      throw new ValidationError('Permit-ready generation requires a current verified professional approval for this workflow');
    }
    if (!approval.sourceDocumentId || !approval.sealedDocumentId || !approval.sourceContentHash || !approval.sealedContentHash) {
      throw new ValidationError('Professional approval is missing immutable source and sealed document evidence');
    }
  }
  const eventId = `site-plan-generation:${workflowId}:${idempotencyKey}`;
  const inputHash = createHash('sha256').update(JSON.stringify(input)).digest('hex');
  const priorEvent = await db.workflowEvent.findUnique({ where: { idempotencyKey: eventId } });
  if (priorEvent?.payload?.inputHash && priorEvent.payload.inputHash !== inputHash) {
    throw new ValidationError('Idempotency key was already used with different site-plan input');
  }
  const artifact = generateCivilSitePlan({ ...input, id: workflowId });
  const outputSummary = {
    idempotencyKey, revision: input.revision, classification: input.requestedClassification,
    units: input.units, crs: input.crs, geometryCount: input.geometry.length,
    quantities: artifact.quantities, warnings: artifact.warnings, generatedAt: new Date().toISOString(),
  };
  await db.$transaction(async (tx: any) => {
    await tx.sitePlanStageExecution.update({ where: { id: stage.id }, data: {
      inputs: { revision: input.revision, classification: input.requestedClassification,
        units: input.units, crs: input.crs, geometry: input.geometry },
      outputs: { ...(typeof stage.outputs === 'object' && stage.outputs ? stage.outputs : {}), generation: outputSummary },
    } });
    await tx.workflowEvent.upsert({ where: { idempotencyKey: eventId }, create: {
      eventType: 'SITE_PLAN_ARTIFACT_GENERATED', subjectType: 'PROJECT', subjectId: workflow.projectId,
      payload: { workflowId, actorId: user.id, inputHash, ...outputSummary }, idempotencyKey: eventId, processedAt: new Date(),
    }, update: {} });
  });
  return { artifact, summary: outputSummary };
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
