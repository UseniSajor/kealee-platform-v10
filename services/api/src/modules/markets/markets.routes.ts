/**
 * markets.routes.ts — Multi-Market Expansion Operating System
 * Prefix: /markets
 */
import type { FastifyInstance } from 'fastify'
import { authenticateUser } from '../../middleware/auth'
import {
  CreateMarketDto,
  UpdateMarketDto,
  CreateLaunchChecklistItemDto,
  UpdateLaunchChecklistItemDto,
  SetMarketConfigDto,
} from './markets.dto'
import {
  listMarkets,
  getMarket,
  createMarket,
  updateMarket,
  getChecklist,
  createChecklistItem,
  updateChecklistItem,
  getMarketConfig,
  setMarketConfig,
  getMarketStats,
} from './markets.service'

export async function marketsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticateUser)

  // ─── Markets ───────────────────────────────────────────────────────────────

  /** GET /markets?status=ACTIVE */
  fastify.get('/', async (request, reply) => {
    const { status } = request.query as Record<string, string>
    const markets = await listMarkets(status)
    return reply.send({ markets })
  })

  /** POST /markets */
  fastify.post('/', async (request, reply) => {
    const body = CreateMarketDto.parse(request.body)
    const market = await createMarket(body)
    return reply.status(201).send({ market })
  })

  /** GET /markets/:id */
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const market = await getMarket(id)
    return reply.send({ market })
  })

  /** PATCH /markets/:id */
  fastify.patch('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = UpdateMarketDto.parse(request.body)
    const market = await updateMarket(id, body)
    return reply.send({ market })
  })

  /** GET /markets/:id/stats */
  fastify.get('/:id/stats', async (request, reply) => {
    const { id } = request.params as { id: string }
    const stats = await getMarketStats(id)
    return reply.send({ stats })
  })

  // ─── Launch Checklist ──────────────────────────────────────────────────────

  /** GET /markets/:id/checklist */
  fastify.get('/:id/checklist', async (request, reply) => {
    const { id } = request.params as { id: string }
    const items = await getChecklist(id)
    return reply.send({ items })
  })

  /** POST /markets/:id/checklist */
  fastify.post('/:id/checklist', async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = CreateLaunchChecklistItemDto.parse({ ...request.body as object, marketId: id })
    const item = await createChecklistItem(body)
    return reply.status(201).send({ item })
  })

  /** PATCH /markets/:id/checklist/:itemId */
  fastify.patch('/:id/checklist/:itemId', async (request, reply) => {
    const { itemId } = request.params as { id: string; itemId: string }
    const body = UpdateLaunchChecklistItemDto.parse(request.body)
    const item = await updateChecklistItem(itemId, body)
    return reply.send({ item })
  })

  // ─── Market Config ─────────────────────────────────────────────────────────

  /** GET /markets/:id/config */
  fastify.get('/:id/config', async (request, reply) => {
    const { id } = request.params as { id: string }
    const config = await getMarketConfig(id)
    return reply.send({ config })
  })

  /** PUT /markets/:id/config */
  fastify.put('/:id/config', async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = SetMarketConfigDto.parse(request.body)
    await setMarketConfig(id, body)
    return reply.status(204).send()
  })

  fastify.setErrorHandler((error, _request, reply) => {
    const statusCode = (error as any).statusCode ?? 500
    fastify.log.error(error)
    return reply.status(statusCode).send({ error: error.message, statusCode })
  })
}
