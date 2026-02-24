import type { PrismaClient } from '@prisma/client';
import type { EventBus, KealeeEventEnvelope } from '@kealee/events';
import { createEvent, EVENT_TYPES } from '@kealee/events';
import { KEALEE_QUEUES, createQueue, createWorker } from '@kealee/queue';
import { AIProvider, BUDGET_PROMPT } from '@kealee/ai';
import { BaseClaw } from '../base-claw';
import { VARIANCE_PROMPT, FORECAST_PROMPT } from './ai/prompts';
import type { Job } from 'bullmq';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Budget categories per architecture doc S9 */
const BUDGET_CATEGORIES = [
  'LABOR',
  'MATERIAL',
  'EQUIPMENT',
  'SUBCONTRACTOR',
  'PERMITS',
  'OVERHEAD',
  'CONTINGENCY',
] as const;

type BudgetCategory = typeof BUDGET_CATEGORIES[number];

/** Variance thresholds that trigger alerts */
const VARIANCE_THRESHOLDS = {
  /** >15% variance in any single category triggers a category alert */
  CATEGORY_PERCENT: 15,
  /** >10% total project budget variance triggers a total alert */
  TOTAL_PERCENT: 10,
} as const;

// Config per architecture doc S9
const CLAW_CONFIG = {
  name: 'budget-cost-claw',
  eventPatterns: ['estimate.*', 'changeorder.*', 'payment.*'],
  writableModels: [
    'BudgetItem',
    'BudgetLine',
    'BudgetEntry',
    'BudgetTransaction',
    'BudgetSnapshot',
    'BudgetAlert',
    'Prediction',
  ],
};

/**
 * Claw D: Budget & Cost
 *
 * Responsibilities:
 *   - Seed budget from approved estimates (7 categories)
 *   - Recalculate budget on approved change orders
 *   - Record actuals from payment disbursements
 *   - Variance alerts (>15% category or >10% total)
 *   - AI root cause analysis on variance triggers
 *   - Cost forecasting with earned value metrics
 *   - Budget snapshots for trend analysis
 *
 * Events consumed:
 *   estimate.approved, changeorder.approved, payment.disbursed
 *
 * Events published:
 *   budget.seeded.from.estimate, budget.updated,
 *   budget.alert.variance.high, prediction.costoverrun.created
 *
 * GUARDRAILS:
 *   - Cannot modify contracts, change orders, or payment statuses
 *   - Cannot alter schedules
 *   - Cannot approve/reject permits
 */
export class BudgetCostClaw extends BaseClaw {
  private ai: AIProvider;

  constructor(eventBus: EventBus, prisma: PrismaClient) {
    super(eventBus, prisma, CLAW_CONFIG);
    this.ai = new AIProvider();
  }

  // =========================================================================
  // Event Router
  // =========================================================================

  async handleEvent(event: KealeeEventEnvelope): Promise<void> {
    switch (event.type) {
      // --- Estimate approved -> seed budget from estimate categories ---
      case 'estimate.approved': {
        const queue = createQueue(KEALEE_QUEUES.BUDGET_TRACKER);
        await queue.add('seed-budget-from-estimate', { event });
        break;
      }

      // --- Change order approved -> recalculate budget with CO impact ---
      case 'changeorder.approved': {
        const queue = createQueue(KEALEE_QUEUES.BUDGET_TRACKER);
        await queue.add('recalculate-for-change-order', { event });
        break;
      }

      // --- Payment disbursed -> record actual costs ---
      case 'payment.disbursed': {
        const queue = createQueue(KEALEE_QUEUES.BUDGET_TRACKER);
        await queue.add('record-actual-from-payment', { event });
        break;
      }

      // --- Estimate updated (CTC takeoff confirmed) -> refresh budget if needed ---
      case 'estimate.updated': {
        const p = event.payload as Record<string, any>;
        if (p.status === 'AI_TAKEOFF_CONFIRMED') {
          const queue = createQueue(KEALEE_QUEUES.BUDGET_TRACKER);
          await queue.add('ctc-estimate-ready', { event });
        }
        break;
      }
    }
  }

  // =========================================================================
  // Worker Registration
  // =========================================================================

  async registerWorkers(): Promise<void> {
    createWorker(KEALEE_QUEUES.BUDGET_TRACKER, async (job: Job) => {
      switch (job.name) {
        case 'seed-budget-from-estimate':
          await this.handleSeedBudgetFromEstimate(job);
          break;
        case 'recalculate-for-change-order':
          await this.handleRecalculateForChangeOrder(job);
          break;
        case 'record-actual-from-payment':
          await this.handleRecordActualFromPayment(job);
          break;
        case 'check-variance-alerts':
          await this.handleCheckVarianceAlerts(job);
          break;
        case 'generate-forecast':
          return await this.handleGenerateForecast(job);
        case 'create-snapshot':
          await this.handleCreateSnapshot(job);
          break;
        case 'ctc-estimate-ready':
          await this.handleCTCEstimateReady(job);
          break;
      }
    });
  }

  // =========================================================================
  // seed-budget-from-estimate: Create budget items from approved estimate
  // =========================================================================

