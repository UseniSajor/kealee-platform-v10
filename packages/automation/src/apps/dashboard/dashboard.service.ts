import { PrismaClient } from '@prisma/client';
import { createQueue, QUEUE_NAMES } from '../../infrastructure/queues.js';
import type { Queue } from 'bullmq';

const prisma = new PrismaClient();

/**
 * Map of appId → queue name for health monitoring.
 */
const APP_QUEUE_MAP: Record<string, string> = {
  'APP-01': QUEUE_NAMES.BID_ENGINE,
  'APP-02': QUEUE_NAMES.VISIT_SCHEDULER,
  'APP-03': QUEUE_NAMES.CHANGE_ORDER,
  'APP-04': QUEUE_NAMES.REPORT_GENERATOR,
  'APP-05': QUEUE_NAMES.PERMIT_TRACKER,
  'APP-06': QUEUE_NAMES.INSPECTION,
  'APP-07': QUEUE_NAMES.BUDGET_TRACKER,
  'APP-08': QUEUE_NAMES.COMMUNICATION,
  'APP-09': QUEUE_NAMES.TASK_QUEUE,
  'APP-10': QUEUE_NAMES.DOCUMENT_GEN,
  'APP-11': QUEUE_NAMES.PREDICTIVE,
  'APP-12': QUEUE_NAMES.SMART_SCHEDULER,
  'APP-13': QUEUE_NAMES.QA_INSPECTOR,
  'APP-14': QUEUE_NAMES.DECISION_SUPPORT,
};

const APP_NAMES: Record<string, string> = {
  'APP-01': 'Bid Engine',
  'APP-02': 'Visit Scheduler',
  'APP-03': 'Change Order Processor',
  'APP-04': 'Report Generator',
  'APP-05': 'Permit Tracker',
  'APP-06': 'Inspection Coordinator',
  'APP-07': 'Budget Tracker',
  'APP-08': 'Communication Hub',
  'APP-09': 'Task Queue Manager',
  'APP-10': 'Document Generator',
  'APP-11': 'Predictive Engine',
  'APP-12': 'Smart Scheduler',
  'APP-13': 'QA Inspector',
  'APP-14': 'Decision Support',
  'APP-15': 'Dashboard Monitor',
};

interface QueueMetrics {
  active: number;
  waiting: number;
  delayed: number;
  failed: number;
  completed: number;
}

async function getQueueMetrics(queueName: string): Promise<QueueMetrics> {
  try {
    const queue = createQueue(queueName);
    const [active, waiting, delayed, failed, completed] = await Promise.all([
      queue.getActiveCount(),
      queue.getWaitingCount(),
      queue.getDelayedCount(),
      queue.getFailedCount(),
      queue.getCompletedCount(),
    ]);
    return { active, waiting, delayed, failed, completed };
  } catch {
    return { active: 0, waiting: 0, delayed: 0, failed: 0, completed: 0 };
  }
}

export class DashboardService {
  // -----------------------------------------------------------------------
  // collectHealthMetrics
  // -----------------------------------------------------------------------

  async collectHealthMetrics(): Promise<number> {
    let metricsCollected = 0;

    for (const [appId, queueName] of Object.entries(APP_QUEUE_MAP)) {
      try {
        const metrics = await getQueueMetrics(queueName);

        const jobsTotal = metrics.completed + metrics.failed;
        const jobsSuccess = metrics.completed;
        const jobsFailed = metrics.failed;
        const errorRate =
          jobsTotal > 0 ? jobsFailed / jobsTotal : 0;
        const queueDepth = metrics.active + metrics.waiting + metrics.delayed;

        // Estimate avg duration from recent completed AutomationTasks
        const recentTasks = await prisma.automationTask.findMany({
          where: {
            sourceApp: appId,
            status: 'COMPLETED',
            startedAt: { not: null },
            completedAt: { not: null },
          },
          select: { startedAt: true, completedAt: true },
          orderBy: { completedAt: 'desc' },
          take: 50,
        });

        let avgDuration = 0;
        if (recentTasks.length > 0) {
          const durations = recentTasks.map((t) =>
            t.completedAt!.getTime() - t.startedAt!.getTime(),
          );
          avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
        }

        // Create AppHealthMetric record
        await prisma.appHealthMetric.create({
          data: {
            appId,
            jobsTotal,
            jobsSuccess,
            jobsFailed,
            avgDuration,
            queueDepth,
            errorRate,
            metadata: {
              active: metrics.active,
              waiting: metrics.waiting,
              delayed: metrics.delayed,
              queueName,
            },
          },
        });

        metricsCollected++;

        // Alert on high error rate
        if (errorRate > 0.1 && jobsTotal > 0) {
          console.warn(
            `[Dashboard] ALERT: ${APP_NAMES[appId]} error rate ${(errorRate * 100).toFixed(1)}% (${jobsFailed}/${jobsTotal})`,
          );
        }

        // Alert on deep queue
        if (queueDepth > 100) {
          console.warn(
            `[Dashboard] ALERT: ${APP_NAMES[appId]} queue depth ${queueDepth}`,
          );
        }
      } catch (err) {
        console.error(
          `[Dashboard] Failed to collect metrics for ${appId}:`,
          (err as Error).message,
        );
      }
    }

    console.log(`[Dashboard] Collected metrics for ${metricsCollected} apps`);
    return metricsCollected;
  }

