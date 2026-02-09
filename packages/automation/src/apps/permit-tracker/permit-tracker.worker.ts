import { PrismaClient } from '@prisma/client';
import type { Job } from 'bullmq';
import { createWorker, QUEUE_NAMES } from '../../infrastructure/queues.js';
import { PermitTrackerService } from './permit-tracker.service.js';

const prisma = new PrismaClient();
const service = new PermitTrackerService();
const SOURCE_APP = 'APP-05';

interface AIReviewPayload {
  permitId: string;
}

interface CheckStatusPayload {
  permitId: string;
}

interface CheckExpirationsPayload {
  // Empty — checks all permits
}

interface CheckSubmittedPayload {
  // Empty — checks all submitted permits
}

type PermitTrackerPayload =
  | AIReviewPayload
  | CheckStatusPayload
  | CheckExpirationsPayload
  | CheckSubmittedPayload;

async function processor(job: Job<PermitTrackerPayload>): Promise<any> {
  const task = await prisma.automationTask.create({
    data: {
      type: `permit-tracker:${job.name}`,
      status: 'PROCESSING',
      sourceApp: SOURCE_APP,
      payload: job.data as any,
      startedAt: new Date(),
    },
  });

  try {
    let result: any;

    switch (job.name) {
      case 'ai-review': {
        const payload = job.data as AIReviewPayload;
        const reviewResult = await service.aiReviewApplication(payload.permitId);
        result = {
          permitId: payload.permitId,
          score: reviewResult.score,
          issueCount: reviewResult.issues.length,
          readyToSubmit: reviewResult.readyToSubmit,
        };
        break;
      }

      case 'check-status': {
        const payload = job.data as CheckStatusPayload;
        await service.checkPermitStatus(payload.permitId);
        result = { permitId: payload.permitId, checked: true };
        break;
      }

      case 'check-expirations': {
        const count = await service.checkAllPermitExpirations();
        result = { expiringPermits: count };
        break;
      }

      case 'check-submitted': {
        const count = await service.checkSubmittedPermits();
        result = { submittedChecked: count };
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

export const permitTrackerWorker = createWorker<PermitTrackerPayload>(
  QUEUE_NAMES.PERMIT_TRACKER,
  processor,
  { concurrency: 3 },
);
