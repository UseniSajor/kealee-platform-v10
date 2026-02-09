import { createQueue, QUEUE_NAMES } from '../../infrastructure/queues.js';
import { DashboardService } from './dashboard.service.js';

export { DashboardService } from './dashboard.service.js';
export { dashboardWorker } from './dashboard.worker.js';

export const dashboardQueue = createQueue(QUEUE_NAMES.DASHBOARD);
export const dashboardService = new DashboardService();

/**
 * Register the Dashboard Monitor.
 *
 * APP-15 is a monitoring-only app — it does NOT subscribe to events.
 * All cron jobs (collect-metrics, cleanup-old-metrics) are registered
 * centrally in infrastructure/cron.ts.
 */
export function registerDashboardJobs(): void {
  console.log('[Dashboard] Registered (crons managed by infrastructure/cron.ts)');
}
