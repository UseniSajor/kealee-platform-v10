/**
 * Centralized Cron Scheduler for the Command Center
 *
 * All time-based repeatable jobs are registered here using BullMQ's built-in
 * repeat feature. This ensures jobs survive worker restarts and run exactly
 * once even with multiple worker instances.
 *
 * Individual app index files should NOT register their own crons — this file
 * is the single source of truth for all scheduled work.
 */

import type { Queue } from 'bullmq';

import { dashboardQueue } from '../apps/dashboard/index.js';
import { predictiveEngineQueue } from '../apps/predictive-engine/index.js';
import { taskQueueQueue } from '../apps/task-queue/index.js';
import { permitTrackerQueue } from '../apps/permit-tracker/index.js';
import { budgetTrackerQueue } from '../apps/budget-tracker/index.js';
import { visitSchedulerQueue } from '../apps/visit-scheduler/index.js';
import { smartSchedulerQueue } from '../apps/smart-scheduler/index.js';
import { reportGeneratorQueue } from '../apps/report-generator/index.js';
import { inspectionQueue } from '../apps/inspection-coord/index.js';

// ── Types ──────────────────────────────────────────────────────────────────

interface CronDefinition {
  label: string;
  appId: string;
  queue: Queue;
  jobName: string;
  data: Record<string, any>;
  repeat: { pattern?: string; every?: number; tz?: string };
  jobId: string;
}

const TZ = 'America/New_York';

// ── Cron definitions ───────────────────────────────────────────────────────

const CRONS: CronDefinition[] = [
  // ═══ EVERY 60 SECONDS ════════════════════════════════════════════════════
  {
    label: 'APP-15 Dashboard: collect-health-metrics',
    appId: 'APP-15',
    queue: dashboardQueue,
    jobName: 'collect-metrics',
    data: {},
    repeat: { every: 60_000 },
    jobId: 'cron:collect-health-metrics',
  },

  // ═══ DAILY AT 3:00 AM EST ════════════════════════════════════════════════
  {
    label: 'APP-15 Dashboard: cleanup-old-metrics',
    appId: 'APP-15',
    queue: dashboardQueue,
    jobName: 'cleanup-old-metrics',
    data: { retentionDays: 30 },
    repeat: { pattern: '0 3 * * *', tz: TZ },
    jobId: 'cron:cleanup-old-metrics',
  },

  // ═══ DAILY AT 6:00 AM EST ════════════════════════════════════════════════
  {
    label: 'APP-11 Predictive Engine: analyze-all-projects',
    appId: 'APP-11',
    queue: predictiveEngineQueue,
    jobName: 'analyze-all',
    data: {},
    repeat: { pattern: '0 6 * * *', tz: TZ },
    jobId: 'cron:analyze-all-projects',
  },
  {
    label: 'APP-09 Task Queue: check-overdue-tasks',
    appId: 'APP-09',
    queue: taskQueueQueue,
    jobName: 'check-overdue',
    data: {},
    repeat: { pattern: '0 6 * * *', tz: TZ },
    jobId: 'cron:check-overdue-tasks',
  },
  {
    label: 'APP-05 Permit Tracker: check-all-permit-status',
    appId: 'APP-05',
    queue: permitTrackerQueue,
    jobName: 'check-submitted',
    data: {},
    repeat: { pattern: '0 6 * * *', tz: TZ },
    jobId: 'cron:check-all-permit-status',
  },
  {
    label: 'APP-05 Permit Tracker: check-permit-expirations',
    appId: 'APP-05',
    queue: permitTrackerQueue,
    jobName: 'check-expirations',
    data: {},
    repeat: { pattern: '0 6 * * *', tz: TZ },
    jobId: 'cron:check-permit-expirations',
  },
  {
    label: 'APP-07 Budget Tracker: daily-snapshots-all',
    appId: 'APP-07',
    queue: budgetTrackerQueue,
    jobName: 'daily-snapshots',
    data: {},
    repeat: { pattern: '0 6 * * *', tz: TZ },
    jobId: 'cron:daily-snapshots-all',
  },

  // ═══ EVERY MONDAY AT 6:00 AM EST ════════════════════════════════════════
  {
    label: 'APP-02 Visit Scheduler: schedule-weekly-visits-all',
    appId: 'APP-02',
    queue: visitSchedulerQueue,
    jobName: 'schedule-weekly-all',
    data: {},
    repeat: { pattern: '0 6 * * 1', tz: TZ },
    jobId: 'cron:schedule-weekly-visits-all',
  },
  {
    label: 'APP-09 Task Queue: weekly-workload-rebalance',
    appId: 'APP-09',
    queue: taskQueueQueue,
    jobName: 'rebalance-workload',
    data: {},
    repeat: { pattern: '0 6 * * 1', tz: TZ },
    jobId: 'cron:weekly-workload-rebalance',
  },

  // ═══ EVERY MONDAY AT 6:00 AM EST — cross-app chain ══════════════════════
  {
    label: 'Event Router: weekly-monday-chain',
    appId: 'EVENT-ROUTER',
    queue: dashboardQueue,
    jobName: 'weekly-monday-chain',
    data: {},
    repeat: { pattern: '0 6 * * 1', tz: TZ },
    jobId: 'cron:weekly-monday-chain',
  },

  // ═══ EVERY SUNDAY AT 10:00 PM EST ═══════════════════════════════════════
  {
    label: 'APP-12 Smart Scheduler: weekly-schedule-optimize-all',
    appId: 'APP-12',
    queue: smartSchedulerQueue,
    jobName: 'optimize-all',
    data: {},
    repeat: { pattern: '0 22 * * 0', tz: TZ },
    jobId: 'cron:weekly-schedule-optimize-all',
  },

  // ═══ EVERY FRIDAY AT 4:00 PM EST ════════════════════════════════════════
  {
    label: 'APP-04 Report Generator: generate-weekly-reports-all',
    appId: 'APP-04',
    queue: reportGeneratorQueue,
    jobName: 'weekly-cron',
    data: {},
    repeat: { pattern: '0 16 * * 5', tz: TZ },
    jobId: 'cron:generate-weekly-reports-all',
  },
  {
    label: 'Event Router: weekly-friday-chain',
    appId: 'EVENT-ROUTER',
    queue: dashboardQueue,
    jobName: 'weekly-friday-chain',
    data: {},
    repeat: { pattern: '0 16 * * 5', tz: TZ },
    jobId: 'cron:weekly-friday-chain',
  },

  // ═══ EVERY 6 HOURS ══════════════════════════════════════════════════════
  {
    label: 'APP-06 Inspection Coordinator: send-upcoming-reminders',
    appId: 'APP-06',
    queue: inspectionQueue,
    jobName: 'check-upcoming',
    data: { hoursAhead: 48 },
    repeat: { pattern: '0 */6 * * *', tz: TZ },
    jobId: 'cron:send-upcoming-reminders',
  },
];

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Register all repeatable cron jobs across the Command Center.
 *
 * Uses BullMQ's `repeat` option with explicit `jobId` to prevent duplicates
 * on restart. Safe to call multiple times — BullMQ deduplicates by jobId.
 */