  private async handleSeedBudgetFromEstimate(job: Job): Promise<void> {
    const { event } = job.data as { event: KealeeEventEnvelope };
    this.assertWritable('BudgetItem');
    this.assertWritable('BudgetTransaction');
    this.assertWritable('BudgetLine');

    const payload = event.payload as Record<string, any>;
    const projectId = event.projectId;
    const organizationId = event.organizationId;
    const estimateId = payload.estimateId;

    if (!estimateId) return;

    // Load the approved estimate with sections and line items
    const estimate = await this.prisma.estimate.findUnique({
      where: { id: estimateId },
      include: {
        sections: {
          include: { lineItems: true },
        },
      },
    });

    if (!estimate) return;

    // Check if budget items already exist for this project
    const existingItems = await this.prisma.budgetItem.findMany({
      where: { projectId },
    });

    if (existingItems.length > 0) {
      console.warn(
        `[${this.config.name}] Budget already seeded for project ${projectId}. Skipping.`,
      );
      return;
    }

    // Categorize estimate line items into the 7 budget categories
    const categoryTotals = new Map<BudgetCategory, number>();
    for (const cat of BUDGET_CATEGORIES) {
      categoryTotals.set(cat, 0);
    }

    const sections = estimate.sections ?? [];
    const allLineItems = sections.flatMap((s: any) => s.lineItems ?? []);

    // Check if this estimate was built from CTC tasks (has assembly references
    // with ctcTaskNumber). CTC tasks carry granular L/M/E breakdowns we can use
    // directly instead of relying on AI categorization.
    const ctcAssemblyIds = allLineItems
      .map((li: any) => li.assemblyId)
      .filter(Boolean);

    let ctcAssemblyMap = new Map<string, any>();
    if (ctcAssemblyIds.length > 0) {
      const ctcAssemblies = await this.prisma.assembly.findMany({
        where: {
          id: { in: ctcAssemblyIds },
          ctcTaskNumber: { not: null },
        },
      });
      ctcAssemblyMap = new Map(ctcAssemblies.map((a) => [a.id, a]));
    }

    const isCTCEstimate = ctcAssemblyMap.size > 0;

    if (isCTCEstimate) {
      // CTC-aware categorization: use built-in labor/material/equipment breakdown
      for (const lineItem of allLineItems) {
        const assembly = ctcAssemblyMap.get(lineItem.assemblyId);
        if (assembly) {
          // CTC tasks have explicit L/M/E breakdowns — split into budget categories
          const qty = Number(lineItem.quantity ?? 1);
          const laborCost = Number(assembly.laborCost ?? 0) * qty;
          const materialCost = Number(assembly.materialCost ?? 0) * qty;
          const equipmentCost = Number(assembly.equipmentCost ?? 0) * qty;

          categoryTotals.set('LABOR', (categoryTotals.get('LABOR') ?? 0) + laborCost);
          categoryTotals.set('MATERIAL', (categoryTotals.get('MATERIAL') ?? 0) + materialCost);
          categoryTotals.set('EQUIPMENT', (categoryTotals.get('EQUIPMENT') ?? 0) + equipmentCost);
        } else {
          // Non-CTC line item in a mixed estimate — use CSI-based fallback
          const category = this.resolveCategory(undefined, lineItem);
          const amount = Number(lineItem.totalCost ?? lineItem.amount ?? 0);
          categoryTotals.set(category, (categoryTotals.get(category) ?? 0) + amount);
        }
      }
    } else {
      // Standard AI categorization for non-CTC estimates
      const aiResult = await this.ai.reason({
        task:
          'Categorize these estimate line items into the 7 standard construction budget categories: ' +
          'LABOR, MATERIAL, EQUIPMENT, SUBCONTRACTOR, PERMITS, OVERHEAD, CONTINGENCY. ' +
          'Return a JSON object mapping each lineItemId to its budget category.',
        context: {
          lineItems: allLineItems.map((li: any) => ({
            id: li.id,
            description: li.description,
            csiDivision: li.csiDivision ?? null,
            totalCost: li.totalCost ?? li.amount ?? 0,
            unitType: li.unitType ?? null,
          })),
        },
        systemPrompt: BUDGET_PROMPT,
      });

      const lineItemCategories = (aiResult as any)?.categories ?? {};

      for (const lineItem of allLineItems) {
        const category = this.resolveCategory(
          lineItemCategories[lineItem.id],
          lineItem,
        );
        const amount = Number(lineItem.totalCost ?? lineItem.amount ?? 0);
        categoryTotals.set(
          category,
          (categoryTotals.get(category) ?? 0) + amount,
        );
      }
    }

    // Add contingency if not present (default 10% of subtotal)
    const subtotal = Array.from(categoryTotals.entries())
      .filter(([cat]) => cat !== 'CONTINGENCY')
      .reduce((sum, [, val]) => sum + val, 0);

    if ((categoryTotals.get('CONTINGENCY') ?? 0) === 0) {
      categoryTotals.set('CONTINGENCY', subtotal * 0.1);
    }

    // Create BudgetItem and initial BudgetTransaction for each category
    const createdItemIds: string[] = [];

    for (const [category, estimatedCost] of categoryTotals) {
      if (estimatedCost <= 0) continue;

      this.assertWritable('BudgetItem');
      const budgetItem = await this.prisma.budgetItem.create({
        data: {
          projectId,
          organizationId,
          category,
          description: `${category} - seeded from estimate ${estimate.name}`,
          estimatedCost,
          actualCost: 0,
          committedCost: 0,
          varianceAmount: 0,
          variancePercent: 0,
          estimateId,
        },
      });

      createdItemIds.push(budgetItem.id);

      // Create the initial ESTIMATED transaction
      this.assertWritable('BudgetTransaction');
      await this.prisma.budgetTransaction.create({
        data: {
          budgetItemId: budgetItem.id,
          projectId,
          organizationId,
          amount: estimatedCost,
          type: 'ESTIMATED',
          description: `Initial budget from approved estimate: ${estimate.name}`,
          referenceType: 'ESTIMATE',
          referenceId: estimateId,
        },
      });

      // Also create a BudgetLine for the simpler view
      this.assertWritable('BudgetLine');
      await this.prisma.budgetLine.create({
        data: {
          projectId,
          category,
          description: `${category} budget from estimate`,
          budgetedAmount: estimatedCost,
          committedAmount: 0,
          actualAmount: 0,
          variance: 0,
          variancePercent: 0,
          status: 'ON_TRACK',
        },
      });
    }

    // Create initial budget snapshot
    const queue = createQueue(KEALEE_QUEUES.BUDGET_TRACKER);
    await queue.add('create-snapshot', {
      projectId,
      organizationId,
      reason: 'initial-seed',
    });

    // Publish budget.seeded.from.estimate
    const seededEvent = createEvent({
      type: EVENT_TYPES.budget.seeded.from.estimate,
      source: this.config.name,
      projectId,
      organizationId,
      payload: {
        estimateId,
        budgetItemCount: createdItemIds.length,
        budgetItemIds: createdItemIds,
        totalBudget: subtotal + (categoryTotals.get('CONTINGENCY') ?? 0),
        categories: Object.fromEntries(categoryTotals),
      },
      trigger: { eventId: event.id, eventType: event.type },
    });
    await this.eventBus.publish(seededEvent);
  }

