import { createQueue, addJob, QUEUE_NAMES } from '../../infrastructure/queues.js';
import { eventBus } from '../../infrastructure/event-bus.js';
import { EVENT_TYPES } from '../../infrastructure/event-types.js';
import { ReportGeneratorService } from './report-generator.service.js';

export { ReportGeneratorService } from './report-generator.service.js';
export { reportGeneratorWorker } from './report-generator.worker.js';

export const reportGeneratorQueue = createQueue(QUEUE_NAMES.REPORT_GENERATOR);
export const reportGeneratorService = new ReportGeneratorService();

/**
 * Register event subscriptions for the Report Generator.
 */
export function registerReportGeneratorEvents(): void {
  // Milestone completed → generate milestone report
  eventBus.subscribe(EVENT_TYPES.MILESTONE_COMPLETED, async (event) => {
    if (event.projectId && event.data.milestoneId) {
      await addJob(reportGeneratorQueue, 'generate-milestone', {
        projectId: event.projectId,
        milestoneId: event.data.milestoneId,
      });
    }
  });

  // Project completed → generate closeout package
  eventBus.subscribe(EVENT_TYPES.PROJECT_COMPLETED, async (event) => {
    if (event.projectId) {
      await addJob(reportGeneratorQueue, 'generate-closeout', {
        projectId: event.projectId,
      });
    }
  });

  // NOTE: Weekly cron (weekly-cron) is registered centrally in infrastructure/cron.ts

  console.log('[ReportGenerator] Event subscriptions registered');
}
