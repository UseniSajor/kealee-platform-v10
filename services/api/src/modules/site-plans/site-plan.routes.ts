import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticateUser, requireRole } from '../../middleware/auth';
import { applySitePlanWorkflowEvent, createSitePlan, getSitePlan, listOperationsQueue,
  listProfessionalReviews, recordProfessionalReviewDecision, generateSitePlanArtifact,
  cancelEngineeringJob, enqueueSitePlanDocumentExtraction, getEngineeringDrawingDownload,
  getEngineeringJob, enqueueEngineeringTask } from './site-plan.service';

const geometrySchema = z.object({
  id: z.string().min(1).max(200),
  layer: z.enum(['BOUNDARY', 'EASEMENTS', 'RIGHT-OF-WAY', 'EXISTING-CONTOURS', 'PROPOSED-CONTOURS',
    'EXISTING-STRUCTURES', 'PROPOSED-STRUCTURES', 'SETBACKS', 'UTILITIES', 'STORM-DRAIN', 'SWM-BMP',
    'EROSION-CONTROL', 'LIMIT-OF-DISTURBANCE', 'TREE-SAVE', 'WOODLAND-CLEARING', 'FLOODPLAIN',
    'STREAM-BUFFER', 'WETLAND', 'ANNOTATIONS']),
  vertices: z.array(z.object({ x: z.number().finite(), y: z.number().finite() })).min(2).max(10000),
  closed: z.boolean(),
  authority: z.enum(['ESTIMATED', 'EXTRACTED', 'GIS_SCREENED', 'OFFICIAL', 'SURVEYED', 'VERIFIED',
    'PROFESSIONALLY_CERTIFIED']),
  sourceId: z.string().min(1).max(500), sourceRetrievedAt: z.string().datetime(),
  confidence: z.number().min(0).max(1),
}).superRefine((geometry, context) => {
  if (geometry.closed && geometry.vertices.length < 3) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['vertices'], message: 'Closed geometry requires at least three vertices' });
  }
});

const eventSchema = z.object({ id: z.string().min(8), type: z.enum(['START_STAGE', 'BLOCK_STAGE',
  'SUBMIT_STAGE_REVIEW', 'APPROVE_STAGE', 'REJECT_STAGE', 'COMPLETE_STAGE', 'RELEASE']),
  stage: z.enum(['PARCEL_RESOLUTION', 'DOCUMENT_COLLECTION', 'FEASIBILITY', 'PLAN_GENERATION',
    'COMPLIANCE_AUDIT', 'PROFESSIONAL_REVIEW', 'SUBMISSION_CORRECTIONS']),
  assignedPartyId: z.string().optional(), blockers: z.array(z.string()).optional(),
  outputRefs: z.array(z.string()).optional(), approvalId: z.string().optional(), sealedDocumentId: z.string().optional() });
