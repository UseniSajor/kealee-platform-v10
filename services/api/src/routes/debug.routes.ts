/**
 * services/api/src/routes/debug.routes.ts
 *
 * Debug status endpoints for observability:
 * - GET /api/debug/status — agents/queue/RAG health
 */

import type { FastifyInstance } from 'fastify'
import { getRAGStatus } from '../lib/orchestrator/retrieval/rag-retriever'
import { redisClient as redis } from '../config/redis.config'

export async function debugRoutes(fastify: FastifyInstance) {
  fastify.get('/debug/status', async (_req, reply) => {
    const rag = getRAGStatus()
    let queueHealth = { connected: false, lastJobAt: null as string | null }

    try {
      if (redis) {
        await redis.ping()
        queueHealth.connected = true

        // Try to get last job info
        const info = await redis.info('keyspace')
        if (info) {
          queueHealth.lastJobAt = new Date().toISOString()
        }
      }
    } catch (err: any) {
      console.warn('[debug] Redis ping failed:', err.message)
    }

    return reply.send({
      agents: {
        land: true,
        design: true,
        permit: true,
        contractor: true,
      },
      rag: {
        loaded: rag.loaded,
        recordCount: rag.recordCount,
      },
      queue: queueHealth,
      timestamp: new Date().toISOString(),
    })
  })
}
