import type { PrismaClient } from '@prisma/client';
import type { EventBus, KealeeEventEnvelope } from '@kealee/events';
import { createEvent, EVENT_TYPES } from '@kealee/events';
import { KEALEE_QUEUES, createQueue, createWorker } from '@kealee/queue';
import { AIProvider, CONTRACT_PROMPT } from '@kealee/ai';
import { BaseClaw } from '../base-claw';
import { CO_IMPACT_PROMPT, PAYMENT_RISK_PROMPT } from './ai/prompts';
import { ContractEngineWorkerHandlers } from './workers/contract-engine';
import { ChangeOrderWorkerHandlers } from './workers/change-orders';
import { PaymentWorkerHandlers } from './workers/payments';
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
  private contractEngineHandlers: ContractEngineWorkerHandlers;
  private changeOrderHandlers: ChangeOrderWorkerHandlers;
  private paymentHandlers: PaymentWorkerHandlers;

  constructor(eventBus: EventBus, prisma: PrismaClient) {
    super(eventBus, prisma, CLAW_CONFIG);
    this.ai = new AIProvider();

    const boundAssert = this.assertWritable.bind(this);
    this.contractEngineHandlers = new ContractEngineWorkerHandlers(
      prisma, this.ai, eventBus, CLAW_CONFIG.name, boundAssert, CONTRACT_PROMPT,
    );
    this.changeOrderHandlers = new ChangeOrderWorkerHandlers(
      prisma, this.ai, eventBus, CLAW_CONFIG.name, boundAssert, CO_IMPACT_PROMPT,
    );
    this.paymentHandlers = new PaymentWorkerHandlers(
      prisma, this.ai, eventBus, CLAW_CONFIG.name, boundAssert, PAYMENT_RISK_PROMPT,
    );
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
    // Contract Engine Worker — delegates to ContractEngineWorkerHandlers
    createWorker(KEALEE_QUEUES.CONTRACT_ENGINE, async (job: Job) => {
      switch (job.name) {
        case 'draft-contract':
          await this.contractEngineHandlers.handleDraftContract(job);
          break;
        case 'attach-estimate-to-contract':
          await this.contractEngineHandlers.handleAttachEstimate(job);
          break;
        case 'execute-contract':
          await this.contractEngineHandlers.handleExecuteContract(job);
          break;
      }
    });

    // Change Order Worker — delegates to ChangeOrderWorkerHandlers
    createWorker(KEALEE_QUEUES.CHANGE_ORDER, async (job: Job) => {
      switch (job.name) {
        case 'evaluate-change-order':
          await this.changeOrderHandlers.handleEvaluateChangeOrder(job);
          break;
        case 'assess-schedule-impact':
          await this.changeOrderHandlers.handleAssessScheduleImpact(job);
          break;
        case 'route-approval':
          await this.changeOrderHandlers.handleRouteApproval(job);
          break;
      }
    });

    // Payment Worker — delegates to PaymentWorkerHandlers
    createWorker(KEALEE_QUEUES.PAYMENT, async (job: Job) => {
      switch (job.name) {
        case 'process-pay-app':
          await this.paymentHandlers.handleProcessPayApp(job);
          break;
        case 'calculate-retainage':
          await this.paymentHandlers.handleCalculateRetainage(job);
          break;
        case 'generate-lien-waiver':
          await this.paymentHandlers.handleGenerateLienWaiver(job);
          break;
        case 'disburse-payment':
          await this.paymentHandlers.handleDisbursePayment(job);
          break;
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Handler implementations are in:
  //   workers/contract-engine.ts — ContractEngineWorkerHandlers
  //   workers/change-orders.ts   — ChangeOrderWorkerHandlers
  //   workers/payments.ts        — PaymentWorkerHandlers
  // ---------------------------------------------------------------------------
}
