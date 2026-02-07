import { PrismaClient } from '@prisma/client';
import type { Job } from 'bullmq';
import { createWorker, QUEUE_NAMES } from '../../infrastructure/queues.js';
import { VisitSchedulerService } from './visit-scheduler.service.js';

const prisma = new PrismaClient();
const service = new VisitSchedulerService();
const SOURCE_APP = 'APP-02';

interface ScheduleWeeklyPayload {
  pmId: string;
}

interface ScheduleMilestonePayload {
  projectId: string;
  milestoneId: string;
}

interface ScheduleWalkthroughPayload {
  projectId: string;
  requestedDate?: string; // ISO string
}

interface CompleteVisitPayload {
  visitId: string;
  notes?: string;
  photos?: string[];
  checklist?: Record<string, any>;
}

type VisitSchedulerPayload =
  | ScheduleWeeklyPayload
  | ScheduleMilestonePayload
  | ScheduleWalkthroughPayload
  | CompleteVisitPayload;

async function processor(job: Job<VisitSchedulerPayload>): Promise<any> {
  const task = await prisma.automationTask.create({
    data: {
      type: `visit-scheduler:${job.name}`,
      status: 'PROCESSING',
      sourceApp: SOURCE_APP,
      payload: job.data as any,
      startedAt: new Date(),
    },
  });

  try {
    let result: any;

    switch (job.name) {
      case 'schedule-weekly': {
        const payload = job.data as ScheduleWeeklyPayload;
        const visitIds = await service.scheduleWeeklyVisits(payload.pmId);
        result = { pmId: payload.pmId, scheduledCount: visitIds.length, visitIds };
        break;
      }

      case 'schedule-milestone': {
        const payload = job.data as ScheduleMilestonePayload;
        const visitId = await service.scheduleMilestoneVisit(
          payload.projectId,
          payload.milestoneId,
        );
        result = { visitId };
        break;
      }

      case 'schedule-walkthrough': {
        const payload = job.data as ScheduleWalkthroughPayload;
        const visitId = await service.scheduleClientWalkthrough(
          payload.projectId,
          payload.requestedDate ? new Date(payload.requestedDate) : undefined,
        );
        result = { visitId };
        break;
      }

      case 'complete-visit': {
        const payload = job.data as CompleteVisitPayload;
        await service.completeVisit(payload.visitId, {
          notes: payload.notes,
          photos: payload.photos,
          checklist: payload.checklist,
        });
        result = { visitId: payload.visitId, completed: true };
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

export const visitSchedulerWorker = createWorker<VisitSchedulerPayload>(
  QUEUE_NAMES.VISIT_SCHEDULER,
  processor,
  { concurrency: 3 },
);
