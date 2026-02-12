/**
 * APP-07: BUDGET TRACKER
 * Automated budget monitoring and variance detection
 * Automation Level: 90%
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { createWorker, queues, JOB_OPTIONS, QUEUE_NAMES } from '../../../shared/queue.js';
import { getEventBus, EVENT_TYPES } from '../../../shared/events.js';
import { sendEmail } from '../../../shared/integrations/email.js';
import {
  formatCurrency,
  formatCurrencyCompact,
  calculatePercentage,
  calculateVariance,
  calculateBudgetSummary,
  calculateCostBreakdown,
  calculateChangeOrderImpact,
  BudgetSummary,
  CostCategory,
} from '../../../shared/utils/money.js';
import { formatDate, addMonths } from '../../../shared/utils/date.js';
import { autonomyEngine } from '../../../shared/autonomy/index.js';

const prisma = new PrismaClient();
const eventBus = getEventBus('budget-tracker');

// ============================================================================
// TYPES
// ============================================================================

interface BudgetLine {
  id: string;
  projectId: string;
  category: string;
  subcategory?: string;
  description: string;
  budgeted: number;
  spent: number;
  committed: number;
  remaining: number;
  variance: number;
  variancePercent: number;
}

interface BudgetAlert {
  id: string;
  projectId: string;
  type: AlertType;
  severity: 'info' | 'warning' | 'critical';
  category?: string;
  message: string;
  threshold: number;
  currentValue: number;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  createdAt: Date;
}

type AlertType =
  | 'OVER_BUDGET'
  | 'APPROACHING_LIMIT'
  | 'BURN_RATE_HIGH'
  | 'PROJECTION_OVERRUN'
  | 'CHANGE_ORDER_THRESHOLD'
  | 'CONTINGENCY_LOW';

interface CashFlowProjection {
  month: string;
  projected: number;
  actual?: number;
  cumulative: number;
  variance?: number;
}

interface BudgetSnapshot {
  id: string;
  projectId: string;
  snapshotDate: Date;
  totalBudget: number;
  spent: number;
  committed: number;
  remaining: number;
  percentComplete: number;
  varianceAmount: number;
  variancePercent: number;
}

// ============================================================================
// BUDGET SERVICE
// ============================================================================

class BudgetService {
  /**
   * Calculate comprehensive budget summary
   */
  async calculateProjectBudget(projectId: string): Promise<BudgetSummary> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        budgetLines: true,
      },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    const totalBudget = (project as any).totalBudget || 0;
    const spent = (project as any).invoices?.reduce(
      (sum: number, inv: any) => sum + inv.amount,
      0
    ) || 0;
    const committed = (project as any).purchaseOrders?.reduce(
      (sum: number, po: any) => sum + po.amount,
      0
    ) || 0;
    const percentComplete = (project as any).percentComplete || 0;

    return calculateBudgetSummary(totalBudget, spent, committed, percentComplete);
  }

  /**
   * Get budget breakdown by category
   */
  async getCategoryBreakdown(projectId: string): Promise<CostCategory[]> {
    const budgetLines = await prisma.budgetLine.findMany({
      where: { projectId },
    });

    const categories = budgetLines.reduce((acc: any, line: any) => {
      const category = line.category;
      if (!acc[category]) {
        acc[category] = { name: category, budgeted: 0, spent: 0, committed: 0 };
      }
      acc[category].budgeted += Number(line.budgetedAmount || 0);
      acc[category].spent += Number(line.actualAmount || 0);
      acc[category].committed += Number(line.committedAmount || 0);

      return acc;
    }, {});

    return calculateCostBreakdown(Object.values(categories));
  }

  /**
   * Project cash flow
   */
  async projectCashFlow(
    projectId: string,
    monthsAhead: number = 6
  ): Promise<CashFlowProjection[]> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        scheduledPayments: {
          orderBy: { scheduledDate: 'asc' },
        },
      },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    const projections: CashFlowProjection[] = [];
    const startDate = new Date();
    let cumulative = 0;

    for (let i = 0; i < monthsAhead; i++) {
      const monthDate = addMonths(startDate, i);
      const monthStr = formatDate(monthDate, 'MMM yyyy');

      // Get scheduled payments for this month
      const monthPayments = (project as any).scheduledPayments?.filter(
        (p: any) => {
          const paymentMonth = formatDate(new Date(p.dueDate), 'MMM yyyy');
          return paymentMonth === monthStr;
        }
      ) || [];

      // Get actual payments for past months
      const actualPayments = (project as any).invoices?.filter(
        (inv: any) => {
          if (!inv.paidAt) return false;
          const paymentMonth = formatDate(new Date(inv.paidAt), 'MMM yyyy');
          return paymentMonth === monthStr;
        }
      ) || [];

      const projected = monthPayments.reduce((s: number, p: any) => s + p.amount, 0);
      const actual = actualPayments.reduce((s: number, p: any) => s + p.amount, 0);
      cumulative += actual || projected;

      projections.push({
        month: monthStr,
        projected,
        actual: i <= 0 ? actual : undefined,
        cumulative,
        variance: actual ? actual - projected : undefined,
      });
    }

    return projections;
  }

  /**
   * Check for budget alerts
   */
  async checkAlerts(projectId: string): Promise<BudgetAlert[]> {
    const summary = await this.calculateProjectBudget(projectId);
    const categories = await this.getCategoryBreakdown(projectId);

    const alerts: Omit<BudgetAlert, 'id' | 'createdAt'>[] = [];

    // Check overall budget
    if (summary.variance.status === 'over') {
      alerts.push({
        projectId,
        type: 'OVER_BUDGET',
        severity: summary.variance.percentage > 10 ? 'critical' : 'warning',
        message: `Project is ${Math.abs(summary.variance.percentage)}% over budget`,
        threshold: 0,
        currentValue: summary.variance.percentage,
        acknowledged: false,
      });
    }

    // Check if approaching limit (>85% spent)
    if (summary.percentSpent > 85 && summary.percentSpent < 100) {
      alerts.push({
        projectId,
        type: 'APPROACHING_LIMIT',
        severity: summary.percentSpent > 95 ? 'critical' : 'warning',
        message: `${summary.percentSpent}% of budget has been spent`,
        threshold: 85,
        currentValue: summary.percentSpent,
        acknowledged: false,
      });
    }

    // Check projected overrun
    if (summary.projectedVariance > 0) {
      const overrunPercent = calculatePercentage(summary.projectedVariance, summary.totalBudget);
      alerts.push({
        projectId,
        type: 'PROJECTION_OVERRUN',
        severity: overrunPercent > 15 ? 'critical' : 'warning',
        message: `Projected to exceed budget by ${formatCurrency(summary.projectedVariance)}`,
        threshold: 0,
        currentValue: summary.projectedVariance,
        acknowledged: false,
      });
    }

    // Check contingency
    const contingencyRemaining = summary.remaining - summary.committed;
    const contingencyPercent = calculatePercentage(contingencyRemaining, summary.totalBudget);
    if (contingencyPercent < 5) {
      alerts.push({
        projectId,
        type: 'CONTINGENCY_LOW',
        severity: contingencyPercent < 2 ? 'critical' : 'warning',
        message: `Only ${contingencyPercent}% contingency remaining`,
        threshold: 5,
        currentValue: contingencyPercent,
        acknowledged: false,
      });
    }

    // Check category-level alerts
    for (const category of categories) {
      if (category.variancePercent > 10) {
        alerts.push({
          projectId,
          type: 'OVER_BUDGET',
          severity: category.variancePercent > 25 ? 'critical' : 'warning',
          category: category.name,
          message: `${category.name} is ${category.variancePercent}% over budget`,
          threshold: 10,
          currentValue: category.variancePercent,
          acknowledged: false,
        });
      }
    }

    // ── Autonomy: Auto-acknowledge low-severity alerts ──
    for (const alert of alerts) {
      if (alert.severity === 'warning' || alert.severity === 'info') {
        try {
          const variancePercent = Math.abs(alert.currentValue || 0);
          const result = await autonomyEngine.evaluateAndAct({
            projectId,
            category: 'budget_variance',
            appSource: 'APP-07',
            actionType: 'budget_acknowledge',
            description: `Auto-acknowledge ${alert.type} alert: ${alert.message}`,
            confidence: alert.severity === 'info' ? 90 : 70,
            percentage: variancePercent,
            metadata: {
              alertType: alert.type,
              severity: alert.severity,
              message: alert.message,
              threshold: alert.threshold,
              currentValue: alert.currentValue,
            },
          });

          if (result.decision === 'AUTO_APPROVED') {
            alert.acknowledged = true;
          }
        } catch {
          // Autonomy check failed — leave alert unacknowledged
        }
      }
    }
    // ── End Autonomy ──

    return alerts as BudgetAlert[];
  }

  /**
   * Create budget snapshot
   */
  async createSnapshot(projectId: string): Promise<BudgetSnapshot> {
    const summary = await this.calculateProjectBudget(projectId);
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    const snapshot = await prisma.budgetSnapshot.create({
      data: {
        projectId,
        snapshotDate: new Date(),
        totalBudget: summary.totalBudget,
        spent: summary.spent,
        committed: summary.committed,
        remaining: summary.remaining,
        percentComplete: (project as any).percentComplete || 0,
        varianceAmount: summary.variance.amount,
        variancePercent: summary.variance.percentage,
      } as any,
    });

    return snapshot as unknown as BudgetSnapshot;
  }
}

