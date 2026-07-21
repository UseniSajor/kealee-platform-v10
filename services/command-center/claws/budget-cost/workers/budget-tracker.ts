/**
 * Claw D — Budget Tracker Worker Handlers
 *
 * Core budget lifecycle: seed from estimate, recalculate on change orders,
 * record actuals from payments, create snapshots, handle CTC updates.
 *
 * Budget categories (7): LABOR, MATERIAL, EQUIPMENT, SUBCONTRACTOR,
 * PERMITS, OVERHEAD, CONTINGENCY
 *
 * Uses CTC assembly breakdowns when available for granular L/M/E
 * categorization, otherwise falls back to AI + CSI division logic.
 */
import type { PrismaClient } from '@prisma/client';
import type { EventBus, KealeeEventEnvelope } from '@kealee/events';
import { createEvent, EVENT_TYPES } from '@kealee/events';
import { KEALEE_QUEUES, createQueue } from '@kealee/queue';
import type { AIProvider } from '@kealee/ai';
import { BUDGET_PROMPT } from '@kealee/ai';
import type { Job } from 'bullmq';

const BUDGET_CATEGORIES = [
  'LABOR', 'MATERIAL', 'EQUIPMENT', 'SUBCONTRACTOR',
  'PERMITS', 'OVERHEAD', 'CONTINGENCY',
] as const;

type BudgetCategory = typeof BUDGET_CATEGORIES[number];

export class BudgetTrackerWorkerHandlers {
  constructor(
    private prisma: PrismaClient,
    private ai: AIProvider,
    private eventBus: EventBus,
    private clawName: string,
    private assertWritable: (model: string) => void,
  ) {}

