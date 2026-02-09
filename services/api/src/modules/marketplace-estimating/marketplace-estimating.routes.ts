/**
 * Marketplace Estimating Routes
 *
 * Registered under /api/v1/estimate and /api/v1/assemblies
 *
 * Routes:
 *   POST /api/v1/estimate/quick      — Instant estimate (no auth needed)
 *   POST /api/v1/estimate/detailed    — Full detailed estimate (auth required)
 *   GET  /api/v1/estimate/:id         — Get saved estimate
 *   POST /api/v1/estimate/validate-bid — Validate bid against suggested price
 *   GET  /api/v1/assemblies           — Browse assembly library
 *   GET  /api/v1/assemblies/:code     — Get single assembly by code
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../auth/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../../middleware/validation.middleware'
import { cacheMiddleware, CACHE_TTL } from '../../middleware/cache.middleware'
import { prismaAny } from '../../utils/prisma-helper'
import { EstimatingService } from '@kealee/estimating'

// Shared service instance
const estimatingService = new EstimatingService(prismaAny)

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const quickEstimateSchema = z.object({
  projectType: z.string().min(1),
  sqft: z.number().min(10).max(100000).optional(),
  location: z.string().min(1),
  qualityTier: z.enum(['low', 'mid', 'high']).optional(),
  description: z.string().max(2000).optional(),
})

const detailedEstimateSchema = z.object({
  projectType: z.string().min(1),
  sqft: z.number().min(10).max(100000).optional(),
  location: z.string().min(1),
  qualityTier: z.enum(['low', 'mid', 'high']).default('mid'),
  projectId: z.string().uuid().optional(),
  leadId: z.string().uuid().optional(),
  description: z.string().max(5000).optional(),
  customLineItems: z
    .array(
      z.object({
        assemblyCode: z.string().min(1),
        quantity: z.number().min(0.01),
      })
    )
    .optional(),
})

const validateBidSchema = z.object({
  leadId: z.string().uuid(),
  bidAmount: z.number().min(0),
})

const assemblyQuerySchema = z.object({
  category: z.string().optional(),
  trade: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
})

// ---------------------------------------------------------------------------
// Route plugin
// ---------------------------------------------------------------------------

export async function marketplaceEstimatingRoutes(fastify: FastifyInstance) {
  // ─── POST /estimate/quick ─────────────────────────────────────────
  // Public endpoint — powers the marketing site "instant estimate" feature
  fastify.post(
    '/estimate/quick',
    { preHandler: [validateBody(quickEstimateSchema)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = request.body as z.infer<typeof quickEstimateSchema>

      try {
        const result = await estimatingService.calculateSuggestedPrice({
          projectType: body.projectType,
          sqft: body.sqft,
          location: body.location,
          qualityTier: body.qualityTier,
          description: body.description,
        })

        return reply.send({
          suggestedPrice: result.suggestedPrice,
          priceRange: result.priceRange,
          breakdown: result.breakdown,
          assumptions: result.assumptions,
        })
      } catch (err: any) {
        fastify.log.error(err)
        return reply.code(400).send({ error: err.message || 'Failed to calculate estimate' })
      }
    }
  )

  // ─── POST /estimate/detailed ──────────────────────────────────────
  // Creates a persisted QuickEstimate record
  fastify.post(
    '/estimate/detailed',
    { preHandler: [authenticateUser, validateBody(detailedEstimateSchema)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user
      const body = request.body as z.infer<typeof detailedEstimateSchema>

      try {
        const estimate = await estimatingService.createEstimate({
          projectType: body.projectType,
          sqft: body.sqft,
          location: body.location,
          qualityTier: body.qualityTier,
          projectId: body.projectId,
          leadId: body.leadId,
          description: body.description,
          customLineItems: body.customLineItems,
          createdBy: user.userId || user.id,
        })

        return reply.code(201).send({ estimate })
      } catch (err: any) {
        fastify.log.error(err)
        return reply.code(400).send({ error: err.message || 'Failed to create estimate' })
      }
    }
  )

  // ─── GET /estimate/:id ────────────────────────────────────────────
  fastify.get(
    '/estimate/:id',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string }

      const estimate = await estimatingService.getEstimateById(id)
      if (!estimate) {
        return reply.code(404).send({ error: 'Estimate not found' })
      }

      return reply.send({ estimate })
    }
  )

  // ─── POST /estimate/validate-bid ──────────────────────────────────
  fastify.post(
    '/estimate/validate-bid',
    { preHandler: [authenticateUser, validateBody(validateBidSchema)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = request.body as z.infer<typeof validateBidSchema>

      try {
        const result = await estimatingService.validateBidPrice(body.leadId, body.bidAmount)
        return reply.send(result)
      } catch (err: any) {
        fastify.log.error(err)
        return reply.code(400).send({ error: err.message || 'Failed to validate bid' })
      }
    }
  )

  // ─── GET /assemblies ──────────────────────────────────────────────
  fastify.get(
    '/assemblies',
    { preHandler: [
      cacheMiddleware({
        ttl: CACHE_TTL.ASSEMBLY_LIBRARY,
        key: (req) => `assemblies:${JSON.stringify(req.query)}`,
      }),
      validateQuery(assemblyQuerySchema),
    ] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = request.query as z.infer<typeof assemblyQuerySchema>

      try {
        const result = await estimatingService.getAssemblyLibrary({
          categoryId: query.category,
          trade: query.trade,
          search: query.search,
          page: query.page,
          limit: query.limit,
        })

        return reply.send(result)
      } catch (err: any) {
        fastify.log.error(err)
        return reply.code(500).send({ error: err.message || 'Failed to fetch assemblies' })
      }
    }
  )

  // ─── GET /assemblies/:code ────────────────────────────────────────
  fastify.get(
    '/assemblies/:code',
    { preHandler: [
      cacheMiddleware({
        ttl: CACHE_TTL.ASSEMBLY_LIBRARY,
        key: (req) => `assembly:${(req.params as any).code}`,
      }),
      validateParams(z.object({ code: z.string().min(1) })),
    ] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { code } = request.params as { code: string }

      const assembly = await estimatingService.getAssemblyByCode(code)
      if (!assembly) {
        return reply.code(404).send({ error: `Assembly ${code} not found` })
      }

      return reply.send({ assembly })
    }
  )
}
