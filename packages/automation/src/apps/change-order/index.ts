import { createQueue, addJob, QUEUE_NAMES } from '../../infrastructure/queues.js';
import { eventBus } from '../../infrastructure/event-bus.js';
import { EVENT_TYPES } from '../../infrastructure/event-types.js';
import { ChangeOrderService } from './change-order.service.js';

export { ChangeOrderService } from './change-order.service.js';
export { changeOrderWorker } from './change-order.worker.js';

export const changeOrderQueue = createQueue(QUEUE_NAMES.CHANGE_ORDER);
export const changeOrderService = new ChangeOrderService();

/**
 * Register event subscriptions for the Change Order Processor.
 */
export function registerChangeOrderEvents(): void {
  // Direct change order request
  eventBus.subscribe(EVENT_TYPES.CHANGE_ORDER_REQUESTED, async (event) => {
    // Only generate if not already a CO (avoid loop from our own publish)
    if (event.sourceApp === 'APP-03') return;

    if (event.projectId) {
      await addJob(changeOrderQueue, 'generate', {
        projectId: event.projectId,
        title: event.data.title ?? 'Change Order',
        description: event.data.description ?? event.data.reason ?? '',
        reason: event.data.reason ?? 'UNFORESEEN_CONDITIONS',
        requestedBy: event.userId,
      });
    }
  });

  // Inspection failure may trigger a change order assessment
  eventBus.subscribe(EVENT_TYPES.INSPECTION_FAILED, async (event) => {
    if (
      event.projectId &&
      event.data.corrections &&
      event.data.corrections.length > 0
    ) {
      const corrections = event.data.corrections as Array<{
        description: string;
        severity: string;
      }>;
      const hasCritical = corrections.some(
        (c) => c.severity === 'CRITICAL' || c.severity === 'HIGH',
      );

      if (hasCritical) {
        await addJob(changeOrderQueue, 'generate', {
          projectId: event.projectId,
          title: `Inspection Corrections - ${event.data.type ?? 'General'}`,
          description: corrections.map((c) => c.description).join('; '),
          reason: 'CODE_COMPLIANCE',
          requestedBy: 'system',
        });
      }
    }
  });

  console.log('[ChangeOrder] Event subscriptions registered');
}
