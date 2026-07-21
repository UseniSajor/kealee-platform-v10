import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';

/**
 * Budget & Cost routes (Claw D).
 * Provides CRUD for budget items, transactions, snapshots, alerts, and forecasts.
 */
export function budgetRoutes(prisma: PrismaClient) {
  return async function (fastify: FastifyInstance) {
    // =====================================================================
    // BUDGET ITEMS
    // =====================================================================

    // -----------------------------------------------------------------------
    // List budget items (filtered by project, optional category filter)
    // -----------------------------------------------------------------------
    fastify.get('/items', async (request) => {
      const { projectId, category, status } = request.query as {
        projectId?: string;
        category?: string;
        status?: string;
      };

      const where: Record<string, any> = {};
      if (projectId) where.projectId = projectId;
      if (category) where.category = category;

      const items = await prisma.budgetItem.findMany({
        where,
        include: {
          transactions: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
        orderBy: { category: 'asc' },
      });

      return { data: items };
    });

    // -----------------------------------------------------------------------
    // Get single budget item with all transactions
    // -----------------------------------------------------------------------
    fastify.get('/items/:id', async (request) => {
      const { id } = request.params as { id: string };

      const item = await prisma.budgetItem.findUnique({
        where: { id },
        include: {
          transactions: { orderBy: { createdAt: 'desc' } },
        },
      });

      if (!item) {
        return { error: 'Budget item not found', statusCode: 404 };
      }

      return { data: item };
    });

    // -----------------------------------------------------------------------
    // Get budget summary for a project (aggregated by category)
    // -----------------------------------------------------------------------
    fastify.get('/summary', async (request) => {
      const { projectId } = request.query as { projectId: string };

      if (!projectId) {
        return { error: 'projectId is required', statusCode: 400 };
      }

      const items = await prisma.budgetItem.findMany({
        where: { projectId },
      });

      // Aggregate by category
      const categoryMap = new Map<string, {
        category: string;
        estimatedTotal: number;
        actualTotal: number;
        committedTotal: number;
        varianceTotal: number;
        itemCount: number;
      }>();

      for (const item of items) {
        const existing = categoryMap.get(item.category) ?? {
          category: item.category,
          estimatedTotal: 0,
          actualTotal: 0,
          committedTotal: 0,
          varianceTotal: 0,
          itemCount: 0,
        };

        existing.estimatedTotal += Number(item.estimatedCost);
        existing.actualTotal += Number(item.actualCost);
        existing.committedTotal += Number(item.committedCost);
        existing.varianceTotal += Number(item.varianceAmount);
        existing.itemCount += 1;

        categoryMap.set(item.category, existing);
      }

      const categories = Array.from(categoryMap.values()).map((cat) => ({
        ...cat,
        variancePercent:
          cat.estimatedTotal > 0
            ? ((cat.varianceTotal / cat.estimatedTotal) * 100).toFixed(2)
            : '0.00',
      }));

      const totals = {
        estimatedTotal: categories.reduce((s, c) => s + c.estimatedTotal, 0),
        actualTotal: categories.reduce((s, c) => s + c.actualTotal, 0),
        committedTotal: categories.reduce((s, c) => s + c.committedTotal, 0),
        varianceTotal: categories.reduce((s, c) => s + c.varianceTotal, 0),
      };

      return {
        data: {
          categories,
          totals: {
            ...totals,
            variancePercent:
              totals.estimatedTotal > 0
                ? ((totals.varianceTotal / totals.estimatedTotal) * 100).toFixed(2)
                : '0.00',
          },
          itemCount: items.length,
        },
      };
    });

    // =====================================================================
    // BUDGET TRANSACTIONS
    // =====================================================================

    // -----------------------------------------------------------------------
    // List transactions for a project (optionally filtered by type)
    // -----------------------------------------------------------------------
    fastify.get('/transactions', async (request) => {
      const { projectId, budgetItemId, type, limit } = request.query as {
        projectId?: string;
        budgetItemId?: string;
        type?: string;
        limit?: string;
      };

      const where: Record<string, any> = {};
      if (projectId) where.projectId = projectId;
      if (budgetItemId) where.budgetItemId = budgetItemId;
      if (type) where.type = type;

      const transactions = await prisma.budgetTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit ? parseInt(limit, 10) : 100,
        include: {
          budgetItem: { select: { id: true, category: true, description: true } },
        },
      });

      return { data: transactions };
    });

    // -----------------------------------------------------------------------
    // Create a manual budget transaction
    // -----------------------------------------------------------------------
    fastify.post('/transactions', async (request) => {
      const body = request.body as {
        budgetItemId: string;
        projectId: string;
        organizationId: string;
        amount: number;
        type: string; // ESTIMATED, COMMITTED, ACTUAL, ADJUSTMENT
        description?: string;
        referenceType?: string;
        referenceId?: string;
      };

      const transaction = await prisma.budgetTransaction.create({
        data: {
          budgetItemId: body.budgetItemId,
          projectId: body.projectId,
          organizationId: body.organizationId,
          amount: body.amount,
          type: body.type,
          description: body.description ?? null,
          referenceType: body.referenceType ?? 'MANUAL',
          referenceId: body.referenceId ?? null,
        },
      });

      // Recalculate budget item totals
      await recalculateBudgetItem(prisma, body.budgetItemId);

      return { data: transaction };
    });

    // =====================================================================
    // BUDGET SNAPSHOTS
    // =====================================================================

    // -----------------------------------------------------------------------
    // List snapshots for a project (budget history over time)
    // -----------------------------------------------------------------------
    fastify.get('/snapshots', async (request) => {
      const { projectId, limit } = request.query as {
        projectId: string;
        limit?: string;
      };

      if (!projectId) {
        return { error: 'projectId is required', statusCode: 400 };
      }

      const snapshots = await prisma.budgetSnapshot.findMany({
        where: { projectId },
        orderBy: { snapshotDate: 'desc' },
        take: limit ? parseInt(limit, 10) : 52, // Default: 1 year of weekly snapshots
      });

      return { data: snapshots };
    });

    // -----------------------------------------------------------------------
    // Get latest snapshot for a project
    // -----------------------------------------------------------------------
    fastify.get('/snapshots/latest', async (request) => {
      const { projectId } = request.query as { projectId: string };

      if (!projectId) {
        return { error: 'projectId is required', statusCode: 400 };
      }

      const snapshot = await prisma.budgetSnapshot.findFirst({
        where: { projectId },
        orderBy: { snapshotDate: 'desc' },
      });

      if (!snapshot) {
        return { error: 'No snapshots found', statusCode: 404 };
      }

      return { data: snapshot };
    });

    // =====================================================================
    // BUDGET ALERTS
    // =====================================================================

    // -----------------------------------------------------------------------
    // List alerts for a project (optionally filter by acknowledged)
    // -----------------------------------------------------------------------
    fastify.get('/alerts', async (request) => {
      const { projectId, acknowledged, severity } = request.query as {
        projectId?: string;
        acknowledged?: string;
        severity?: string;
      };

      const where: Record<string, any> = {};
      if (projectId) where.projectId = projectId;
      if (acknowledged !== undefined) where.acknowledged = acknowledged === 'true';
      if (severity) where.severity = severity;

      const alerts = await prisma.budgetAlert.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      return { data: alerts };
    });

    // -----------------------------------------------------------------------
    // Acknowledge an alert
    // -----------------------------------------------------------------------
    fastify.put('/alerts/:id/acknowledge', async (request) => {
      const { id } = request.params as { id: string };
      const body = request.body as {
        acknowledgedBy: string;
        resolution?: string;
      };

      const alert = await prisma.budgetAlert.update({
        where: { id },
        data: {
          acknowledged: true,
          acknowledgedAt: new Date(),
          acknowledgedBy: body.acknowledgedBy,
          resolution: body.resolution ?? null,
        },
      });

      return { data: alert };
    });

    // -----------------------------------------------------------------------
    // Resolve an alert
    // -----------------------------------------------------------------------
    fastify.put('/alerts/:id/resolve', async (request) => {
      const { id } = request.params as { id: string };
      const body = request.body as { resolution: string };

      const alert = await prisma.budgetAlert.update({
        where: { id },
        data: {
          resolvedAt: new Date(),
          resolution: body.resolution,
        },
      });

      return { data: alert };
    });

    // =====================================================================
    // BUDGET LINES (Simpler line-level view)
    // =====================================================================

    // -----------------------------------------------------------------------
    // List budget lines for a project
    // -----------------------------------------------------------------------
    fastify.get('/lines', async (request) => {
      const { projectId, category, status } = request.query as {
        projectId?: string;
        category?: string;
        status?: string;
      };

      const where: Record<string, any> = {};
      if (projectId) where.projectId = projectId;
      if (category) where.category = category;
      if (status) where.status = status;

      const lines = await prisma.budgetLine.findMany({
        where,
        orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
      });

      return { data: lines };
    });

    // =====================================================================
    // FORECASTS (Predictions)
    // =====================================================================

    // -----------------------------------------------------------------------
    // List predictions for a project (cost overrun forecasts)
    // -----------------------------------------------------------------------
    fastify.get('/forecasts', async (request) => {
      const { projectId, type, acknowledged } = request.query as {
        projectId?: string;
        type?: string;
        acknowledged?: string;
      };

      const where: Record<string, any> = {};
      if (projectId) where.projectId = projectId;
      if (type) where.type = type;
      if (acknowledged !== undefined) where.acknowledged = acknowledged === 'true';

      const predictions = await prisma.prediction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      return { data: predictions };
    });

    // -----------------------------------------------------------------------
    // Acknowledge a prediction
    // -----------------------------------------------------------------------
    fastify.put('/forecasts/:id/acknowledge', async (request) => {
      const { id } = request.params as { id: string };
      const body = request.body as { acknowledgedBy: string };

      const prediction = await prisma.prediction.update({
        where: { id },
        data: {
          acknowledged: true,
          acknowledgedAt: new Date(),
          acknowledgedBy: body.acknowledgedBy,
        },
      });

      return { data: prediction };
    });
  };
}

// ---------------------------------------------------------------------------
// Helper: Recalculate budget item totals from its transactions
// ---------------------------------------------------------------------------
async function recalculateBudgetItem(
  prisma: PrismaClient,
  budgetItemId: string,
): Promise<void> {
  const transactions = await prisma.budgetTransaction.findMany({
    where: { budgetItemId },
  });

  let actualTotal = 0;
  let committedTotal = 0;

  for (const txn of transactions) {
    const amount = Number(txn.amount);
    switch (txn.type) {
      case 'ACTUAL':
        actualTotal += amount;
        break;
      case 'COMMITTED':
        committedTotal += amount;
        break;
      case 'ADJUSTMENT':
        actualTotal += amount;
        break;
    }
  }

  const item = await prisma.budgetItem.findUnique({
    where: { id: budgetItemId },
  });

  if (!item) return;

  const estimated = Number(item.estimatedCost);
  const variance = actualTotal - estimated;
  const variancePercent = estimated > 0 ? (variance / estimated) * 100 : 0;

  await prisma.budgetItem.update({
    where: { id: budgetItemId },
    data: {
      actualCost: actualTotal,
      committedCost: committedTotal,
      varianceAmount: variance,
      variancePercent,
    },
  });
}
