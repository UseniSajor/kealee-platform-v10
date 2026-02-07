import { PrismaClient } from '@prisma/client';
import { createQueue, addJob, QUEUE_NAMES } from '../../infrastructure/queues.js';
import { eventBus } from '../../infrastructure/event-bus.js';
import { EVENT_TYPES } from '../../infrastructure/event-types.js';
import { VisitSchedulerService } from './visit-scheduler.service.js';

export { VisitSchedulerService } from './visit-scheduler.service.js';
export { visitSchedulerWorker } from './visit-scheduler.worker.js';

const prisma = new PrismaClient();

export const visitSchedulerQueue = createQueue(QUEUE_NAMES.VISIT_SCHEDULER);
export const visitSchedulerService = new VisitSchedulerService();

/**
 * Register event subscriptions for the Visit Scheduler.
 * Call this once during application startup.
 */
export function registerVisitSchedulerEvents(): void {
  // When a project is activated, schedule the first visit + weekly cadence
  eventBus.subscribe(EVENT_TYPES.PROJECT_ACTIVATED, async (event) => {
    if (event.data.pmId) {
      await addJob(visitSchedulerQueue, 'schedule-weekly', {
        pmId: event.data.pmId,
      });
    }
  });

  // When a milestone is completed, schedule a milestone visit
  eventBus.subscribe(EVENT_TYPES.MILESTONE_COMPLETED, async (event) => {
    if (event.projectId && event.data.milestoneId) {
      await addJob(visitSchedulerQueue, 'schedule-milestone', {
        projectId: event.projectId,
        milestoneId: event.data.milestoneId,
      });
    }
  });

  // Weekly cron: schedule visits for all active PMs (every Monday at 6am)
  visitSchedulerQueue.add(
    'schedule-weekly-cron',
    {},
    {
      repeat: { pattern: '0 6 * * 1' }, // Monday 6am
    },
  ).catch((err) => {
    console.error('[VisitScheduler] Failed to add cron job:', err.message);
  });

  console.log('[VisitScheduler] Event subscriptions registered');
}

/**
 * Cron handler: schedule weekly visits for all active PMs.
 * Called by the repeatable 'schedule-weekly-cron' job.
 */
export async function scheduleWeeklyForAllPMs(): Promise<void> {
  const activePMs = await prisma.projectManager.findMany({
    where: { removedAt: null },
    select: { userId: true },
    distinct: ['userId'],
  });

  for (const pm of activePMs) {
    await addJob(visitSchedulerQueue, 'schedule-weekly', {
      pmId: pm.userId,
    });
  }
}
