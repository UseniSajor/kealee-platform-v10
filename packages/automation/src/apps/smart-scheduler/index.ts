import { createQueue, addJob, QUEUE_NAMES } from '../../infrastructure/queues.js';
import { eventBus } from '../../infrastructure/event-bus.js';
import { EVENT_TYPES } from '../../infrastructure/event-types.js';
import { SmartSchedulerService } from './smart-scheduler.service.js';

export { SmartSchedulerService } from './smart-scheduler.service.js';
export { smartSchedulerWorker } from './smart-scheduler.worker.js';

export const smartSchedulerQueue = createQueue(QUEUE_NAMES.SMART_SCHEDULER);
export const smartSchedulerService = new SmartSchedulerService();

/**
 * Register event subscriptions for the Smart Scheduler.
 */
export function registerSmartSchedulerEvents(): void {
  // project.activated → initial schedule optimization
  eventBus.subscribe(EVENT_TYPES.PROJECT_ACTIVATED, async (event) => {
    if (event.projectId) {
      await addJob(smartSchedulerQueue, 'optimize-schedule', {
        projectId: event.projectId,
      });
    }
  });

  // schedule.disruption → handle disruption and re-optimize
  eventBus.subscribe(EVENT_TYPES.SCHEDULE_DISRUPTION, async (event) => {
    if (event.projectId && event.data.disruptionType) {
      await addJob(smartSchedulerQueue, 'handle-disruption', {
        projectId: event.projectId,
        disruption: {
          type: event.data.disruptionType ?? 'unknown',
          description: event.data.description ?? event.data.assessment ?? 'Schedule disruption detected',
          affectedTaskIds: event.data.affectedTaskIds ?? [],
        },
      });
    }
  });

  // change_order.approved → re-optimize (scope change affects schedule)
  eventBus.subscribe(EVENT_TYPES.CHANGE_ORDER_APPROVED, async (event) => {
    if (event.projectId) {
      await addJob(smartSchedulerQueue, 'optimize-schedule', {
        projectId: event.projectId,
      });
    }
  });

  // inspection.failed → re-optimize (correction work added)
  eventBus.subscribe(EVENT_TYPES.INSPECTION_FAILED, async (event) => {
    if (event.projectId) {
      await addJob(smartSchedulerQueue, 'optimize-schedule', {
        projectId: event.projectId,
      });
    }
  });

  // NOTE: Weekly cron (optimize-all) is registered centrally in infrastructure/cron.ts

  console.log('[SmartScheduler] Event subscriptions registered');
}