  // -----------------------------------------------------------------------
  // getSystemStatus
  // -----------------------------------------------------------------------

  async getSystemStatus(): Promise<{
    apps: Array<{
      appId: string;
      name: string;
      status: 'healthy' | 'degraded' | 'down';
      metrics: {
        jobsTotal: number;
        jobsSuccess: number;
        jobsFailed: number;
        avgDuration: number;
        queueDepth: number;
        errorRate: number;
      } | null;
      lastActivity: string | null;
    }>;
    alerts: Array<{
      appId: string;
      appName: string;
      type: 'error_rate' | 'queue_depth' | 'no_activity';
      message: string;
      timestamp: string;
    }>;
    summary: {
      totalJobsToday: number;
      avgProcessingTime: number;
      successRate: number;
      activeWorkers: number;
    };
  }> {
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000);
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const allAppIds = Object.keys(APP_NAMES);

    // Get latest metric for each app
    const latestMetrics = await Promise.all(
      allAppIds.map(async (appId) => {
        const metric = await prisma.appHealthMetric.findFirst({
          where: { appId },
          orderBy: { timestamp: 'desc' },
        });
        return { appId, metric };
      }),
    );

    // Get today's aggregate counts
    const todayTasks = await prisma.automationTask.findMany({
      where: { startedAt: { gte: twentyFourHoursAgo } },
      select: {
        sourceApp: true,
        status: true,
        startedAt: true,
        completedAt: true,
      },
    });

    const todayByApp = new Map<string, { total: number; success: number; failed: number; durations: number[] }>();
    for (const t of todayTasks) {
      const app = t.sourceApp ?? 'UNKNOWN';
      const entry = todayByApp.get(app) ?? { total: 0, success: 0, failed: 0, durations: [] };
      entry.total++;
      if (t.status === 'COMPLETED') entry.success++;
      if (t.status === 'FAILED') entry.failed++;
      if (t.startedAt && t.completedAt) {
        entry.durations.push(t.completedAt.getTime() - t.startedAt.getTime());
      }
      todayByApp.set(app, entry);
    }

    const apps = allAppIds.map((appId) => {
      const latest = latestMetrics.find((m) => m.appId === appId)?.metric;
      const todayData = todayByApp.get(appId);

      let status: 'healthy' | 'degraded' | 'down' = 'healthy';
      if (latest) {
        const errorRate = Number(latest.errorRate);
        const isStale = latest.timestamp < tenMinAgo;
        if (errorRate > 0.15 || isStale) status = 'down';
        else if (errorRate > 0.05) status = 'degraded';
      } else {
        // No metrics ever collected — treat as healthy (new app)
        status = 'healthy';
      }

      return {
        appId,
        name: APP_NAMES[appId] ?? appId,
        status,
        metrics: latest
          ? {
              jobsTotal: todayData?.total ?? latest.jobsTotal,
              jobsSuccess: todayData?.success ?? latest.jobsSuccess,
              jobsFailed: todayData?.failed ?? latest.jobsFailed,
              avgDuration: Number(latest.avgDuration),
              queueDepth: latest.queueDepth,
              errorRate: Number(latest.errorRate),
            }
          : null,
        lastActivity: latest?.timestamp.toISOString() ?? null,
      };
    });

    // Build alerts
    const alerts: Array<{
      appId: string;
      appName: string;
      type: 'error_rate' | 'queue_depth' | 'no_activity';
      message: string;
      timestamp: string;
    }> = [];

    for (const app of apps) {
      if (app.metrics) {
        if (app.metrics.errorRate > 0.1) {
          alerts.push({
            appId: app.appId,
            appName: app.name,
            type: 'error_rate',
            message: `Error rate ${(app.metrics.errorRate * 100).toFixed(1)}%`,
            timestamp: app.lastActivity ?? new Date().toISOString(),
          });
        }
        if (app.metrics.queueDepth > 100) {
          alerts.push({
            appId: app.appId,
            appName: app.name,
            type: 'queue_depth',
            message: `Queue depth: ${app.metrics.queueDepth} jobs`,
            timestamp: app.lastActivity ?? new Date().toISOString(),
          });
        }
      }
      if (app.status === 'down' && app.lastActivity && new Date(app.lastActivity) < tenMinAgo) {
        alerts.push({
          appId: app.appId,
          appName: app.name,
          type: 'no_activity',
          message: 'No activity in last 10 minutes',
          timestamp: app.lastActivity,
        });
      }
    }

    // Summary
    let totalJobsToday = 0;
    let totalSuccess = 0;
    let allDurations: number[] = [];
    let activeWorkers = 0;

    for (const [, data] of todayByApp) {
      totalJobsToday += data.total;
      totalSuccess += data.success;
      allDurations = allDurations.concat(data.durations);
    }

