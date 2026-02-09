import { createQueue, addJob, QUEUE_NAMES } from '../../infrastructure/queues.js';
import { eventBus } from '../../infrastructure/event-bus.js';
import { EVENT_TYPES } from '../../infrastructure/event-types.js';
import { VisitSchedulerService } from './visit-scheduler.service.js';

export { VisitSchedulerService } from './visit-scheduler.service.js';
export { visitSchedulerWorker } from './visit-scheduler.worker.js';

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

  // NOTE: Weekly cron (schedule-weekly-all) is registered centrally in infrastructure/cron.ts

  console.log('[VisitScheduler] Event subscriptions registered');
}
