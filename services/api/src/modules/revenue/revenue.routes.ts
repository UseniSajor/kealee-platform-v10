/**
 * revenue.routes.ts — Revenue Optimization Layer
 * Prefix: /revenue
 */
import type { FastifyInstance } from 'fastify'
import { authenticateUser } from '../../middleware/auth'
import {
  CreateSubscriptionPlanDto,
  UpdateSubscriptionPlanDto,
  CreateLeadPricingDto,
  CreateSponsoredPlacementDto,
  GetUpsellOfferDto,
  StartCheckoutDto,
} from './revenue.dto'
import {
  listSubscriptionPlans,
  getSubscriptionPlan,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  listLeadPricing,
  getLeadPrice,
  upsertLeadPricing,
  createSponsoredPlacement,
  getActivePlacements,
  recordPlacementImpression,
  recordPlacementClick,
  getUpsellOffer,
  startCheckout,
} from './revenue.service'

export async function revenueRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticateUser)

  // ─── Subscription Plans ────────────────────────────────────────────────────

  /** GET /revenue/plans — list active plans (public-ish, but behind auth for personalization) */
  fastify.get('/plans', async (request, reply) => {
    const { includeInactive = 'false' } = request.query as Record<string, string>
    const plans = await listSubscriptionPlans(includeInactive === 'true')
    return reply.send({ plans })
  })

  /** GET /revenue/plans/:id */
  fastify.get('/plans/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const plan = await getSubscriptionPlan(id)
    return reply.send({ plan })
  })

  /** POST /revenue/plans — admin only */
  fastify.post('/plans', async (request, reply) => {
    const body = CreateSubscriptionPlanDto.parse(request.body)
    const plan = await createSubscriptionPlan(body)
    return reply.status(201).send({ plan })
  })

  /** PATCH /revenue/plans/:id — admin only */
  fastify.patch('/plans/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = UpdateSubscriptionPlanDto.parse(request.body)
    const plan = await updateSubscriptionPlan(id, body)
    return reply.send({ plan })
  })

  // ─── Lead Pricing ──────────────────────────────────────────────────────────

  /** GET /revenue/lead-pricing?tradeCategory=&jurisdictionCode= */
  fastify.get('/lead-pricing', async (request, reply) => {
    const { tradeCategory, jurisdictionCode } = request.query as Record<string, string>
    const prices = await listLeadPricing(tradeCategory, jurisdictionCode)
    return reply.send({ prices })
  })

  /** GET /revenue/lead-pricing/lookup?tradeCategory=&jurisdictionCode= */
  fastify.get('/lead-pricing/lookup', async (request, reply) => {
    const { tradeCategory, jurisdictionCode } = request.query as Record<string, string>
    if (!tradeCategory || !jurisdictionCode) {
      return reply.status(400).send({ error: 'tradeCategory and jurisdictionCode required' })
    }
    const price = await getLeadPrice(tradeCategory, jurisdictionCode)
    return reply.send({ price })
  })

  /** PUT /revenue/lead-pricing — admin: upsert */
  fastify.put('/lead-pricing', async (request, reply) => {
    const body = CreateLeadPricingDto.parse(request.body)
    const price = await upsertLeadPricing(body)
    return reply.send({ price })
  })

  // ─── Sponsored Placements ──────────────────────────────────────────────────

  /** POST /revenue/placements */
  fastify.post('/placements', async (request, reply) => {
    const user = (request as any).user
    const body = CreateSponsoredPlacementDto.parse(request.body)
    const placement = await createSponsoredPlacement(body, user.id)
    return reply.status(201).send({ placement })
  })

  /** GET /revenue/placements/active?type=&jurisdiction=&tradeCategory= */
  fastify.get('/placements/active', async (request, reply) => {
    const { type, jurisdiction, tradeCategory } = request.query as Record<string, string>
    if (!type) return reply.status(400).send({ error: 'type required' })
    const placements = await getActivePlacements(type, { jurisdiction, tradeCategory })
    return reply.send({ placements })
  })

  /** POST /revenue/placements/:id/impression */
  fastify.post('/placements/:id/impression', async (request, reply) => {
    const { id } = request.params as { id: string }
    await recordPlacementImpression(id)
    return reply.status(204).send()
  })

  /** POST /revenue/placements/:id/click */
  fastify.post('/placements/:id/click', async (request, reply) => {
    const { id } = request.params as { id: string }
    await recordPlacementClick(id)
    return reply.status(204).send()
  })

  // ─── Upsell Offers ─────────────────────────────────────────────────────────

  /** POST /revenue/upsell-offer */
  fastify.post('/upsell-offer', async (request, reply) => {
    const body = GetUpsellOfferDto.parse(request.body)
    const offer = await getUpsellOffer(body)
    return reply.send({ offer })
  })

  // ─── Stripe Checkout ───────────────────────────────────────────────────────

  /** POST /revenue/checkout */
  fastify.post('/checkout', async (request, reply) => {
    const user = (request as any).user
    const body = StartCheckoutDto.parse(request.body)
    const session = await startCheckout(user.id, body)
    return reply.send(session)
  })

  fastify.setErrorHandler((error, _request, reply) => {
    const statusCode = (error as any).statusCode ?? 500
    fastify.log.error(error)
    return reply.status(statusCode).send({ error: error.message, statusCode })
  })
}
