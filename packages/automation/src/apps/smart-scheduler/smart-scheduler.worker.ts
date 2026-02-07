import { PrismaClient } from '@prisma/client';
import type { Job } from 'bullmq';
import { createWorker, addJob, createQueue, QUEUE_NAMES } from '../../infrastructure/queues.js';
import { SmartSchedulerService } from './smart-scheduler.service.js';

const prisma = new PrismaClient();
const service = new SmartSchedulerService();
const SOURCE_APP = 'APP-12';

interface OptimizeSchedulePayload {
  projectId: string;
}

interface HandleDisruptionPayload {
  projectId: string;
  disruption: {
    type: string;
    description: string;
    affectedTaskIds: string[];
  };
}

interface CrossProjectOptimizePayload {
  pmId: string;
}

interface OptimizeAllPayload {
  // Empty — triggers optimization for all active projects
}

type SmartSchedulerPayload =
  | OptimizeSchedulePayload
  | HandleDisruptionPayload
  | CrossProjectOptimizePayload
  | OptimizeAllPayload;

async function processor(job: Job<SmartSchedulerPayload>): Promise<any> {
  const task = await prisma.automationTask.create({
    data: {
      type: `smart-scheduler:${job.name}`,
      status: 'PROCESSING',
      sourceApp: SOURCE_APP,
      payload: job.data as any,
      startedAt: new Date(),
    },
  });

  try {
    let result: any;

    switch (job.name) {
      case 'optimize-schedule': {
        const payload = job.data as OptimizeSchedulePayload;
        const optimization = await service.optimizeSchedule(payload.projectId);
        result = {
          projectId: payload.projectId,
          optimized: !!optimization,
          criticalPathItems: optimization?.criticalPath?.length ?? 0,
          taskChanges: optimization?.optimizedTasks?.length ?? 0,
          weatherConflicts: optimization?.weatherConflicts?.length ?? 0,
          estimatedCompletion: optimization?.estimatedCompletion ?? null,
        };
        break;
      }

      case 'handle-disruption': {
        const payload = job.data as HandleDisruptionPayload;
        await service.handleDisruption(
          payload.projectId,
          payload.disruption,
        );
        result = {
          projectId: payload.projectId,
          disruptionType: payload.disruption.type,
          handled: true,
        };
        break;
      }

      case 'cross-project-optimize': {
        const payload = job.data as CrossProjectOptimizePayload;
        const summary = await service.crossProjectOptimize(payload.pmId);
        result = {
          pmId: payload.pmId,
          ...summary,
        };
        break;
      }

      case 'optimize-all': {
        // Queue individual optimization for each active project
        const activeProjects = await prisma.project.findMany({
          where: { status: { in: ['ACTIVE', 'IN_PROGRESS'] } },
          select: { id: true },
        });

        const queue = createQueue(QUEUE_NAMES.SMART_SCHEDULER);

        for (let i = 0; i < activeProjects.length; i++) {
          await addJob<OptimizeSchedulePayload>(
            queue,
            'optimize-schedule',
            { projectId: activeProjects[i].id },
            { delay: i * 5000 }, // Stagger: 1 every 5 seconds
          );
        }

        // Also queue cross-project optimization for all active PMs
        const activePMs = await prisma.projectManager.findMany({
          where: { removedAt: null },
          select: { userId: true },
          distinct: ['userId'],
        });

        for (let i = 0; i < activePMs.length; i++) {
          await addJob<CrossProjectOptimizePayload>(
            queue,
            'cross-project-optimize',
            { pmId: activePMs[i].userId },
            { delay: (activeProjects.length + i) * 5000 },
          );
        }

        result = {
          projectsQueued: activeProjects.length,
          pmsQueued: activePMs.length,
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

export const smartSchedulerWorker = createWorker<SmartSchedulerPayload>(
  QUEUE_NAMES.SMART_SCHEDULER,
  processor,
  {
    concurrency: 2,
    limiter: { max: 10, duration: 60000 }, // 10 per minute (Claude rate limited)
  },
);