  // =========================================================================
  // recalculate-for-change-order: Adjust budget when CO is approved
  // =========================================================================

  private async handleRecalculateForChangeOrder(job: Job): Promise<void> {
    const { event } = job.data as { event: KealeeEventEnvelope };
    this.assertWritable('BudgetItem');
    this.assertWritable('BudgetTransaction');
    this.assertWritable('BudgetLine');

    const payload = event.payload as Record<string, any>;
    const projectId = event.projectId;
    const organizationId = event.organizationId;
    const changeOrderId = payload.changeOrderId;

    if (!changeOrderId) return;

    // Load the change order with line items
    const changeOrder = await this.prisma.changeOrder.findUnique({
      where: { id: changeOrderId },
      include: { lineItems: true },
    });

    if (!changeOrder) return;

    // AI categorization of CO line items into budget categories
    const coLineItems = changeOrder.lineItems ?? [];
    const aiResult = await this.ai.reason({
      task:
        'Categorize these change order line items into budget categories: ' +
        'LABOR, MATERIAL, EQUIPMENT, SUBCONTRACTOR, PERMITS, OVERHEAD, CONTINGENCY. ' +
        'For each line item, determine the budget impact (additive or deductive).',
      context: {
        changeOrder: {
          title: changeOrder.title,
          description: changeOrder.description,
          totalAmount: changeOrder.amount,
        },
        lineItems: coLineItems.map((li: any) => ({
          id: li.id,
          description: li.description,
          totalCost: li.totalCost,
          csiDivision: li.csiDivision ?? null,
        })),
      },
      systemPrompt: BUDGET_PROMPT,
    });

    const lineItemCategories = (aiResult as any)?.categories ?? {};

    // Apply CO impact to budget items
    const categoryDeltas = new Map<string, number>();

    for (const lineItem of coLineItems) {
      const category = this.resolveCategory(
        lineItemCategories[lineItem.id],
        lineItem,
      );
      const amount = Number(lineItem.totalCost ?? 0);
      categoryDeltas.set(
        category,
        (categoryDeltas.get(category) ?? 0) + amount,
      );
    }

    // Update budget items and create transactions
    for (const [category, delta] of categoryDeltas) {
      // Find the existing budget item for this category
      let budgetItem = await this.prisma.budgetItem.findFirst({
        where: { projectId, category },
      });

      if (!budgetItem) {
        // Create budget item if it doesn't exist for this category
        this.assertWritable('BudgetItem');
        budgetItem = await this.prisma.budgetItem.create({
          data: {
            projectId,
            organizationId,
            category,
            description: `${category} - created from change order`,
            estimatedCost: 0,
            actualCost: 0,
            committedCost: 0,
            varianceAmount: 0,
            variancePercent: 0,
          },
        });
      }

      // Update estimated cost to include CO impact
      const newEstimated = Number(budgetItem.estimatedCost) + delta;
      const variance = Number(budgetItem.actualCost) - newEstimated;
      const variancePercent =
        newEstimated > 0 ? (variance / newEstimated) * 100 : 0;

      this.assertWritable('BudgetItem');
      await this.prisma.budgetItem.update({
        where: { id: budgetItem.id },
        data: {
          estimatedCost: newEstimated,
          committedCost: Number(budgetItem.committedCost) + delta,
          varianceAmount: variance,
          variancePercent,
        },
      });

      // Record the CO transaction
      this.assertWritable('BudgetTransaction');
      await this.prisma.budgetTransaction.create({
        data: {
          budgetItemId: budgetItem.id,
          projectId,
          organizationId,
          amount: delta,
          type: 'COMMITTED',
          description: `Change order: ${changeOrder.title} (${changeOrder.changeOrderNumber})`,
          referenceType: 'CHANGE_ORDER',
          referenceId: changeOrderId,
        },
      });

      // Update the BudgetLine
      const budgetLine = await this.prisma.budgetLine.findFirst({
        where: { projectId, category },
      });
      if (budgetLine) {
        this.assertWritable('BudgetLine');
        await this.prisma.budgetLine.update({
          where: { id: budgetLine.id },
          data: {
            budgetedAmount: newEstimated,
            committedAmount: Number(budgetLine.committedAmount) + delta,
            variance: Number(budgetLine.actualAmount) - newEstimated,
            variancePercent:
              newEstimated > 0
                ? ((Number(budgetLine.actualAmount) - newEstimated) / newEstimated) * 100
                : 0,
            status:
              Math.abs(variancePercent) > VARIANCE_THRESHOLDS.CATEGORY_PERCENT
                ? 'OVER_BUDGET'
                : Math.abs(variancePercent) > VARIANCE_THRESHOLDS.CATEGORY_PERCENT / 2
                  ? 'AT_RISK'
                  : 'ON_TRACK',
          },
        });
      }
    }

    // Check for variance alerts after recalculation
    const queue = createQueue(KEALEE_QUEUES.BUDGET_TRACKER);
    await queue.add('check-variance-alerts', {
      projectId,
      organizationId,
      trigger: 'changeorder',
      changeOrderId,
      event,
    });

    // Create snapshot after CO impact
    await queue.add('create-snapshot', {
      projectId,
      organizationId,
      reason: `change-order-${changeOrder.changeOrderNumber}`,
    });

    // Publish budget.updated
    const updatedEvent = createEvent({
      type: EVENT_TYPES.budget.updated,
      source: this.config.name,
      projectId,
      organizationId,
      payload: {
        reason: 'changeorder-approved',
        changeOrderId,
        categoryDeltas: Object.fromEntries(categoryDeltas),
        totalDelta: Array.from(categoryDeltas.values()).reduce(
          (s, v) => s + v,
          0,
        ),
      },
      trigger: { eventId: event.id, eventType: event.type },
    });
    await this.eventBus.publish(updatedEvent);
  }

