import { PrismaClient } from '@prisma/client';
import type { Job } from 'bullmq';
import { createWorker, QUEUE_NAMES } from '../../infrastructure/queues.js';
import { BudgetTrackerService } from './budget-tracker.service.js';

const prisma = new PrismaClient();
const service = new BudgetTrackerService();
const SOURCE_APP = 'APP-07';

interface ProcessReceiptPayload {
  projectId: string;
  fileUrl?: string;
  documentId?: string;
  ocrData?: {
    vendor: string;
    amount: number;
    date: string;
    category: string;
    description: string;
  };
}

interface CreateSnapshotPayload {
  projectId: string;
}

interface ProcessPaymentPayload {
  paymentId: string;
}

interface DailySnapshotPayload {
  // Empty — triggers snapshots for all active projects
}

type BudgetTrackerPayload =
  | ProcessReceiptPayload
  | CreateSnapshotPayload
  | ProcessPaymentPayload
  | DailySnapshotPayload;

async function processor(job: Job<BudgetTrackerPayload>): Promise<any> {
  const task = await prisma.automationTask.create({
    data: {
      type: `budget-tracker:${job.name}`,
      status: 'PROCESSING',
      sourceApp: SOURCE_APP,
      payload: job.data as any,
      startedAt: new Date(),
    },
  });

  try {
    let result: any;

    switch (job.name) {
      case 'process-receipt': {
        const payload = job.data as ProcessReceiptPayload;
        await service.processReceipt(payload.projectId, {
          fileUrl: payload.fileUrl,
          documentId: payload.documentId,
          ocrData: payload.ocrData,
        });
        result = { projectId: payload.projectId, processed: true };
        break;
      }

      case 'create-snapshot': {
        const payload = job.data as CreateSnapshotPayload;
        const snapshotId = await service.createSnapshot(payload.projectId);
        result = { snapshotId };
        break;
      }

      case 'process-payment': {
        const payload = job.data as ProcessPaymentPayload;
        await service.processPayment(payload.paymentId);
        result = { paymentId: payload.paymentId, processed: true };
        break;
      }

      case 'daily-snapshots': {
        const activeProjects = await prisma.project.findMany({
          where: { status: 'ACTIVE' },
          select: { id: true },
        });

        const snapshotIds: string[] = [];
        for (const project of activeProjects) {
          try {
            const id = await service.createSnapshot(project.id);
            snapshotIds.push(id);
          } catch (err) {
            console.error(
              `[BudgetTracker] Snapshot failed for project ${project.id}:`,
              (err as Error).message,
            );
          }
        }

        result = { projectCount: activeProjects.length, snapshots: snapshotIds.length };
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

export const budgetTrackerWorker = createWorker<BudgetTrackerPayload>(
  QUEUE_NAMES.BUDGET_TRACKER,
  processor,
  { concurrency: 3 },
);