  async handleSeedBudgetFromEstimate(job: Job): Promise<void> {
    const { event } = job.data as { event: KealeeEventEnvelope };
    this.assertWritable('BudgetItem');
    this.assertWritable('BudgetTransaction');
    this.assertWritable('BudgetLine');

    const payload = event.payload as Record<string, any>;
    const projectId = event.projectId;
    const organizationId = event.organizationId;
    const estimateId = payload.estimateId;

    if (!estimateId) return;

    const estimate = await this.prisma.estimate.findUnique({
      where: { id: estimateId },
      include: { sections: { include: { lineItems: true } } },
    });
    if (!estimate) return;

    // Check if budget already seeded
    const existingItems = await this.prisma.budgetItem.findMany({
      where: { projectId },
    });
    if (existingItems.length > 0) return;

    const categoryTotals = new Map<BudgetCategory, number>();
    for (const cat of BUDGET_CATEGORIES) categoryTotals.set(cat, 0);

    const sections = estimate.sections ?? [];
    const allLineItems = sections.flatMap((s: any) => s.lineItems ?? []);

    // Check for CTC assemblies
    const ctcAssemblyIds = allLineItems.map((li: any) => li.assemblyId).filter(Boolean);
    let ctcAssemblyMap = new Map<string, any>();
    if (ctcAssemblyIds.length > 0) {
      const ctcAssemblies = await this.prisma.assembly.findMany({
        where: { id: { in: ctcAssemblyIds }, ctcTaskNumber: { not: null } },
      });
      ctcAssemblyMap = new Map(ctcAssemblies.map((a) => [a.id, a]));
    }

    if (ctcAssemblyMap.size > 0) {
      // CTC-aware categorization
      for (const lineItem of allLineItems) {
        const assembly = ctcAssemblyMap.get(lineItem.assemblyId);
        if (assembly) {
          const qty = Number(lineItem.quantity ?? 1);
          categoryTotals.set('LABOR', (categoryTotals.get('LABOR') ?? 0) + Number(assembly.laborCost ?? 0) * qty);
          categoryTotals.set('MATERIAL', (categoryTotals.get('MATERIAL') ?? 0) + Number(assembly.materialCost ?? 0) * qty);
          categoryTotals.set('EQUIPMENT', (categoryTotals.get('EQUIPMENT') ?? 0) + Number(assembly.equipmentCost ?? 0) * qty);
        } else {
          const category = resolveCategory(undefined, lineItem);
          const amount = Number(lineItem.totalCost ?? lineItem.amount ?? 0);
          categoryTotals.set(category, (categoryTotals.get(category) ?? 0) + amount);
        }
      }
    } else {
      // Standard AI categorization
      const aiResult = await this.ai.reason({
        task: 'Categorize these estimate line items into the 7 standard construction budget categories: LABOR, MATERIAL, EQUIPMENT, SUBCONTRACTOR, PERMITS, OVERHEAD, CONTINGENCY. Return a JSON object mapping each lineItemId to its budget category.',
        context: {
          lineItems: allLineItems.map((li: any) => ({
            id: li.id, description: li.description,
            csiDivision: li.csiDivision ?? null,
            totalCost: li.totalCost ?? li.amount ?? 0,
          })),
        },
        systemPrompt: BUDGET_PROMPT,
      });

      const lineItemCategories = (aiResult as any)?.categories ?? {};
      for (const lineItem of allLineItems) {
        const category = resolveCategory(lineItemCategories[lineItem.id], lineItem);
        const amount = Number(lineItem.totalCost ?? lineItem.amount ?? 0);
        categoryTotals.set(category, (categoryTotals.get(category) ?? 0) + amount);
      }
    }

    // Add 10% contingency if missing
    const subtotal = Array.from(categoryTotals.entries())
      .filter(([cat]) => cat !== 'CONTINGENCY')
      .reduce((sum, [, val]) => sum + val, 0);
    if ((categoryTotals.get('CONTINGENCY') ?? 0) === 0) {
      categoryTotals.set('CONTINGENCY', subtotal * 0.1);
    }

    const createdItemIds: string[] = [];
    for (const [category, estimatedCost] of categoryTotals) {
      if (estimatedCost <= 0) continue;

      const budgetItem = await this.prisma.budgetItem.create({
        data: {
          projectId, organizationId, category,
          description: `${category} - seeded from estimate ${estimate.name}`,
          estimatedCost, actualCost: 0, committedCost: 0,
          varianceAmount: 0, variancePercent: 0, estimateId,
        },
      });
      createdItemIds.push(budgetItem.id);

      await this.prisma.budgetTransaction.create({
        data: {
          budgetItemId: budgetItem.id, projectId, organizationId,
          amount: estimatedCost, type: 'ESTIMATED',
          description: `Initial budget from approved estimate: ${estimate.name}`,
          referenceType: 'ESTIMATE', referenceId: estimateId,
        },
      });

      await this.prisma.budgetLine.create({
        data: {
          projectId, category,
          description: `${category} budget from estimate`,
          budgetedAmount: estimatedCost, committedAmount: 0,
          actualAmount: 0, variance: 0, variancePercent: 0, status: 'ON_TRACK',
        },
      });
    }

    const queue = createQueue(KEALEE_QUEUES.BUDGET_TRACKER);
    await queue.add('create-snapshot', { projectId, organizationId, reason: 'initial-seed' });

    const seededEvent = createEvent({
      type: EVENT_TYPES.budget.seeded.from.estimate,
      source: this.clawName, projectId, organizationId,
      payload: {
        estimateId, budgetItemCount: createdItemIds.length,
        budgetItemIds: createdItemIds,
        totalBudget: subtotal + (categoryTotals.get('CONTINGENCY') ?? 0),
        categories: Object.fromEntries(categoryTotals),
      },
      trigger: { eventId: event.id, eventType: event.type },
    });
    await this.eventBus.publish(seededEvent);
  }

