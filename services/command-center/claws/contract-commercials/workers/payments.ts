/**
 * Claw B — Payment Worker Handlers
 *
 * Handles pay application processing, retainage calculation (10% until 50%
 * complete, 5% after), lien waiver generation, and Stripe Connect disbursement.
 * All payments require audit trail and cannot be auto-approved without explicit
 * state transitions.
 */
import type { PrismaClient } from '@prisma/client';
import type { EventBus, KealeeEventEnvelope } from '@kealee/events';
import { createEvent, EVENT_TYPES } from '@kealee/events';
import { KEALEE_QUEUES, createQueue } from '@kealee/queue';
import type { AIProvider } from '@kealee/ai';
import type { Job } from 'bullmq';

export class PaymentWorkerHandlers {
  constructor(
    private prisma: PrismaClient,
    private ai: AIProvider,
    private eventBus: EventBus,
    private clawName: string,
    private assertWritable: (model: string) => void,
    private paymentRiskPrompt: string,
  ) {}

  async handleProcessPayApp(job: Job): Promise<void> {
    const { event } = job.data as { event: KealeeEventEnvelope };
    this.assertWritable('Payment');

    const payload = event.payload as Record<string, any>;

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
      systemPrompt: this.paymentRiskPrompt,
    });

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

    const queue = createQueue(KEALEE_QUEUES.PAYMENT);
    await queue.add('calculate-retainage', {
      paymentId: payment.id,
      contractId: payload.contractId,
      projectId: event.projectId,
      organizationId: event.organizationId,
      event,
    });

    const processedEvent = createEvent({
      type: EVENT_TYPES.payment.payapp.processed,
      source: this.clawName,
      projectId: event.projectId,
      organizationId: event.organizationId,
      payload: { paymentId: payment.id, amount: payload.amount },
      entity: { type: 'Payment', id: payment.id },
      trigger: { eventId: event.id, eventType: event.type },
    });
    await this.eventBus.publish(processedEvent);
  }

  async handleCalculateRetainage(job: Job): Promise<void> {
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

    const queue = createQueue(KEALEE_QUEUES.PAYMENT);
    await queue.add('generate-lien-waiver', {
      paymentId,
      contractId,
      projectId,
      organizationId,
      netAmount: netPayment,
      event,
    });

    const retainageEvent = createEvent({
      type: EVENT_TYPES.payment.retainage.calculated,
      source: this.clawName,
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

  async handleGenerateLienWaiver(job: Job): Promise<void> {
    const { paymentId, contractId, projectId, organizationId, netAmount, event } =
      job.data;
    this.assertWritable('Payment');

    await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        lienWaiverStatus: 'PENDING',
        lienWaiverRequired: true,
      },
    });

    const waiverEvent = createEvent({
      type: EVENT_TYPES.payment.lienwaiver.requested,
      source: this.clawName,
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

  async handleDisbursePayment(job: Job): Promise<void> {
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
        `[${this.clawName}] Cannot disburse payment ${paymentId} — lien waiver not received`,
      );
      return;
    }

    await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'DISBURSEMENT_INITIATED',
        disbursedAt: new Date(),
      },
    });

    const disburseEvent = createEvent({
      type: EVENT_TYPES.payment.disbursed,
      source: this.clawName,
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