const budgetService = new BudgetService();

// ============================================================================
// WORKER
// ============================================================================

async function processBudgetJob(job: Job): Promise<any> {
  const { type, ...data } = job.data;

  switch (type) {
    case 'CALCULATE_BUDGET':
      return await calculateBudget(data.projectId);

    case 'CHECK_ALERTS':
      return await checkBudgetAlerts(data.projectId);

    case 'CHECK_ALL_PROJECTS':
      return await checkAllProjectBudgets();

    case 'CREATE_SNAPSHOT':
      return await createBudgetSnapshot(data.projectId);

    case 'PROCESS_INVOICE':
      return await processInvoice(data);

    case 'PROCESS_CHANGE_ORDER':
      return await processChangeOrderBudgetImpact(data);

    case 'GENERATE_REPORT':
      return await generateBudgetReport(data.projectId, data.period);

    default:
      throw new Error(`Unknown job type: ${type}`);
  }
}

async function calculateBudget(projectId: string) {
  const summary = await budgetService.calculateProjectBudget(projectId);
  const categories = await budgetService.getCategoryBreakdown(projectId);
  const cashFlow = await budgetService.projectCashFlow(projectId);

  return { summary, categories, cashFlow };
}

async function checkBudgetAlerts(projectId: string) {
  const alerts = await budgetService.checkAlerts(projectId);

  // Save new alerts
  for (const alert of alerts) {
    // Check if similar unacknowledged alert exists
    const existing = await prisma.budgetAlert.findFirst({
      where: {
        projectId,
        type: alert.type,
        category: alert.category,
        acknowledged: false,
      },
    });

    if (!existing) {
      const savedAlert = await prisma.budgetAlert.create({
        data: alert as any,
      });

      // Send notifications for critical alerts
      if (alert.severity === 'critical') {
        await notifyBudgetAlert(savedAlert as any);
      }

      // Emit event
      await eventBus.publish(EVENT_TYPES.BUDGET_ALERT, {
        alertId: savedAlert.id,
        projectId,
        type: alert.type,
        severity: alert.severity,
        message: alert.message,
      });
    }
  }

  return { alertCount: alerts.length, alerts };
}

