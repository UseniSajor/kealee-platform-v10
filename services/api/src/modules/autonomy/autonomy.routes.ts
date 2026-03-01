/**
 * Autonomy Configuration & Action Log API Routes
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { authenticateUser } from '../auth/auth.middleware.js';

const prisma = new PrismaClient();
const prismaAny = prisma as any;

// Lazy import the autonomy engine (lives in command-center package)
async function getAutonomyEngine() {
  // Direct inline implementation for the API layer — queries the DB directly
  return {
    async getActionLog(projectId: string, filters: any, page: number, pageSize: number) {
      const where: Record<string, unknown> = { projectId };
      if (filters?.appSource) where.appSource = filters.appSource;
      if (filters?.decision) where.decision = filters.decision;
      if (filters?.reviewedByPM !== undefined) where.reviewedByPM = filters.reviewedByPM;
      if (filters?.startDate || filters?.endDate) {
        where.createdAt = {
          ...(filters.startDate && { gte: new Date(filters.startDate) }),
          ...(filters.endDate && { lte: new Date(filters.endDate) }),
        };
      }

      const [actions, total] = await Promise.all([
        prismaAny.autonomousActionLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prismaAny.autonomousActionLog.count({ where }),
      ]);

      return { actions, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
    },

    async getStats(projectId: string, days: number) {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const actions = await prismaAny.autonomousActionLog.findMany({
        where: { projectId, createdAt: { gte: since } },
        select: { decision: true, actionType: true, reviewedByPM: true, revertedAt: true },
        take: 1000,
        orderBy: { createdAt: 'desc' },
      });

      const totalActions = actions.length;
      const autoApproved = actions.filter((a: any) => a.decision === 'AUTO_APPROVED').length;
      const autoRejected = actions.filter((a: any) => a.decision === 'AUTO_REJECTED').length;
      const autoExecuted = actions.filter((a: any) => a.decision === 'AUTO_EXECUTED').length;
      const escalated = actions.filter((a: any) => a.decision === 'ESCALATED').length;
      const revertedCount = actions.filter((a: any) => a.revertedAt !== null).length;
      const reviewedCount = actions.filter((a: any) => a.reviewedByPM).length;

      const autoActions = actions.filter((a: any) => a.decision !== 'ESCALATED');
      const estimatedHoursSaved = Math.round((autoActions.length * 15) / 60 * 10) / 10;

      return {
        totalActions, autoApproved, autoRejected, autoExecuted,
        escalated, revertedCount, reviewedCount, estimatedHoursSaved,
      };
    },
  };
}

export async function autonomyRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', authenticateUser);

  /**
   * GET /autonomy/projects/:id/config
   * Get project autonomy configuration
   */
  fastify.get('/projects/:id/config', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const project = await prisma.project.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        autonomyLevel: true,
        autonomyRules: true,
        autonomyEnabledAt: true,
        autonomyEnabledBy: true,
      },
    } as any);

    if (!project) {
      return reply.status(404).send({ error: 'Project not found' });
    }

    return {
      projectId: (project as any).id,
      projectName: (project as any).name,
      autonomyLevel: (project as any).autonomyLevel ?? 1,
      autonomyRules: (project as any).autonomyRules,
      enabledAt: (project as any).autonomyEnabledAt,
      enabledBy: (project as any).autonomyEnabledBy,
    };
  });

  /**
   * PUT /autonomy/projects/:id/config
   * Update project autonomy level and rules
   */
  fastify.put('/projects/:id/config', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { autonomyLevel, autonomyRules } = request.body as {
      autonomyLevel?: number;
      autonomyRules?: Record<string, unknown>;
    };
    const user = (request as any).user;

    // Validate autonomy level
    if (autonomyLevel !== undefined && (autonomyLevel < 1 || autonomyLevel > 3)) {
      return reply.status(400).send({ error: 'Autonomy level must be 1, 2, or 3' });
    }

    const updateData: Record<string, unknown> = {};
    if (autonomyLevel !== undefined) {
      updateData.autonomyLevel = autonomyLevel;
      updateData.autonomyEnabledAt = new Date();
      updateData.autonomyEnabledBy = user?.id || 'unknown';
    }
    if (autonomyRules !== undefined) {
      updateData.autonomyRules = autonomyRules;
    }

    const project = await prisma.project.update({
      where: { id },
      data: updateData as any,
      select: {
        id: true,
        name: true,
        autonomyLevel: true,
        autonomyRules: true,
        autonomyEnabledAt: true,
        autonomyEnabledBy: true,
      },
    } as any);

    return {
      projectId: (project as any).id,
      autonomyLevel: (project as any).autonomyLevel,
      autonomyRules: (project as any).autonomyRules,
      enabledAt: (project as any).autonomyEnabledAt,
      enabledBy: (project as any).autonomyEnabledBy,
    };
  });

  /**
   * GET /autonomy/projects/:id/actions
   * Paginated list of autonomous actions for a project
   */
  fastify.get('/projects/:id/actions', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const {
      page = '1',
      pageSize = '20',
      appSource,
      decision,
      reviewedByPM,
      startDate,
      endDate,
    } = request.query as {
      page?: string;
      pageSize?: string;
      appSource?: string;
      decision?: string;
      reviewedByPM?: string;
      startDate?: string;
      endDate?: string;
    };

    const engine = await getAutonomyEngine();
    const result = await engine.getActionLog(
      id,
      {
        appSource,
        decision,
        reviewedByPM: reviewedByPM !== undefined ? reviewedByPM === 'true' : undefined,
        startDate: startDate ? startDate : undefined,
        endDate: endDate ? endDate : undefined,
      },
      parseInt(page),
      parseInt(pageSize)
    );

    return result;
  });

  /**
   * GET /autonomy/projects/:id/stats
   * Aggregate stats for autonomous actions
   */
  fastify.get('/projects/:id/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { days = '7' } = request.query as { days?: string };

    const engine = await getAutonomyEngine();
    return engine.getStats(id, parseInt(days));
  });

  /**
   * POST /autonomy/actions/:id/revert
   * Revert an autonomous action
   */
  fastify.post('/actions/:id/revert', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const user = (request as any).user;

    const action = await prismaAny.autonomousActionLog.findUnique({
      where: { id },
    });

    if (!action) {
      return reply.status(404).send({ error: 'Action not found' });
    }

    if (action.revertedAt) {
      return reply.status(400).send({ error: 'Action already reverted' });
    }

    await prismaAny.autonomousActionLog.update({
      where: { id },
      data: {
        revertedAt: new Date(),
        revertedBy: user?.id || 'unknown',
      },
    });

    return { success: true, message: `Action ${action.actionType} reverted`, revertedActionId: id };
  });

  /**
   * POST /autonomy/actions/:id/review
   * Mark an autonomous action as reviewed by PM
   */
  fastify.post('/actions/:id/review', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    await prismaAny.autonomousActionLog.update({
      where: { id },
      data: {
        reviewedByPM: true,
        reviewedAt: new Date(),
      },
    });

    return { success: true, message: 'Action marked as reviewed' };
  });
}
