import { PrismaClient } from '@prisma/client';
import type { Job } from 'bullmq';
import { createWorker, QUEUE_NAMES } from '../../infrastructure/queues.js';
import { QAInspectorService } from './qa-inspector.service.js';

const prisma = new PrismaClient();
const service = new QAInspectorService();
const SOURCE_APP = 'APP-13';

interface AnalyzePhotoPayload {
  photoUrl: string;
  projectId: string;
  siteVisitId?: string;
  projectPhase: string;
  projectType: string;
}

interface AnalyzeVisitPhotosPayload {
  siteVisitId: string;
}

interface CompileSummaryPayload {
  siteVisitId: string;
}

type QAInspectorPayload =
  | AnalyzePhotoPayload
  | AnalyzeVisitPhotosPayload
  | CompileSummaryPayload;

async function processor(job: Job<QAInspectorPayload>): Promise<any> {
  const task = await prisma.automationTask.create({
    data: {
      type: `qa-inspector:${job.name}`,
      status: 'PROCESSING',
      sourceApp: SOURCE_APP,
      payload: job.data as any,
      startedAt: new Date(),
    },
  });

  try {
    let result: any;

    switch (job.name) {
      case 'analyze-photo': {
        const payload = job.data as AnalyzePhotoPayload;
        const qaResultId = await service.analyzePhoto({
          photoUrl: payload.photoUrl,
          projectId: payload.projectId,
          siteVisitId: payload.siteVisitId,
          projectPhase: payload.projectPhase,
          projectType: payload.projectType,
        });
        result = { qaResultId, projectId: payload.projectId };
        break;
      }

      case 'analyze-visit-photos': {
        const payload = job.data as AnalyzeVisitPhotosPayload;
        const summary = await service.analyzeSiteVisitPhotos(
          payload.siteVisitId,
        );
        result = summary;
        break;
      }

      case 'compile-summary': {
        const payload = job.data as CompileSummaryPayload;
        await service.compileSiteVisitSummary(payload.siteVisitId);
        result = { siteVisitId: payload.siteVisitId, compiled: true };
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

export const qaInspectorWorker = createWorker<QAInspectorPayload>(
  QUEUE_NAMES.QA_INSPECTOR,
  processor,
  {
    concurrency: 3,
    limiter: { max: 15, duration: 60000 }, // 15 per minute
  },
);
