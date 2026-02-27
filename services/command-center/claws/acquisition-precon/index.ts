import type { PrismaClient } from '@prisma/client';
import type { EventBus, KealeeEventEnvelope } from '@kealee/events';
import { createEvent, EVENT_TYPES } from '@kealee/events';
import { KEALEE_QUEUES, createQueue, createWorker } from '@kealee/queue';
import { AIProvider, ACQUISITION_PROMPT } from '@kealee/ai';
import { BaseClaw } from '../base-claw';
import { BidEngineWorkerHandlers } from './workers/bid-engine';
import { EstimationWorkerHandlers } from './workers/estimation';
import type { Job } from 'bullmq';

// Config per architecture doc §6
const CLAW_CONFIG = {
  name: 'acquisition-precon-claw',
  eventPatterns: ['project.*', 'estimation.*', 'ctc.*'],
  writableModels: [
    'Estimate', 'EstimateSection', 'EstimateLineItem',
    'BidRequest', 'BidInvitation', 'BidSubmission', 'ContractorBid',
  ],
};

export class AcquisitionPreConClaw extends BaseClaw {
  private ai: AIProvider;
  private bidEngineHandlers: BidEngineWorkerHandlers;
  private estimationHandlers: EstimationWorkerHandlers;

  constructor(eventBus: EventBus, prisma: PrismaClient) {
    super(eventBus, prisma, CLAW_CONFIG);
    this.ai = new AIProvider();

    const boundAssert = this.assertWritable.bind(this);
    this.bidEngineHandlers = new BidEngineWorkerHandlers(
      prisma, this.ai, eventBus, CLAW_CONFIG.name, boundAssert,
    );
    this.estimationHandlers = new EstimationWorkerHandlers(
      prisma, this.ai, eventBus, CLAW_CONFIG.name, boundAssert,
    );
  }

  async handleEvent(event: KealeeEventEnvelope): Promise<void> {
    // Route events to appropriate queues
    switch (event.type) {
      case 'project.created':
      case 'estimation.order.created': {
        const queue = createQueue(KEALEE_QUEUES.ESTIMATION_TOOL);
        await queue.add('analyze-project', { event });
        break;
      }
      case 'project.precon.requested': {
        const queue = createQueue(KEALEE_QUEUES.BID_ENGINE);
        await queue.add('create-bid-request', { event });
        break;
      }
      case 'ctc.imported': {
        // CTC import completed — trigger project analysis refresh for affected projects
        const queue = createQueue(KEALEE_QUEUES.ESTIMATION_TOOL);
        await queue.add('ctc-import-completed', { event });
        break;
      }
      case 'ctc.takeoff.confirmed': {
        // AI takeoff confirmed — can trigger bid request creation if project is ready
        const queue = createQueue(KEALEE_QUEUES.ESTIMATION_TOOL);
        await queue.add('takeoff-confirmed', { event });
        break;
      }
    }
  }

  async registerWorkers(): Promise<void> {
    // Bid Engine Worker — delegates to BidEngineWorkerHandlers
    createWorker(KEALEE_QUEUES.BID_ENGINE, async (job: Job) => {
      switch (job.name) {
        case 'create-bid-request':
          await this.bidEngineHandlers.handleCreateBidRequest(job);
          break;
        case 'score-submissions':
          await this.bidEngineHandlers.handleScoreSubmissions(job);
          break;
        case 'match-contractors':
          await this.bidEngineHandlers.handleMatchContractors(job);
          break;
      }
    });

    // Estimation Worker — delegates to EstimationWorkerHandlers
    createWorker(KEALEE_QUEUES.ESTIMATION_TOOL, async (job: Job) => {
      switch (job.name) {
        case 'analyze-project':
          await this.estimationHandlers.handleAnalyzeProject(job);
          break;
        case 'calculate-costs':
          await this.estimationHandlers.handleCalculateCosts(job);
          break;
        case 'ctc-import-completed':
          await this.estimationHandlers.handleCTCImportCompleted(job);
          break;
        case 'takeoff-confirmed':
          await this.estimationHandlers.handleTakeoffConfirmed(job);
          break;
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Handler implementations are in:
  //   workers/bid-engine.ts    — BidEngineWorkerHandlers
  //   workers/estimation.ts    — EstimationWorkerHandlers
  // ---------------------------------------------------------------------------
}
