import { PrismaClient, Prisma } from '@prisma/client';
import { generateJSON } from '../../infrastructure/ai.js';
import { AI_PROMPTS } from '../../infrastructure/ai-prompts.js';
import { eventBus } from '../../infrastructure/event-bus.js';
import { EVENT_TYPES } from '../../infrastructure/event-types.js';

const prisma = new PrismaClient();
const SOURCE_APP = 'APP-03';

interface CostEstimate {
  laborCost: number;
  materialCost: number;
  markup: number;
  totalCost: number;
  scheduleDays: number;
  confidence: number;
  reasoning: string;
}

export class ChangeOrderService {
  // -----------------------------------------------------------------------
  // generateChangeOrder
  // -----------------------------------------------------------------------

  async generateChangeOrder(
    projectId: string,
    data: {
      title: string;
      description: string;
      reason: string;
      requestedBy?: string;
    },
  ): Promise<string> {
    const project = await prisma.project.findUniqueOrThrow({
      where: { id: projectId },
    });

    // Calculate next CO number
    const lastCO = await prisma.changeOrder.findFirst({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      select: { changeOrderNumber: true },
    });

    const lastNum = lastCO
      ? parseInt(lastCO.changeOrderNumber.replace(/\D/g, ''), 10) || 0
      : 0;
    const coNumber = `CO-${String(lastNum + 1).padStart(3, '0')}`;

    // Get current budget state
    const budgetLines = await prisma.budgetLine.findMany({
      where: { projectId },
    });

    const totalBudget = Number(project.budget ?? 0);
    const totalSpent = budgetLines.reduce(
      (sum, bl) => sum + Number(bl.actualAmount),
      0,
    );
    const totalCommitted = budgetLines.reduce(
      (sum, bl) => sum + Number(bl.committedAmount),
      0,
    );
    const budgetRemaining = totalBudget - totalSpent - totalCommitted;

    // Estimate cost and schedule impact using AI
    let estimate: CostEstimate = {
      laborCost: 0,
      materialCost: 0,
      markup: 0,
      totalCost: 0,
      scheduleDays: 0,
      confidence: 0.5,
      reasoning: 'Estimate pending',
    };

    try {
      const result = await generateJSON<CostEstimate>({
        systemPrompt: AI_PROMPTS.DECISION_SUPPORT,
        userPrompt:
          `Estimate the cost and schedule impact for this change order on a construction project.\n\n` +
          `Project budget: $${totalBudget.toLocaleString()}\n` +
          `Budget spent: $${totalSpent.toLocaleString()}\n` +
          `Budget remaining: $${budgetRemaining.toLocaleString()}\n\n` +
          `Change Order: ${data.title}\n` +
          `Description: ${data.description}\n` +
          `Reason: ${data.reason}\n\n` +
          `Respond with JSON: { "laborCost": number, "materialCost": number, ` +
          `"markup": number (percentage as decimal e.g. 0.15 for 15%), ` +
          `"totalCost": number, "scheduleDays": number (additional days needed), ` +
          `"confidence": number (0-1), "reasoning": string }`,
        maxTokens: 1000,
      });
      estimate = result.data;
    } catch (err) {
      console.error('[ChangeOrder] AI estimation failed:', (err as Error).message);
    }

    const totalCost = estimate.totalCost || estimate.laborCost + estimate.materialCost;
    const markupPct = (estimate.markup || 0) * 100;

    // Create ChangeOrder record
    const changeOrder = await prisma.changeOrder.create({
      data: {
        projectId,
        changeOrderNumber: coNumber,
        title: data.title,
        description: data.description,
        reason: data.reason,
        requestedBy: data.requestedBy,
        originalAmount: new Prisma.Decimal(0),
        estimatedCost: new Prisma.Decimal(totalCost.toFixed(2)),
        laborCost: new Prisma.Decimal(estimate.laborCost.toFixed(2)),
        materialCost: new Prisma.Decimal(estimate.materialCost.toFixed(2)),
        markupPercent: new Prisma.Decimal(markupPct.toFixed(2)),
        totalCost: new Prisma.Decimal(totalCost.toFixed(2)),
        scheduleDays: estimate.scheduleDays,
        status: 'SUBMITTED',
        submittedAt: new Date(),
        aiAnalysis: estimate as any,
        aiScore: Math.round(estimate.confidence * 100),
        impactAnalysis: {
          costImpact: totalCost,
          scheduleImpact: estimate.scheduleDays,
          budgetRemaining,
          budgetRemainingAfter: budgetRemaining - totalCost,
          percentOfBudget:
            totalBudget > 0 ? (totalCost / totalBudget) * 100 : 0,
        },
      },
    });

    // Trigger document generation via event
    await eventBus.publish(
      EVENT_TYPES.DOCUMENT_GENERATED,
      {
        type: 'change_order',
        changeOrderId: changeOrder.id,
        projectId,
        title: `Change Order ${coNumber}: ${data.title}`,
      },
      SOURCE_APP,
      { projectId },
    );

    // Create DecisionQueue entry for PM
    const pmId = project.pmId;
    if (pmId) {
      await prisma.decisionQueue.create({
        data: {
          projectId,
          pmId,
          type: 'change_order',
          title: `Review Change Order ${coNumber}: ${data.title}`,
          context: {
            changeOrderId: changeOrder.id,
            coNumber,
            costImpact: totalCost,
            scheduleImpact: estimate.scheduleDays,
            currentBudget: totalBudget,
            budgetSpent: totalSpent,
            budgetRemaining,
            reason: data.reason,
          },
          aiRecommendation: estimate.reasoning,
          aiConfidence: new Prisma.Decimal(estimate.confidence.toFixed(4)),
          options: [
            { action: 'approve', label: 'Approve Change Order' },
            { action: 'reject', label: 'Reject Change Order' },
            { action: 'negotiate', label: 'Request Negotiation' },
          ],
        },
      });

      await eventBus.publish(
        EVENT_TYPES.DECISION_NEEDED,
        {
          changeOrderId: changeOrder.id,
          coNumber,
          type: 'change_order',
          costImpact: totalCost,
          projectId,
        },
        SOURCE_APP,
        { projectId },
      );
    }

    await eventBus.publish(
      EVENT_TYPES.CHANGE_ORDER_REQUESTED,
      {
        changeOrderId: changeOrder.id,
        coNumber,
        title: data.title,
        estimatedCost: totalCost,
        scheduleDays: estimate.scheduleDays,
      },
      SOURCE_APP,
      { projectId },
    );

    return changeOrder.id;
  }

