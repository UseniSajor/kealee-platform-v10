import { PrismaClient } from '@prisma/client';
import type { Job } from 'bullmq';
import { createWorker, QUEUE_NAMES } from '../../infrastructure/queues.js';
import { DecisionSupportService } from './decision-support.service.js';

const prisma = new PrismaClient();
const service = new DecisionSupportService();
const SOURCE_APP = 'APP-14';

type DecisionType = 'bid_award' | 'change_order' | 'payment_release' | 'schedule_change';

interface CreateDecisionPayload {
  projectId: string;
  pmId: string;
  type: DecisionType;
  title: string;
  contextData: Record<string, any>;
}

interface ResolveDecisionPayload {
  decisionId: string;
  decision: string;
  decidedBy: string;
  reasoning?: string;
}

type DecisionSupportPayload = CreateDecisionPayload | ResolveDecisionPayload;

async function processor(job: Job<DecisionSupportPayload>): Promise<any> {
  const task = await prisma.automationTask.create({
    data: {
      type: `decision-support:${job.name}`,
      status: 'PROCESSING',
      sourceApp: SOURCE_APP,
      payload: job.data as any,
      startedAt: new Date(),
    },
  });

  try {
    let result: any;

    switch (job.name) {
      case 'create-decision': {
        const payload = job.data as CreateDecisionPayload;
        const decisionId = await service.createDecision({
          projectId: payload.projectId,
          pmId: payload.pmId,
          type: payload.type,
          title: payload.title,
          contextData: payload.contextData,
        });
        result = { decisionId, type: payload.type };
        break;
      }

      case 'resolve-decision': {
        const payload = job.data as ResolveDecisionPayload;
        await service.resolveDecision(payload.decisionId, {
          decision: payload.decision,
          decidedBy: payload.decidedBy,
          reasoning: payload.reasoning,
        });
        result = {
          decisionId: payload.decisionId,
          decision: payload.decision,
          resolved: true,
        };
        break;
      }

      default:
        throw new Error(`Unknown job name: ${job.name}`);
    }

    await prisma.automationTask.update({
      where: { id: task.id },
      data: { status: 'COMPLETED', result: result ?? {}, completedAt: new Date() },
    });

    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.automationTask.update({
      where: { id: task.id },
      data: { status: 'FAILED', error: message, completedAt: new Date() },
    });
    throw err;
  }
}

export const decisionSupportWorker = createWorker<DecisionSupportPayload>(
  QUEUE_NAMES.DECISION_SUPPORT,
  processor,
  { concurrency: 3 },
);
