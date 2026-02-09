/**
 * Command Center API Routes
 *
 * Provides the dashboard, monitoring, and control endpoints consumed by
 * the os-admin dashboard (APP-15 UI) and the os-pm workspace.
 *
 * All routes require ADMIN role.
 * Registered under prefix /api/v1/command-center
 */

import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '@kealee/database'
import { authenticateUser, requireAdmin } from '../../middleware/auth.middleware'
import { validateBody, validateQuery, validateParams } from '../../middleware/validation.middleware'
import { Queue, Job } from 'bullmq'
import Redis from 'ioredis'

// ---------------------------------------------------------------------------
// Queue infrastructure
// ---------------------------------------------------------------------------

const APP_QUEUE_MAP: Record<string, string> = {
  'APP-01': 'bid-engine',
  'APP-02': 'visit-scheduler',
  'APP-03': 'change-order',
  'APP-04': 'report-generator',
  'APP-05': 'permit-tracker',
  'APP-06': 'inspection-coordinator',
  'APP-07': 'budget-tracker',
  'APP-08': 'communication-hub',
  'APP-09': 'task-queue',
  'APP-10': 'document-generator',
  'APP-11': 'predictive-engine',
  'APP-12': 'smart-scheduler',
  'APP-13': 'qa-inspector',
  'APP-14': 'decision-support',
}

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
}

function getRedisConnection(): Redis {
  return new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  })
}

function getQueue(queueName: string): Queue {
  return new Queue(queueName, {
    connection: getRedisConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: { count: 1000 },
      removeOnFail: { count: 5000 },
    },
  })
}

interface QueueMetrics {
  active: number
  waiting: number
  delayed: number
  failed: number
  completed: number
}

async function getQueueMetrics(queueName: string): Promise<QueueMetrics> {
  try {
    const queue = getQueue(queueName)
    const [active, waiting, delayed, failed, completed] = await Promise.all([
      queue.getActiveCount(),
      queue.getWaitingCount(),
      queue.getDelayedCount(),
      queue.getFailedCount(),
      queue.getCompletedCount(),
    ])
    await queue.close()
    return { active, waiting, delayed, failed, completed }
  } catch {
    return { active: 0, waiting: 0, delayed: 0, failed: 0, completed: 0 }
  }
}

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const appIdParamsSchema = z.object({
  appId: z.string().regex(/^APP-\d{2}$/, 'appId must be APP-01 through APP-15'),
})

