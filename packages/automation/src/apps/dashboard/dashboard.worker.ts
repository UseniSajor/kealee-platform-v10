import { PrismaClient } from '@prisma/client';
import type { Job } from 'bullmq';
import { createWorker, QUEUE_NAMES } from '../../infrastructure/queues.js';
import { DashboardService } from './dashboard.service.js';

const prisma = new PrismaClient();
const service = new DashboardService();
const SOURCE_APP = 'APP-15';

// Lazy import to avoid circular dependency — eventRouter imports dashboard/index
let _eventRouter: any = null;
async function getEventRouter() {
  if (!_eventRouter) {
    const mod = await import('../../event-router.js');
    _eventRouter = mod.eventRouter;
  }
  return _eventRouter;
}

interface CollectMetricsPayload {
  force?: boolean;
}

interface CleanupPayload {
  retentionDays?: number;
}

type DashboardPayload = CollectMetricsPayload | CleanupPayload;

async function processor(job: Job<DashboardPayload>): Promise<any> {
  const task = await prisma.automationTask.create({
    data: {
      type: `dashboard:${job.name}`,
      status: 'PROCESSING',
      sourceApp: SOURCE_APP,
      payload: job.data as any,
      startedAt: new Date(),
    },
  });

  try {
    let result: any;

    switch (job.name) {
      case 'collect-metrics': {
        const metricsCollected = await service.collectHealthMetrics();
        result = { metricsCollected, timestamp: new Date().toISOString() };
        break;
      }

      case 'cleanup-old-metrics': {
        const payload = job.data as CleanupPayload;
        const retentionDays = payload.retentionDays ?? 30;
        const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

        const deleted = await prisma.appHealthMetric.deleteMany({
          where: { timestamp: { lt: cutoff } },
        });

        result = { deletedCount: deleted.count, retentionDays };
        break;
      }

      // Weekly cycle chains dispatched by EventRouter
      case 'weekly-monday-chain': {
        const router = await getEventRouter();
        await router.executeMondayCycle();
        result = { cycle: 'monday', timestamp: new Date().toISOString() };
        break;
      }

      case 'weekly-friday-chain': {
        const router = await getEventRouter();
        await router.executeFridayCycle();
        result = { cycle: 'friday', timestamp: new Date().toISOString() };
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

export const dashboardWorker = createWorker<DashboardPayload>(
  QUEUE_NAMES.DASHBOARD,
  processor,
  { concurrency: 1 },
);
