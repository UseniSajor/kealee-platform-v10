/**
 * Worker Health Check & Monitoring
 *
 * Provides comprehensive health status for legacy worker service and all queues.
 * Compatible with Railway healthcheck probes and Sentry monitoring.
 */

import type { Worker, Queue } from 'bullmq';
import { logger } from './logger';

export interface QueueHealthStatus {
  [queueName: string]: {
    connected: boolean;
    size: number;
    activeJobs: number;
    failedJobs: number;
    stalledJobs: number;
  };
}

export interface WorkerHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number; // milliseconds since startup
  checks: {
    redisConnection: 'connected' | 'disconnected';
    databaseConnection: 'connected' | 'disconnected' | 'unknown';
    workersRunning: number;
    workersTotal: number;
  };
  queues: QueueHealthStatus;
  metrics: {
    totalActiveJobs: number;
    totalFailedJobs: number;
    totalStalledJobs: number;
    queueSize: number;
  };
}

let startTime = Date.now();
let isRedisConnected = false;
let isDatabaseConnected = false;

export function setHealthStartTime() {
  startTime = Date.now();
}

export function setRedisHealth(connected: boolean) {
  isRedisConnected = connected;
}

export function setDatabaseHealth(connected: boolean) {
  isDatabaseConnected = connected;
}

/**
 * Get comprehensive health status for worker service
 */
export async function getWorkerHealth(
  queues: Map<string, Queue>,
  workers: Map<string, Worker | null>
): Promise<WorkerHealthStatus> {
  const timestamp = new Date().toISOString();
  const uptime = Date.now() - startTime;

  const queueHealth: QueueHealthStatus = {};
  let totalActiveJobs = 0;
  let totalFailedJobs = 0;
  let totalStalledJobs = 0;
  let totalQueueSize = 0;

  // Get health for each queue
  for (const [queueName, queue] of queues) {
    try {
      const size = await (queue as any).count?.();
      const activeCount = await (queue as any).getActiveCount?.();
      const failedCount = await (queue as any).getFailedCount?.();
      const stalledCount = await (queue as any).getStalledCount?.();

      queueHealth[queueName] = {
        connected: true,
        size: size || 0,
        activeJobs: activeCount || 0,
        failedJobs: failedCount || 0,
        stalledJobs: stalledCount || 0,
      };

      totalQueueSize += size || 0;
      totalActiveJobs += activeCount || 0;
      totalFailedJobs += failedCount || 0;
      totalStalledJobs += stalledCount || 0;
    } catch (error) {
      logger.warn({ queue: queueName, error }, 'Failed to get queue health');
      queueHealth[queueName] = {
        connected: false,
        size: 0,
        activeJobs: 0,
        failedJobs: 0,
        stalledJobs: 0,
      };
    }
  }

  // Count active workers
  const workersRunning = Array.from(workers.values()).filter((w) => w && !w.isPaused?.()).length;
  const workersTotal = workers.size;

  // Determine overall health
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

  if (!isRedisConnected || !isDatabaseConnected) {
    status = 'unhealthy';
  } else if (totalFailedJobs > 10 || totalStalledJobs > 5 || totalActiveJobs > 100) {
    status = 'degraded';
  }

  return {
    status,
    timestamp,
    uptime,
    checks: {
      redisConnection: isRedisConnected ? 'connected' : 'disconnected',
      databaseConnection: isDatabaseConnected ? 'connected' : 'disconnected',
      workersRunning,
      workersTotal,
    },
    queues: queueHealth,
    metrics: {
      totalActiveJobs,
      totalFailedJobs,
      totalStalledJobs,
      queueSize: totalQueueSize,
    },
  };
}

/**
 * Check if worker is ready to accept jobs
 */
export function isWorkerReadyForProduction(health: WorkerHealthStatus): boolean {
  return (
    health.status !== 'unhealthy' &&
    health.checks.redisConnection === 'connected' &&
    health.checks.databaseConnection === 'connected' &&
    health.checks.workersRunning > 0 &&
    health.metrics.totalFailedJobs < 5 &&
    health.metrics.totalStalledJobs < 3
  );
}

/**
 * Get alerts based on health status
 */
export function getWorkerAlerts(health: WorkerHealthStatus): string[] {
  const alerts: string[] = [];

  if (health.checks.redisConnection === 'disconnected') {
    alerts.push('⚠️ Redis disconnected — queues may be stalled');
  }

  if (health.checks.databaseConnection === 'disconnected') {
    alerts.push('⚠️ Database disconnected — worker cannot persist results');
  }

  if (health.metrics.totalActiveJobs > 100) {
    alerts.push(`⚠️ High job backlog: ${health.metrics.totalActiveJobs} active jobs`);
  }

  if (health.metrics.totalFailedJobs > 10) {
    alerts.push(`⚠️ High failure rate: ${health.metrics.totalFailedJobs} failed jobs`);
  }

  if (health.metrics.totalStalledJobs > 5) {
    alerts.push(`⚠️ Stalled jobs detected: ${health.metrics.totalStalledJobs}`);
  }

  if (health.checks.workersRunning === 0) {
    alerts.push('🚨 No workers running — jobs will not be processed');
  }

  if (health.checks.workersRunning < health.checks.workersTotal) {
    alerts.push(
      `⚠️ Incomplete worker initialization: ${health.checks.workersRunning}/${health.checks.workersTotal} online`
    );
  }

  return alerts;
}
