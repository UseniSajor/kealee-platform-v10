import { createQueue, addJob, QUEUE_NAMES } from '../../infrastructure/queues.js';
import { eventBus } from '../../infrastructure/event-bus.js';
import { EVENT_TYPES } from '../../infrastructure/event-types.js';
import { PermitTrackerService } from './permit-tracker.service.js';

export { PermitTrackerService } from './permit-tracker.service.js';
export { permitTrackerWorker } from './permit-tracker.worker.js';

export const permitTrackerQueue = createQueue(QUEUE_NAMES.PERMIT_TRACKER);
export const permitTrackerService = new PermitTrackerService();

/**
 * Register event subscriptions for the Permit Tracker.
 */
export function registerPermitTrackerEvents(): void {
  // Permit submitted → begin tracking status
  eventBus.subscribe(EVENT_TYPES.PERMIT_SUBMITTED, async (event) => {
    if (event.data.permitId) {
      await addJob(permitTrackerQueue, 'check-status', {
        permitId: event.data.permitId,
      });
    }
  });

  // Project activated → check if permits need review
  eventBus.subscribe(EVENT_TYPES.PROJECT_ACTIVATED, async (event) => {
    if (event.data.permitId) {
      await addJob(permitTrackerQueue, 'ai-review', {
        permitId: event.data.permitId,
      });
    }
  });

  // Daily cron: check status for all submitted permits (8am)
  permitTrackerQueue.add(
    'check-submitted',
    {},
    {
      repeat: { pattern: '0 8 * * *' }, // Daily at 8am
    },
  ).catch((err) => {
    console.error('[PermitTracker] Failed to add status check cron:', err.message);
  });

  // Daily cron: check permit expirations (9am)
  permitTrackerQueue.add(
    'check-expirations',
    {},
    {
      repeat: { pattern: '0 9 * * *' }, // Daily at 9am
    },
  ).catch((err) => {
    console.error('[PermitTracker] Failed to add expiration cron:', err.message);
  });

  console.log('[PermitTracker] Event subscriptions registered');
}
