/**
 * Claw B — Change Order Worker Handlers
 *
 * Handles change order evaluation, AI scope/cost/schedule impact analysis,
 * and tiered approval routing per architecture doc §7:
 *   <= $5K       → PM auto-approve
 *   $5K - $25K   → Owner approval required
 *   > $25K       → Written sign-off required
 */
import type { PrismaClient } from '@prisma/client';
import type { EventBus, KealeeEventEnvelope } from '@kealee/events';
import { createEvent, EVENT_TYPES } from '@kealee/events';
import { KEALEE_QUEUES, createQueue } from '@kealee/queue';
import type { AIProvider } from '@kealee/ai';
import type { Job } from 'bullmq';

const APPROVAL_THRESHOLDS = {
  PM_AUTO: 5_000,
  OWNER_REQUIRED: 25_000,
  WRITTEN_SIGNOFF: Infinity,
} as const;

export class ChangeOrderWorkerHandlers {
  constructor(
    private prisma: PrismaClient,
    private ai: AIProvider,
    private eventBus: EventBus,
    private clawName: string,
    private assertWritable: (model: string) => void,
    private coImpactPrompt: string,
  ) {}

  async handleEvaluateChangeOrder(job: Job): Promise<void> {
    const { event } = job.data as { event: KealeeEventEnvelope };
    this.assertWritable('ChangeOrder');
    this.assertWritable('ChangeOrderLineItem');

    const payload = event.payload as Record<string, any>;

    const changeOrder = await this.prisma.changeOrder.create({
      data: {
        projectId: event.projectId,
        contractId: payload.contractId,
        organizationId: event.organizationId,
        title: payload.title ?? 'Change Order',
        description: payload.description ?? '',
        status: 'PENDING_EVALUATION',
        requestedBy: payload.requestedBy,
      },
    });

    // AI scope + cost impact analysis
    const aiResult = await this.ai.reason({
      task:
        'Evaluate this change order request. Assess scope impact, cost delta, ' +
        'and schedule implications. Classify risk level.',
      context: {
        changeRequest: payload,
        contractId: payload.contractId,
      },
      systemPrompt: this.coImpactPrompt,
    });

    // Create line items from AI analysis
    const suggestedItems = (aiResult as any)?.lineItems ?? [];
    let totalAmount = 0;
    for (const item of suggestedItems) {
      this.assertWritable('ChangeOrderLineItem');
      await this.prisma.changeOrderLineItem.create({
        data: {
          changeOrderId: changeOrder.id,
          description: item.description,
          quantity: item.quantity ?? 1,
          unitCost: item.unitCost ?? 0,
          totalCost: item.totalCost ?? 0,
          csiDivision: item.csiDivision ?? null,
        },
      });
      totalAmount += item.totalCost ?? 0;
    }

    await this.prisma.changeOrder.update({
      where: { id: changeOrder.id },
      data: {
        amount: totalAmount,
        status: 'EVALUATED',
        aiAnalysis: aiResult as any,
      },
    });

    // Route to appropriate approval level
    const queue = createQueue(KEALEE_QUEUES.CHANGE_ORDER);
    await queue.add('route-approval', {
      changeOrderId: changeOrder.id,
      amount: totalAmount,
      projectId: event.projectId,
      organizationId: event.organizationId,
      event,
    });

    const evalEvent = createEvent({
      type: EVENT_TYPES.changeorder.evaluated,
      source: this.clawName,
      projectId: event.projectId,
      organizationId: event.organizationId,
      payload: {
        changeOrderId: changeOrder.id,
        amount: totalAmount,
        aiAnalysis: aiResult,
      },
      entity: { type: 'ChangeOrder', id: changeOrder.id },
      trigger: { eventId: event.id, eventType: event.type },
    });
    await this.eventBus.publish(evalEvent);
  }

  async handleRouteApproval(job: Job): Promise<void> {
    const { changeOrderId, amount, projectId, organizationId, event } =
      job.data;
    this.assertWritable('ChangeOrderApproval');
    this.assertWritable('ChangeOrder');

    let approvalTier: 'PM_AUTO' | 'OWNER_REQUIRED' | 'WRITTEN_SIGNOFF';
    let approvalStatus: string;

    if (amount <= APPROVAL_THRESHOLDS.PM_AUTO) {
      approvalTier = 'PM_AUTO';
      approvalStatus = 'APPROVED';
    } else if (amount <= APPROVAL_THRESHOLDS.OWNER_REQUIRED) {
      approvalTier = 'OWNER_REQUIRED';
      approvalStatus = 'PENDING_OWNER';
    } else {
      approvalTier = 'WRITTEN_SIGNOFF';
      approvalStatus = 'PENDING_WRITTEN_SIGNOFF';
    }

    const approval = await this.prisma.changeOrderApproval.create({
      data: {
        changeOrderId,
        tier: approvalTier,
        status: approvalStatus,
        amount,
        requiredBy:
          approvalTier === 'PM_AUTO' ? 'SYSTEM' : approvalTier,
        approvedAt:
          approvalTier === 'PM_AUTO' ? new Date() : null,
      },
    });

    await this.prisma.changeOrder.update({
      where: { id: changeOrderId },
      data: {
        status:
          approvalTier === 'PM_AUTO' ? 'APPROVED' : 'PENDING_APPROVAL',
        approvalTier,
      },
    });

    const routedEvent = createEvent({
      type:
        approvalTier === 'PM_AUTO'
          ? EVENT_TYPES.changeorder.approved
          : EVENT_TYPES.changeorder.approval.pending,
      source: this.clawName,
      projectId,
      organizationId,
      payload: {
        changeOrderId,
        approvalId: approval.id,
        approvalTier,
        amount,
      },
      entity: { type: 'ChangeOrder', id: changeOrderId },
      trigger: event
        ? { eventId: event.id, eventType: event.type }
        : undefined,
    });
    await this.eventBus.publish(routedEvent);
  }

  async handleAssessScheduleImpact(job: Job): Promise<void> {
    const { event } = job.data as { event: KealeeEventEnvelope };
    const payload = event.payload as Record<string, any>;

    const openChangeOrders = await this.prisma.changeOrder.findMany({
      where: {
        projectId: event.projectId,
        status: { in: ['PENDING_EVALUATION', 'EVALUATED', 'PENDING_APPROVAL'] },
      },
    });

    if (openChangeOrders.length === 0) return;

    const aiResult = await this.ai.reason({
      task:
        'Assess how this schedule update impacts open change orders. ' +
        'Identify any COs that need timeline revision or cost adjustment.',
      context: {
        scheduleUpdate: payload,
        openChangeOrders: openChangeOrders.map((co) => ({
          id: co.id,
          title: co.title,
          amount: co.amount,
          status: co.status,
        })),
      },
      systemPrompt: this.coImpactPrompt,
    });

    const impactEvent = createEvent({
      type: EVENT_TYPES.changeorder.schedule.impacted,
      source: this.clawName,
      projectId: event.projectId,
      organizationId: event.organizationId,
      payload: {
        affectedChangeOrders: openChangeOrders.map((co) => co.id),
        aiAnalysis: aiResult,
      },
      trigger: { eventId: event.id, eventType: event.type },
    });
    await this.eventBus.publish(impactEvent);
  }
}
