/**
 * Admin Dashboard Routes
 * Bull Board queue visualization + system status
 */

import type { FastifyInstance } from 'fastify'
import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import { FastifyAdapter } from '@bull-board/fastify'
import { Queue } from 'bullmq'
import IORedis from 'ioredis'
import { prisma } from '@kealee/database'

// Queue names used in the platform
const QUEUE_NAMES = [
  'email',
  'webhook',
  'ml',
  'reports',
  'sales',
  'ml-prediction',
  'spatial-verification',
  'concept-delivery',
  'intake-processing',
  'concept-engine',
  'capture-analysis',
  'project-execution',
] as const

/**
 * Register admin routes
 */
export async function registerAdminRoutes(fastify: FastifyInstance) {
  const redisUrl = process.env.REDIS_URL

  if (!redisUrl) {
    fastify.log.warn('[AdminDashboard] REDIS_URL not set — BullBoard disabled, serving basic system-status only')

    fastify.get('/admin/system-status', async (_request, reply) => {
      let dbStatus = true
      try { await prisma.$queryRaw`SELECT 1` } catch { dbStatus = false }
      return reply.send({
        status: dbStatus ? 'healthy' : 'degraded',
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        services: { api: 'running', database: dbStatus ? 'connected' : 'disconnected', redis: 'unavailable (REDIS_URL not set)' },
        queues: {},
        environment: { nodeEnv: process.env.NODE_ENV || 'development', service: 'kealee-api' },
      })
    })

    fastify.log.info('Admin routes registered: /admin/system-status (Redis-free mode)')
    return
  }

  const redis = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
  })

  // Create read-only Queue instances pointing to same Redis
  const queues = QUEUE_NAMES.map((name) =>
    new BullMQAdapter(
      new Queue(name, { connection: redis })
    )
  )

  // Create Bull Board serverAdapter
  const serverAdapter = new FastifyAdapter()
  createBullBoard({ queues, serverAdapter })

  // Register Bull Board at /admin/queues
  await fastify.register(serverAdapter.registerPlugin(), {
    prefix: '/admin/queues',
    basePath: '/admin/queues',
  })

  // System Status Endpoint
  fastify.get('/admin/system-status', async (_request, reply) => {
    try {
      const uptime = process.uptime()

      // Get queue stats
      const queueStats: Record<string, any> = {}
      for (const name of QUEUE_NAMES) {
        try {
          const queue = new Queue(name, { connection: redis })
          const counts = await queue.getCountsPerState('wait', 'active', 'completed', 'failed')
          queueStats[name] = { waiting: counts.wait || 0, active: counts.active || 0, completed: counts.completed || 0, failed: counts.failed || 0 }
          await queue.close()
        } catch {
          queueStats[name] = { error: 'Failed to fetch stats' }
        }
      }

      let dbStatus = true
      try { await prisma.$queryRaw`SELECT 1` } catch { dbStatus = false }

      let redisStatus = true
      try { await redis.ping() } catch { redisStatus = false }

      return reply.send({
        status: dbStatus && redisStatus ? 'healthy' : 'degraded',
        uptime: Math.floor(uptime),
        timestamp: new Date().toISOString(),
        services: { api: 'running', database: dbStatus ? 'connected' : 'disconnected', redis: redisStatus ? 'connected' : 'disconnected' },
        queues: queueStats,
        environment: { nodeEnv: process.env.NODE_ENV || 'development', service: 'kealee-api' },
      })
    } catch (error) {
      fastify.log.error(error, 'System status check failed')
      return reply.status(500).send({ status: 'error', error: 'Failed to fetch system status' })
    }
  })

  fastify.log.info('Admin routes registered: /admin/queues, /admin/system-status')
}
