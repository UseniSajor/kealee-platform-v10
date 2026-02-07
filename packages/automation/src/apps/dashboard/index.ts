import { createQueue, QUEUE_NAMES } from '../../infrastructure/queues.js';
import { DashboardService } from './dashboard.service.js';

export { DashboardService } from './dashboard.service.js';
export { dashboardWorker } from './dashboard.worker.js';

export const dashboardQueue = createQueue(QUEUE_NAMES.DASHBOARD);
export const dashboardService = new DashboardService();

/**
 * Register scheduled jobs for the Dashboard Monitor.
 *
 * APP-15 is a monitoring-only app — it does NOT subscribe to events.
 * Instead it polls queue metrics on a cron schedule.
 */
export function registerDashboardJobs(): void {
  // Collect health metrics every 60 seconds
  dashboardQueue.add(
    'collect-metrics',
    {},
    {
      repeat: { every: 60_000 }, // Every 60 seconds
      jobId: 'dashboard-collect-metrics-repeat',
    },
  ).catch((err) => {
    console.error('[Dashboard] Failed to add collect-metrics cron:', err.message);
  });

  // Cleanup old metrics daily at 3am
  dashboardQueue.add(
    'cleanup-old-metrics',
    { retentionDays: 30 },
    {
      repeat: { pattern: '0 3 * * *' }, // Daily at 3am
      jobId: 'dashboard-cleanup-repeat',
    },
  ).catch((err) => {
    console.error('[Dashboard] Failed to add cleanup cron:', err.message);
  });

  console.log('[Dashboard] Scheduled jobs registered (metrics every 60s, cleanup daily 3am)');
}
