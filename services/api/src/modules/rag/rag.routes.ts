/**
 * services/api/src/modules/rag/rag.routes.ts
 *
 * POST /api/v1/rag/trigger  — manually trigger ingestion (admin only)
 * GET  /api/v1/rag/status   — check queue status
 */

import type { FastifyInstance } from 'fastify'
import { triggerImmediateIngestion } from './rag-nightly-job.js'
import { buildAllIngestPayloads } from './document-processor.js'

export async function ragRoutes(fastify: FastifyInstance) {
  fastify.post('/trigger', {
    handler: async (request, reply) => {
      const body = request.body as any
      const reason = body?.reason ?? 'manual-api-trigger'
      const jobId = await triggerImmediateIngestion(reason)
      if (!jobId) {
        return reply.status(503).send({ error: 'RAG queue unavailable — REDIS_URL not configured' })
      }
      return reply.send({ jobId, reason, queued: true })
    },
  })

  fastify.get('/status', {
    handler: async (_request, reply) => {
      const payloads = await buildAllIngestPayloads()
      return reply.send({
        documentsReady: payloads.length,
        breakdown: {
          permits: payloads.filter(p => p.sourceType === 'PERMIT_APPLICATION').length,
          intakes: payloads.filter(p => p.sourceType === 'PROJECT_DESCRIPTION').length,
          jurisdictions: payloads.filter(p => p.sourceType === 'JURISDICTION_GUIDE').length,
          serviceCatalog: payloads.filter(p => p.sourceType === 'SERVICE_CATALOG').length,
        },
        redisConfigured: !!process.env.REDIS_URL,
      })
    },
  })
}