  // =========================================================================
  // record-actual-from-payment: Record actuals when payment is disbursed
  // =========================================================================

  private async handleRecordActualFromPayment(job: Job): Promise<void> {
    const { event } = job.data as { event: KealeeEventEnvelope };
    this.assertWritable('BudgetItem');
    this.assertWritable('BudgetTransaction');
    this.assertWritable('BudgetEntry');

    const payload = event.payload as Record<string, any>;
    const projectId = event.projectId;
    const organizationId = event.organizationId;
    const paymentId = payload.paymentId;
    const amount = Number(payload.amount ?? 0);

    if (!paymentId || amount <= 0) return;

    // Load payment details (read-only -- GUARDRAIL: we don't modify Payment)
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) return;

    // Determine which budget category this payment falls under
    // Payment may have line items or a general category
    const paymentType = (payment as any).type ?? 'GENERAL';
    let category: BudgetCategory;

    switch (paymentType) {
      case 'LABOR':
      case 'LABOR_ONLY':
        category = 'LABOR';
        break;
      case 'MATERIAL':
      case 'MATERIALS':
        category = 'MATERIAL';
        break;
      case 'EQUIPMENT':
        category = 'EQUIPMENT';
        break;
      case 'SUBCONTRACTOR':
      case 'SUB':
        category = 'SUBCONTRACTOR';
        break;
      default:
        // For general payments, distribute proportionally or default to LABOR
        category = 'LABOR';
    }

    // Find the budget item for this category
    let budgetItem = await this.prisma.budgetItem.findFirst({
      where: { projectId, category },
    });

    if (!budgetItem) {
      // Create if missing (shouldn't happen in normal flow)
      this.assertWritable('BudgetItem');
      budgetItem = await this.prisma.budgetItem.create({
        data: {
          projectId,
          organizationId,
          category,
          description: `${category} - auto-created from payment`,
          estimatedCost: 0,
          actualCost: 0,
          committedCost: 0,
          varianceAmount: 0,
          variancePercent: 0,
        },
      });
    }

    // Record the actual payment transaction
    this.assertWritable('BudgetTransaction');
    await this.prisma.budgetTransaction.create({
      data: {
        budgetItemId: budgetItem.id,
        projectId,
        organizationId,
        amount,
        type: 'ACTUAL',
        description: `Payment disbursed: ${paymentId}`,
        referenceType: 'PAYMENT',
        referenceId: paymentId,
      },
    });

    // Update the budget item actual costs
    const newActual = Number(budgetItem.actualCost) + amount;
    const estimated = Number(budgetItem.estimatedCost);
    const variance = newActual - estimated;
    const variancePercent = estimated > 0 ? (variance / estimated) * 100 : 0;

