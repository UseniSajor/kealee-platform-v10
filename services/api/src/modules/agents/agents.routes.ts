/**
 * services/api/src/modules/agents/agents.routes.ts
 *
 * RAG-powered construction agent endpoints.
 *
 * POST /api/v1/agents/land/execute
 * POST /api/v1/agents/design/execute
 * POST /api/v1/agents/permit/execute
 * POST /api/v1/agents/contractor/execute
 * GET  /api/v1/agents/status
 */

import type { FastifyInstance } from 'fastify'
import { executeLandAgent } from '../../../../ai-orchestrator/src/agents/land-agent'
import { executeDesignAgent } from '../../../../ai-orchestrator/src/agents/design-agent'
import { executePermitAgent } from '../../../../ai-orchestrator/src/agents/permit-agent'
import { executeContractorAgent } from '../../../../ai-orchestrator/src/agents/contractor-agent'
import { getRAGStatus } from '../../../../ai-orchestrator/src/retrieval/rag-retriever'

export async function agentsRoutes(fastify: FastifyInstance) {
  // GET /agents/status — health check for all agents + RAG
  fastify.get('/status', async (_req, reply) => {
    const rag = getRAGStatus()
    return reply.send({
      agents: ['land', 'design', 'permit', 'contractor'],
      rag: {
        loaded: rag.loaded,
        recordCount: rag.recordCount,
      },
      ready: rag.loaded,
    })
  })

  // POST /agents/land/execute
  fastify.post('/land/execute', async (request, reply) => {
    const body = request.body as any
    if (!body?.jurisdiction) {
      return reply.code(400).send({ error: 'jurisdiction is required' })
    }
    const result = await executeLandAgent({
      jurisdiction: body.jurisdiction,
      projectType: body.projectType ?? 'residential',
      address: body.address,
      stage: body.stage ?? 'land-analysis',
    })
    return reply.send(result)
  })

  // POST /agents/design/execute
  fastify.post('/design/execute', async (request, reply) => {
    const body = request.body as any
    if (!body?.projectType) {
      return reply.code(400).send({ error: 'projectType is required' })
    }
    const result = await executeDesignAgent({
      jurisdiction: body.jurisdiction ?? '',
      projectType: body.projectType,
      stage: body.stage ?? 'design',
    })
    return reply.send(result)
  })

  // POST /agents/permit/execute
  fastify.post('/permit/execute', async (request, reply) => {
    const body = request.body as any
    if (!body?.jurisdiction) {
      return reply.code(400).send({ error: 'jurisdiction is required' })
    }
    const result = await executePermitAgent({
      jurisdiction: body.jurisdiction,
      projectType: body.projectType ?? 'residential',
      stage: body.stage ?? 'permitting',
    })
    return reply.send(result)
  })

  // POST /agents/contractor/execute
  fastify.post('/contractor/execute', async (request, reply) => {
    const body = request.body as any
    if (!body?.projectType) {
      return reply.code(400).send({ error: 'projectType is required' })
    }
    const result = await executeContractorAgent({
      jurisdiction: body.jurisdiction ?? '',
      projectType: body.projectType,
      stage: body.stage ?? 'construction',
    })
    return reply.send(result)
  })
}
