/**
 * Agentic Bot Health Check & Status
 *
 * Provides health check endpoints and status monitoring for agentic bots.
 */

import type { Worker, Queue } from 'bullmq';

export interface AgenticBotHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    queueConnection: { status: string; message?: string };
    worker: { status: string; processing?: number; paused?: boolean };
    database: { status: string; message?: string };
    redis: { status: string; message?: string };
  };
  metrics: {
    queueSize: number;
    activeJobs: number;
    failedJobs: number;
    stalledJobs: number;
    averageJobDuration: number;
  };
}

/**
 * Get health status for agentic bots
 */
export async function getAgenticBotHealth(
  worker: Worker,
  queue: Queue,
  deps: {
    db?: { $queryRaw: any };
    redis?: { ping: () => Promise<string> };
  }
): Promise<AgenticBotHealth> {
  const timestamp = new Date().toISOString();
  const health: AgenticBotHealth = {
    status: 'healthy',
    timestamp,
    checks: {
      queueConnection: { status: 'unknown' },
      worker: { status: 'unknown' },
      database: { status: 'unknown' },
      redis: { status: 'unknown' },
    },
    metrics: {
      queueSize: 0,
      activeJobs: 0,
      failedJobs: 0,
      stalledJobs: 0,
      averageJobDuration: 0,
    },
  };

  // Check queue connection
  try {
    const queueSize = await (queue as any).count();
    health.checks.queueConnection = { status: 'connected' };
    health.metrics.queueSize = queueSize;
  } catch (err) {
    health.checks.queueConnection = {
      status: 'error',
      message: err instanceof Error ? err.message : String(err),
    };
    health.status = 'unhealthy';
  }

  // Check worker
  try {
    const active = await (worker as any).getActiveCount?.();
    const failed = await (worker as any).getFailedCount?.();
    const stalled = await (worker as any).getStalledCount?.();

    health.checks.worker = {
      status: worker.isRunning() ? 'running' : 'paused',
      processing: active || 0,
      paused: worker.isPaused(),
    };

    health.metrics.activeJobs = active || 0;
    health.metrics.failedJobs = failed || 0;
    health.metrics.stalledJobs = stalled || 0;

    if (stalled && stalled > 0) {
      health.status = 'degraded';
    }
  } catch (err) {
    health.checks.worker = {
      status: 'error',
      message: err instanceof Error ? err.message : String(err),
    };
    health.status = 'degraded';
  }

  // Check database
  if (deps.db) {
    try {
      await deps.db.$queryRaw`SELECT 1`;
      health.checks.database = { status: 'connected' };
    } catch (err) {
      health.checks.database = {
        status: 'error',
        message: err instanceof Error ? err.message : String(err),
      };
      health.status = 'unhealthy';
    }
  }

  // Check Redis
  if (deps.redis) {
    try {
      await deps.redis.ping();
      health.checks.redis = { status: 'connected' };
    } catch (err) {
      health.checks.redis = {
        status: 'error',
        message: err instanceof Error ? err.message : String(err),
      };
      health.status = 'unhealthy';
    }
  }

  return health;
}

/**
 * Check if agentic bot system is ready to accept jobs
 */
export function isAgenticBotReadyForProduction(health: AgenticBotHealth): boolean {
  return (
    health.status !== 'unhealthy' &&
    health.checks.queueConnection.status === 'connected' &&
    health.checks.worker.status === 'running' &&
    health.checks.database.status === 'connected' &&
    health.checks.redis.status === 'connected' &&
    !health.checks.worker.paused
  );
}

/**
 * Alert criteria for agentic bots
 */
export function checkAgenticBotAlerts(health: AgenticBotHealth): string[] {
  const alerts: string[] = [];

  if (health.status === 'unhealthy') {
    alerts.push('System is unhealthy');
  }

  if (health.metrics.activeJobs > 50) {
    alerts.push(`High job backlog: ${health.metrics.activeJobs} active jobs`);
  }

  if (health.metrics.stalledJobs > 5) {
    alerts.push(`Stalled jobs detected: ${health.metrics.stalledJobs}`);
  }

  if (health.metrics.failedJobs > 10) {
    alerts.push(`High failure rate: ${health.metrics.failedJobs} failed jobs`);
  }

  if (health.checks.worker.paused) {
    alerts.push('Worker is paused');
  }

  return alerts;
}