    this.assertWritable('BudgetItem');
    await this.prisma.budgetItem.update({
      where: { id: budgetItem.id },
      data: {
        actualCost: newActual,
        varianceAmount: variance,
        variancePercent,
      },
    });

    // Also create a BudgetEntry for backward compatibility
    this.assertWritable('BudgetEntry');
    await this.prisma.budgetEntry.create({
      data: {
        projectId,
        category,
        description: `Actual payment: ${paymentId}`,
        estimatedAmount: 0,
        actualAmount: amount,
        amount,
        variance: 0,
        status: 'ACTIVE',
      },
    });

    // Update BudgetLine
    const budgetLine = await this.prisma.budgetLine.findFirst({
      where: { projectId, category },
    });
    if (budgetLine) {
      const lineActual = Number(budgetLine.actualAmount) + amount;
      const lineBudgeted = Number(budgetLine.budgetedAmount);
      const lineVariance = lineActual - lineBudgeted;
      const lineVariancePct =
        lineBudgeted > 0 ? (lineVariance / lineBudgeted) * 100 : 0;

      this.assertWritable('BudgetLine');
      await this.prisma.budgetLine.update({
        where: { id: budgetLine.id },
        data: {
          actualAmount: lineActual,
          variance: lineVariance,
          variancePercent: lineVariancePct,
          status:
            Math.abs(lineVariancePct) > VARIANCE_THRESHOLDS.CATEGORY_PERCENT
              ? 'OVER_BUDGET'
              : Math.abs(lineVariancePct) > VARIANCE_THRESHOLDS.CATEGORY_PERCENT / 2
                ? 'AT_RISK'
                : 'ON_TRACK',
        },
      });
    }

    // Check variance alerts
    const queue = createQueue(KEALEE_QUEUES.BUDGET_TRACKER);
    await queue.add('check-variance-alerts', {
      projectId,
      organizationId,
      trigger: 'payment',
      paymentId,
      event,
    });

