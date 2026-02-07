import { PrismaClient, Prisma } from '@prisma/client';
import { generateJSON } from '../../infrastructure/ai.js';
import { AI_PROMPTS } from '../../infrastructure/ai-prompts.js';
import { eventBus } from '../../infrastructure/event-bus.js';
import { EVENT_TYPES } from '../../infrastructure/event-types.js';

const prisma = new PrismaClient();
const SOURCE_APP = 'APP-07';

interface ReceiptData {
  vendor: string;
  amount: number;
  date: string;
  category: string;
  description: string;
}

interface DashboardData {
  snapshot: {
    totalBudget: number;
    spentToDate: number;
    committed: number;
    variance: number;
    variancePercent: number;
    forecast: number | null;
    alertLevel: string;
  } | null;
  recentPayments: Array<{
    id: string;
    amount: number;
    status: string;
    paidAt: Date | null;
    createdAt: Date;
  }>;
  pendingChangeOrders: Array<{
    id: string;
    title: string;
    totalCost: number;
    status: string;
  }>;
  budgetLines: Array<{
    category: string;
    budgeted: number;
    actual: number;
    committed: number;
    variance: number;
  }>;
}

export class BudgetTrackerService {
  // -----------------------------------------------------------------------
  // processReceipt
  // -----------------------------------------------------------------------

  async processReceipt(
    projectId: string,
    data: {
      fileUrl?: string;
      ocrData?: ReceiptData;
      documentId?: string;
    },
  ): Promise<void> {
    let receipt: ReceiptData;

    if (data.ocrData) {
      receipt = data.ocrData;
    } else {
      // Use AI to extract receipt data from description or image
      try {
        const result = await generateJSON<ReceiptData>({
          systemPrompt:
            'You are a receipt data extractor for construction project expenses. ' +
            'Extract structured data from the provided receipt information.',
          userPrompt:
            `Extract receipt data from this document (ID: ${data.documentId ?? 'unknown'}).\n` +
            `File: ${data.fileUrl ?? 'not provided'}\n\n` +
            `Respond with JSON: { "vendor": string, "amount": number, ` +
            `"date": "YYYY-MM-DD", "category": string (e.g. "MATERIALS", ` +
            `"LABOR", "EQUIPMENT", "PERMITS", "SUBCONTRACTOR"), ` +
            `"description": string }`,
          maxTokens: 500,
        });
        receipt = result.data;
      } catch (err) {
        console.error('[BudgetTracker] AI receipt extraction failed:', (err as Error).message);
        receipt = {
          vendor: 'Unknown',
          amount: 0,
          date: new Date().toISOString().split('T')[0],
          category: 'MATERIALS',
          description: 'Receipt pending manual review',
        };
      }
    }

    // Update budget line with actual expense
    const budgetLine = await prisma.budgetLine.findFirst({
      where: { projectId, category: receipt.category },
    });

    if (budgetLine) {
      await prisma.budgetLine.update({
        where: { id: budgetLine.id },
        data: {
          actualAmount: { increment: new Prisma.Decimal(receipt.amount.toFixed(2)) },
        },
      });
    } else {
      await prisma.budgetLine.create({
        data: {
          projectId,
          category: receipt.category,
          description: `${receipt.category} expenses`,
          budgetedAmount: new Prisma.Decimal(0),
          actualAmount: new Prisma.Decimal(receipt.amount.toFixed(2)),
        },
      });
    }

    // Recalculate variance on the budget line
    const updatedLine = await prisma.budgetLine.findFirst({
      where: { projectId, category: receipt.category },
    });

    if (updatedLine) {
      const budgeted = Number(updatedLine.budgetedAmount);
      const actual = Number(updatedLine.actualAmount);
      const variance = budgeted - actual;
      const variancePercent = budgeted > 0 ? (variance / budgeted) * 100 : 0;

      await prisma.budgetLine.update({
        where: { id: updatedLine.id },
        data: {
          variance: new Prisma.Decimal(variance.toFixed(2)),
          variancePercent: new Prisma.Decimal(variancePercent.toFixed(2)),
          status: variance < 0 ? 'OVER_BUDGET' : 'ON_TRACK',
        },
      });
    }

    // Check for budget overrun at the project level
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (project?.budget) {
      const allLines = await prisma.budgetLine.findMany({ where: { projectId } });
      const totalActual = allLines.reduce((s, l) => s + Number(l.actualAmount), 0);
      const budget = Number(project.budget);

      if (totalActual > budget) {
        await eventBus.publish(
          EVENT_TYPES.BUDGET_OVERRUN_DETECTED,
          {
            projectId,
            budget,
            actual: totalActual,
            overage: totalActual - budget,
            overagePercent: ((totalActual - budget) / budget) * 100,
            triggerSource: 'receipt',
          },
          SOURCE_APP,
          { projectId },
        );
      }
    }
  }

