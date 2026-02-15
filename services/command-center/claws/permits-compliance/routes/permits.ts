import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { KEALEE_QUEUES, createQueue } from '@kealee/queue';

export function permitRoutes(prisma: PrismaClient) {
  return async function (fastify: FastifyInstance) {
    // -----------------------------------------------------------------------
    // List permits (optionally filtered by project or status)
    // -----------------------------------------------------------------------
    fastify.get('/', async (request) => {
      const { projectId, status, jurisdictionId } = request.query as {
        projectId?: string;
        status?: string;
        jurisdictionId?: string;
      };

      const permits = await prisma.permit.findMany({
        where: {
          ...(projectId && { projectId }),
          ...(status && { status }),
          ...(jurisdictionId && { jurisdictionId }),
        },
        include: {
          jurisdiction: true,
          inspections: {
            orderBy: { requestedDate: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return { data: permits };
    });

    // -----------------------------------------------------------------------
    // Get single permit with full detail
    // -----------------------------------------------------------------------
    fastify.get('/:id', async (request) => {
      const { id } = request.params as { id: string };

      const permit = await prisma.permit.findUnique({
        where: { id },
        include: {
          jurisdiction: true,
          inspections: {
            include: { findings: true },
            orderBy: { requestedDate: 'asc' },
          },
          submissions: {
            orderBy: { submittedAt: 'desc' },
          },
          corrections: {
            orderBy: { receivedAt: 'desc' },
          },
          events: {
            orderBy: { occurredAt: 'desc' },
            take: 50,
          },
        },
      });

      if (!permit) {
        return { error: 'Permit not found', statusCode: 404 };
      }

      return { data: permit };
    });

    // -----------------------------------------------------------------------
    // Create a permit (DRAFT only -- filing requires explicit user action)
    // -----------------------------------------------------------------------
    fastify.post('/', async (request) => {
      const body = request.body as {
        projectId: string;
        clientId: string;
        jurisdictionId: string;
        pmUserId: string;
        permitType: string;
        subtype?: string;
        scope: string;
        valuation: number;
        address: string;
        parcelNumber?: string;
        squareFootage?: number;
        units?: number;
        stories?: number;
      };

      const permit = await prisma.permit.create({
        data: {
          projectId: body.projectId,
          clientId: body.clientId,
          jurisdictionId: body.jurisdictionId,
          pmUserId: body.pmUserId,
          permitType: body.permitType as any,
          subtype: body.subtype,
          scope: body.scope,
          valuation: body.valuation,
          address: body.address,
          parcelNumber: body.parcelNumber,
          squareFootage: body.squareFootage,
          units: body.units,
          stories: body.stories,
          status: 'DRAFT', // Always start as draft
        },
      });

      return { data: permit };
    });

    // -----------------------------------------------------------------------
    // Request portal status check for a specific permit
    // -----------------------------------------------------------------------
    fastify.post('/:id/check-status', async (request) => {
      const { id } = request.params as { id: string };

      const permit = await prisma.permit.findUnique({
        where: { id },
        include: { jurisdiction: true },
      });

      if (!permit) {
        return { error: 'Permit not found', statusCode: 404 };
      }

      const queue = createQueue(KEALEE_QUEUES.PERMIT_TRACKER);
      await queue.add('check-portal-status', {
        jurisdictions: [(permit.jurisdiction as any).code],
      });

      return {
        data: {
          queued: true,
          permitId: id,
          jurisdiction: (permit.jurisdiction as any).code,
        },
      };
    });

    // -----------------------------------------------------------------------
    // List inspections for a permit
    // -----------------------------------------------------------------------
    fastify.get('/:id/inspections', async (request) => {
      const { id } = request.params as { id: string };

      const inspections = await prisma.inspection.findMany({
        where: { permitId: id },
        include: {
          findings: true,
        },
        orderBy: { requestedDate: 'asc' },
      });

      return { data: inspections };
    });

    // -----------------------------------------------------------------------
    // Schedule an inspection
    // -----------------------------------------------------------------------
    fastify.post('/:id/inspections', async (request) => {
      const { id } = request.params as { id: string };
      const body = request.body as {
        inspectionType: string;
        description?: string;
        requestedDate: string;
        requestedBy: string;
        notes?: string;
      };

      const permit = await prisma.permit.findUnique({
        where: { id },
      });

      if (!permit) {
        return { error: 'Permit not found', statusCode: 404 };
      }

      const inspection = await prisma.inspection.create({
        data: {
          permitId: id,
          projectId: permit.projectId,
          jurisdictionId: permit.jurisdictionId,
          inspectionType: body.inspectionType as any,
          description: body.description,
          requestedDate: new Date(body.requestedDate),
          requestedBy: body.requestedBy,
          notes: body.notes,
          status: 'REQUESTED',
        },
      });

      return { data: inspection };
    });

    // -----------------------------------------------------------------------
    // Record inspection result (explicit user action)
    // -----------------------------------------------------------------------
    fastify.post('/:permitId/inspections/:inspectionId/result', async (request) => {
      const { permitId, inspectionId } = request.params as {
        permitId: string;
        inspectionId: string;
      };
      const body = request.body as {
        result: 'PASSED' | 'FAILED';
        notes?: string;
        findings?: Array<{
          type: string;
          severity: string;
          description: string;
          location?: string;
          photos?: string[];
          requiredAction?: string;
        }>;
      };

      const inspection = await prisma.inspection.findUnique({
        where: { id: inspectionId },
      });

      if (!inspection || inspection.permitId !== permitId) {
        return { error: 'Inspection not found', statusCode: 404 };
      }

      const queue = createQueue(KEALEE_QUEUES.QA_INSPECTOR);
      await queue.add('record-result', {
        inspectionId,
        projectId: inspection.projectId,
        organizationId: null,
        result: body.result,
        findings: body.findings,
        notes: body.notes,
      });

      return {
        data: {
          queued: true,
          inspectionId,
          result: body.result,
        },
      };
    });

    // -----------------------------------------------------------------------
    // Run AI compliance check for an inspection
    // -----------------------------------------------------------------------
    fastify.post('/:permitId/inspections/:inspectionId/compliance-check', async (request) => {
      const { permitId, inspectionId } = request.params as {
        permitId: string;
        inspectionId: string;
      };

      const inspection = await prisma.inspection.findUnique({
        where: { id: inspectionId },
      });

      if (!inspection || inspection.permitId !== permitId) {
        return { error: 'Inspection not found', statusCode: 404 };
      }

      const queue = createQueue(KEALEE_QUEUES.QA_INSPECTOR);
      await queue.add('run-compliance-check', {
        inspectionId,
        projectId: inspection.projectId,
        organizationId: null,
      });

      return {
        data: {
          queued: true,
          inspectionId,
        },
      };
    });

    // -----------------------------------------------------------------------
    // Submit photo for AI QA analysis
    // -----------------------------------------------------------------------
    fastify.post('/qa/analyze-photo', async (request) => {
      const body = request.body as {
        photoUrl: string;
        projectId: string;
        inspectionId?: string;
        siteVisitId?: string;
      };

      const queue = createQueue(KEALEE_QUEUES.QA_INSPECTOR);
      await queue.add('analyze-photo', {
        photoUrl: body.photoUrl,
        projectId: body.projectId,
        inspectionId: body.inspectionId,
        siteVisitId: body.siteVisitId,
      });

      return {
        data: {
          queued: true,
          projectId: body.projectId,
        },
      };
    });

    // -----------------------------------------------------------------------
    // List quality issues for a project
    // -----------------------------------------------------------------------
    fastify.get('/qa/issues', async (request) => {
      const { projectId, status, severity } = request.query as {
        projectId?: string;
        status?: string;
        severity?: string;
      };

      const issues = await prisma.qualityIssue.findMany({
        where: {
          ...(projectId && { projectId }),
          ...(status && { status }),
          ...(severity && { severity }),
        },
        orderBy: { createdAt: 'desc' },
      });

      return { data: issues };
    });

    // -----------------------------------------------------------------------
    // List QA inspection results for a project
    // -----------------------------------------------------------------------
    fastify.get('/qa/results', async (request) => {
      const { projectId } = request.query as { projectId?: string };

      const results = await prisma.qAInspectionResult.findMany({
        where: projectId ? { projectId } : undefined,
        orderBy: { createdAt: 'desc' },
      });

      return { data: results };
    });

    // -----------------------------------------------------------------------
    // List jurisdictions
    // -----------------------------------------------------------------------
    fastify.get('/jurisdictions', async () => {
      const jurisdictions = await prisma.jurisdiction.findMany({
        orderBy: { name: 'asc' },
      });

      return { data: jurisdictions };
    });

    // -----------------------------------------------------------------------
    // Get jurisdiction detail
    // -----------------------------------------------------------------------
    fastify.get('/jurisdictions/:id', async (request) => {
      const { id } = request.params as { id: string };

      const jurisdiction = await prisma.jurisdiction.findUnique({
        where: { id },
      });

      if (!jurisdiction) {
        return { error: 'Jurisdiction not found', statusCode: 404 };
      }

      return { data: jurisdiction };
    });
  };
}