const jobsQuerySchema = z.object({
  after: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

const triggerBodySchema = z.object({
  jobType: z.string().min(1),
  data: z.record(z.unknown()).default({}),
})

// ---------------------------------------------------------------------------
// DashboardService — self-contained service layer
// ---------------------------------------------------------------------------

class DashboardService {
  async getSystemStatus() {
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const allAppIds = Object.keys(APP_NAMES)

    // Latest metric per app
    const latestMetrics = await Promise.all(
      allAppIds.map(async (appId) => {
        const metric = await prisma.appHealthMetric.findFirst({
          where: { appId },
          orderBy: { timestamp: 'desc' },
        })
        return { appId, metric }
      }),
    )

    // Today's tasks aggregated
    const todayTasks = await prisma.automationTask.findMany({
      where: { startedAt: { gte: twentyFourHoursAgo } },
      select: { sourceApp: true, status: true, startedAt: true, completedAt: true },
    })

    const todayByApp = new Map<string, { total: number; success: number; failed: number; durations: number[] }>()
    for (const t of todayTasks) {
      const app = t.sourceApp ?? 'UNKNOWN'
      const entry = todayByApp.get(app) ?? { total: 0, success: 0, failed: 0, durations: [] }
      entry.total++
      if (t.status === 'COMPLETED') entry.success++
      if (t.status === 'FAILED') entry.failed++
      if (t.startedAt && t.completedAt) {
        entry.durations.push(t.completedAt.getTime() - t.startedAt.getTime())
      }
      todayByApp.set(app, entry)
    }

    const apps = allAppIds.map((appId) => {
      const latest = latestMetrics.find((m) => m.appId === appId)?.metric
      const todayData = todayByApp.get(appId)

      let status: 'healthy' | 'degraded' | 'down' = 'healthy'
      if (latest) {
        const errorRate = Number(latest.errorRate)
        const isStale = latest.timestamp < tenMinAgo
        if (errorRate > 0.15 || isStale) status = 'down'
        else if (errorRate > 0.05) status = 'degraded'
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
      }
    })

    // Alerts
    const alerts: Array<{
      appId: string
      appName: string
      type: 'error_rate' | 'queue_depth' | 'no_activity'
      message: string
      timestamp: string
    }> = []

    for (const app of apps) {
      if (app.metrics) {
        if (app.metrics.errorRate > 0.1) {
          alerts.push({
            appId: app.appId,
            appName: app.name,
            type: 'error_rate',
            message: `Error rate ${(app.metrics.errorRate * 100).toFixed(1)}%`,
            timestamp: app.lastActivity ?? new Date().toISOString(),
          })
        }
        if (app.metrics.queueDepth > 100) {
          alerts.push({
            appId: app.appId,
            appName: app.name,
            type: 'queue_depth',
            message: `Queue depth: ${app.metrics.queueDepth} jobs`,
            timestamp: app.lastActivity ?? new Date().toISOString(),
          })
        }
      }
      if (app.status === 'down' && app.lastActivity && new Date(app.lastActivity) < tenMinAgo) {
        alerts.push({
          appId: app.appId,
          appName: app.name,
          type: 'no_activity',
          message: 'No activity in last 10 minutes',
          timestamp: app.lastActivity,
        })
      }
    }

    return {
      apps,
      alerts,
      lastUpdated: new Date().toISOString(),
    }
  }

  async getAppDetail(appId: string) {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const [metrics, recentJobs] = await Promise.all([
      prisma.appHealthMetric.findMany({
        where: { appId, timestamp: { gte: twentyFourHoursAgo } },
        orderBy: { timestamp: 'asc' },
      }),
      prisma.automationTask.findMany({
        where: { sourceApp: appId },
        orderBy: { startedAt: 'desc' },
        take: 50,
        select: { id: true, type: true, status: true, startedAt: true, completedAt: true, error: true },
      }),
    ])

    // Current queue state
    const queueName = APP_QUEUE_MAP[appId]
    let queueState: QueueMetrics | null = null
    if (queueName) {
      queueState = await getQueueMetrics(queueName)
    }

    // Determine status from latest metric
    const latest = metrics.length > 0 ? metrics[metrics.length - 1] : null
    let status: 'healthy' | 'degraded' | 'down' = 'healthy'
    if (latest) {
      const errorRate = Number(latest.errorRate)
      if (errorRate > 0.15) status = 'down'
      else if (errorRate > 0.05) status = 'degraded'
    }

    return {
      metrics: metrics.map((m) => ({
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
    }
  }

  async pauseApp(appId: string): Promise<boolean> {
    const queueName = APP_QUEUE_MAP[appId]
    if (!queueName) return false
    try {
      const queue = getQueue(queueName)
      await queue.pause()
      await queue.close()
      return true
    } catch {
      return false
    }
  }

  async resumeApp(appId: string): Promise<boolean> {
    const queueName = APP_QUEUE_MAP[appId]
    if (!queueName) return false
    try {
      const queue = getQueue(queueName)
      await queue.resume()
      await queue.close()
      return true
    } catch {
      return false
    }
  }

  async retryFailedJobs(appId: string): Promise<number> {
    const queueName = APP_QUEUE_MAP[appId]
    if (!queueName) return 0
    try {
      const queue = getQueue(queueName)
      const failedJobs = await queue.getFailed(0, 100)
      let retried = 0
      for (const job of failedJobs) {
        await job.retry()
        retried++
      }
      await queue.close()
      return retried
    } catch {
      return 0
    }
  }
}

const dashboardService = new DashboardService()

// ---------------------------------------------------------------------------
// Route plugin
// ---------------------------------------------------------------------------

export async function commandCenterRoutes(fastify: FastifyInstance) {
  // Require ADMIN role for all Command Center routes
  fastify.addHook('onRequest', async (request, reply) => {
    await authenticateUser(request, reply)
    await requireAdmin(request, reply)
  })

  // -------------------------------------------------------------------------
  // GET /status
  // -------------------------------------------------------------------------
  fastify.get('/status', async (_request, reply) => {
    try {
      const result = await dashboardService.getSystemStatus()
      return reply.send(result)
    } catch (error: any) {
      fastify.log.error(error)
      return reply.code(500).send({ error: error.message || 'Failed to get system status' })
    }
  })

  // -------------------------------------------------------------------------
  // GET /metrics
  // -------------------------------------------------------------------------
  fastify.get('/metrics', async (_request, reply) => {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

      const metrics = await prisma.appHealthMetric.findMany({
        where: { timestamp: { gte: twentyFourHoursAgo } },
      })

      let totalJobs = 0
      let totalSuccess = 0
      let totalFailed = 0
      let durationSum = 0
      let durationCount = 0
      let activeWorkers = 0

      for (const m of metrics) {
        totalJobs += m.jobsTotal
        totalSuccess += m.jobsSuccess
        totalFailed += m.jobsFailed
        const dur = Number(m.avgDuration)
        if (dur > 0) {
          durationSum += dur
          durationCount++
        }
        const meta = m.metadata as any
        if (meta?.active) activeWorkers += meta.active
      }

      const successRate = totalJobs > 0 ? totalSuccess / totalJobs : 1
      const avgDuration = durationCount > 0 ? Math.round(durationSum / durationCount) : 0

      return reply.send({
        totalJobs,
        successRate,
        avgDuration,
        activeWorkers,
      })
    } catch (error: any) {
      fastify.log.error(error)
      return reply.code(500).send({ error: error.message || 'Failed to get metrics' })
    }
  })

  // -------------------------------------------------------------------------
  // GET /alerts
  // -------------------------------------------------------------------------
  fastify.get('/alerts', async (_request, reply) => {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

      const alertMetrics = await prisma.appHealthMetric.findMany({
        where: {
          timestamp: { gte: twentyFourHoursAgo },
          errorRate: { gt: 0.05 },
        },
        orderBy: { timestamp: 'desc' },
        take: 100,
      })

      const alerts = alertMetrics.map((m) => ({
        appId: m.appId,
        appName: APP_NAMES[m.appId] ?? m.appId,
        errorRate: Number(m.errorRate),
        jobsTotal: m.jobsTotal,
        jobsFailed: m.jobsFailed,
        timestamp: m.timestamp.toISOString(),
      }))

      return reply.send({ alerts })
    } catch (error: any) {
      fastify.log.error(error)
      return reply.code(500).send({ error: error.message || 'Failed to get alerts' })
    }
  })

  // -------------------------------------------------------------------------
  // GET /:appId/detail
  // -------------------------------------------------------------------------
  fastify.get(
    '/:appId/detail',
    { preHandler: [validateParams(appIdParamsSchema)] },
    async (request, reply) => {
      try {
        const { appId } = request.params as z.infer<typeof appIdParamsSchema>
        const result = await dashboardService.getAppDetail(appId)
        return reply.send(result)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to get app detail' })
      }
    },
  )

  // -------------------------------------------------------------------------
  // GET /:appId/jobs — cursor-based pagination
  // -------------------------------------------------------------------------
  fastify.get(
    '/:appId/jobs',
    {
      preHandler: [
        validateParams(appIdParamsSchema),
        validateQuery(jobsQuerySchema),
      ],
    },
    async (request, reply) => {
      try {
        const { appId } = request.params as z.infer<typeof appIdParamsSchema>
        const { after, limit, status, startDate, endDate } = request.query as z.infer<typeof jobsQuerySchema>

        const where: any = { sourceApp: appId }
        if (status) where.status = status
        if (startDate || endDate) {
          where.createdAt = {}
          if (startDate) where.createdAt.gte = new Date(startDate)
          if (endDate) where.createdAt.lte = new Date(endDate)
        }

        // Cursor-based pagination: if "after" is provided, skip that record
        const findArgs: any = {
          where,
          orderBy: { createdAt: 'desc' as const },
          take: limit + 1, // fetch one extra to determine if there's a next page
          select: {
            id: true,
            type: true,
            status: true,
            priority: true,
            sourceApp: true,
            startedAt: true,
            completedAt: true,
            createdAt: true,
            error: true,
          },
        }

        if (after) {
          findArgs.cursor = { id: after }
          findArgs.skip = 1 // skip the cursor record itself
        }

        const rows = await prisma.automationTask.findMany(findArgs)

        const hasMore = rows.length > limit
        const jobs = hasMore ? rows.slice(0, limit) : rows
        const cursor = hasMore ? jobs[jobs.length - 1].id : null

        return reply.send({
          jobs: jobs.map((j: any) => ({
            ...j,
            startedAt: j.startedAt?.toISOString() ?? null,
            completedAt: j.completedAt?.toISOString() ?? null,
            createdAt: j.createdAt.toISOString(),
          })),
          cursor,
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to get jobs' })
      }
    },
  )

  // -------------------------------------------------------------------------
  // POST /:appId/trigger
  // -------------------------------------------------------------------------
  fastify.post(
    '/:appId/trigger',
    {
      preHandler: [
        validateParams(appIdParamsSchema),
        validateBody(triggerBodySchema),
      ],
    },
    async (request, reply) => {
      try {
        const { appId } = request.params as z.infer<typeof appIdParamsSchema>
        const { jobType, data } = request.body as z.infer<typeof triggerBodySchema>

        const queueName = APP_QUEUE_MAP[appId]
        if (!queueName) {
          return reply.code(400).send({ error: `Unknown app: ${appId}` })
        }

        const queue = getQueue(queueName)
        const job: Job = await queue.add(jobType, data, { priority: 0 })
        await queue.close()

        return reply.code(201).send({ jobId: job.id })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to trigger job' })
      }
    },
  )

  // -------------------------------------------------------------------------
  // POST /:appId/pause
  // -------------------------------------------------------------------------
  fastify.post(
    '/:appId/pause',
    { preHandler: [validateParams(appIdParamsSchema)] },
    async (request, reply) => {
      try {
        const { appId } = request.params as z.infer<typeof appIdParamsSchema>
        const paused = await dashboardService.pauseApp(appId)
        if (!paused) {
          return reply.code(400).send({ error: `Cannot pause ${appId}: unknown app or queue error` })
        }
        return reply.send({ paused: true })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to pause app' })
      }
    },
  )

  // -------------------------------------------------------------------------
  // POST /:appId/resume
  // -------------------------------------------------------------------------
  fastify.post(
    '/:appId/resume',
    { preHandler: [validateParams(appIdParamsSchema)] },
    async (request, reply) => {
      try {
        const { appId } = request.params as z.infer<typeof appIdParamsSchema>
        const resumed = await dashboardService.resumeApp(appId)
        if (!resumed) {
          return reply.code(400).send({ error: `Cannot resume ${appId}: unknown app or queue error` })
        }
        return reply.send({ paused: false })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to resume app' })
      }
    },
  )

  // -------------------------------------------------------------------------
  // POST /:appId/retry-failed
  // -------------------------------------------------------------------------
  fastify.post(
    '/:appId/retry-failed',
    { preHandler: [validateParams(appIdParamsSchema)] },
    async (request, reply) => {
      try {
        const { appId } = request.params as z.infer<typeof appIdParamsSchema>
        const retriedCount = await dashboardService.retryFailedJobs(appId)
        return reply.send({ retriedCount })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to retry failed jobs' })
      }
    },
  )
}