    for (const app of apps) {
      if (app.metrics) {
        const meta = (await prisma.appHealthMetric.findFirst({
          where: { appId: app.appId },
          orderBy: { timestamp: 'desc' },
          select: { metadata: true },
        }))?.metadata as any;
        if (meta?.active) activeWorkers += meta.active;
      }
    }

    const avgProcessingTime =
      allDurations.length > 0
        ? Math.round(allDurations.reduce((a, b) => a + b, 0) / allDurations.length)
        : 0;
    const successRate =
      totalJobsToday > 0 ? totalSuccess / totalJobsToday : 1;

    return {
      apps,
      alerts,
      summary: {
        totalJobsToday,
        avgProcessingTime,
        successRate,
        activeWorkers,
      },
    };
  }

  // -----------------------------------------------------------------------
  // getAppDetail
  // -----------------------------------------------------------------------

  async getAppDetail(appId: string): Promise<{
    appId: string;
    name: string;
    status: 'healthy' | 'degraded' | 'down';
    metrics24h: Array<{
      timestamp: string;
      jobsTotal: number;
      jobsSuccess: number;
      jobsFailed: number;
      avgDuration: number;
      queueDepth: number;
      errorRate: number;
    }>;
    recentJobs: Array<{
      id: string;
      type: string;
      status: string;
      startedAt: string | null;
      completedAt: string | null;
      duration: number | null;
      error: string | null;
    }>;
    queueState: QueueMetrics | null;
  }> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [metrics, recentJobs] = await Promise.all([
      prisma.appHealthMetric.findMany({
        where: { appId, timestamp: { gte: twentyFourHoursAgo } },
        orderBy: { timestamp: 'asc' },
      }),
      prisma.automationTask.findMany({
        where: { sourceApp: appId },
        orderBy: { startedAt: 'desc' },
        take: 50,
        select: {
          id: true,
          type: true,
          status: true,
          startedAt: true,
          completedAt: true,
          error: true,
        },
      }),
    ]);

    // Get current queue state
    const queueName = APP_QUEUE_MAP[appId];
    let queueState: QueueMetrics | null = null;
    if (queueName) {
      queueState = await getQueueMetrics(queueName);
    }

    // Determine status from latest metric
    const latest = metrics.length > 0 ? metrics[metrics.length - 1] : null;
    let status: 'healthy' | 'degraded' | 'down' = 'healthy';
    if (latest) {
      const errorRate = Number(latest.errorRate);
      if (errorRate > 0.15) status = 'down';
      else if (errorRate > 0.05) status = 'degraded';
    }

    return {
      appId,
      name: APP_NAMES[appId] ?? appId,
      status,
      metrics24h: metrics.map((m) => ({
        timestamp: m.timestamp.toISOString(),
        jobsTotal: m.jobsTotal,
        jobsSuccess: m.jobsSuccess,
        jobsFailed: m.jobsFailed,
        avgDuration: Number(m.avgDuration),
        queueDepth: m.queueDepth,
        errorRate: Number(m.errorRate),
      })),
      recentJobs: recentJobs.map((j) => ({
        id: j.id,
        type: j.type,
        status: j.status,
        startedAt: j.startedAt?.toISOString() ?? null,
        completedAt: j.completedAt?.toISOString() ?? null,
        duration:
          j.startedAt && j.completedAt
            ? j.completedAt.getTime() - j.startedAt.getTime()
            : null,
        error: j.error,
      })),
      queueState,
    };
  }

  // -----------------------------------------------------------------------
  // pauseApp / resumeApp
  // -----------------------------------------------------------------------

  async pauseApp(appId: string): Promise<boolean> {
    const queueName = APP_QUEUE_MAP[appId];
    if (!queueName) return false;
    try {
      const queue = createQueue(queueName);
      await queue.pause();
      console.log(`[Dashboard] Paused ${APP_NAMES[appId]} (${queueName})`);
      return true;
    } catch (err) {
      console.error(`[Dashboard] Failed to pause ${appId}:`, (err as Error).message);
      return false;
    }
  }

  async resumeApp(appId: string): Promise<boolean> {
    const queueName = APP_QUEUE_MAP[appId];
    if (!queueName) return false;
    try {
      const queue = createQueue(queueName);
      await queue.resume();
      console.log(`[Dashboard] Resumed ${APP_NAMES[appId]} (${queueName})`);
      return true;
    } catch (err) {
      console.error(`[Dashboard] Failed to resume ${appId}:`, (err as Error).message);
      return false;
    }
  }

  // -----------------------------------------------------------------------
  // retryFailedJobs
  // -----------------------------------------------------------------------

  async retryFailedJobs(appId: string): Promise<number> {
    const queueName = APP_QUEUE_MAP[appId];
    if (!queueName) return 0;

    try {
      const queue = createQueue(queueName);
      const failedJobs = await queue.getFailed(0, 100);
      let retried = 0;

      for (const job of failedJobs) {
        await job.retry();
        retried++;
      }

      console.log(
        `[Dashboard] Retried ${retried} failed jobs for ${APP_NAMES[appId]}`,
      );
      return retried;
    } catch (err) {
      console.error(`[Dashboard] Failed to retry jobs for ${appId}:`, (err as Error).message);
      return 0;
    }
  }
}