  // -----------------------------------------------------------------------
  // approveChangeOrder
  // -----------------------------------------------------------------------

  async approveChangeOrder(
    changeOrderId: string,
    approvedBy: string,
  ): Promise<void> {
    const co = await prisma.changeOrder.findUniqueOrThrow({
      where: { id: changeOrderId },
      include: { project: true },
    });

    // Update CO status
    await prisma.changeOrder.update({
      where: { id: changeOrderId },
      data: {
        status: 'APPROVED',
        approvedBy,
        approvedAt: new Date(),
        approvedCost: co.totalCost,
      },
    });

    // Update project budget if applicable
    if (co.project.budget) {
      const newBudget = Number(co.project.budget) + Number(co.totalCost);
      await prisma.project.update({
        where: { id: co.projectId },
        data: { budget: new Prisma.Decimal(newBudget.toFixed(2)) },
      });
    }

    // Add committed amount to budget lines
    const category = co.reason ?? 'CHANGE_ORDER';
    const existingLine = await prisma.budgetLine.findFirst({
      where: { projectId: co.projectId, category },
    });

    if (existingLine) {
      await prisma.budgetLine.update({
        where: { id: existingLine.id },
        data: {
          committedAmount: {
            increment: co.totalCost,
          },
        },
      });
    } else {
      await prisma.budgetLine.create({
        data: {
          projectId: co.projectId,
          category,
          description: `Change Order: ${co.title}`,
          budgetedAmount: co.totalCost,
          committedAmount: co.totalCost,
        },
      });
    }

    // Update escrow if needed
    const escrow = await prisma.escrowAgreement.findFirst({
      where: { projectId: co.projectId, status: 'ACTIVE' },
    });

    if (escrow) {
      await prisma.escrowAgreement.update({
        where: { id: escrow.id },
        data: {
          totalContractAmount: {
            increment: co.totalCost,
          },
        },
      });
    }

    // Publish events
    await eventBus.publish(
      EVENT_TYPES.CHANGE_ORDER_APPROVED,
      {
        changeOrderId,
        coNumber: co.changeOrderNumber,
        amount: co.totalCost.toString(),
        scheduleDays: co.scheduleDays,
        projectId: co.projectId,
      },
      SOURCE_APP,
      { projectId: co.projectId },
    );

    // Queue schedule update via Smart Scheduler
    if (co.scheduleDays > 0) {
      await eventBus.publish(
        EVENT_TYPES.SCHEDULE_DISRUPTION,
        {
          changeOrderId,
          additionalDays: co.scheduleDays,
          projectId: co.projectId,
          reason: `Change Order ${co.changeOrderNumber} approved`,
        },
        SOURCE_APP,
        { projectId: co.projectId },
      );
    }
  }

  // -----------------------------------------------------------------------
  // rejectChangeOrder
  // -----------------------------------------------------------------------

  async rejectChangeOrder(
    changeOrderId: string,
    reason: string,
  ): Promise<void> {
    const co = await prisma.changeOrder.findUniqueOrThrow({
      where: { id: changeOrderId },
    });

    await prisma.changeOrder.update({
      where: { id: changeOrderId },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
        reviewedAt: new Date(),
      },
    });

    // Notify relevant parties via event
    await eventBus.publish(
      EVENT_TYPES.DECISION_MADE,
      {
        type: 'change_order',
        changeOrderId,
        coNumber: co.changeOrderNumber,
        decision: 'rejected',
        reason,
        projectId: co.projectId,
      },
      SOURCE_APP,
      { projectId: co.projectId },
    );
  }
}
