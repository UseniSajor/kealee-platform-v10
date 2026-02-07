import { PrismaClient } from '@prisma/client';
import type { Job } from 'bullmq';
import { createWorker, QUEUE_NAMES } from '../../infrastructure/queues.js';
import { CommunicationHubService } from './communication-hub.service.js';

const prisma = new PrismaClient();
const service = new CommunicationHubService();
const SOURCE_APP = 'APP-08';

type Channel = 'email' | 'sms' | 'in_app' | 'whatsapp';

interface SendNotificationPayload {
  userId: string;
  projectId?: string;
  type: string;
  title: string;
  body: string;
  link?: string;
  channels: Channel[];
}

interface SendTemplatePayload {
  templateName: string;
  projectId: string;
  audience: 'client' | 'contractor' | 'pm' | 'all';
  variables: Record<string, string>;
}

interface SendBulkPayload {
  userIds: string[];
  type: string;
  title: string;
  body: string;
  channels: Channel[];
  projectId?: string;
}

type CommunicationPayload =
  | SendNotificationPayload
  | SendTemplatePayload
  | SendBulkPayload;

async function processor(job: Job<CommunicationPayload>): Promise<any> {
  const task = await prisma.automationTask.create({
    data: {
      type: `communication-hub:${job.name}`,
      status: 'PROCESSING',
      sourceApp: SOURCE_APP,
      payload: job.data as any,
      startedAt: new Date(),
    },
  });

  try {
    let result: any;

    switch (job.name) {
      case 'send-notification': {
        const payload = job.data as SendNotificationPayload;
        const messageIds = await service.sendNotification({
          userId: payload.userId,
          projectId: payload.projectId,
          type: payload.type,
          title: payload.title,
          body: payload.body,
          link: payload.link,
          channels: payload.channels,
        });
        result = { messageIds, count: messageIds.length };
        break;
      }

      case 'send-template': {
        const payload = job.data as SendTemplatePayload;
        const messageIds = await service.sendTemplateMessage({
          templateName: payload.templateName,
          projectId: payload.projectId,
          audience: payload.audience,
          variables: payload.variables,
        });
        result = { messageIds, count: messageIds.length };
        break;
      }

      case 'send-bulk': {
        const payload = job.data as SendBulkPayload;
        const messageIds = await service.sendBulkNotification({
          userIds: payload.userIds,
          type: payload.type,
          title: payload.title,
          body: payload.body,
          channels: payload.channels,
          projectId: payload.projectId,
        });
        result = { messageIds, count: messageIds.length };
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

export const communicationHubWorker = createWorker<CommunicationPayload>(
  QUEUE_NAMES.COMMUNICATION,
  processor,
  { concurrency: 10, limiter: { max: 30, duration: 1000 } },
);