  // -----------------------------------------------------------------------
  // createSnapshot
  // -----------------------------------------------------------------------

  async createSnapshot(projectId: string): Promise<string> {
    const project = await prisma.project.findUniqueOrThrow({
      where: { id: projectId },
    });

    const budgetLines = await prisma.budgetLine.findMany({
      where: { projectId },
    });

    const totalBudget = Number(project.budget ?? 0);
    const spentToDate = budgetLines.reduce(
      (s, l) => s + Number(l.actualAmount),
      0,
    );
    const committed = budgetLines.reduce(
      (s, l) => s + Number(l.committedAmount),
      0,
    );
    const totalVariance = totalBudget - spentToDate;
    const percentComplete =
      totalBudget > 0 ? (spentToDate / totalBudget) * 100 : 0;

    // Determine alert level
    const overagePercent =
      totalBudget > 0
        ? Math.max(0, ((spentToDate + committed - totalBudget) / totalBudget) * 100)
        : 0;

    let alertLevel: string;
    if (overagePercent <= 0) alertLevel = 'green';
    else if (overagePercent <= 5) alertLevel = 'green';
    else if (overagePercent <= 15) alertLevel = 'yellow';
    else alertLevel = 'red';

    // AI forecast: predict final cost
    let forecast: number | null = null;
    try {
      const result = await generateJSON<{ forecastFinalCost: number; reasoning: string }>({
        systemPrompt: AI_PROMPTS.PREDICTIVE_ENGINE,
        userPrompt:
          `Forecast the final cost for this construction project.\n\n` +
          `Total budget: $${totalBudget.toLocaleString()}\n` +
          `Spent to date: $${spentToDate.toLocaleString()}\n` +
          `Committed (approved COs): $${committed.toLocaleString()}\n` +
          `Completion: ${percentComplete.toFixed(1)}%\n` +
          `Alert level: ${alertLevel}\n\n` +
          `Budget breakdown:\n` +
          budgetLines
            .map(
              (l) =>
                `  ${l.category}: budgeted $${Number(l.budgetedAmount).toLocaleString()}, ` +
                `actual $${Number(l.actualAmount).toLocaleString()}, ` +
                `committed $${Number(l.committedAmount).toLocaleString()}`,
            )
            .join('\n') +
          `\n\nRespond with JSON: { "forecastFinalCost": number, "reasoning": string }`,
        maxTokens: 500,
      });
      forecast = result.data.forecastFinalCost;
    } catch (err) {
      console.error('[BudgetTracker] AI forecast failed:', (err as Error).message);
    }

    // Build category breakdown
    const categories: Record<string, any> = {};
    for (const line of budgetLines) {
      categories[line.category] = {
        budgeted: Number(line.budgetedAmount),
        actual: Number(line.actualAmount),
        committed: Number(line.committedAmount),
        variance: Number(line.variance),
      };
    }

    // Create snapshot
    const snapshot = await prisma.budgetSnapshot.create({
      data: {
        projectId,
        totalBudget: new Prisma.Decimal(totalBudget.toFixed(2)),
        totalCommitted: new Prisma.Decimal(committed.toFixed(2)),
        totalActual: new Prisma.Decimal(spentToDate.toFixed(2)),
        totalVariance: new Prisma.Decimal(totalVariance.toFixed(2)),
        percentComplete: new Prisma.Decimal(percentComplete.toFixed(2)),
        forecast: forecast
          ? new Prisma.Decimal(forecast.toFixed(2))
          : undefined,
        categories,
        notes: alertLevel === 'red' ? 'Budget overrun detected' : undefined,
      },
    });

    // Alert on red
    if (alertLevel === 'red') {
      await eventBus.publish(
        EVENT_TYPES.BUDGET_OVERRUN_DETECTED,
        {
          projectId,
          snapshotId: snapshot.id,
          totalBudget,
          spentToDate,
          committed,
          overagePercent,
          forecast,
          alertLevel,
        },
        SOURCE_APP,
        { projectId },
      );
    }

    return snapshot.id;
  }

