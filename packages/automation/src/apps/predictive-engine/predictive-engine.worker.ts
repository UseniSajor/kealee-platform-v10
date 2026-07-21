import { PrismaClient } from '@prisma/client';
import type { Job } from 'bullmq';
import { createWorker, addJob, createQueue, QUEUE_NAMES } from '../../infrastructure/queues.js';
import { PredictiveEngineService } from './predictive-engine.service.js';

const prisma = new PrismaClient();
const service = new PredictiveEngineService();
const SOURCE_APP = 'APP-11';

interface AnalyzeProjectPayload {
  projectId: string;
}

interface AnalyzeAllPayload {
  // Empty — triggers analysis for all active projects
}

type PredictivePayload = AnalyzeProjectPayload | AnalyzeAllPayload;

/**
 * Simple delay helper for staggering API calls.
 */
function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function processor(job: Job<PredictivePayload>): Promise<any> {
  const task = await prisma.automationTask.create({
    data: {
      type: `predictive-engine:${job.name}`,
      status: 'PROCESSING',
      sourceApp: SOURCE_APP,
      payload: job.data as any,
      startedAt: new Date(),
    },
  });

  try {
    let result: any;

    switch (job.name) {
      case 'analyze-project': {
        const payload = job.data as AnalyzeProjectPayload;
        const predictionIds = await service.analyzeProject(payload.projectId);
        result = {
          projectId: payload.projectId,
          predictionsCreated: predictionIds.length,
          predictionIds,
        };
        break;
      }

      case 'analyze-all': {
        // Get all active projects and queue individual analysis jobs
        const count = await service.analyzeAllActiveProjects();

        const activeProjects = await prisma.project.findMany({
          where: { status: { in: ['ACTIVE', 'IN_PROGRESS'] } },
          select: { id: true },
        });

        // Use the queue directly to add staggered jobs
        const queue = createQueue(QUEUE_NAMES.PREDICTIVE);

        for (let i = 0; i < activeProjects.length; i++) {
          await addJob<AnalyzeProjectPayload>(
            queue,
            'analyze-project',
            { projectId: activeProjects[i].id },
            { delay: i * 5000 }, // Stagger: 1 project every 5 seconds
          );
        }

        result = { projectsQueued: count };
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

export const predictiveEngineWorker = createWorker<PredictivePayload>(
  QUEUE_NAMES.PREDICTIVE,
  processor,
  {
    concurrency: 2,
    limiter: { max: 10, duration: 60000 }, // 10 per minute
  },
);
