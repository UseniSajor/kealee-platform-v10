/**
 * Health Check Routes
 *
 * GET /health       - Basic liveness probe (always fast, no external deps)
 * GET /health/ready - Readiness probe (verifies database + Redis connectivity)
 *
 * These endpoints require NO authentication so that container orchestrators
 * (Railway, Docker, Kubernetes) can probe them freely.
 */

import { FastifyPluginAsync } from 'fastify'
import { prisma } from '@kealee/database'

// Capture process start time once so uptime is accurate across requests
const processStartTime = Date.now()

export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  // ── GET /health — basic liveness check ──────────────────────────────────
  fastify.get('/health', async (_request, reply) => {
    return reply.send({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - processStartTime) / 1000),
    })
  })

  // ── GET /health/ready — readiness check (DB + Redis) ────────────────────
  fastify.get('/health/ready', async (_request, reply) => {
    const timestamp = new Date().toISOString()
    const checks: Record<string, string> = {}
    let overallStatus: 'ok' | 'degraded' = 'ok'

    // ── Database check ─────────────────────────────────────────────────────
    try {
      await (prisma as any).$queryRaw`SELECT 1`
      checks.database = 'connected'
    } catch (err: any) {
      checks.database = 'disconnected'
      overallStatus = 'degraded'
      fastify.log.error(err, 'Health check: database unreachable')
    }

    // ── Redis check (non-fatal — jobs degrade gracefully without Redis) ────
    try {
      const { Redis } = await import('ioredis')
      const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
        connectTimeout: 3000,
        maxRetriesPerRequest: 1,
        lazyConnect: true,
      })
      await redis.connect()
      await redis.ping()
      await redis.quit()
      checks.redis = 'connected'
    } catch (err: any) {
      checks.redis = 'disconnected'
      // Redis failure is non-fatal — warn but don't degrade overall status
      fastify.log.warn('Health check: Redis unreachable (non-fatal)')
    }

    const code = overallStatus === 'ok' ? 200 : 503
    return reply.code(code).send({ status: overallStatus, checks, timestamp })
  })
}
