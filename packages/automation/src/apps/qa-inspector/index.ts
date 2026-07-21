import { createQueue, addJob, QUEUE_NAMES } from '../../infrastructure/queues.js';
import { eventBus } from '../../infrastructure/event-bus.js';
import { EVENT_TYPES } from '../../infrastructure/event-types.js';
import { QAInspectorService } from './qa-inspector.service.js';

export { QAInspectorService } from './qa-inspector.service.js';
export { qaInspectorWorker } from './qa-inspector.worker.js';

export const qaInspectorQueue = createQueue(QUEUE_NAMES.QA_INSPECTOR);
export const qaInspectorService = new QAInspectorService();

/**
 * Register event subscriptions for the QA Inspector.
 */
export function registerQAInspectorEvents(): void {
  // site_photo.uploaded → analyze individual photo
  eventBus.subscribe(EVENT_TYPES.SITE_PHOTO_UPLOADED, async (event) => {
    if (event.projectId && event.data.photoUrl) {
      await addJob(qaInspectorQueue, 'analyze-photo', {
        photoUrl: event.data.photoUrl,
        projectId: event.projectId,
        siteVisitId: event.data.siteVisitId ?? undefined,
        projectPhase: event.data.projectPhase ?? event.data.phase ?? 'GENERAL',
        projectType: event.data.projectType ?? 'RENOVATION',
      });
    }
  });

  // task.completed (site visit completion) → analyze all visit photos + compile summary
  eventBus.subscribe(EVENT_TYPES.TASK_COMPLETED, async (event) => {
    // Check if this is a completed site visit
    if (event.data.siteVisitId) {
      await addJob(qaInspectorQueue, 'analyze-visit-photos', {
        siteVisitId: event.data.siteVisitId,
      });

      // Queue summary compilation with a delay to allow photo analyses to complete
      await addJob(
        qaInspectorQueue,
        'compile-summary',
        { siteVisitId: event.data.siteVisitId },
        { delay: 120000 }, // 2 minutes after to let photo analyses finish
      );
    }
  });

  console.log('[QAInspector] Event subscriptions registered');
}
