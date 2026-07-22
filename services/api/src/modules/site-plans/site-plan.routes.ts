import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticateUser } from '../../middleware/auth';
import { applySitePlanWorkflowEvent, createSitePlan, getSitePlan } from './site-plan.service';

const eventSchema = z.object({ id: z.string().min(8), type: z.enum(['START_STAGE', 'BLOCK_STAGE',
  'SUBMIT_STAGE_REVIEW', 'APPROVE_STAGE', 'REJECT_STAGE', 'COMPLETE_STAGE', 'RELEASE']),
  stage: z.enum(['PARCEL_RESOLUTION', 'DOCUMENT_COLLECTION', 'FEASIBILITY', 'PLAN_GENERATION',
    'COMPLIANCE_AUDIT', 'PROFESSIONAL_REVIEW', 'SUBMISSION_CORRECTIONS']),
  assignedPartyId: z.string().optional(), blockers: z.array(z.string()).optional(),
  outputRefs: z.array(z.string()).optional(), approvalId: z.string().optional(), sealedDocumentId: z.string().optional() });
export async function sitePlanRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticateUser);
  fastify.post('/projects/:projectId', async (request, reply) => {
    const { projectId } = z.object({ projectId: z.string().uuid() }).parse(request.params);
    const body = z.object({ organizationId: z.string().uuid(), propertyId: z.string().uuid().optional(),
      parcelId: z.string().uuid().optional(), productId: z.string().optional() }).parse(request.body);
    return reply.status(201).send({ workflow: await createSitePlan(projectId, (request as any).user.id, body) });
  });
  fastify.get('/:workflowId', async (request, reply) => {
    const { workflowId } = z.object({ workflowId: z.string().uuid() }).parse(request.params);
    return reply.send({ workflow: await getSitePlan(workflowId, (request as any).user.id) });
  });
  fastify.post('/:workflowId/events', async (request, reply) => {
    const { workflowId } = z.object({ workflowId: z.string().uuid() }).parse(request.params);
    const body = z.object({ expectedVersion: z.number().int().nonnegative(), event: eventSchema }).parse(request.body);
    return reply.send({ workflow: await applySitePlanWorkflowEvent(workflowId, (request as any).user.id,
      body.expectedVersion, body.event as any) });
  });
}