export async function registerAllCrons(): Promise<void> {
  console.log('[Cron] Registering all cron jobs...');

  let registered = 0;
  let failed = 0;

  for (const cron of CRONS) {
    try {
      await cron.queue.add(cron.jobName, cron.data, {
        repeat: cron.repeat,
        jobId: cron.jobId,
      });

      const schedule = cron.repeat.pattern
        ? cron.repeat.pattern
        : `every ${cron.repeat.every! / 1000}s`;

      console.log(`[Cron]   ✓ ${cron.label} at ${schedule}`);
      registered++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[Cron]   ✗ ${cron.label} — ${message}`);
      failed++;
    }
  }

  console.log(
    `[Cron] Registration complete: ${registered} registered` +
      (failed > 0 ? `, ${failed} failed` : ''),
  );
}

/**
 * Remove all repeatable jobs from all queues.
 * Useful for shutdown, testing, or re-registration.
 */
export async function removeAllCrons(): Promise<void> {
  console.log('[Cron] Removing all cron jobs...');

  // Collect unique queues
  const queues = new Map<string, Queue>();
  for (const cron of CRONS) {
    queues.set(cron.queue.name, cron.queue);
  }

  let removed = 0;

  for (const [name, queue] of queues) {
    try {
      const repeatables = await queue.getRepeatableJobs();
      for (const job of repeatables) {
        await queue.removeRepeatableByKey(job.key);
        removed++;
      }
      if (repeatables.length > 0) {
        console.log(`[Cron]   ✓ ${name}: removed ${repeatables.length} repeatable(s)`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[Cron]   ✗ ${name}: ${message}`);
    }
  }

  console.log(`[Cron] Removal complete: ${removed} jobs removed`);
}

/**
 * List all registered repeatable jobs for diagnostics.
 */
export async function listAllCrons(): Promise<
  { queue: string; name: string; pattern: string; next: number | null }[]
> {
  const queues = new Map<string, Queue>();
  for (const cron of CRONS) {
    queues.set(cron.queue.name, cron.queue);
  }

  const results: { queue: string; name: string; pattern: string; next: number | null }[] = [];

  for (const [name, queue] of queues) {
    const repeatables = await queue.getRepeatableJobs();
    for (const job of repeatables) {
      results.push({
        queue: name,
        name: job.name,
        pattern: job.pattern ?? `every ${job.every}ms`,
        next: job.next ?? null,
      });
    }
  }

  return results;
}

/** Exported for testing/introspection */
export { CRONS };
