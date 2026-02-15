import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { KEALEE_QUEUES, createQueue } from '@kealee/queue';

export function predictionRoutes(prisma: PrismaClient) {
  return async function (fastify: FastifyInstance) {
    // -----------------------------------------------------------------------
    // List predictions (filtered by project, type, or acknowledged status)
    // -----------------------------------------------------------------------
    fastify.get('/predictions', async (request) => {
      const { projectId, type, acknowledged, limit } = request.query as {
        projectId?: string;
        type?: string;
        acknowledged?: string;
        limit?: string;
      };

      const predictions = await prisma.prediction.findMany({
        where: {
          ...(projectId && { projectId }),
          ...(type && { type }),
          ...(acknowledged !== undefined && {
            acknowledged: acknowledged === 'true',
          }),
        },
        orderBy: { createdAt: 'desc' },
        take: limit ? parseInt(limit, 10) : 50,
      });

      return { data: predictions };
    });

    // -----------------------------------------------------------------------
    // Get single prediction
    // -----------------------------------------------------------------------
    fastify.get('/predictions/:id', async (request) => {
      const { id } = request.params as { id: string };

      const prediction = await prisma.prediction.findUnique({
        where: { id },
      });

      if (!prediction) {
        return { error: 'Prediction not found', statusCode: 404 };
      }

      return { data: prediction };
    });

    // -----------------------------------------------------------------------
    // Acknowledge a prediction (PM marks it as reviewed)
    // -----------------------------------------------------------------------
    fastify.post('/predictions/:id/acknowledge', async (request) => {
      const { id } = request.params as { id: string };
      const { userId } = request.body as { userId: string };

      const prediction = await prisma.prediction.findUnique({
        where: { id },
      });

      if (!prediction) {
        return { error: 'Prediction not found', statusCode: 404 };
      }

      const updated = await prisma.prediction.update({
        where: { id },
        data: {
          acknowledged: true,
          acknowledgedAt: new Date(),
          acknowledgedBy: userId,
        },
      });

      return { data: updated };
    });

    // -----------------------------------------------------------------------
    // List risk assessments for a project
    // -----------------------------------------------------------------------
    fastify.get('/risk-assessments', async (request) => {
      const { projectId, limit } = request.query as {
        projectId?: string;
        limit?: string;
      };

      const assessments = await prisma.riskAssessment.findMany({
        where: projectId ? { projectId } : undefined,
        orderBy: { assessedAt: 'desc' },
        take: limit ? parseInt(limit, 10) : 20,
      });

      return { data: assessments };
    });

    // -----------------------------------------------------------------------
    // Get single risk assessment
    // -----------------------------------------------------------------------
    fastify.get('/risk-assessments/:id', async (request) => {
      const { id } = request.params as { id: string };

      const assessment = await prisma.riskAssessment.findUnique({
        where: { id },
      });

      if (!assessment) {
        return { error: 'Risk assessment not found', statusCode: 404 };
      }

      return { data: assessment };
    });

    // -----------------------------------------------------------------------
    // Get latest risk assessment for a project
    // -----------------------------------------------------------------------
    fastify.get('/risk-assessments/project/:projectId/latest', async (request) => {
      const { projectId } = request.params as { projectId: string };

      const assessment = await prisma.riskAssessment.findFirst({
        where: { projectId },
        orderBy: { assessedAt: 'desc' },
      });

      if (!assessment) {
        return { error: 'No risk assessments found for project', statusCode: 404 };
      }

      return { data: assessment };
    });

    // -----------------------------------------------------------------------
    // List decision logs (filtered by project, type, or status)
    // -----------------------------------------------------------------------
    fastify.get('/decisions', async (request) => {
      const { projectId, type, status, limit } = request.query as {
        projectId?: string;
        type?: string;
        status?: string; // 'pending' | 'accepted' | 'rejected'
        limit?: string;
      };

      const acceptedFilter =
        status === 'pending'
          ? { accepted: null }
          : status === 'accepted'
            ? { accepted: true }
            : status === 'rejected'
              ? { accepted: false }
              : undefined;

      const decisions = await prisma.decisionLog.findMany({
        where: {
          ...(projectId && { projectId }),
          ...(type && { type }),
          ...acceptedFilter,
        },
        orderBy: { createdAt: 'desc' },
        take: limit ? parseInt(limit, 10) : 50,
      });

      return { data: decisions };
    });

    // -----------------------------------------------------------------------
    // Get single decision log
    // -----------------------------------------------------------------------
    fastify.get('/decisions/:id', async (request) => {
      const { id } = request.params as { id: string };

      const decision = await prisma.decisionLog.findUnique({
        where: { id },
      });

      if (!decision) {
        return { error: 'Decision log not found', statusCode: 404 };
      }

      return { data: decision };
    });

    // -----------------------------------------------------------------------
    // Accept a decision recommendation
    // -----------------------------------------------------------------------
    fastify.post('/decisions/:id/accept', async (request) => {
      const { id } = request.params as { id: string };
      const { userId, feedback } = request.body as {
        userId: string;
        feedback?: string;
      };

      const decision = await prisma.decisionLog.findUnique({
        where: { id },
      });

      if (!decision) {
        return { error: 'Decision log not found', statusCode: 404 };
      }

      if (decision.accepted !== null) {
        return {
          error: `Decision already ${decision.accepted ? 'accepted' : 'rejected'}`,
          statusCode: 400,
        };
      }

      // Queue the acceptance through the worker for event publishing
      const queue = createQueue(KEALEE_QUEUES.DECISION_SUPPORT);
      await queue.add('accept-decision', {
        decisionLogId: id,
        projectId: decision.projectId,
        organizationId: null, // Will be resolved from project
        userId,
        feedback,
      });

      return {
        data: { queued: true, decisionLogId: id, action: 'accept' },
      };
    });

    // -----------------------------------------------------------------------
    // Reject a decision recommendation
    // -----------------------------------------------------------------------
    fastify.post('/decisions/:id/reject', async (request) => {
      const { id } = request.params as { id: string };
      const { userId, feedback } = request.body as {
        userId: string;
        feedback?: string;
      };

      const decision = await prisma.decisionLog.findUnique({
        where: { id },
      });

      if (!decision) {
        return { error: 'Decision log not found', statusCode: 404 };
      }

      if (decision.accepted !== null) {
        return {
          error: `Decision already ${decision.accepted ? 'accepted' : 'rejected'}`,
          statusCode: 400,
        };
      }

      // Queue the rejection through the worker for event publishing
      const queue = createQueue(KEALEE_QUEUES.DECISION_SUPPORT);
      await queue.add('reject-decision', {
        decisionLogId: id,
        projectId: decision.projectId,
        organizationId: null,
        userId,
        feedback,
      });

      return {
        data: { queued: true, decisionLogId: id, action: 'reject' },
      };
    });

    // -----------------------------------------------------------------------
    // Trigger manual risk assessment for a project
    // -----------------------------------------------------------------------
    fastify.post('/risk-assessments/trigger', async (request) => {
      const { projectId } = request.body as { projectId: string };

      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        return { error: 'Project not found', statusCode: 404 };
      }

      const queue = createQueue(KEALEE_QUEUES.PREDICTIVE_ENGINE);
      await queue.add('nightly-risk-assessment', { projectId });

      return {
        data: { queued: true, projectId, action: 'risk-assessment' },
      };
    });
  };
}
