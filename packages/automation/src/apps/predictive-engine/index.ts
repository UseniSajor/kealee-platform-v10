import { createQueue, addJob, QUEUE_NAMES } from '../../infrastructure/queues.js';
import { eventBus } from '../../infrastructure/event-bus.js';
import { EVENT_TYPES } from '../../infrastructure/event-types.js';
import { PredictiveEngineService } from './predictive-engine.service.js';

export { PredictiveEngineService } from './predictive-engine.service.js';
export { predictiveEngineWorker } from './predictive-engine.worker.js';

export const predictiveEngineQueue = createQueue(QUEUE_NAMES.PREDICTIVE);
export const predictiveEngineService = new PredictiveEngineService();

/**
 * Register event subscriptions for the Predictive Engine.
 */
export function registerPredictiveEngineEvents(): void {
  // budget.overrun_detected → immediate re-analysis of budget risk
  eventBus.subscribe(EVENT_TYPES.BUDGET_OVERRUN_DETECTED, async (event) => {
    if (event.projectId) {
      await addJob(predictiveEngineQueue, 'analyze-project', {
        projectId: event.projectId,
      });
    }
  });

  // inspection.failed → re-analyze affected project
  eventBus.subscribe(EVENT_TYPES.INSPECTION_FAILED, async (event) => {
    if (event.projectId) {
      await addJob(predictiveEngineQueue, 'analyze-project', {
        projectId: event.projectId,
      });
    }
  });

  // change_order.approved → re-analyze budget risk
  eventBus.subscribe(EVENT_TYPES.CHANGE_ORDER_APPROVED, async (event) => {
    if (event.projectId) {
      await addJob(predictiveEngineQueue, 'analyze-project', {
        projectId: event.projectId,
      });
    }
  });

  // task.overdue → re-analyze schedule risk
  eventBus.subscribe(EVENT_TYPES.TASK_OVERDUE, async (event) => {
    if (event.projectId) {
      await addJob(predictiveEngineQueue, 'analyze-project', {
        projectId: event.projectId,
      });
    }
  });

  // Daily cron: analyze all active projects at 6am
  predictiveEngineQueue.add(
    'analyze-all',
    {},
    {
      repeat: { pattern: '0 6 * * *' }, // Daily at 6am
    },
  ).catch((err) => {
    console.error('[PredictiveEngine] Failed to add cron job:', err.message);
  });

  console.log('[PredictiveEngine] Event subscriptions registered');
}