export async function sitePlanRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticateUser);
  fastify.get('/professional/reviews', async (request, reply) =>
    reply.send({ reviews: await listProfessionalReviews((request as any).user.id) }));
  fastify.post('/professional/reviews/:reviewId/decision', async (request, reply) => {
    const { reviewId } = z.object({ reviewId: z.string().uuid() }).parse(request.params);
    const body = z.object({
      decision: z.enum(['APPROVED', 'REJECTED', 'CHANGES_REQUESTED']),
      declaration: z.string().min(10).max(5000),
      licenseNumber: z.string().min(2).max(100),
      sourceDocumentId: z.string().optional(), sealedDocumentId: z.string().optional(),
      sourceContentHash: z.string().regex(/^[a-fA-F0-9]{64}$/).optional(),
      sealedContentHash: z.string().regex(/^[a-fA-F0-9]{64}$/).optional(),
      redlines: z.array(z.string().min(1).max(2000)).max(100).optional(),
    }).parse(request.body);
    return reply.send({ review: await recordProfessionalReviewDecision((request as any).user.id, reviewId, body) });
  });
  fastify.get('/operations/queue', { preHandler: requireRole(['admin', 'super_admin', 'pm', 'operations']) },
    async (request, reply) => reply.send({ workflows: await listOperationsQueue((request as any).user) }));
  fastify.post('/:workflowId/extract-document',
    async (request, reply) => {
      const { workflowId } = z.object({ workflowId: z.string().uuid() }).parse(request.params);
      const upload = await (request as any).file();
      if (!upload) return reply.code(400).send({ error: 'A plat or survey file is required' });
      const mediaType = z.enum(['application/pdf']).parse(upload.mimetype);
      const buffer = await upload.toBuffer();
      if (buffer.length > 25 * 1024 * 1024) return reply.code(400).send({ error: 'Plat or survey exceeds the 25MB limit' });
      const field = (name: string) => {
        const value = upload.fields?.[name];
        return typeof value?.value === 'string' ? value.value : undefined;
      };
      const options = z.object({ crs: z.string().min(1).max(100), units: z.enum(['FEET', 'METERS']),
        idempotencyKey: z.string().min(8).max(200) }).parse({
        crs: field('crs'), units: field('units'), idempotencyKey: field('idempotencyKey'),
      });
      return reply.code(202).send({ job: await enqueueSitePlanDocumentExtraction((request as any).user, workflowId,
        { buffer, filename: upload.filename, mediaType }, options) });
    });
  fastify.get('/:workflowId/jobs/:jobId',
    async (request, reply) => {
      const { workflowId, jobId } = z.object({ workflowId: z.string().uuid(),
        jobId: z.string().min(8).max(200) }).parse(request.params);
      return reply.send({ job: await getEngineeringJob((request as any).user, workflowId, jobId) });
    });
  fastify.post('/:workflowId/jobs', { preHandler: requireRole(['admin', 'super_admin', 'pm', 'operations']) },
    async (request, reply) => {
      const { workflowId } = z.object({ workflowId: z.string().uuid() }).parse(request.params);
      const body = z.object({
        type: z.enum(['TRANSFORM_COORDINATES', 'GENERATE_SURFACE', 'GENERATE_CONTOURS',
          'CALCULATE_CUT_FILL', 'ANALYZE_DRAINAGE', 'GENERATE_DXF', 'GENERATE_VECTOR_PDF',
          'GENERATE_REPORT', 'RUN_COMPLIANCE_AUDIT']),
        stageCode: z.enum(['BASE_GEOMETRY_CREATION', 'TERRAIN_GRADING_ANALYSIS', 'STORMWATER_SCREENING',
          'EROSION_SEDIMENT_CONTROL', 'COMPLIANCE_AUDIT', 'DRAWING_REPORT_GENERATION']),
        idempotencyKey: z.string().min(8).max(200), options: z.record(z.string(), z.unknown()),
      }).parse(request.body);
      return reply.code(202).send({ job: await enqueueEngineeringTask((request as any).user, workflowId, body) });
    });
  fastify.delete('/:workflowId/jobs/:jobId', { preHandler: requireRole(['admin', 'super_admin', 'pm', 'operations']) },
    async (request, reply) => {
      const { workflowId, jobId } = z.object({ workflowId: z.string().uuid(),
        jobId: z.string().min(8).max(200) }).parse(request.params);
      return reply.send({ job: await cancelEngineeringJob((request as any).user, workflowId, jobId) });
    });
  fastify.get('/:workflowId/drawings/:packageId/download', async (request, reply) => {
    const { workflowId, packageId } = z.object({ workflowId: z.string().uuid(),
      packageId: z.string().uuid() }).parse(request.params);
    const { kind } = z.object({ kind: z.enum(['DXF', 'PDF', 'PREVIEW', 'REPORT']) }).parse(request.query);
    return reply.send(await getEngineeringDrawingDownload((request as any).user.id, workflowId, packageId, kind));
  });
  fastify.post('/:workflowId/generate', { preHandler: requireRole(['admin', 'super_admin', 'pm', 'operations']) },
    async (request, reply) => {
      const { workflowId } = z.object({ workflowId: z.string().uuid() }).parse(request.params);
      const body = z.object({
        idempotencyKey: z.string().min(8).max(200), name: z.string().min(1).max(200),
        units: z.enum(['FEET', 'METERS']), crs: z.string().min(1).max(100), geometry: z.array(geometrySchema).min(1).max(1000),
        revision: z.number().int().positive(), surveyVerified: z.boolean(),
        professionalApprovalId: z.string().optional(), requestedClassification: z.enum(['CONCEPT', 'PERMIT_READY']),
      }).parse(request.body);
      const { idempotencyKey, ...input } = body;
      return reply.send(await generateSitePlanArtifact((request as any).user, workflowId, idempotencyKey, input));
    });
  fastify.post('/projects/:projectId', async (request, reply) => {
    const { projectId } = z.object({ projectId: z.string().uuid() }).parse(request.params);
    const body = z.object({ organizationId: z.string().uuid().optional(), propertyId: z.string().uuid().optional(),
      parcelId: z.string().uuid().optional(), productId: z.string().optional(),
      jurisdictionCode: z.enum(['US-DC-DC', 'US-MD-MONTGOMERY', 'US-MD-PRINCE_GEORGES',
        'US-VA-ARLINGTON', 'US-VA-ALEXANDRIA', 'US-VA-FAIRFAX_COUNTY', 'US-VA-LOUDOUN',
        'US-VA-PRINCE_WILLIAM']) }).parse(request.body);
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