  // -----------------------------------------------------------------------
  // getDashboardData
  // -----------------------------------------------------------------------

  async getDashboardData(projectId: string): Promise<DashboardData> {
    // Latest snapshot
    const latestSnapshot = await prisma.budgetSnapshot.findFirst({
      where: { projectId },
      orderBy: { snapshotDate: 'desc' },
    });

    // Recent payments (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentPayments = await prisma.payment.findMany({
      where: {
        projectId,
        createdAt: { gte: thirtyDaysAgo },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // Pending change orders
    const pendingCOs = await prisma.changeOrder.findMany({
      where: {
        projectId,
        status: { in: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Budget lines
    const budgetLines = await prisma.budgetLine.findMany({
      where: { projectId },
      orderBy: { sortOrder: 'asc' },
    });

    const totalBudget = latestSnapshot ? Number(latestSnapshot.totalBudget) : 0;
    const spentToDate = latestSnapshot ? Number(latestSnapshot.totalActual) : 0;
    const committed = latestSnapshot ? Number(latestSnapshot.totalCommitted) : 0;
    const variance = latestSnapshot ? Number(latestSnapshot.totalVariance) : 0;
    const variancePercent =
      totalBudget > 0 ? (variance / totalBudget) * 100 : 0;
    const overagePercent =
      totalBudget > 0
        ? Math.max(0, ((spentToDate + committed - totalBudget) / totalBudget) * 100)
        : 0;

    let alertLevel: string;
    if (overagePercent <= 5) alertLevel = 'green';
    else if (overagePercent <= 15) alertLevel = 'yellow';
    else alertLevel = 'red';

    return {
      snapshot: latestSnapshot
        ? {
            totalBudget,
            spentToDate,
            committed,
            variance,
            variancePercent,
            forecast: latestSnapshot.forecast
              ? Number(latestSnapshot.forecast)
              : null,
            alertLevel,
          }
        : null,
      recentPayments: recentPayments.map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        status: p.status,
        paidAt: p.paidAt,
        createdAt: p.createdAt,
      })),
      pendingChangeOrders: pendingCOs.map((co) => ({
        id: co.id,
        title: co.title,
        totalCost: Number(co.totalCost),
        status: co.status,
      })),
      budgetLines: budgetLines.map((bl) => ({
        category: bl.category,
        budgeted: Number(bl.budgetedAmount),
        actual: Number(bl.actualAmount),
        committed: Number(bl.committedAmount),
        variance: Number(bl.variance),
      })),
    };
  }

  // -----------------------------------------------------------------------
  // processPayment
  // -----------------------------------------------------------------------

  async processPayment(paymentId: string): Promise<void> {
    const payment = await prisma.payment.findUniqueOrThrow({
      where: { id: paymentId },
    });

    if (!payment.projectId) return;

    const amount = Number(payment.amount);
    const category = 'PAYMENTS';

    // Update or create budget line for payments
    const budgetLine = await prisma.budgetLine.findFirst({
      where: { projectId: payment.projectId, category },
    });

    if (budgetLine) {
      await prisma.budgetLine.update({
        where: { id: budgetLine.id },
        data: {
          actualAmount: { increment: new Prisma.Decimal(amount.toFixed(2)) },
        },
      });
    } else {
      await prisma.budgetLine.create({
        data: {
          projectId: payment.projectId,
          category,
          description: 'Project payments',
          budgetedAmount: new Prisma.Decimal(0),
          actualAmount: new Prisma.Decimal(amount.toFixed(2)),
        },
      });
    }

    // Create a fresh snapshot after payment processing
    await this.createSnapshot(payment.projectId);
  }
}
