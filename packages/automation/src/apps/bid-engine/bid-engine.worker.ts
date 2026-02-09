import { PrismaClient } from '@prisma/client';
import type { Job } from 'bullmq';
import { createWorker } from '../../infrastructure/queues.js';
import { QUEUE_NAMES } from '../../infrastructure/queues.js';
import { eventBus } from '../../infrastructure/event-bus.js';
import { EVENT_TYPES } from '../../infrastructure/event-types.js';
import { BidEngineService } from './bid-engine.service.js';

const prisma = new PrismaClient();
const service = new BidEngineService();
const SOURCE_APP = 'APP-01';

interface MatchContractorsPayload {
  leadId: string;
  projectId?: string;
}

interface ScoreBidPayload {
  bidId: string;
}

interface EvaluateAllPayload {
  evaluationId: string;
}

interface AcceptBidPayload {
  bidId: string;
}

type BidEnginePayload =
  | MatchContractorsPayload
  | ScoreBidPayload
  | EvaluateAllPayload
  | AcceptBidPayload;

async function createTask(job: Job<BidEnginePayload>) {
  return prisma.automationTask.create({
    data: {
      type: `bid-engine:${job.name}`,
      status: 'PROCESSING',
      sourceApp: SOURCE_APP,
      projectId: 'projectId' in job.data ? job.data.projectId : undefined,
      payload: job.data as any,
      startedAt: new Date(),
    },
  });
}

async function completeTask(taskId: string, result: any) {
  await prisma.automationTask.update({
    where: { id: taskId },
    data: {
      status: 'COMPLETED',
      result: result ?? {},
      completedAt: new Date(),
    },
  });
}

async function failTask(taskId: string, error: string) {
  await prisma.automationTask.update({
    where: { id: taskId },
    data: {
      status: 'FAILED',
      error,
      completedAt: new Date(),
    },
  });
}

async function processor(job: Job<BidEnginePayload>): Promise<any> {
  const task = await createTask(job);

  try {
    let result: any;

    switch (job.name) {
      case 'match-contractors': {
        const payload = job.data as MatchContractorsPayload;
        const matches = await service.matchContractors(payload.leadId);
        result = { matchCount: matches.length, matches };

        await eventBus.publish(
          EVENT_TYPES.LEAD_CREATED,
          {
            leadId: payload.leadId,
            matchedContractors: matches.length,
          },
          SOURCE_APP,
          { projectId: payload.projectId },
        );
        break;
      }

      case 'score-bid': {
        const payload = job.data as ScoreBidPayload;
        await service.scoreBid(payload.bidId);
        result = { bidId: payload.bidId, scored: true };
        break;
      }

      case 'evaluate-all': {
        const payload = job.data as EvaluateAllPayload;
        await service.evaluateBids(payload.evaluationId);
        result = { evaluationId: payload.evaluationId, evaluated: true };
        break;
      }

      case 'accept-bid': {
        const payload = job.data as AcceptBidPayload;
        await service.acceptBid(payload.bidId);
        result = { bidId: payload.bidId, accepted: true };
        break;
      }

      default:
        throw new Error(`Unknown job name: ${job.name}`);
    }

    await completeTask(task.id, result);
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await failTask(task.id, message);
    throw err;
  }
}

export const bidEngineWorker = createWorker<BidEnginePayload>(
  QUEUE_NAMES.BID_ENGINE,
  processor,
  { concurrency: 5 },
);