async function checkAllProjectBudgets() {
  const activeProjects = await prisma.project.findMany({
    where: { status: { in: ['IN_PROGRESS', 'ACTIVE'] } },
    select: { id: true, name: true },
  });

  const results = [];
  for (const project of activeProjects) {
    try {
      const alerts = await checkBudgetAlerts(project.id);
      results.push({ projectId: project.id, name: project.name, ...alerts });
    } catch (error) {
      results.push({ projectId: project.id, name: project.name, error: String(error) });
    }
  }

  return { projectsChecked: results.length, results };
}

async function createBudgetSnapshot(projectId: string) {
  const snapshot = await budgetService.createSnapshot(projectId);

  // Emit event
  await eventBus.publish(EVENT_TYPES.BUDGET_UPDATED, {
    projectId,
    snapshotId: snapshot.id,
    spent: snapshot.spent,
    remaining: snapshot.remaining,
    variancePercent: snapshot.variancePercent,
  });

  return snapshot;
}

async function processInvoice(data: {
  projectId: string;
  invoiceId: string;
  amount: number;
  category: string;
}) {
  // Update budget line
  const budgetLine = await prisma.budgetLine.findFirst({
    where: { projectId: data.projectId, category: data.category },
  });

  if (budgetLine) {
    await prisma.budgetLine.update({
      where: { id: budgetLine.id },
      data: {
        actualAmount: { increment: data.amount },
      },
    });
  }

  // Check for budget impacts
  await checkBudgetAlerts(data.projectId);

  // Create snapshot
  await createBudgetSnapshot(data.projectId);

  return { processed: true, invoiceId: data.invoiceId };
}

