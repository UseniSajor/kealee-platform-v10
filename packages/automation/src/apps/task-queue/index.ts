import { createQueue, addJob, QUEUE_NAMES } from '../../infrastructure/queues.js';
import { eventBus } from '../../infrastructure/event-bus.js';
import { EVENT_TYPES } from '../../infrastructure/event-types.js';
import { TaskQueueService } from './task-queue.service.js';

export { TaskQueueService } from './task-queue.service.js';
export { taskQueueWorker } from './task-queue.worker.js';
export type { ProjectType } from './task-templates.js';
export { TASK_TEMPLATES, getPhasesForType } from './task-templates.js';

export const taskQueueQueue = createQueue(QUEUE_NAMES.TASK_QUEUE);
export const taskQueueService = new TaskQueueService();

/**
 * Register event subscriptions for the Task Queue Manager.
 */
export function registerTaskQueueEvents(): void {
  // project.activated → create project tasks
  eventBus.subscribe(EVENT_TYPES.PROJECT_ACTIVATED, async (event) => {
    if (event.projectId) {
      // Default to RENOVATION if project type is not specified
      const projectType = event.data.projectType ?? 'RENOVATION';
      await addJob(taskQueueQueue, 'create-project-tasks', {
        projectId: event.projectId,
        projectType,
      });
    }
  });

  // project.milestone.completed → attempt phase advance
  eventBus.subscribe(EVENT_TYPES.MILESTONE_COMPLETED, async (event) => {
    if (event.projectId) {
      await addJob(taskQueueQueue, 'advance-phase', {
        projectId: event.projectId,
      });
    }
  });

  // contract.signed → create project tasks (if not already created)
  eventBus.subscribe(EVENT_TYPES.CONTRACT_SIGNED, async (event) => {
    if (event.projectId) {
      const projectType = event.data.projectType ?? 'RENOVATION';
      await addJob(taskQueueQueue, 'create-project-tasks', {
        projectId: event.projectId,
        projectType,
      });
    }
  });

  // task.completed → check if phase can advance
  eventBus.subscribe(EVENT_TYPES.TASK_COMPLETED, async (event) => {
    if (event.projectId) {
      await addJob(taskQueueQueue, 'advance-phase', {
        projectId: event.projectId,
      });
    }
  });

  // Daily cron: check overdue tasks at 8am
  taskQueueQueue.add(
    'check-overdue',
    {},
    {
      repeat: { pattern: '0 8 * * *' }, // Daily at 8am
    },
  ).catch((err) => {
    console.error('[TaskQueue] Failed to add overdue cron:', err.message);
  });

  // Weekly cron: rebalance workload every Monday at 7am
  taskQueueQueue.add(
    'rebalance-workload',
    {},
    {
      repeat: { pattern: '0 7 * * 1' }, // Monday at 7am
    },
  ).catch((err) => {
    console.error('[TaskQueue] Failed to add rebalance cron:', err.message);
  });

  console.log('[TaskQueue] Event subscriptions registered');
}