  async handleRecalculateForChangeOrder(job: Job): Promise<void> {
    const { event } = job.data as { event: KealeeEventEnvelope };
    this.assertWritable('BudgetItem');
    this.assertWritable('BudgetTransaction');
    this.assertWritable('BudgetLine');

    const payload = event.payload as Record<string, any>;
    const projectId = event.projectId;
    const organizationId = event.organizationId;
    const changeOrderId = payload.changeOrderId;
    if (!changeOrderId) return;

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
    const categoryDeltas = new Map<string, number>();

    for (const lineItem of coLineItems) {
      const category = resolveCategory(lineItemCategories[lineItem.id], lineItem);
      const amount = Number(lineItem.totalCost ?? 0);
      categoryDeltas.set(category, (categoryDeltas.get(category) ?? 0) + amount);
    }

    // Update budget items and create transactions
    for (const [category, delta] of categoryDeltas) {
      let budgetItem = await this.prisma.budgetItem.findFirst({
        where: { projectId, category },
      });

      if (!budgetItem) {
        this.assertWritable('BudgetItem');
        budgetItem = await this.prisma.budgetItem.create({
          data: {
            projectId, organizationId, category,
            description: `${category} - created from change order`,
            estimatedCost: 0, actualCost: 0, committedCost: 0,
            varianceAmount: 0, variancePercent: 0,
          },
        });
      }

      const newEstimated = Number(budgetItem.estimatedCost) + delta;
      const variance = Number(budgetItem.actualCost) - newEstimated;
      const variancePercent = newEstimated > 0 ? (variance / newEstimated) * 100 : 0;

      this.assertWritable('BudgetItem');
      await this.prisma.budgetItem.update({
        where: { id: budgetItem.id },
        data: {
          estimatedCost: newEstimated,
          committedCost: Number(budgetItem.committedCost) + delta,
          varianceAmount: variance, variancePercent,
        },
      });

      this.assertWritable('BudgetTransaction');
      await this.prisma.budgetTransaction.create({
        data: {
          budgetItemId: budgetItem.id, projectId, organizationId,
          amount: delta, type: 'COMMITTED',
          description: `Change order: ${changeOrder.title} (${changeOrder.changeOrderNumber})`,
          referenceType: 'CHANGE_ORDER', referenceId: changeOrderId,
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
              Math.abs(variancePercent) > 15 ? 'OVER_BUDGET'
                : Math.abs(variancePercent) > 7.5 ? 'AT_RISK' : 'ON_TRACK',
          },
        });
      }
    }

    // Check for variance alerts after recalculation
    const queue = createQueue(KEALEE_QUEUES.BUDGET_TRACKER);
    await queue.add('check-variance-alerts', {
      projectId, organizationId, trigger: 'changeorder', changeOrderId, event,
    });
    await queue.add('create-snapshot', {
      projectId, organizationId,
      reason: `change-order-${changeOrder.changeOrderNumber}`,
    });

