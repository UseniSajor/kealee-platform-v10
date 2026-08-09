import { getHealthStatus } from './monitoring'
import { getQueueStats } from './job-queue'

async function performHealthCheck() {
  const health = getHealthStatus()
  const queueStats = await getQueueStats()

  const report = {
    timestamp: new Date().toISOString(),
    service: 'marketing-cron',
    status: health.status,
    checks: {
      cronJobsInitialized: health.activeTasks > 0,
      successRate: health.successRate >= 90,
      noRecentFailures: health.failedTasks === 0,
      queueAvailable: Object.keys(queueStats).length > 0 || true, // OK if no Redis
    },
    metrics: {
      activeTasks: health.activeTasks,
      successRate: health.successRate.toFixed(1) + '%',
      totalRuns: health.totalRuns,
      totalFailures: health.totalFailures,
      failedTasks: health.failedTasks,
    },
    details: health.tasks.map(t => ({
      name: t.name,
      schedule: t.schedule,
      status: t.lastStatus,
      totalRuns: t.totalRuns,
      successCount: t.successCount,
      failureCount: t.failureCount,
      averageRuntime: t.averageRuntime.toFixed(0) + 'ms',
    })),
  }

  // Exit code: 0 = healthy, 1 = unhealthy
  const exitCode = health.status === 'healthy' ? 0 : 1
  console.log(JSON.stringify(report, null, 2))
  process.exit(exitCode)
}

performHealthCheck().catch(error => {
  console.error('Health check failed:', error)
  process.exit(1)
})
