import type { PrismaClient } from '@prisma/client';
import type { EventBus, KealeeEventEnvelope } from '@kealee/events';
import { createEvent, EVENT_TYPES } from '@kealee/events';
import { KEALEE_QUEUES, createQueue, createWorker } from '@kealee/queue';
import { AIProvider, CONTRACT_PROMPT } from '@kealee/ai';
import { BaseClaw } from '../base-claw';
import { CO_IMPACT_PROMPT, PAYMENT_RISK_PROMPT } from './ai/prompts';
import type { Job } from 'bullmq';

// ---------------------------------------------------------------------------
// Approval thresholds per architecture doc §7
// ---------------------------------------------------------------------------
const APPROVAL_THRESHOLDS = {
  PM_AUTO: 5_000,        // <= $5K  -> PM can approve
  OWNER_REQUIRED: 25_000, // $5K-$25K -> owner approval
  WRITTEN_SIGNOFF: Infinity, // > $25K -> written sign-off required
} as const;

// Config per architecture doc §7
const CLAW_CONFIG = {
  name: 'contract-commercials-claw',
  eventPatterns: ['project.*', 'estimate.*', 'bid.*', 'schedule.*'],
  writableModels: [
    'Contract',
    'ContractAgreement',
    'ChangeOrder',
    'ChangeOrderLineItem',
    'ChangeOrderApproval',
    'Payment',
    'ScheduledPayment',
  ],
};

export class ContractCommercialsClaw extends BaseClaw {
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
      // --- Contract lifecycle ---
      case 'project.precon.completed':
      case 'bid.contractor.recommended': {
        const queue = createQueue(KEALEE_QUEUES.CONTRACT_ENGINE);
        await queue.add('draft-contract', { event });
        break;
      }
      case 'estimate.approved': {
        const queue = createQueue(KEALEE_QUEUES.CONTRACT_ENGINE);
        await queue.add('attach-estimate-to-contract', { event });
        break;
      }

      // --- Change orders ---
      case 'project.change.requested': {
        const queue = createQueue(KEALEE_QUEUES.CHANGE_ORDER);
        await queue.add('evaluate-change-order', { event });
        break;
      }
      case 'schedule.updated': {
        const queue = createQueue(KEALEE_QUEUES.CHANGE_ORDER);
        await queue.add('assess-schedule-impact', { event });
        break;
      }

