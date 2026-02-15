import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { KEALEE_QUEUES, createQueue } from '@kealee/queue';

export function taskRoutes(prisma: PrismaClient) {
  return async function (fastify: FastifyInstance) {
    // -----------------------------------------------------------------------
    // List automation tasks (filtered by project, status, priority)
    // -----------------------------------------------------------------------
    fastify.get('/tasks', async (request) => {
      const { projectId, status, priority, assignedPmId, limit, offset } =
        request.query as {
          projectId?: string;
          status?: string;
          priority?: string;
          assignedPmId?: string;
          limit?: string;
          offset?: string;
        };

      const tasks = await prisma.automationTask.findMany({
        where: {
          ...(projectId && { projectId }),
          ...(status && { status }),
          ...(priority && { priority }),
          ...(assignedPmId && { assignedPmId }),
        },
        orderBy: [
          { priority: 'desc' },
          { dueAt: 'asc' },
          { createdAt: 'desc' },
        ],
        take: limit ? parseInt(limit, 10) : 50,
        skip: offset ? parseInt(offset, 10) : 0,
      });

      const total = await prisma.automationTask.count({
        where: {
          ...(projectId && { projectId }),
          ...(status && { status }),
          ...(priority && { priority }),
          ...(assignedPmId && { assignedPmId }),
        },
      });

      return { data: tasks, meta: { total, limit: limit ? parseInt(limit, 10) : 50 } };
    });

    // -----------------------------------------------------------------------
    // Get single automation task
    // -----------------------------------------------------------------------
    fastify.get('/tasks/:id', async (request) => {
      const { id } = request.params as { id: string };

      const task = await prisma.automationTask.findUnique({
        where: { id },
      });

      if (!task) {
        return { error: 'Task not found', statusCode: 404 };
      }

      return { data: task };
    });

    // -----------------------------------------------------------------------
    // Update task status (start, complete, fail)
    // -----------------------------------------------------------------------
    fastify.patch('/tasks/:id/status', async (request) => {
      const { id } = request.params as { id: string };
      const { status, result, error } = request.body as {
        status: string;
        result?: Record<string, unknown>;
        error?: string;
      };

      const task = await prisma.automationTask.findUnique({
        where: { id },
      });

      if (!task) {
        return { error: 'Task not found', statusCode: 404 };
      }

      const validTransitions: Record<string, string[]> = {
        PENDING: ['IN_PROGRESS', 'FAILED'],
        IN_PROGRESS: ['COMPLETED', 'FAILED'],
        FAILED: ['PENDING'], // Allow retry
      };

      const allowed = validTransitions[task.status] ?? [];
      if (!allowed.includes(status)) {
        return {
          error: `Cannot transition from ${task.status} to ${status}`,
          statusCode: 400,
        };
      }

      const now = new Date();
      const updateData: Record<string, unknown> = { status };

      if (status === 'IN_PROGRESS') {
        updateData.startedAt = now;
      } else if (status === 'COMPLETED') {
        updateData.completedAt = now;
        if (result) updateData.result = result;
      } else if (status === 'FAILED') {
        updateData.error = error ?? 'Task failed';
        updateData.retryCount = { increment: 1 };
      } else if (status === 'PENDING') {
        // Retry -- reset start/complete dates
        updateData.startedAt = null;
        updateData.completedAt = null;
        updateData.error = null;
      }

      const updated = await prisma.automationTask.update({
        where: { id },
        data: updateData,
      });

      return { data: updated };
    });

    // -----------------------------------------------------------------------
    // Assign task to a PM
    // -----------------------------------------------------------------------
    fastify.patch('/tasks/:id/assign', async (request) => {
      const { id } = request.params as { id: string };
      const { assignedPmId } = request.body as { assignedPmId: string };

      const task = await prisma.automationTask.findUnique({
        where: { id },
      });

      if (!task) {
        return { error: 'Task not found', statusCode: 404 };
      }

      const updated = await prisma.automationTask.update({
        where: { id },
        data: { assignedPmId },
      });

      return { data: updated };
    });

    // -----------------------------------------------------------------------
    // Get overdue tasks
    // -----------------------------------------------------------------------
    fastify.get('/tasks/overdue', async (request) => {
      const { projectId, limit } = request.query as {
        projectId?: string;
        limit?: string;
      };

      const now = new Date();

      const tasks = await prisma.automationTask.findMany({
        where: {
          status: { in: ['PENDING', 'IN_PROGRESS'] },
          dueAt: { lt: now },
          ...(projectId && { projectId }),
        },
        orderBy: [
          { priority: 'desc' },
          { dueAt: 'asc' },
        ],
        take: limit ? parseInt(limit, 10) : 50,
      });

      return { data: tasks };
    });

    // -----------------------------------------------------------------------
    // Get task statistics (dashboard widget data)
    // -----------------------------------------------------------------------
    fastify.get('/tasks/stats', async (request) => {
      const { projectId } = request.query as { projectId?: string };
      const now = new Date();

      const whereBase = projectId ? { projectId } : {};

      const [total, pending, inProgress, completed, failed, overdue] =
        await Promise.all([
          prisma.automationTask.count({ where: whereBase }),
          prisma.automationTask.count({
            where: { ...whereBase, status: 'PENDING' },
          }),
          prisma.automationTask.count({
            where: { ...whereBase, status: 'IN_PROGRESS' },
          }),
          prisma.automationTask.count({
            where: { ...whereBase, status: 'COMPLETED' },
          }),
          prisma.automationTask.count({
            where: { ...whereBase, status: 'FAILED' },
          }),
          prisma.automationTask.count({
            where: {
              ...whereBase,
              status: { in: ['PENDING', 'IN_PROGRESS'] },
              dueAt: { lt: now },
            },
          }),
        ]);

      // Priority breakdown
      const [urgent, high, normal, low] = await Promise.all([
        prisma.automationTask.count({
          where: { ...whereBase, status: { in: ['PENDING', 'IN_PROGRESS'] }, priority: 'URGENT' },
        }),
        prisma.automationTask.count({
          where: { ...whereBase, status: { in: ['PENDING', 'IN_PROGRESS'] }, priority: 'HIGH' },
        }),
        prisma.automationTask.count({
          where: { ...whereBase, status: { in: ['PENDING', 'IN_PROGRESS'] }, priority: 'NORMAL' },
        }),
        prisma.automationTask.count({
          where: { ...whereBase, status: { in: ['PENDING', 'IN_PROGRESS'] }, priority: 'LOW' },
        }),
      ]);

      return {
        data: {
          total,
          byStatus: { pending, inProgress, completed, failed },
          overdue,
          byPriority: { urgent, high, normal, low },
        },
      };
    });

    // -----------------------------------------------------------------------
    // List job schedules
    // -----------------------------------------------------------------------
    fastify.get('/schedules', async (request) => {
      const { isActive } = request.query as { isActive?: string };

      const schedules = await prisma.jobSchedule.findMany({
        where: isActive !== undefined
          ? { isActive: isActive === 'true' }
          : undefined,
        orderBy: { nextRunAt: 'asc' },
      });

      return { data: schedules };
    });

    // -----------------------------------------------------------------------
    // Toggle job schedule active/inactive
    // -----------------------------------------------------------------------
    fastify.patch('/schedules/:id/toggle', async (request) => {
      const { id } = request.params as { id: string };

      const schedule = await prisma.jobSchedule.findUnique({
        where: { id },
      });

      if (!schedule) {
        return { error: 'Schedule not found', statusCode: 404 };
      }

      const updated = await prisma.jobSchedule.update({
        where: { id },
        data: { isActive: !schedule.isActive },
      });

      return { data: updated };
    });

    // -----------------------------------------------------------------------
    // List recent job queue entries
    // -----------------------------------------------------------------------
    fastify.get('/jobs', async (request) => {
      const { queueName, status, limit } = request.query as {
        queueName?: string;
        status?: string;
        limit?: string;
      };

      const jobs = await prisma.jobQueue.findMany({
        where: {
          ...(queueName && { queueName }),
          ...(status && { status: status as any }),
        },
        orderBy: { createdAt: 'desc' },
        take: limit ? parseInt(limit, 10) : 50,
      });

      return { data: jobs };
    });

    // -----------------------------------------------------------------------
    // List activity log entries
    // -----------------------------------------------------------------------
    fastify.get('/activity', async (request) => {
      const { projectId, category, entityType, limit, offset } =
        request.query as {
          projectId?: string;
          category?: string;
          entityType?: string;
          limit?: string;
          offset?: string;
        };

      const activities = await prisma.activityLog.findMany({
        where: {
          ...(projectId && { projectId }),
          ...(category && { category }),
          ...(entityType && { entityType }),
        },
        orderBy: { createdAt: 'desc' },
        take: limit ? parseInt(limit, 10) : 100,
        skip: offset ? parseInt(offset, 10) : 0,
      });

      return { data: activities };
    });

    // -----------------------------------------------------------------------
    // List alerts
    // -----------------------------------------------------------------------
    fastify.get('/alerts', async (request) => {
      const { level, acknowledged, source, limit } = request.query as {
        level?: string;
        acknowledged?: string;
        source?: string;
        limit?: string;
      };

      const alerts = await prisma.alert.findMany({
        where: {
          ...(level && { level }),
          ...(acknowledged !== undefined && {
            acknowledged: acknowledged === 'true',
          }),
          ...(source && { source }),
        },
        orderBy: { createdAt: 'desc' },
        take: limit ? parseInt(limit, 10) : 50,
      });

      return { data: alerts };
    });

    // -----------------------------------------------------------------------
    // Acknowledge an alert
    // -----------------------------------------------------------------------
    fastify.post('/alerts/:id/acknowledge', async (request) => {
      const { id } = request.params as { id: string };
      const { userId } = request.body as { userId: string };

      const alert = await prisma.alert.findUnique({ where: { id } });

      if (!alert) {
        return { error: 'Alert not found', statusCode: 404 };
      }

      const updated = await prisma.alert.update({
        where: { id },
        data: {
          acknowledged: true,
          acknowledgedBy: userId,
          acknowledgedAt: new Date(),
        },
      });

      return { data: updated };
    });

    // -----------------------------------------------------------------------
    // Resolve an alert
    // -----------------------------------------------------------------------
    fastify.post('/alerts/:id/resolve', async (request) => {
      const { id } = request.params as { id: string };

      const alert = await prisma.alert.findUnique({ where: { id } });

      if (!alert) {
        return { error: 'Alert not found', statusCode: 404 };
      }

      const updated = await prisma.alert.update({
        where: { id },
        data: { resolvedAt: new Date() },
      });

      return { data: updated };
    });

    // -----------------------------------------------------------------------
    // Dashboard widget management
    // -----------------------------------------------------------------------
    fastify.get('/widgets', async (request) => {
      const { userId } = request.query as { userId: string };

      if (!userId) {
        return { error: 'userId is required', statusCode: 400 };
      }

      const widgets = await prisma.dashboardWidget.findMany({
        where: { userId, isVisible: true },
        orderBy: { sortOrder: 'asc' },
      });

      return { data: widgets };
    });

    fastify.post('/widgets', async (request) => {
      const body = request.body as {
        userId: string;
        type: string;
        title: string;
        position: Record<string, unknown>;
        config?: Record<string, unknown>;
        refreshInterval?: number;
      };

      const widget = await prisma.dashboardWidget.create({
        data: {
          userId: body.userId,
          type: body.type as any,
          title: body.title,
          position: body.position,
          config: body.config ?? null,
          refreshInterval: body.refreshInterval ?? null,
        },
      });

      return { data: widget };
    });

    fastify.put('/widgets/:id', async (request) => {
      const { id } = request.params as { id: string };
      const body = request.body as Record<string, unknown>;

      const widget = await prisma.dashboardWidget.update({
        where: { id },
        data: body,
      });

      return { data: widget };
    });

    fastify.delete('/widgets/:id', async (request) => {
      const { id } = request.params as { id: string };

      await prisma.dashboardWidget.delete({ where: { id } });

      return { data: { ok: true } };
    });
  };
}