async function processChangeOrderBudgetImpact(data: {
  projectId: string;
  changeOrderId: string;
  amount: number;
}) {
  const project = await prisma.project.findUnique({
    where: { id: data.projectId },
  });

  if (!project) {
    throw new Error('Project not found');
  }

  // Calculate impact
  const existingChangeOrders = (project as any).changeOrderTotal || 0;
  const impact = calculateChangeOrderImpact(
    (project as any).originalBudget || (project as any).totalBudget,
    data.amount,
    existingChangeOrders
  );

  // Update project budget
  await prisma.project.update({
    where: { id: data.projectId },
    data: {
      totalBudget: impact.newBudget,
      changeOrderTotal: impact.totalChangeOrders,
    } as any,
  });

  // Check for material change alert
  if (impact.isMaterialChange) {
    await prisma.budgetAlert.create({
      data: {
        projectId: data.projectId,
        type: 'CHANGE_ORDER_THRESHOLD',
        severity: 'warning',
        message: `Change orders now represent ${impact.changeOrderPercent}% of original budget`,
        threshold: 10,
        currentValue: impact.changeOrderPercent,
        acknowledged: false,
      } as any,
    });

    await notifyMaterialChange(data.projectId, impact);
  }

  // Create snapshot
  await createBudgetSnapshot(data.projectId);

  return impact;
}

