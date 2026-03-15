/**
 * intelligence.routes.ts — Marketplace Intelligence Layer
 * Prefix: /intelligence
 */
import type { FastifyInstance } from 'fastify'
import { authenticateUser } from '../middleware/auth'
import {
  RecordScoreEventDto,
  MarketInsightQueryDto,
  ContractorPerformanceQueryDto,
  LeadFunnelQueryDto,
  GetContractorRecommendationsDto,
} from './intelligence.dto'
import {
  recordScoreEvent,
  getEntityScore,
  getMarketInsights,
  getContractorPerformance,
  getLeadFunnel,
  getContractorRecommendations,
} from './intelligence.service'

export async function intelligenceRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticateUser)

  // ─── Scoring ───────────────────────────────────────────────────────────────

  /** POST /intelligence/scores/events — record a score event */
  fastify.post('/scores/events', async (request, reply) => {
    const body = RecordScoreEventDto.parse(request.body)
    await recordScoreEvent(body)
    return reply.status(201).send({ ok: true })
  })

  /** GET /intelligence/scores/:entityType/:entityId */
  fastify.get('/scores/:entityType/:entityId', async (request, reply) => {
    const { entityType, entityId } = request.params as { entityType: string; entityId: string }
    const score = await getEntityScore(entityId, entityType)
    if (!score) return reply.status(404).send({ error: 'Score not found' })
    return reply.send({ score })
  })

  // ─── Market Insights ───────────────────────────────────────────────────────

  /** GET /intelligence/insights/market */
  fastify.get('/insights/market', async (request, reply) => {
    const query = MarketInsightQueryDto.parse(request.query)
    const insights = await getMarketInsights(query)
    return reply.send({ insights })
  })

  // ─── Contractor Performance ────────────────────────────────────────────────

  /** GET /intelligence/insights/contractor/:contractorId */
  fastify.get('/insights/contractor/:contractorId', async (request, reply) => {
    const { contractorId } = request.params as { contractorId: string }
    const { period = '90d' } = request.query as { period?: string }
    const perf = await getContractorPerformance({ contractorId, period: period as any })
    return reply.send({ performance: perf })
  })

  // ─── Lead Funnel ───────────────────────────────────────────────────────────

  /** GET /intelligence/insights/funnel */
  fastify.get('/insights/funnel', async (request, reply) => {
    const query = LeadFunnelQueryDto.parse(request.query)
    const funnel = await getLeadFunnel(query)
    return reply.send({ funnel })
  })

  // ─── Recommendations ───────────────────────────────────────────────────────

  /** POST /intelligence/recommendations/contractors */
  fastify.post('/recommendations/contractors', async (request, reply) => {
    const body = GetContractorRecommendationsDto.parse(request.body)
    const recommendations = await getContractorRecommendations(body)
    return reply.send({ recommendations })
  })

  fastify.setErrorHandler((error, _request, reply) => {
    const statusCode = (error as any).statusCode ?? 500
    fastify.log.error(error)
    return reply.status(statusCode).send({ error: error.message, statusCode })
  })
}
