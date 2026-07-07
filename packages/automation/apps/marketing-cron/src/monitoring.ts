import { prisma } from '@kealee/database'

interface CronTaskExecution {
  name: string
  schedule: string
  lastRun?: Date
  lastStatus: 'pending' | 'success' | 'failed'
  lastError?: string
  nextRun?: Date
  totalRuns: number
  successCount: number
  failureCount: number
  averageRuntime: number
}

const taskMetrics = new Map<string, CronTaskExecution>()

export function recordTaskExecution(
  taskName: string,
  schedule: string,
  status: 'success' | 'failed',
  runtime: number,
  error?: string
) {
  const existing = taskMetrics.get(taskName) || {
    name: taskName,
    schedule,
    lastStatus: status,
    lastError: error,
    totalRuns: 0,
    successCount: 0,
    failureCount: 0,
    averageRuntime: 0,
  }

  existing.lastRun = new Date()
  existing.lastStatus = status
  existing.lastError = error
  existing.totalRuns += 1

  if (status === 'success') {
    existing.successCount += 1
  } else {
    existing.failureCount += 1
  }

  existing.averageRuntime =
    (existing.averageRuntime * (existing.totalRuns - 1) + runtime) / existing.totalRuns

  taskMetrics.set(taskName, existing)

  // Persist to database
  persistTaskMetrics(taskName, existing).catch(e =>
    console.error(`Failed to persist metrics for ${taskName}:`, e)
  )
}

async function persistTaskMetrics(taskName: string, metrics: CronTaskExecution) {
  try {
    await prisma.jobQueue.upsert({
      where: { name: taskName },
      update: {
        status: metrics.lastStatus === 'success' ? 'completed' : 'failed',
        metadata: {
          lastRun: metrics.lastRun,
          totalRuns: metrics.totalRuns,
          successCount: metrics.successCount,
          failureCount: metrics.failureCount,
          averageRuntime: metrics.averageRuntime,
          lastError: metrics.lastError,
        } as any,
      },
      create: {
        name: taskName,
        type: 'CRON_TASK',
        status: metrics.lastStatus === 'success' ? 'completed' : 'failed',
        metadata: {
          schedule: metrics.schedule,
          totalRuns: metrics.totalRuns,
          successCount: metrics.successCount,
          failureCount: metrics.failureCount,
          averageRuntime: metrics.averageRuntime,
        } as any,
        input: { schedule: metrics.schedule },
        output: { lastRun: metrics.lastRun },
      },
    })
  } catch (error) {
    console.error('Metrics persistence error:', error)
  }
}

export function getTaskMetrics(): CronTaskExecution[] {
  return Array.from(taskMetrics.values())
}

export function getHealthStatus() {
  const tasks = Array.from(taskMetrics.values())
  const failedCount = tasks.filter(t => t.lastStatus === 'failed').length
  const totalRuns = tasks.reduce((sum, t) => sum + t.totalRuns, 0)
  const totalFailures = tasks.reduce((sum, t) => sum + t.failureCount, 0)

  return {
    status: failedCount === 0 ? 'healthy' : 'degraded',
    activeTasks: tasks.length,
    failedTasks: failedCount,
    totalRuns,
    totalFailures,
    successRate: totalRuns > 0 ? ((totalRuns - totalFailures) / totalRuns) * 100 : 0,
    tasks,
  }
}

export function getMetricsByTask(taskName: string): CronTaskExecution | undefined {
  return taskMetrics.get(taskName)
}