      // --- Payments ---
      case 'project.payapp.submitted': {
        const queue = createQueue(KEALEE_QUEUES.PAYMENT);
        await queue.add('process-pay-app', { event });
        break;
      }
    }
  }

  // =========================================================================
  // Worker Registration
  // =========================================================================

  async registerWorkers(): Promise<void> {
    // Contract Engine Worker
    createWorker(KEALEE_QUEUES.CONTRACT_ENGINE, async (job: Job) => {
      switch (job.name) {
        case 'draft-contract':
          await this.handleDraftContract(job);
          break;
        case 'attach-estimate-to-contract':
          await this.handleAttachEstimate(job);
          break;
        case 'execute-contract':
          await this.handleExecuteContract(job);
          break;
      }
    });

    // Change Order Worker
    createWorker(KEALEE_QUEUES.CHANGE_ORDER, async (job: Job) => {
      switch (job.name) {
        case 'evaluate-change-order':
          await this.handleEvaluateChangeOrder(job);
          break;
        case 'assess-schedule-impact':
          await this.handleAssessScheduleImpact(job);
          break;
        case 'route-approval':
          await this.handleRouteApproval(job);
          break;
      }
    });

    // Payment Worker
    createWorker(KEALEE_QUEUES.PAYMENT, async (job: Job) => {
      switch (job.name) {
        case 'process-pay-app':
          await this.handleProcessPayApp(job);
          break;
        case 'calculate-retainage':
          await this.handleCalculateRetainage(job);
          break;
        case 'generate-lien-waiver':
          await this.handleGenerateLienWaiver(job);
          break;
        case 'disburse-payment':
          await this.handleDisbursePayment(job);
          break;
      }
    });
  }

  // =========================================================================
  // Contract Engine Workers
  // =========================================================================

  private async handleDraftContract(job: Job): Promise<void> {
    const { event } = job.data as { event: KealeeEventEnvelope };
    this.assertWritable('Contract');
    this.assertWritable('ContractAgreement');

    const payload = event.payload as Record<string, any>;

    // Build contract from bid recommendation or precon completion
    const contract = await this.prisma.contract.create({
      data: {
        projectId: event.projectId,
        organizationId: event.organizationId,
        contractorId: payload.contractorId ?? null,
        status: 'DRAFT',
        type: payload.contractType ?? 'FIXED_PRICE',
        totalAmount: payload.contractAmount ?? 0,
      },
    });

    // Create the agreement wrapper
    const agreement = await this.prisma.contractAgreement.create({
      data: {
        contractId: contract.id,
        version: 1,
        status: 'PENDING_REVIEW',
        terms: payload.terms ?? {},
      },
    });

    // AI-assisted clause generation
    const _aiResult = await this.ai.reason({
      task:
        'Review the contract parameters and suggest standard AIA-based clauses. ' +
        'Flag any risk areas based on project type and contractor history.',
      context: {
        projectId: event.projectId,
        contractType: payload.contractType ?? 'FIXED_PRICE',
        contractAmount: payload.contractAmount ?? 0,
        scope: payload.scope,
      },
      systemPrompt: CONTRACT_PROMPT,
    });

    // Publish draft event
    const draftEvent = createEvent({
      type: EVENT_TYPES.contract.draft.created,
      source: this.config.name,
      projectId: event.projectId,
      organizationId: event.organizationId,
      payload: {
        contractId: contract.id,
        agreementId: agreement.id,
      },
      entity: { type: 'Contract', id: contract.id },
      trigger: { eventId: event.id, eventType: event.type },
    });
    await this.eventBus.publish(draftEvent);
  }

  private async handleAttachEstimate(job: Job): Promise<void> {
    const { event } = job.data as { event: KealeeEventEnvelope };
    this.assertWritable('Contract');

    const payload = event.payload as Record<string, any>;
    const estimateId = payload.estimateId;

    // Find the active draft contract for this project
    const contract = await this.prisma.contract.findFirst({
      where: {
        projectId: event.projectId,
        status: 'DRAFT',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!contract) return;

    // Attach estimate and update amount
    const estimate = await this.prisma.estimate.findUnique({
      where: { id: estimateId },
    });

    await this.prisma.contract.update({
      where: { id: contract.id },
      data: {
        estimateId,
        totalAmount: (estimate as any)?.grandTotal ?? contract.totalAmount,
      },
    });

    // Publish updated event
    const updatedEvent = createEvent({
      type: EVENT_TYPES.contract.updated,
      source: this.config.name,
      projectId: event.projectId,
      organizationId: event.organizationId,
      payload: { contractId: contract.id, estimateId },
      entity: { type: 'Contract', id: contract.id },
      trigger: { eventId: event.id, eventType: event.type },
    });
    await this.eventBus.publish(updatedEvent);
  }

  private async handleExecuteContract(job: Job): Promise<void> {
    const { contractId, projectId, organizationId, event } = job.data;
    this.assertWritable('Contract');
    this.assertWritable('ScheduledPayment');

    // Mark contract as executed
    const contract = await this.prisma.contract.update({
      where: { id: contractId },
      data: { status: 'EXECUTED', executedAt: new Date() },
    });

    // Generate payment schedule from contract milestones
    const milestones = (contract as any).milestones ?? [];
    for (let i = 0; i < milestones.length; i++) {
      const milestone = milestones[i];
      await this.prisma.scheduledPayment.create({
        data: {
          contractId: contract.id,
          projectId,
          amount: milestone.amount,
          dueDate: new Date(milestone.dueDate),
          description: milestone.description ?? `Milestone ${i + 1}`,
          status: 'SCHEDULED',
          sortOrder: i,
        },
      });
    }

    // Publish executed event
    const executedEvent = createEvent({
      type: EVENT_TYPES.contract.executed,
      source: this.config.name,
      projectId,
      organizationId,
      payload: { contractId: contract.id },
      entity: { type: 'Contract', id: contract.id },
      trigger: event
        ? { eventId: event.id, eventType: event.type }
        : undefined,
    });
    await this.eventBus.publish(executedEvent);
  }

  // =========================================================================
  // Change Order Workers
  // =========================================================================

  private async handleEvaluateChangeOrder(job: Job): Promise<void> {
    const { event } = job.data as { event: KealeeEventEnvelope };
    this.assertWritable('ChangeOrder');
    this.assertWritable('ChangeOrderLineItem');

    const payload = event.payload as Record<string, any>;

    // Create change order record
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
      systemPrompt: CO_IMPACT_PROMPT,
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

    // Update CO with calculated amount
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

    // Publish evaluation event
    const evalEvent = createEvent({
      type: EVENT_TYPES.changeorder.evaluated,
      source: this.config.name,
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

  private async handleRouteApproval(job: Job): Promise<void> {
    const { changeOrderId, amount, projectId, organizationId, event } =
      job.data;
    this.assertWritable('ChangeOrderApproval');
    this.assertWritable('ChangeOrder');

    // Determine approval tier per architecture doc §7:
    //   <= $5K       -> PM auto-approve
    //   $5K - $25K   -> Owner approval required
    //   > $25K       -> Written sign-off required
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

    // Create approval record
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

    // Update change order status
    await this.prisma.changeOrder.update({
      where: { id: changeOrderId },
      data: {
        status:
          approvalTier === 'PM_AUTO' ? 'APPROVED' : 'PENDING_APPROVAL',
        approvalTier,
      },
    });

    // Publish approval routed event
    const routedEvent = createEvent({
      type:
        approvalTier === 'PM_AUTO'
          ? EVENT_TYPES.changeorder.approved
          : EVENT_TYPES.changeorder.approval.pending,
      source: this.config.name,
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

  private async handleAssessScheduleImpact(job: Job): Promise<void> {
    const { event } = job.data as { event: KealeeEventEnvelope };

    const payload = event.payload as Record<string, any>;

    // Find open change orders for this project that may be affected
    const openChangeOrders = await this.prisma.changeOrder.findMany({
      where: {
        projectId: event.projectId,
        status: { in: ['PENDING_EVALUATION', 'EVALUATED', 'PENDING_APPROVAL'] },
      },
    });

    if (openChangeOrders.length === 0) return;

    // AI analysis of schedule impact on open COs
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
      systemPrompt: CO_IMPACT_PROMPT,
    });

    // Publish schedule impact event
    const impactEvent = createEvent({
      type: EVENT_TYPES.changeorder.schedule.impacted,
      source: this.config.name,
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

  // =========================================================================
  // Payment Workers
  // =========================================================================

  private async handleProcessPayApp(job: Job): Promise<void> {
    const { event } = job.data as { event: KealeeEventEnvelope };
    this.assertWritable('Payment');

    const payload = event.payload as Record<string, any>;

    // Validate pay application against contract
    const contract = await this.prisma.contract.findUnique({
      where: { id: payload.contractId },
    });

    if (!contract || contract.status !== 'EXECUTED') return;

    // AI risk assessment on payment
    const aiResult = await this.ai.reason({
      task:
        'Evaluate this pay application. Check for overbilling, incomplete work, ' +
        'and retainage compliance. Flag any risk indicators.',
      context: {
        payApp: payload,
        contractAmount: contract.totalAmount,
        contractType: (contract as any).type,
      },
      systemPrompt: PAYMENT_RISK_PROMPT,
    });

    // Create payment record
    const payment = await this.prisma.payment.create({
      data: {
        projectId: event.projectId,
        contractId: payload.contractId,
        organizationId: event.organizationId,
        amount: payload.amount,
        type: 'PAY_APP',
        status: 'PENDING_REVIEW',
        payAppNumber: payload.payAppNumber,
        periodStart: payload.periodStart ? new Date(payload.periodStart) : null,
        periodEnd: payload.periodEnd ? new Date(payload.periodEnd) : null,
        aiRiskAssessment: aiResult as any,
      },
    });

    // Queue retainage calculation
    const queue = createQueue(KEALEE_QUEUES.PAYMENT);
    await queue.add('calculate-retainage', {
      paymentId: payment.id,
      contractId: payload.contractId,
      projectId: event.projectId,
      organizationId: event.organizationId,
      event,
    });

    // Publish pay app processed event
    const processedEvent = createEvent({
      type: EVENT_TYPES.payment.payapp.processed,
      source: this.config.name,
      projectId: event.projectId,
      organizationId: event.organizationId,
      payload: { paymentId: payment.id, amount: payload.amount },
      entity: { type: 'Payment', id: payment.id },
      trigger: { eventId: event.id, eventType: event.type },
    });
    await this.eventBus.publish(processedEvent);
  }

  private async handleCalculateRetainage(job: Job): Promise<void> {
    const { paymentId, contractId, projectId, organizationId, event } =
      job.data;
    this.assertWritable('Payment');

    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
    });
    if (!contract) return;

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });
    if (!payment) return;

    // Standard retainage: 10% until 50% complete, 5% after
    const retainageRate = (contract as any).percentComplete >= 50 ? 0.05 : 0.10;
    const retainageAmount = payment.amount * retainageRate;
    const netPayment = payment.amount - retainageAmount;

    await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        retainageRate,
        retainageAmount,
        netAmount: netPayment,
        status: 'RETAINAGE_CALCULATED',
      },
    });

    // Queue lien waiver generation
    const queue = createQueue(KEALEE_QUEUES.PAYMENT);
    await queue.add('generate-lien-waiver', {
      paymentId,
      contractId,
      projectId,
      organizationId,
      netAmount: netPayment,
      event,
    });

    // Publish retainage event
    const retainageEvent = createEvent({
      type: EVENT_TYPES.payment.retainage.calculated,
      source: this.config.name,
      projectId,
      organizationId,
      payload: {
        paymentId,
        retainageRate,
        retainageAmount,
        netPayment,
      },
      entity: { type: 'Payment', id: paymentId },
      trigger: event
        ? { eventId: event.id, eventType: event.type }
        : undefined,
    });
    await this.eventBus.publish(retainageEvent);
  }

  private async handleGenerateLienWaiver(job: Job): Promise<void> {
    const { paymentId, contractId, projectId, organizationId, netAmount, event } =
      job.data;
    this.assertWritable('Payment');

    // Update payment with lien waiver status
    await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        lienWaiverStatus: 'PENDING',
        lienWaiverRequired: true,
      },
    });

    // Publish lien waiver requested event
    const waiverEvent = createEvent({
      type: EVENT_TYPES.payment.lienwaiver.requested,
      source: this.config.name,
      projectId,
      organizationId,
      payload: {
        paymentId,
        contractId,
        netAmount,
        waiverType: 'CONDITIONAL_PROGRESS',
      },
      entity: { type: 'Payment', id: paymentId },
      trigger: event
        ? { eventId: event.id, eventType: event.type }
        : undefined,
    });
    await this.eventBus.publish(waiverEvent);
  }

  private async handleDisbursePayment(job: Job): Promise<void> {
    const { paymentId, projectId, organizationId, event } = job.data;
    this.assertWritable('Payment');

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { contract: true },
    });
    if (!payment) return;

    // Verify lien waiver received before disbursement
    if (
      (payment as any).lienWaiverRequired &&
      (payment as any).lienWaiverStatus !== 'RECEIVED'
    ) {
      console.warn(
        `[${this.config.name}] Cannot disburse payment ${paymentId} — lien waiver not received`,
      );
      return;
    }

    // Stripe Connect disbursement
    // The actual Stripe call is handled by the payment integration service.
    // We update status and publish the event for the integration layer.
    await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'DISBURSEMENT_INITIATED',
        disbursedAt: new Date(),
      },
    });

    // Publish disbursement event
    const disburseEvent = createEvent({
      type: EVENT_TYPES.payment.disbursed,
      source: this.config.name,
      projectId,
      organizationId,
      payload: {
        paymentId,
        amount: (payment as any).netAmount ?? payment.amount,
        contractorId: (payment.contract as any)?.contractorId,
        stripeConnectAccount: (payment.contract as any)?.stripeAccountId,
      },
      entity: { type: 'Payment', id: paymentId },
      trigger: event
        ? { eventId: event.id, eventType: event.type }
        : undefined,
    });
    await this.eventBus.publish(disburseEvent);
  }
}
