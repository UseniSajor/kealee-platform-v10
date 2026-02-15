import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';

/**
 * Schedule & Field Ops routes (Claw C).
 * Provides CRUD for schedule items, site visits, and look-ahead generation.
 */
export function scheduleRoutes(prisma: PrismaClient) {
  return async function (fastify: FastifyInstance) {
    // =====================================================================
    // SCHEDULE ITEMS
    // =====================================================================

    // -----------------------------------------------------------------------
    // List schedule items (filtered by project, with optional status filter)
    // -----------------------------------------------------------------------
    fastify.get('/items', async (request) => {
      const { projectId, status, criticalPathOnly } = request.query as {
        projectId?: string;
        status?: string;
        criticalPathOnly?: string;
      };

      const where: Record<string, any> = {};
      if (projectId) where.projectId = projectId;
      if (status) where.status = status;
      if (criticalPathOnly === 'true') where.criticalPath = true;

      const items = await prisma.scheduleItem.findMany({
        where,
        orderBy: { startDate: 'asc' },
      });

      return { data: items };
    });

    // -----------------------------------------------------------------------
    // Get single schedule item
    // -----------------------------------------------------------------------
    fastify.get('/items/:id', async (request) => {
      const { id } = request.params as { id: string };

      const item = await prisma.scheduleItem.findUnique({
        where: { id },
      });

      if (!item) {
        return { error: 'Schedule item not found', statusCode: 404 };
      }

      return { data: item };
    });

    // -----------------------------------------------------------------------
    // Create schedule item
    // -----------------------------------------------------------------------
    fastify.post('/items', async (request) => {
      const body = request.body as {
        projectId: string;
        taskName: string;
        description?: string;
        startDate: string;
        endDate: string;
        duration: number;
        dependencies?: string[];
        assignedTo?: string;
        trade?: string;
        milestone?: boolean;
        weatherSensitive?: boolean;
      };

      const item = await prisma.scheduleItem.create({
        data: {
          projectId: body.projectId,
          taskName: body.taskName,
          description: body.description ?? null,
          startDate: new Date(body.startDate),
          endDate: new Date(body.endDate),
          duration: body.duration,
          dependencies: body.dependencies ?? [],
          assignedTo: body.assignedTo ?? null,
          trade: body.trade ?? null,
          milestone: body.milestone ?? false,
          weatherSensitive: body.weatherSensitive ?? false,
        },
      });

      return { data: item };
    });

    // -----------------------------------------------------------------------
    // Update schedule item
    // -----------------------------------------------------------------------
    fastify.put('/items/:id', async (request) => {
      const { id } = request.params as { id: string };
      const body = request.body as Record<string, unknown>;

      // Convert date strings to Date objects if present
      const data: Record<string, unknown> = { ...body };
      if (typeof data.startDate === 'string') data.startDate = new Date(data.startDate as string);
      if (typeof data.endDate === 'string') data.endDate = new Date(data.endDate as string);

      const item = await prisma.scheduleItem.update({
        where: { id },
        data,
      });

      return { data: item };
    });

    // -----------------------------------------------------------------------
    // Delete schedule item
    // -----------------------------------------------------------------------
    fastify.delete('/items/:id', async (request) => {
      const { id } = request.params as { id: string };

      await prisma.scheduleItem.delete({ where: { id } });

      return { data: { ok: true } };
    });

    // -----------------------------------------------------------------------
    // Get critical path for a project
    // -----------------------------------------------------------------------
    fastify.get('/critical-path', async (request) => {
      const { projectId } = request.query as { projectId: string };

      if (!projectId) {
        return { error: 'projectId is required', statusCode: 400 };
      }

      const criticalItems = await prisma.scheduleItem.findMany({
        where: { projectId, criticalPath: true },
        orderBy: { startDate: 'asc' },
      });

      return { data: criticalItems };
    });

    // =====================================================================
    // LOOK-AHEAD
    // =====================================================================

    // -----------------------------------------------------------------------
    // Get 2-week look-ahead for a project
    // -----------------------------------------------------------------------
    fastify.get('/look-ahead', async (request) => {
      const { projectId } = request.query as { projectId: string };

      if (!projectId) {
        return { error: 'projectId is required', statusCode: 400 };
      }

      const now = new Date();
      const twoWeeksOut = new Date(now.getTime() + 14 * 86_400_000);

      const tasks = await prisma.scheduleItem.findMany({
        where: {
          projectId,
          OR: [
            { startDate: { gte: now, lte: twoWeeksOut } },
            { endDate: { gte: now, lte: twoWeeksOut } },
            { AND: [{ startDate: { lte: now } }, { endDate: { gte: now } }] },
          ],
        },
        orderBy: { startDate: 'asc' },
      });

      // Tag statuses
      const lookAhead = tasks.map((t) => {
        const isOverdue = new Date(t.endDate) < now && t.status !== 'COMPLETED';
        const isAtRisk =
          t.criticalPath && t.progress < 50 && new Date(t.endDate) < twoWeeksOut;

        return {
          ...t,
          computedStatus: isOverdue ? 'OVERDUE' : isAtRisk ? 'AT_RISK' : t.status,
        };
      });

      return {
        data: lookAhead,
        meta: {
          windowStart: now.toISOString(),
          windowEnd: twoWeeksOut.toISOString(),
          totalTasks: lookAhead.length,
          overdue: lookAhead.filter((t) => t.computedStatus === 'OVERDUE').length,
          atRisk: lookAhead.filter((t) => t.computedStatus === 'AT_RISK').length,
        },
      };
    });

    // =====================================================================
    // SITE VISITS
    // =====================================================================

    // -----------------------------------------------------------------------
    // List site visits (filtered by project and/or PM)
    // -----------------------------------------------------------------------
    fastify.get('/visits', async (request) => {
      const { projectId, pmId, status, from, to } = request.query as {
        projectId?: string;
        pmId?: string;
        status?: string;
        from?: string;
        to?: string;
      };

      const where: Record<string, any> = {};
      if (projectId) where.projectId = projectId;
      if (pmId) where.pmId = pmId;
      if (status) where.status = status;
      if (from || to) {
        where.scheduledAt = {};
        if (from) where.scheduledAt.gte = new Date(from);
        if (to) where.scheduledAt.lte = new Date(to);
      }

      const visits = await prisma.siteVisit.findMany({
        where,
        orderBy: { scheduledAt: 'asc' },
        include: { project: { select: { id: true, name: true } } },
      });

      return { data: visits };
    });

    // -----------------------------------------------------------------------
    // Get single site visit with checklist
    // -----------------------------------------------------------------------
    fastify.get('/visits/:id', async (request) => {
      const { id } = request.params as { id: string };

      const visit = await prisma.siteVisit.findUnique({
        where: { id },
        include: {
          project: { select: { id: true, name: true } },
          pm: { select: { id: true, name: true, email: true } },
        },
      });

      if (!visit) {
        return { error: 'Site visit not found', statusCode: 404 };
      }

      // Get checklist items
      const checklist = await prisma.visitChecklist.findMany({
        where: { siteVisitId: id },
        orderBy: { createdAt: 'asc' },
      });

      return { data: { ...visit, checklist } };
    });

    // -----------------------------------------------------------------------
    // Create site visit
    // -----------------------------------------------------------------------
    fastify.post('/visits', async (request) => {
      const body = request.body as {
        projectId: string;
        pmId: string;
        type: string;
        scheduledAt: string;
        priority?: string;
        estimatedDurationMinutes?: number;
        address?: string;
        latitude?: number;
        longitude?: number;
        purpose?: string;
        clientName?: string;
        clientEmail?: string;
        clientPhone?: string;
      };

      const visit = await prisma.siteVisit.create({
        data: {
          projectId: body.projectId,
          pmId: body.pmId,
          type: body.type,
          status: 'SCHEDULED',
          priority: body.priority ?? 'NORMAL',
          scheduledAt: new Date(body.scheduledAt),
          estimatedDurationMinutes: body.estimatedDurationMinutes ?? 60,
          address: body.address ?? null,
          latitude: body.latitude ?? null,
          longitude: body.longitude ?? null,
          purpose: body.purpose ?? null,
          clientName: body.clientName ?? null,
          clientEmail: body.clientEmail ?? null,
          clientPhone: body.clientPhone ?? null,
        },
      });

      return { data: visit };
    });

    // -----------------------------------------------------------------------
    // Update site visit
    // -----------------------------------------------------------------------
    fastify.put('/visits/:id', async (request) => {
      const { id } = request.params as { id: string };
      const body = request.body as Record<string, unknown>;

      const data: Record<string, unknown> = { ...body };
      if (typeof data.scheduledAt === 'string')
        data.scheduledAt = new Date(data.scheduledAt as string);
      if (typeof data.startedAt === 'string')
        data.startedAt = new Date(data.startedAt as string);
      if (typeof data.completedAt === 'string')
        data.completedAt = new Date(data.completedAt as string);

      const visit = await prisma.siteVisit.update({
        where: { id },
        data,
      });

      return { data: visit };
    });

    // -----------------------------------------------------------------------
    // Delete site visit (cancel)
    // -----------------------------------------------------------------------
    fastify.delete('/visits/:id', async (request) => {
      const { id } = request.params as { id: string };
      const { reason } = request.query as { reason?: string };

      // Soft delete: mark as cancelled instead of removing
      const visit = await prisma.siteVisit.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          cancellationReason: reason ?? 'Cancelled by user',
        },
      });

      return { data: visit };
    });

    // -----------------------------------------------------------------------
    // Update visit checklist item
    // -----------------------------------------------------------------------
    fastify.put('/visits/:visitId/checklist/:checklistId', async (request) => {
      const { checklistId } = request.params as {
        visitId: string;
        checklistId: string;
      };
      const body = request.body as {
        isChecked?: boolean;
        notes?: string;
        photoUrl?: string;
        checkedById?: string;
      };

      const item = await prisma.visitChecklist.update({
        where: { id: checklistId },
        data: {
          isChecked: body.isChecked ?? undefined,
          notes: body.notes ?? undefined,
          photoUrl: body.photoUrl ?? undefined,
          checkedById: body.checkedById ?? undefined,
          checkedAt: body.isChecked ? new Date() : undefined,
        },
      });

      return { data: item };
    });

    // =====================================================================
    // WEATHER LOGS
    // =====================================================================

    // -----------------------------------------------------------------------
    // List weather logs for a project
    // -----------------------------------------------------------------------
    fastify.get('/weather', async (request) => {
      const { projectId, from, to } = request.query as {
        projectId: string;
        from?: string;
        to?: string;
      };

      if (!projectId) {
        return { error: 'projectId is required', statusCode: 400 };
      }

      const where: Record<string, any> = { projectId };
      if (from || to) {
        where.date = {};
        if (from) where.date.gte = new Date(from);
        if (to) where.date.lte = new Date(to);
      }

      const logs = await prisma.weatherLog.findMany({
        where,
        orderBy: { date: 'desc' },
      });

      return { data: logs };
    });

    // -----------------------------------------------------------------------
    // Create weather log entry
    // -----------------------------------------------------------------------
    fastify.post('/weather', async (request) => {
      const body = request.body as {
        projectId: string;
        date: string;
        condition: string;
        temperature?: number;
        precipitation?: number;
        windSpeed?: number;
        workable?: boolean;
        notes?: string;
      };

      const log = await prisma.weatherLog.create({
        data: {
          projectId: body.projectId,
          date: new Date(body.date),
          condition: body.condition,
          temperature: body.temperature ?? null,
          precipitation: body.precipitation ?? null,
          windSpeed: body.windSpeed ?? null,
          workable: body.workable ?? true,
          notes: body.notes ?? null,
        },
      });

      return { data: log };
    });

    // =====================================================================
    // PM DAILY ROUTE
    // =====================================================================

    // -----------------------------------------------------------------------
    // Get optimized daily route for a PM
    // -----------------------------------------------------------------------
    fastify.get('/route', async (request) => {
      const { pmId, date } = request.query as {
        pmId: string;
        date?: string;
      };

      if (!pmId) {
        return { error: 'pmId is required', statusCode: 400 };
      }

      const targetDate = date ? new Date(date) : new Date();
      const dayStart = new Date(targetDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(targetDate);
      dayEnd.setHours(23, 59, 59, 999);

      const visits = await prisma.siteVisit.findMany({
        where: {
          pmId,
          status: { in: ['SCHEDULED', 'RESCHEDULED'] },
          scheduledAt: { gte: dayStart, lte: dayEnd },
        },
        orderBy: { scheduledAt: 'asc' },
        include: { project: { select: { id: true, name: true } } },
      });

      // Sort by priority then time
      const priorityOrder: Record<string, number> = {
        URGENT: 0,
        HIGH: 1,
        NORMAL: 2,
        LOW: 3,
      };
      const sorted = [...visits].sort((a, b) => {
        const aPri = priorityOrder[a.priority] ?? 2;
        const bPri = priorityOrder[b.priority] ?? 2;
        if (aPri !== bPri) return aPri - bPri;
        return (
          new Date(a.scheduledAt).getTime() -
          new Date(b.scheduledAt).getTime()
        );
      });

      return {
        data: sorted,
        meta: {
          pmId,
          date: targetDate.toISOString().split('T')[0],
          visitCount: sorted.length,
          estimatedTotalMinutes: sorted.reduce(
            (sum, v) => sum + (v.estimatedDurationMinutes ?? 60),
            0,
          ),
        },
      };
    });
  };
}