async function generateBudgetReport(
  projectId: string,
  period: 'monthly' | 'quarterly'
) {
  const summary = await budgetService.calculateProjectBudget(projectId);
  const categories = await budgetService.getCategoryBreakdown(projectId);
  const cashFlow = await budgetService.projectCashFlow(projectId, 12);

  // Get historical snapshots
  const snapshots = await prisma.budgetSnapshot.findMany({
    where: { projectId },
    orderBy: { snapshotDate: 'desc' },
    take: period === 'monthly' ? 1 : 3,
  });

  // Get recent alerts
  const alerts = await prisma.budgetAlert.findMany({
    where: {
      projectId,
      createdAt: {
        gte: period === 'monthly'
          ? addMonths(new Date(), -1)
          : addMonths(new Date(), -3),
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const report = {
    projectId,
    period,
    generatedAt: new Date(),
    summary,
    categories,
    cashFlow,
    historicalSnapshots: snapshots,
    alerts,
    analysis: {
      budgetHealth: summary.variance.status,
      spendingTrend: calculateSpendingTrend(snapshots as any),
      topOverrunCategories: categories
        .filter(c => c.variancePercent > 0)
        .sort((a, b) => b.variancePercent - a.variancePercent)
        .slice(0, 3),
      recommendations: generateRecommendations(summary, categories),
    },
  };

  return report;
}

function calculateSpendingTrend(snapshots: BudgetSnapshot[]): 'increasing' | 'stable' | 'decreasing' {
  if (snapshots.length < 2) return 'stable';

  const recent = snapshots[0].variancePercent;
  const previous = snapshots[snapshots.length - 1].variancePercent;
  const change = recent - previous;

  if (change > 5) return 'increasing';
  if (change < -5) return 'decreasing';
  return 'stable';
}

function generateRecommendations(summary: BudgetSummary, categories: CostCategory[]): string[] {
  const recommendations: string[] = [];

  if (summary.variance.status === 'over') {
    recommendations.push('Review all pending purchase orders for potential savings');
    recommendations.push('Consider value engineering for remaining scope');
  }

  if (summary.projectedVariance > 0) {
    recommendations.push(`Projected overrun of ${formatCurrency(summary.projectedVariance)} requires action`);
  }

  const overrunCategories = categories.filter(c => c.variancePercent > 10);
  for (const cat of overrunCategories.slice(0, 2)) {
    recommendations.push(`${cat.name} is ${cat.variancePercent}% over - review commitments`);
  }

  if (summary.percentRemaining < 15) {
    recommendations.push('Low remaining budget - prioritize critical path items');
  }

  return recommendations;
}

async function notifyBudgetAlert(alert: BudgetAlert) {
  const project = await prisma.project.findUnique({
    where: { id: alert.projectId },
    include: {
      projectManagers: {
        include: { user: true },
      },
    },
  });

  if (!project) return;

  const pmEmails = (project as any).projectManagers?.map((pm: any) => pm.user.email) || [];
  const severityColor = alert.severity === 'critical' ? '#dc2626' : '#d97706';

  if (pmEmails.length > 0) {
    await sendEmail({
      to: pmEmails,
      subject: `${alert.severity === 'critical' ? '🚨' : '⚠️'} Budget Alert: ${project.name}`,
      html: `
        <h2 style="color: ${severityColor};">Budget Alert - ${alert.severity.toUpperCase()}</h2>
        <p><strong>Project:</strong> ${project.name}</p>
        <p><strong>Alert:</strong> ${alert.message}</p>
        ${alert.category ? `<p><strong>Category:</strong> ${alert.category}</p>` : ''}
        <p><strong>Current Value:</strong> ${alert.currentValue}%</p>
        <p><strong>Threshold:</strong> ${alert.threshold}%</p>
        <p style="margin-top: 20px;">
          Please review the project budget and take appropriate action.
        </p>
      `,
    });
  }
}

async function notifyMaterialChange(
  projectId: string,
  impact: ReturnType<typeof calculateChangeOrderImpact>
) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      projectManagers: {
        include: { user: true },
      },
    },
  });

  if (!project) return;

  const pmEmails = (project as any).projectManagers?.map((pm: any) => pm.user.email) || [];

  if (pmEmails.length > 0) {
    await sendEmail({
      to: pmEmails,
      subject: `Material Budget Change: ${project.name}`,
      html: `
        <h2 style="color: #d97706;">Material Budget Change Alert</h2>
        <p>Change orders have exceeded 10% of the original budget:</p>
        <table style="border-collapse: collapse; width: 100%;">
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Original Budget:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${formatCurrency((project as any).originalBudget || 0)}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Total Change Orders:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${formatCurrency(impact.totalChangeOrders)}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Change Order %:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd; color: #d97706;">${impact.changeOrderPercent}%</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>New Budget:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${formatCurrency(impact.newBudget)}</td>
          </tr>
        </table>
        <p style="margin-top: 20px;">
          This may require stakeholder notification and budget reauthorization.
        </p>
      `,
    });
  }
}

// Create worker
export const budgetTrackerWorker = createWorker(
  QUEUE_NAMES.BUDGET_TRACKER,
  processBudgetJob
);

// ============================================================================
// ROUTES
// ============================================================================

