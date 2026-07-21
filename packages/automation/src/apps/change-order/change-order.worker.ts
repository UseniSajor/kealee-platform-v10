import { PrismaClient } from '@prisma/client';
import type { Job } from 'bullmq';
import { createWorker, QUEUE_NAMES } from '../../infrastructure/queues.js';
import { ChangeOrderService } from './change-order.service.js';

const prisma = new PrismaClient();
const service = new ChangeOrderService();
const SOURCE_APP = 'APP-03';

interface GenerateCOPayload {
  projectId: string;
  title: string;
  description: string;
  reason: string;
  requestedBy?: string;
}

interface ApproveCOPayload {
  changeOrderId: string;
  approvedBy: string;
}

interface RejectCOPayload {
  changeOrderId: string;
  reason: string;
}

type ChangeOrderPayload = GenerateCOPayload | ApproveCOPayload | RejectCOPayload;

async function processor(job: Job<ChangeOrderPayload>): Promise<any> {
  const task = await prisma.automationTask.create({
    data: {
      type: `change-order:${job.name}`,
      status: 'PROCESSING',
      sourceApp: SOURCE_APP,
      payload: job.data as any,
      startedAt: new Date(),
    },
  });

  try {
    let result: any;

    switch (job.name) {
      case 'generate': {
        const payload = job.data as GenerateCOPayload;
        const coId = await service.generateChangeOrder(payload.projectId, {
          title: payload.title,
          description: payload.description,
          reason: payload.reason,
          requestedBy: payload.requestedBy,
        });
        result = { changeOrderId: coId };
        break;
      }

      case 'approve': {
        const payload = job.data as ApproveCOPayload;
        await service.approveChangeOrder(payload.changeOrderId, payload.approvedBy);
        result = { changeOrderId: payload.changeOrderId, approved: true };
        break;
      }

      case 'reject': {
        const payload = job.data as RejectCOPayload;
        await service.rejectChangeOrder(payload.changeOrderId, payload.reason);
        result = { changeOrderId: payload.changeOrderId, rejected: true };
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

export const changeOrderWorker = createWorker<ChangeOrderPayload>(
  QUEUE_NAMES.CHANGE_ORDER,
  processor,
  { concurrency: 3 },
);