    // Publish budget.updated
    const updatedEvent = createEvent({
      type: EVENT_TYPES.budget.updated,
      source: this.config.name,
      projectId,
      organizationId,
      payload: {
        reason: 'payment-disbursed',
        paymentId,
        amount,
        category,
        budgetItemId: budgetItem.id,
        newActualTotal: newActual,
        variancePercent,
      },
      trigger: { eventId: event.id, eventType: event.type },
    });
    await this.eventBus.publish(updatedEvent);
  }

  // =========================================================================
  // check-variance-alerts: Evaluate category and total variance thresholds
  // =========================================================================

  private async handleCheckVarianceAlerts(job: Job): Promise<void> {
    const { projectId, organizationId, trigger, event } = job.data;
    this.assertWritable('BudgetAlert');
    this.assertWritable('Prediction');

    // Load all budget items for the project
    const budgetItems = await this.prisma.budgetItem.findMany({
      where: { projectId },
    });

    if (budgetItems.length === 0) return;

    // Calculate totals
    let totalEstimated = 0;
    let totalActual = 0;
    const categoryAlerts: Array<{
      category: string;
      variancePercent: number;
      variance: number;
    }> = [];

    for (const item of budgetItems) {
      const estimated = Number(item.estimatedCost);
      const actual = Number(item.actualCost);
      totalEstimated += estimated;
      totalActual += actual;

      // Check per-category threshold (>15%)
      const variancePercent = Number(item.variancePercent);
      if (Math.abs(variancePercent) > VARIANCE_THRESHOLDS.CATEGORY_PERCENT) {
        categoryAlerts.push({
          category: item.category,
          variancePercent,
          variance: Number(item.varianceAmount),
        });
      }
    }

    // Check total project threshold (>10%)
    const totalVariance = totalActual - totalEstimated;
    const totalVariancePct =
      totalEstimated > 0 ? (totalVariance / totalEstimated) * 100 : 0;

    const totalExceeded =
      Math.abs(totalVariancePct) > VARIANCE_THRESHOLDS.TOTAL_PERCENT;

    // Create alerts for category thresholds
    for (const alert of categoryAlerts) {
      // Check if we already have an unacknowledged alert for this category
      const existingAlert = await this.prisma.budgetAlert.findFirst({
        where: {
          projectId,
          category: alert.category,
          type: 'THRESHOLD_WARNING',
          acknowledged: false,
        },
      });

      if (existingAlert) continue; // Don't duplicate

      this.assertWritable('BudgetAlert');
      await this.prisma.budgetAlert.create({
        data: {
          projectId,
          type: 'THRESHOLD_WARNING',
          severity: Math.abs(alert.variancePercent) > 25 ? 'CRITICAL' : 'WARNING',
          category: alert.category,
          title: `${alert.category} budget variance exceeds ${VARIANCE_THRESHOLDS.CATEGORY_PERCENT}%`,
          message:
            `${alert.category} category is ${alert.variancePercent > 0 ? 'over' : 'under'} budget ` +
            `by ${Math.abs(alert.variancePercent).toFixed(1)}% ` +
            `($${Math.abs(alert.variance).toLocaleString()}). ` +
            `Triggered by ${trigger ?? 'recalculation'}.`,
          threshold: VARIANCE_THRESHOLDS.CATEGORY_PERCENT,
          currentValue: totalActual,
          budgetedValue: totalEstimated,
        },
      });
    }

    // Create alert for total project threshold
    if (totalExceeded) {
      const existingTotal = await this.prisma.budgetAlert.findFirst({
        where: {
          projectId,
          type: 'OVER_BUDGET',
          acknowledged: false,
        },
      });

      if (!existingTotal) {
        this.assertWritable('BudgetAlert');
        await this.prisma.budgetAlert.create({
          data: {
            projectId,
            type: 'OVER_BUDGET',
            severity: Math.abs(totalVariancePct) > 20 ? 'CRITICAL' : 'WARNING',
            title: `Total project budget variance exceeds ${VARIANCE_THRESHOLDS.TOTAL_PERCENT}%`,
            message:
              `Total project is ${totalVariancePct > 0 ? 'over' : 'under'} budget ` +
              `by ${Math.abs(totalVariancePct).toFixed(1)}% ` +
              `($${Math.abs(totalVariance).toLocaleString()}). ` +
              `Estimated: $${totalEstimated.toLocaleString()}, ` +
              `Actual: $${totalActual.toLocaleString()}.`,
            threshold: VARIANCE_THRESHOLDS.TOTAL_PERCENT,
            currentValue: totalActual,
            budgetedValue: totalEstimated,
          },
        });
      }
    }

    // If any alert was triggered, run AI root cause analysis
    if (categoryAlerts.length > 0 || totalExceeded) {
      const aiResult = await this.ai.reason({
        task:
          'Perform root cause analysis on these budget variances. Identify the primary ' +
          'drivers, assess trend direction, and recommend corrective actions.',
        context: {
          budgetItems: budgetItems.map((bi) => ({
            category: bi.category,
            estimated: Number(bi.estimatedCost),
            actual: Number(bi.actualCost),
            committed: Number(bi.committedCost),
            variancePercent: Number(bi.variancePercent),
          })),
          categoryAlerts,
          totalVariancePct,
          trigger,
        },
        systemPrompt: VARIANCE_PROMPT,
      });

      // Create a cost overrun prediction if over budget
      if (totalVariancePct > VARIANCE_THRESHOLDS.TOTAL_PERCENT) {
        this.assertWritable('Prediction');
        const prediction = await this.prisma.prediction.create({
          data: {
            projectId,
            type: 'BUDGET_OVERRUN',
            probability: Math.min(
              0.95,
              0.5 + (totalVariancePct / 100),
            ),
            confidence: 0.75,
            impact:
              Math.abs(totalVariancePct) > 20
                ? 'CRITICAL'
                : Math.abs(totalVariancePct) > 15
                  ? 'HIGH'
                  : 'MEDIUM',
            description:
              `Budget overrun predicted. Total variance: ${totalVariancePct.toFixed(1)}%. ` +
              `Categories exceeding thresholds: ${categoryAlerts.map((a) => a.category).join(', ') || 'none'}. ` +
              `Projected final cost at current trend: $${(totalEstimated * (1 + totalVariancePct / 100)).toLocaleString()}.`,
            factors: {
              categoryAlerts,
              totalVariancePct,
              aiAnalysis: aiResult,
            },
            recommendedAction:
              (aiResult as any)?.recommendations?.[0]?.action ??
              'Review budget categories exceeding variance thresholds and implement corrective measures.',
          },
        });

        // Publish prediction.costoverrun.created
        const predictionEvent = createEvent({
          type: EVENT_TYPES.prediction.costoverrun.created,
          source: this.config.name,
          projectId,
          organizationId,
          payload: {
            predictionId: prediction.id,
            probability: prediction.probability,
            impact: prediction.impact,
            totalVariancePct,
            aiAnalysis: aiResult,
          },
          trigger: event
            ? { eventId: event.id, eventType: event.type }
            : undefined,
        });
        await this.eventBus.publish(predictionEvent);
      }

      // Publish budget.alert.variance.high
      const alertEvent = createEvent({
        type: EVENT_TYPES.budget.alert.variance.high,
        source: this.config.name,
        projectId,
        organizationId,
        payload: {
          categoryAlerts,
          totalVariancePct,
          totalExceeded,
          aiAnalysis: aiResult,
        },
        trigger: event
          ? { eventId: event.id, eventType: event.type }
          : undefined,
      });
      await this.eventBus.publish(alertEvent);
    }
  }

  // =========================================================================
  // generate-forecast: Earned value + AI trend analysis
  // =========================================================================

  private async handleGenerateForecast(job: Job): Promise<any> {
    const { projectId, organizationId } = job.data;

    // Load budget data
    const budgetItems = await this.prisma.budgetItem.findMany({
      where: { projectId },
    });

    // Load historical snapshots for trend analysis
    const snapshots = await this.prisma.budgetSnapshot.findMany({
      where: { projectId },
      orderBy: { snapshotDate: 'desc' },
      take: 12, // Last 12 snapshots
    });

    // Load schedule for percent complete estimate
    const scheduleItems = await this.prisma.scheduleItem.findMany({
      where: { projectId },
    });

    const totalTasks = scheduleItems.length;
    const completedTasks = scheduleItems.filter(
      (t) => t.status === 'COMPLETED',
    ).length;
    const percentComplete =
      totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Calculate earned value metrics
    const totalBudget = budgetItems.reduce(
      (s, b) => s + Number(b.estimatedCost),
      0,
    );
    const totalActual = budgetItems.reduce(
      (s, b) => s + Number(b.actualCost),
      0,
    );
    const plannedValue = totalBudget * (percentComplete / 100);
    const earnedValue = totalBudget * (percentComplete / 100);
    const cpi = totalActual > 0 ? earnedValue / totalActual : 1;
    const spi = plannedValue > 0 ? earnedValue / plannedValue : 1;

    // AI-enhanced forecast
    const aiResult = await this.ai.reason({
      task:
        'Generate a cost forecast using earned value analysis and trend data. ' +
        'Calculate optimistic, most likely, and pessimistic EAC. ' +
        'Assess contingency adequacy and identify cash flow risks.',
      context: {
        budgetItems: budgetItems.map((bi) => ({
          category: bi.category,
          estimated: Number(bi.estimatedCost),
          actual: Number(bi.actualCost),
          committed: Number(bi.committedCost),
        })),
        earnedValue: {
          BAC: totalBudget,
          PV: plannedValue,
          EV: earnedValue,
          AC: totalActual,
          CPI: cpi,
          SPI: spi,
        },
        percentComplete,
        snapshotHistory: snapshots.map((s) => ({
          date: s.snapshotDate,
          totalBudget: Number(s.totalBudget),
          totalActual: Number(s.totalActual),
          variance: Number(s.totalVariance),
        })),
      },
      systemPrompt: FORECAST_PROMPT,
    });

    return {
      earnedValue: {
        budgetAtCompletion: totalBudget,
        plannedValue,
        earnedValue,
        actualCost: totalActual,
        cpi,
        spi,
        eac: cpi > 0 ? totalBudget / cpi : totalBudget,
        etc: cpi > 0 ? (totalBudget - earnedValue) / cpi : totalBudget - totalActual,
      },
      percentComplete,
      aiAnalysis: aiResult,
    };
  }

  // =========================================================================
  // create-snapshot: Take a point-in-time budget snapshot
  // =========================================================================

  private async handleCreateSnapshot(job: Job): Promise<void> {
    const { projectId, organizationId, reason } = job.data;
    this.assertWritable('BudgetSnapshot');

    const budgetItems = await this.prisma.budgetItem.findMany({
      where: { projectId },
    });

    if (budgetItems.length === 0) return;

    const totalBudget = budgetItems.reduce(
      (s, b) => s + Number(b.estimatedCost),
      0,
    );
    const totalActual = budgetItems.reduce(
      (s, b) => s + Number(b.actualCost),
      0,
    );
    const totalCommitted = budgetItems.reduce(
      (s, b) => s + Number(b.committedCost),
      0,
    );
    const totalVariance = totalActual - totalBudget;

    // Get schedule progress
    const scheduleItems = await this.prisma.scheduleItem.findMany({
      where: { projectId },
    });
    const totalTasks = scheduleItems.length;
    const completedTasks = scheduleItems.filter(
      (t) => t.status === 'COMPLETED',
    ).length;
    const percentComplete =
      totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Build category breakdown
    const categories: Record<string, any> = {};
    for (const item of budgetItems) {
      categories[item.category] = {
        estimated: Number(item.estimatedCost),
        actual: Number(item.actualCost),
        committed: Number(item.committedCost),
        variance: Number(item.varianceAmount),
        variancePercent: Number(item.variancePercent),
      };
    }

    // Forecast: EAC using CPI
    const cpi =
      totalActual > 0
        ? (totalBudget * (percentComplete / 100)) / totalActual
        : 1;
    const forecast = cpi > 0 ? totalBudget / cpi : totalBudget;

    this.assertWritable('BudgetSnapshot');
    await this.prisma.budgetSnapshot.create({
      data: {
        projectId,
        snapshotDate: new Date(),
        totalBudget,
        totalCommitted,
        totalActual,
        totalVariance,
        percentComplete,
        forecast,
        categories,
        notes: reason ? `Snapshot reason: ${reason}` : null,
      },
    });
  }

  // =========================================================================
  // ctc-estimate-ready: Handle CTC takeoff confirmation
  // =========================================================================

  private async handleCTCEstimateReady(job: Job): Promise<void> {
    const { event } = job.data as { event: KealeeEventEnvelope };
    const payload = event.payload as Record<string, any>;
    const estimateId = payload.estimateId;
    const projectId = event.projectId;
    const organizationId = event.organizationId;

    if (!estimateId) return;

    // Check if budget already exists for this project — if so, update rather
    // than duplicate.  If no budget exists yet, this is a no-op: the budget
    // will be seeded when the estimate is formally approved.
    const existingItems = await this.prisma.budgetItem.findMany({
      where: { projectId },
    });

    if (existingItems.length === 0) {
      // No budget yet — nothing to refresh.  Budget will be seeded on
      // estimate.approved.
      return;
    }

    // Load the CTC-enriched estimate to get updated line item totals
    const estimate = await this.prisma.estimate.findUnique({
      where: { id: estimateId },
      include: {
        sections: { include: { lineItems: true } },
      },
    });

    if (!estimate) return;

    const allLineItems = (estimate.sections ?? []).flatMap(
      (s: any) => s.lineItems ?? [],
    );

    // Fetch CTC assemblies for L/M/E breakdown
    const assemblyIds = allLineItems
      .map((li: any) => li.assemblyId)
      .filter(Boolean);

    const ctcAssemblies = assemblyIds.length > 0
      ? await this.prisma.assembly.findMany({
          where: { id: { in: assemblyIds }, ctcTaskNumber: { not: null } },
        })
      : [];

    const ctcMap = new Map(ctcAssemblies.map((a) => [a.id, a]));
    const newLaborTotal = allLineItems.reduce((sum: number, li: any) => {
      const asm = ctcMap.get(li.assemblyId);
      return sum + (asm ? Number(asm.laborCost ?? 0) * Number(li.quantity ?? 1) : 0);
    }, 0);
    const newMaterialTotal = allLineItems.reduce((sum: number, li: any) => {
      const asm = ctcMap.get(li.assemblyId);
      return sum + (asm ? Number(asm.materialCost ?? 0) * Number(li.quantity ?? 1) : 0);
    }, 0);
    const newEquipmentTotal = allLineItems.reduce((sum: number, li: any) => {
      const asm = ctcMap.get(li.assemblyId);
      return sum + (asm ? Number(asm.equipmentCost ?? 0) * Number(li.quantity ?? 1) : 0);
    }, 0);

    // Update existing budget items with revised CTC totals
    const updateCategory = async (category: BudgetCategory, newEstimated: number) => {
      const item = existingItems.find((i) => i.category === category);
      if (!item) return;
      const variance = Number(item.actualCost) - newEstimated;
      const variancePercent = newEstimated > 0 ? (variance / newEstimated) * 100 : 0;
      this.assertWritable('BudgetItem');
      await this.prisma.budgetItem.update({
        where: { id: item.id },
        data: { estimatedCost: newEstimated, varianceAmount: variance, variancePercent },
      });
    };

    await updateCategory('LABOR', newLaborTotal);
    await updateCategory('MATERIAL', newMaterialTotal);
    await updateCategory('EQUIPMENT', newEquipmentTotal);

    // Snapshot after CTC refresh
    const queue = createQueue(KEALEE_QUEUES.BUDGET_TRACKER);
    await queue.add('create-snapshot', {
      projectId,
      organizationId,
      reason: 'ctc-takeoff-confirmed',
    });

    // Publish budget.updated
    const updatedEvent = createEvent({
      type: EVENT_TYPES.budget.updated,
      source: this.config.name,
      projectId,
      organizationId,
      payload: {
        reason: 'ctc-takeoff-confirmed',
        estimateId,
        lineItemsAdded: payload.lineItemsAdded ?? 0,
        updatedCategories: { LABOR: newLaborTotal, MATERIAL: newMaterialTotal, EQUIPMENT: newEquipmentTotal },
      },
      trigger: { eventId: event.id, eventType: event.type },
    });
    await this.eventBus.publish(updatedEvent);
  }

  // =========================================================================
  // Private: Resolve budget category from AI or fallback
  // =========================================================================

  private resolveCategory(
    aiCategory: string | undefined,
    lineItem: Record<string, any>,
  ): BudgetCategory {
    // If AI provided a valid category, use it
    if (aiCategory && BUDGET_CATEGORIES.includes(aiCategory as BudgetCategory)) {
      return aiCategory as BudgetCategory;
    }

    // Fallback: use CSI division to determine category
    const csi = lineItem.csiDivision ?? lineItem.division ?? '';
    const csiNum = parseInt(csi, 10);

    if (isNaN(csiNum)) return 'MATERIAL'; // Default

    // CSI MasterFormat division-based categorization
    if (csiNum === 1) return 'OVERHEAD'; // General Requirements
    if (csiNum >= 2 && csiNum <= 14) return 'MATERIAL'; // Site, Concrete, Masonry, Metals, etc.
    if (csiNum >= 21 && csiNum <= 28) return 'SUBCONTRACTOR'; // MEP trades
    if (csiNum >= 31 && csiNum <= 35) return 'EQUIPMENT'; // Earthwork, Exterior
    if (csiNum === 41 || csiNum === 42) return 'EQUIPMENT'; // Process equipment

    // Check description keywords
    const desc = (lineItem.description ?? '').toLowerCase();
    if (desc.includes('labor') || desc.includes('crew') || desc.includes('hours'))
      return 'LABOR';
    if (desc.includes('permit') || desc.includes('fee') || desc.includes('inspection'))
      return 'PERMITS';
    if (desc.includes('contingency') || desc.includes('allowance'))
      return 'CONTINGENCY';
    if (desc.includes('overhead') || desc.includes('general conditions'))
      return 'OVERHEAD';
    if (desc.includes('subcontract') || desc.includes('sub '))
      return 'SUBCONTRACTOR';
    if (desc.includes('equip') || desc.includes('rental') || desc.includes('crane'))
      return 'EQUIPMENT';

    return 'MATERIAL'; // Default fallback
  }
}
