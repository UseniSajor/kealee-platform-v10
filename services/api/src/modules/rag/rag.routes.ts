/**
 * services/api/src/modules/rag/rag.routes.ts
 *
 * POST /api/v1/rag/trigger           — manually trigger ingestion (admin only)
 * GET  /api/v1/rag/status            — check queue status
 * POST /api/v1/rag/query             — query the file-based RAG retrieval layer
 * GET  /api/v1/rag/data/:jurisdiction — get all RAG records for a jurisdiction
 * GET  /api/v1/rag/dataset/status    — check file-based dataset health
 */

import type { FastifyInstance } from 'fastify'
import { triggerImmediateIngestion } from './rag-nightly-job.js'
import { buildAllIngestPayloads } from './document-processor.js'
import {
  buildRAGContext,
  retrievePermitContext,
  retrieveZoningContext,
  retrieveCostContext,
  retrieveWorkflowContext,
  getRAGStatus,
} from '../../../../ai-orchestrator/src/retrieval/rag-retriever'

export async function ragRoutes(fastify: FastifyInstance) {
  // ── Existing: manual ingestion trigger ──
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

  // ── Existing: ingestion queue status ──
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

  // ── NEW: file-based dataset health ──
  fastify.get('/dataset/status', {
    handler: async (_request, reply) => {
      const status = getRAGStatus()
      return reply.send({
        loaded: status.loaded,
        recordCount: status.recordCount,
        source: 'data/rag/full/dmv_full_dataset.jsonl',
      })
    },
  })

  // ── NEW: query the file-based RAG retrieval layer ──
  // POST /api/v1/rag/query
  // Body: { jurisdiction?, projectType?, stage?, type? }
  fastify.post('/query', {
    handler: async (request, reply) => {
      const body = request.body as any

      const ragStatus = getRAGStatus()
      if (!ragStatus.loaded) {
        return reply.status(503).send({
          status: 'RAG_MISSING',
          message: 'RAG dataset not loaded. Check startup logs for [RAG] entries.',
        })
      }

      const { jurisdiction = '', projectType = '', stage = '', type } = body

      // Allow targeted retrieval by type, or aggregated via buildRAGContext
      if (type === 'permit') {
        const results = retrievePermitContext(jurisdiction, projectType)
        return reply.send({ type: 'permit', results, count: results.length })
      }
      if (type === 'zoning') {
        const results = retrieveZoningContext(jurisdiction)
        return reply.send({ type: 'zoning', results, count: results.length })
      }
      if (type === 'cost') {
        const results = retrieveCostContext(projectType)
        return reply.send({ type: 'cost', results, count: results.length })
      }
      if (type === 'workflow') {
        const results = retrieveWorkflowContext(stage)
        return reply.send({ type: 'workflow', results, count: results.length })
      }

      // Default: full context aggregation
      const context = buildRAGContext({ jurisdiction, projectType, stage })
      if (!context) {
        return reply.status(404).send({
          status: 'NO_CONTEXT',
          message: `No records found for jurisdiction="${jurisdiction}" projectType="${projectType}"`,
        })
      }
      return reply.send({
        jurisdiction,
        projectType,
        stage,
        context,
        counts: {
          permits: context.permits.length,
          zoning: context.zoning.length,
          costs: context.costs.length,
          workflows: context.workflows.length,
        },
      })
    },
  })

  // ── NEW: all records for a jurisdiction ──
  // GET /api/v1/rag/data/:jurisdiction
  fastify.get('/data/:jurisdiction', {
    handler: async (request, reply) => {
      const { jurisdiction } = request.params as { jurisdiction: string }

      const ragStatus = getRAGStatus()
      if (!ragStatus.loaded) {
        return reply.status(503).send({ status: 'RAG_MISSING', message: 'Dataset not loaded' })
      }

      const permits = retrievePermitContext(jurisdiction, '')
      const zoning = retrieveZoningContext(jurisdiction)

      return reply.send({
        jurisdiction,
        permits,
        zoning,
        counts: { permits: permits.length, zoning: zoning.length },
      })
    },
  })
}