    const updatedEvent = createEvent({
      type: EVENT_TYPES.budget.updated, source: this.clawName,
      projectId, organizationId,
      payload: {
        reason: 'changeorder-approved', changeOrderId,
        categoryDeltas: Object.fromEntries(categoryDeltas),
        totalDelta: Array.from(categoryDeltas.values()).reduce((s, v) => s + v, 0),
      },
      trigger: { eventId: event.id, eventType: event.type },
    });
    await this.eventBus.publish(updatedEvent);
  }

  async handleRecordActualFromPayment(job: Job): Promise<void> {
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

    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) return;

    const paymentType = (payment as any).type ?? 'GENERAL';
    let category: BudgetCategory;
    switch (paymentType) {
      case 'LABOR': case 'LABOR_ONLY': category = 'LABOR'; break;
      case 'MATERIAL': case 'MATERIALS': category = 'MATERIAL'; break;
      case 'EQUIPMENT': category = 'EQUIPMENT'; break;
      case 'SUBCONTRACTOR': case 'SUB': category = 'SUBCONTRACTOR'; break;
      default: category = 'LABOR';
    }

    let budgetItem = await this.prisma.budgetItem.findFirst({ where: { projectId, category } });
    if (!budgetItem) {
      budgetItem = await this.prisma.budgetItem.create({
        data: {
          projectId, organizationId, category,
          description: `${category} - auto-created from payment`,
          estimatedCost: 0, actualCost: 0, committedCost: 0,
          varianceAmount: 0, variancePercent: 0,
        },
      });
    }

    await this.prisma.budgetTransaction.create({
      data: {
        budgetItemId: budgetItem.id, projectId, organizationId, amount,
        type: 'ACTUAL', description: `Payment disbursed: ${paymentId}`,
        referenceType: 'PAYMENT', referenceId: paymentId,
      },
    });

    const newActual = Number(budgetItem.actualCost) + amount;
    const estimated = Number(budgetItem.estimatedCost);
    const variance = newActual - estimated;
    const variancePercent = estimated > 0 ? (variance / estimated) * 100 : 0;

    await this.prisma.budgetItem.update({
      where: { id: budgetItem.id },
      data: { actualCost: newActual, varianceAmount: variance, variancePercent },
    });

    await this.prisma.budgetEntry.create({
      data: {
        projectId, category, description: `Actual payment: ${paymentId}`,
        estimatedAmount: 0, actualAmount: amount, amount, variance: 0, status: 'ACTIVE',
      },
    });

    const queue = createQueue(KEALEE_QUEUES.BUDGET_TRACKER);
    await queue.add('check-variance-alerts', { projectId, organizationId, trigger: 'payment', paymentId, event });

    const updatedEvent = createEvent({
      type: EVENT_TYPES.budget.updated, source: this.clawName,
      projectId, organizationId,
      payload: { reason: 'payment-disbursed', paymentId, amount, category, budgetItemId: budgetItem.id, newActualTotal: newActual, variancePercent },
      trigger: { eventId: event.id, eventType: event.type },
    });
    await this.eventBus.publish(updatedEvent);
  }

  async handleCreateSnapshot(job: Job): Promise<void> {
    const { projectId, organizationId, reason } = job.data;
    this.assertWritable('BudgetSnapshot');

    const budgetItems = await this.prisma.budgetItem.findMany({ where: { projectId } });
    if (budgetItems.length === 0) return;

    const totalBudget = budgetItems.reduce((s, b) => s + Number(b.estimatedCost), 0);
    const totalActual = budgetItems.reduce((s, b) => s + Number(b.actualCost), 0);
    const totalCommitted = budgetItems.reduce((s, b) => s + Number(b.committedCost), 0);
    const totalVariance = totalActual - totalBudget;

    const scheduleItems = await this.prisma.scheduleItem.findMany({ where: { projectId } });
    const totalTasks = scheduleItems.length;
    const completedTasks = scheduleItems.filter((t) => t.status === 'COMPLETED').length;
    const percentComplete = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const categories: Record<string, any> = {};
    for (const item of budgetItems) {
      categories[item.category] = {
        estimated: Number(item.estimatedCost), actual: Number(item.actualCost),
        committed: Number(item.committedCost), variance: Number(item.varianceAmount),
        variancePercent: Number(item.variancePercent),
      };
    }

    const cpi = totalActual > 0 ? (totalBudget * (percentComplete / 100)) / totalActual : 1;
    const forecast = cpi > 0 ? totalBudget / cpi : totalBudget;

    await this.prisma.budgetSnapshot.create({
      data: {
        projectId, snapshotDate: new Date(),
        totalBudget, totalCommitted, totalActual, totalVariance,
        percentComplete, forecast, categories,
        notes: reason ? `Snapshot reason: ${reason}` : null,
      },
    });
  }

  async handleCTCEstimateReady(job: Job): Promise<void> {
    const { event } = job.data as { event: KealeeEventEnvelope };
    const payload = event.payload as Record<string, any>;
    const estimateId = payload.estimateId;
    const projectId = event.projectId;
    const organizationId = event.organizationId;
    if (!estimateId) return;

    const existingItems = await this.prisma.budgetItem.findMany({ where: { projectId } });
    if (existingItems.length === 0) return;

    const estimate = await this.prisma.estimate.findUnique({
      where: { id: estimateId },
      include: { sections: { include: { lineItems: true } } },
    });
    if (!estimate) return;

    const allLineItems = (estimate.sections ?? []).flatMap((s: any) => s.lineItems ?? []);
    const assemblyIds = allLineItems.map((li: any) => li.assemblyId).filter(Boolean);

    const ctcAssemblies = assemblyIds.length > 0
      ? await this.prisma.assembly.findMany({ where: { id: { in: assemblyIds }, ctcTaskNumber: { not: null } } })
      : [];

    const ctcMap = new Map(ctcAssemblies.map((a) => [a.id, a]));
    const calc = (field: string) => allLineItems.reduce((sum: number, li: any) => {
      const asm = ctcMap.get(li.assemblyId);
      return sum + (asm ? Number((asm as any)[field] ?? 0) * Number(li.quantity ?? 1) : 0);
    }, 0);

    const newLaborTotal = calc('laborCost');
    const newMaterialTotal = calc('materialCost');
    const newEquipmentTotal = calc('equipmentCost');

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

    const queue = createQueue(KEALEE_QUEUES.BUDGET_TRACKER);
    await queue.add('create-snapshot', { projectId, organizationId, reason: 'ctc-takeoff-confirmed' });

    const updatedEvent = createEvent({
      type: EVENT_TYPES.budget.updated, source: this.clawName,
      projectId, organizationId,
      payload: {
        reason: 'ctc-takeoff-confirmed', estimateId,
        lineItemsAdded: payload.lineItemsAdded ?? 0,
        updatedCategories: { LABOR: newLaborTotal, MATERIAL: newMaterialTotal, EQUIPMENT: newEquipmentTotal },
      },
      trigger: { eventId: event.id, eventType: event.type },
    });
    await this.eventBus.publish(updatedEvent);
  }
}

