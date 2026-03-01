/**
 * Health Check Routes
 *
 * GET /health       - Basic liveness probe (always fast, no external deps)
 * GET /health/ready - Readiness probe (verifies database connectivity)
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

  // ── GET /health/ready — readiness check (includes DB connectivity) ──────
  fastify.get('/health/ready', async (_request, reply) => {
    const timestamp = new Date().toISOString()

    try {
      // Lightweight query to verify the database connection is alive
      await (prisma as any).$queryRaw`SELECT 1`

      return reply.send({
        status: 'ok',
        checks: {
          database: 'connected',
        },
        timestamp,
      })
    } catch (err: any) {
      fastify.log.error(err, 'Health readiness check failed — database unreachable')

      return reply.code(503).send({
        status: 'degraded',
        checks: {
          database: 'disconnected',
        },
        error: err?.message || 'Database connectivity check failed',
        timestamp,
      })
    }
  })
}
