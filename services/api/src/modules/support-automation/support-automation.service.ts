import { prisma } from '@kealee/database';
import { AuthorizationError, NotFoundError } from '../../errors/app.error';

const db = prisma as any;
async function assertAccess(projectId: string, userId: string) {
  const project = await db.project.findUnique({ where: { id: projectId }, select: {
    id: true, ownerId: true, memberships: { where: { userId }, select: { id: true } },
  } });
  if (!project) throw new NotFoundError('Project', projectId);
  if (project.ownerId !== userId && !project.memberships.length) throw new AuthorizationError('Project access denied');
}
export async function getAuthoritativeProjectStatus(projectId: string, userId: string) {
  await assertAccess(projectId, userId);
  const [project, documents, sitePlan, supportCases] = await Promise.all([
    db.project.findUnique({ where: { id: projectId }, select: {
      id: true, name: true, status: true, currentPhase: true, projectedEndDate: true, updatedAt: true,
      phases: { orderBy: { sortOrder: 'asc' }, select: { id: true, name: true, status: true,
        percentComplete: true, plannedEndDate: true, updatedAt: true } },
      permits: { orderBy: { updatedAt: 'desc' }, select: { id: true, permitType: true, status: true,
        kealeeStatus: true, jurisdictionStatus: true, jurisdictionRefNumber: true, submittedAt: true,
        reviewStartedAt: true, approvedAt: true, expiresAt: true, readyToSubmit: true, updatedAt: true,
        corrections: { select: { id: true, status: true, rawText: true, severity: true,
          discipline: true, assignedTo: true, dueDate: true, receivedAt: true, resolvedAt: true } } } },
    } }),
    db.document.findMany({ where: { projectId }, orderBy: { createdAt: 'desc' }, select: {
      id: true, name: true, type: true, status: true, version: true, signatureStatus: true,
      approvedAt: true, signedAt: true, createdAt: true, updatedAt: true,
    } }),
    // Stage execution rows use scalar workflow IDs and intentionally have no Prisma relation.
    db.sitePlanWorkflow.findFirst({ where: { projectId } }),
    db.customerSupportCase.findMany({ where: { projectId }, orderBy: { createdAt: 'desc' }, take: 20,
      select: { id: true, status: true, topic: true, urgency: true, assignedToUserId: true,
        slaDueAt: true, resolvedAt: true, updatedAt: true } }),
  ]);
  if (!project) throw new NotFoundError('Project', projectId);
  const stages = sitePlan ? await db.sitePlanStageExecution.findMany({ where: { workflowId: sitePlan.id },
    orderBy: [{ stage: 'asc' }, { attempt: 'desc' }] }) : [];
  const reviews = sitePlan ? await db.professionalReviewRecord.findMany({ where: { workflowId: sitePlan.id },
    orderBy: { createdAt: 'desc' }, select: { id: true, discipline: true, decision: true,
      licenseVerifiedAt: true, sealedDocumentId: true, decidedAt: true, updatedAt: true } }) : [];
  return {
    project: { id: project.id, name: project.name, status: project.status, currentPhase: project.currentPhase,
      projectedEndDate: project.projectedEndDate, verifiedAt: project.updatedAt },
    phases: project.phases.map((phase: any) => ({ ...phase, verifiedAt: phase.updatedAt })),
    documents: documents.map((document: any) => ({ ...document, verifiedAt: document.updatedAt })),
    permits: project.permits.map((permit: any) => ({ ...permit, verifiedAt: permit.updatedAt })),
    sitePlan: sitePlan ? { id: sitePlan.id, currentStage: sitePlan.currentStage, status: sitePlan.status,
      releasedAt: sitePlan.releasedAt, verifiedAt: sitePlan.updatedAt, stages, professionalReviews: reviews } : null,
    supportCases,
    generatedAt: new Date().toISOString(),
    truthPolicy: 'Values are returned from authoritative project records; absent values remain null.',
  };
}
export async function createSupportCase(input: { organizationId: string; projectId: string; userId: string;
  topic: string; urgency: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL'; sentiment?: string }) {
  await assertAccess(input.projectId, input.userId);
  const slaDueAt = calculateSupportSlaDueAt(input.urgency);
  return db.customerSupportCase.create({ data: { organizationId: input.organizationId,
    projectId: input.projectId, contactId: input.userId, topic: input.topic, urgency: input.urgency,
    sentiment: input.sentiment, status: input.urgency === 'CRITICAL' ? 'ESCALATED' : 'OPEN',
    slaDueAt, metadata: { source: 'authenticated_portal' } } });
}

export function calculateSupportSlaDueAt(urgency: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL', now = new Date()): Date {
  const minutes = urgency === 'CRITICAL' ? 15 : urgency === 'HIGH' ? 60 : urgency === 'NORMAL' ? 480 : 1440;
  return new Date(now.getTime() + minutes * 60_000);
}
