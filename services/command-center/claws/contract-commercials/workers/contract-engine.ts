/**
 * Claw B — Contract Engine Worker Handlers
 *
 * Handles contract drafting from bid recommendations or precon completion,
 * estimate attachment, and contract execution with payment schedule generation.
 * Uses AI for AIA-based clause generation and risk assessment.
 */
import type { PrismaClient } from '@prisma/client';
import type { EventBus, KealeeEventEnvelope } from '@kealee/events';
import { createEvent, EVENT_TYPES } from '@kealee/events';
import type { AIProvider } from '@kealee/ai';
import type { Job } from 'bullmq';

export class ContractEngineWorkerHandlers {
  constructor(
    private prisma: PrismaClient,
    private ai: AIProvider,
    private eventBus: EventBus,
    private clawName: string,
    private assertWritable: (model: string) => void,
    private contractPrompt: string,
  ) {}

  async handleDraftContract(job: Job): Promise<void> {
    const { event } = job.data as { event: KealeeEventEnvelope };
    this.assertWritable('Contract');
    this.assertWritable('ContractAgreement');

    const payload = event.payload as Record<string, any>;

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
      systemPrompt: this.contractPrompt,
    });

    const draftEvent = createEvent({
      type: EVENT_TYPES.contract.draft.created,
      source: this.clawName,
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

  async handleAttachEstimate(job: Job): Promise<void> {
    const { event } = job.data as { event: KealeeEventEnvelope };
    this.assertWritable('Contract');

    const payload = event.payload as Record<string, any>;
    const estimateId = payload.estimateId;

    const contract = await this.prisma.contract.findFirst({
      where: {
        projectId: event.projectId,
        status: 'DRAFT',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!contract) return;

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

    const updatedEvent = createEvent({
      type: EVENT_TYPES.contract.updated,
      source: this.clawName,
      projectId: event.projectId,
      organizationId: event.organizationId,
      payload: { contractId: contract.id, estimateId },
      entity: { type: 'Contract', id: contract.id },
      trigger: { eventId: event.id, eventType: event.type },
    });
    await this.eventBus.publish(updatedEvent);
  }

  async handleExecuteContract(job: Job): Promise<void> {
    const { contractId, projectId, organizationId, event } = job.data;
    this.assertWritable('Contract');
    this.assertWritable('ScheduledPayment');

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

    const executedEvent = createEvent({
      type: EVENT_TYPES.contract.executed,
      source: this.clawName,
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
}
