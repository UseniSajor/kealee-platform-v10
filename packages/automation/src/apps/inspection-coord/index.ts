import { createQueue, addJob, QUEUE_NAMES } from '../../infrastructure/queues.js';
import { eventBus } from '../../infrastructure/event-bus.js';
import { EVENT_TYPES } from '../../infrastructure/event-types.js';
import { InspectionCoordinatorService } from './inspection-coord.service.js';

export { InspectionCoordinatorService } from './inspection-coord.service.js';
export { inspectionCoordWorker } from './inspection-coord.worker.js';

export const inspectionQueue = createQueue(QUEUE_NAMES.INSPECTION);
export const inspectionCoordService = new InspectionCoordinatorService();

/**
 * Register event subscriptions for the Inspection Coordinator.
 * Call this once during application startup.
 */
export function registerInspectionCoordEvents(): void {
  // When a milestone is completed, schedule the next required inspection
  eventBus.subscribe(EVENT_TYPES.MILESTONE_COMPLETED, async (event) => {
    // Only schedule if not already triggered by an inspection itself
    if (event.data.triggeredByInspection) return;

    if (event.projectId && event.data.permitId) {
      await addJob(inspectionQueue, 'schedule-inspection', {
        projectId: event.projectId,
        type: event.data.inspectionType ?? 'SITE',
        permitId: event.data.permitId,
        milestoneId: event.data.milestoneId,
        requestedBy: event.userId ?? 'system',
      });
    }
  });

  // When a permit is approved, schedule the initial inspection
  eventBus.subscribe(EVENT_TYPES.PERMIT_APPROVED, async (event) => {
    if (event.projectId && event.data.permitId) {
      await addJob(inspectionQueue, 'schedule-inspection', {
        projectId: event.projectId,
        type: 'SITE',
        permitId: event.data.permitId,
        requestedBy: event.userId ?? 'system',
      });
    }
  });

  // Daily cron: check for inspections due in next 48 hours and send reminders
  inspectionQueue.add(
    'check-upcoming',
    { hoursAhead: 48 },
    {
      repeat: { pattern: '0 7 * * *' }, // Daily at 7am
    },
  ).catch((err) => {
    console.error('[InspectionCoord] Failed to add cron job:', err.message);
  });

  console.log('[InspectionCoord] Event subscriptions registered');
}