// ---------------------------------------------------------------------------
// Shared helper: resolve budget category from AI result or CSI fallback
// ---------------------------------------------------------------------------
export function resolveCategory(
  aiCategory: string | undefined,
  lineItem: Record<string, any>,
): BudgetCategory {
  if (aiCategory && BUDGET_CATEGORIES.includes(aiCategory as BudgetCategory)) {
    return aiCategory as BudgetCategory;
  }

  const csi = lineItem.csiDivision ?? lineItem.division ?? '';
  const csiNum = parseInt(csi, 10);
  if (isNaN(csiNum)) return 'MATERIAL';

  if (csiNum === 1) return 'OVERHEAD';
  if (csiNum >= 2 && csiNum <= 14) return 'MATERIAL';
  if (csiNum >= 21 && csiNum <= 28) return 'SUBCONTRACTOR';
  if (csiNum >= 31 && csiNum <= 35) return 'EQUIPMENT';
  if (csiNum === 41 || csiNum === 42) return 'EQUIPMENT';

  const desc = (lineItem.description ?? '').toLowerCase();
  if (desc.includes('labor') || desc.includes('crew') || desc.includes('hours')) return 'LABOR';
  if (desc.includes('permit') || desc.includes('fee') || desc.includes('inspection')) return 'PERMITS';
  if (desc.includes('contingency') || desc.includes('allowance')) return 'CONTINGENCY';
  if (desc.includes('overhead') || desc.includes('general conditions')) return 'OVERHEAD';
  if (desc.includes('subcontract') || desc.includes('sub ')) return 'SUBCONTRACTOR';
  if (desc.includes('equip') || desc.includes('rental') || desc.includes('crane')) return 'EQUIPMENT';

  return 'MATERIAL';
}