export async function budgetTrackerRoutes(fastify: FastifyInstance) {
  /**
   * Get project budget summary
   */
  fastify.get('/projects/:projectId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = request.params as { projectId: string };

    const summary = await budgetService.calculateProjectBudget(projectId);
    const categories = await budgetService.getCategoryBreakdown(projectId);

    return { summary, categories };
  });

  /**
   * Get budget breakdown by category
   */
  fastify.get('/projects/:projectId/categories', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = request.params as { projectId: string };

    const categories = await budgetService.getCategoryBreakdown(projectId);
    return { categories };
  });

  /**
   * Get cash flow projection
   */
  fastify.get('/projects/:projectId/cash-flow', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = request.params as { projectId: string };
    const { months = '6' } = request.query as { months?: string };

    const cashFlow = await budgetService.projectCashFlow(projectId, parseInt(months));
    return { cashFlow };
  });

  /**
   * Get budget alerts
   */
  fastify.get('/projects/:projectId/alerts', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = request.params as { projectId: string };
    const { acknowledged } = request.query as { acknowledged?: string };

    const alerts = await prisma.budgetAlert.findMany({
      where: {
        projectId,
        ...(acknowledged !== undefined && { acknowledged: acknowledged === 'true' }),
      },
      orderBy: { createdAt: 'desc' },
    });

    return { alerts };
  });

  /**
   * Acknowledge alert
   */
  fastify.post('/alerts/:id/acknowledge', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { acknowledgedBy } = request.body as { acknowledgedBy: string };

    const alert = await prisma.budgetAlert.update({
      where: { id },
      data: {
        acknowledged: true,
        acknowledgedBy,
        acknowledgedAt: new Date(),
      } as any,
    });

    return alert;
  });

  /**
   * Check budget alerts
   */
  fastify.post('/projects/:projectId/check-alerts', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = request.params as { projectId: string };

    const job = await queues.BUDGET_TRACKER.add(
      'check-alerts',
      { type: 'CHECK_ALERTS', projectId },
      JOB_OPTIONS.DEFAULT
    );

    return { jobId: job.id, status: 'checking' };
  });

  /**
   * Get budget snapshots (history)
   */
  fastify.get('/projects/:projectId/snapshots', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = request.params as { projectId: string };
    const { limit = '10' } = request.query as { limit?: string };

    const snapshots = await prisma.budgetSnapshot.findMany({
      where: { projectId },
      orderBy: { snapshotDate: 'desc' },
      take: parseInt(limit),
    });

    return { snapshots };
  });

  /**
   * Create budget snapshot
   */
  fastify.post('/projects/:projectId/snapshot', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = request.params as { projectId: string };

    const snapshot = await budgetService.createSnapshot(projectId);
    return snapshot;
  });

  /**
   * Process invoice (update budget)
   */
  fastify.post('/projects/:projectId/invoice', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = request.params as { projectId: string };
    const { invoiceId, amount, category } = request.body as {
      invoiceId: string;
      amount: number;
      category: string;
    };

    const job = await queues.BUDGET_TRACKER.add(
      'process-invoice',
      { type: 'PROCESS_INVOICE', projectId, invoiceId, amount, category },
      JOB_OPTIONS.DEFAULT
    );

    return { jobId: job.id, status: 'processing' };
  });

  /**
   * Generate budget report
   */
  fastify.post('/projects/:projectId/report', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = request.params as { projectId: string };
    const { period = 'monthly' } = request.body as { period?: 'monthly' | 'quarterly' };

    const job = await queues.BUDGET_TRACKER.add(
      'generate-report',
      { type: 'GENERATE_REPORT', projectId, period },
      JOB_OPTIONS.DEFAULT
    );

    return { jobId: job.id, status: 'generating' };
  });

  /**
   * Get budget lines
   */
  fastify.get('/projects/:projectId/lines', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = request.params as { projectId: string };

    const lines = await prisma.budgetLine.findMany({
      where: { projectId },
      orderBy: [{ category: 'asc' }, { subcategory: 'asc' }],
    });

    return { lines };
  });

  /**
   * Update budget line
   */
  fastify.patch('/lines/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const updates = request.body as Partial<BudgetLine>;

    const line = await prisma.budgetLine.update({
      where: { id },
      data: updates as any,
    });

    return line;
  });

  /**
   * Dashboard metrics
   */
  fastify.get('/dashboard/metrics', async (request: FastifyRequest, reply: FastifyReply) => {
    const [
      criticalAlerts,
      warningAlerts,
      projectsOverBudget,
      totalSpentToday,
    ] = await Promise.all([
      prisma.budgetAlert.count({
        where: { severity: 'critical', acknowledged: false },
      }),
      prisma.budgetAlert.count({
        where: { severity: 'warning', acknowledged: false },
      }),
      prisma.project.count({
        where: {
          status: { in: ['IN_PROGRESS', 'ACTIVE'] },
          // Projects where spent > budget
        },
      }),
      prisma.invoice.aggregate({
        where: {
          paidAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
        _sum: { amount: true },
      }),
    ]);

    return {
      criticalAlerts,
      warningAlerts,
      projectsOverBudget,
      totalSpentToday: totalSpentToday._sum.amount || 0,
    };
  });
}
