/**
 * KEALEE - PATTERN BOOK ROUTES
 * 21st Century ROAD to Housing Act — Sec 210 (Public availability mandate)
 */

import { FastifyInstance } from 'fastify'
import { authenticateUser } from '../auth/auth.middleware'
import { z } from 'zod'
import { patternBookService } from './pattern-book.service'
import { sanitizeErrorMessage } from '../../utils/sanitize-error'

// ─── Validation Schemas ─────────────────────────────────────────────────────────

const createDesignSchema = z.object({
  housingType: z.enum([
    'SINGLE_FAMILY', 'ADU', 'DUPLEX', 'TRIPLEX', 'FOURPLEX',
    'TOWNHOUSE', 'SMALL_APARTMENT', 'MID_RISE', 'MIXED_USE', 'MANUFACTURED', 'MODULAR',
  ]),
  name: z.string().min(3),
  slug: z.string().min(3),
  description: z.string().min(10),
  style: z.string(),
  totalSqFt: z.number().min(100),
  stories: z.number().int().min(1).max(10),
  bedrooms: z.number().int().min(0).max(20),
  bathrooms: z.number().min(0).max(20),
  garageSpaces: z.number().int().min(0).optional(),
  costRangeLow: z.number().min(0),
  costRangeHigh: z.number().min(0),
  constructionDays: z.number().int().optional(),
  floorPlanUrl: z.string().url().optional(),
  elevationUrl: z.string().url().optional(),
  renderingUrl: z.string().url().optional(),
  roomSchedule: z.any().optional(),
  complianceNotes: z.string().optional(),
  isPublic: z.boolean().optional(),
  jurisdictionId: z.string().uuid().optional(),
})

const selectDesignSchema = z.object({
  customizations: z.record(z.any()).optional(),
})

// ─── Routes ─────────────────────────────────────────────────────────────────────

export async function patternBookRoutes(fastify: FastifyInstance) {
  // ── Public Routes (Sec 210 — designs must be publicly available) ───────────

  // GET /pattern-book/designs — Public catalog
  fastify.get('/designs', {
    handler: async (request, reply) => {
      try {
        const query = request.query as any
        const result = await patternBookService.listDesigns({
          housingType: query.housingType,
          minSqFt: query.minSqFt ? Number(query.minSqFt) : undefined,
          maxSqFt: query.maxSqFt ? Number(query.maxSqFt) : undefined,
          bedrooms: query.bedrooms ? Number(query.bedrooms) : undefined,
          style: query.style,
          minCost: query.minCost ? Number(query.minCost) : undefined,
          maxCost: query.maxCost ? Number(query.maxCost) : undefined,
          jurisdictionId: query.jurisdictionId,
          page: query.page ? Number(query.page) : 1,
          limit: query.limit ? Number(query.limit) : 20,
        })
        return reply.send({ success: true, data: result })
      } catch (error: any) {
        request.log.error(error, 'List designs failed')
        return reply.status(500).send({ success: false, error: sanitizeErrorMessage(error) })
      }
    },
  })

  // GET /pattern-book/designs/:idOrSlug — Public detail
  fastify.get('/designs/:idOrSlug', {
    handler: async (request, reply) => {
      try {
        const { idOrSlug } = request.params as { idOrSlug: string }
        const result = await patternBookService.getDesign(idOrSlug)
        return reply.send({ success: true, data: result })
      } catch (error: any) {
        request.log.error(error, 'Get design failed')
        return reply.status(error.statusCode || 500).send({ success: false, error: sanitizeErrorMessage(error) })
      }
    },
  })

  // GET /pattern-book/designs/:id/cost-estimate — Location-adjusted cost
  fastify.get('/designs/:id/cost-estimate', {
    handler: async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const { zipCode, state } = request.query as { zipCode?: string; state?: string }
        const result = await patternBookService.getCostEstimate(id, zipCode, state)
        return reply.send({ success: true, data: result })
      } catch (error: any) {
        request.log.error(error, 'Cost estimate failed')
        return reply.status(error.statusCode || 500).send({ success: false, error: sanitizeErrorMessage(error) })
      }
    },
  })

  // GET /pattern-book/housing-types — Types with counts
  fastify.get('/housing-types', {
    handler: async (request, reply) => {
      try {
        const result = await patternBookService.getHousingTypes()
        return reply.send({ success: true, data: result })
      } catch (error: any) {
        request.log.error(error, 'Get housing types failed')
        return reply.status(500).send({ success: false, error: sanitizeErrorMessage(error) })
      }
    },
  })

  // GET /pattern-book/featured — Featured designs for homepage
  fastify.get('/featured', {
    handler: async (request, reply) => {
      try {
        const { limit } = request.query as { limit?: string }
        const result = await patternBookService.getFeatured(limit ? Number(limit) : 6)
        return reply.send({ success: true, data: result })
      } catch (error: any) {
        request.log.error(error, 'Get featured designs failed')
        return reply.status(500).send({ success: false, error: sanitizeErrorMessage(error) })
      }
    },
  })

  // ── Authenticated Routes ──────────────────────────────────────────────────

  // POST /pattern-book/designs — Create design (admin)
  fastify.post('/designs', {
    preHandler: [authenticateUser],
    handler: async (request, reply) => {
      try {
        const body = createDesignSchema.parse(request.body)
        const userId = (request as any).user?.id
        const result = await patternBookService.createDesign(body, userId)
        return reply.status(201).send({ success: true, data: result })
      } catch (error: any) {
        if (error.name === 'ZodError') {
          return reply.status(400).send({ success: false, error: 'Validation error', details: error.errors })
        }
        request.log.error(error, 'Create design failed')
        return reply.status(500).send({ success: false, error: sanitizeErrorMessage(error) })
      }
    },
  })

  // POST /pattern-book/designs/:id/select — User selection
  fastify.post('/designs/:id/select', {
    preHandler: [authenticateUser],
    handler: async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const body = selectDesignSchema.parse(request.body || {})
        const userId = (request as any).user?.id
        const result = await patternBookService.selectDesign(id, userId, body.customizations)
        return reply.send({ success: true, data: result })
      } catch (error: any) {
        request.log.error(error, 'Select design failed')
        return reply.status(error.statusCode || 500).send({ success: false, error: sanitizeErrorMessage(error) })
      }
    },
  })

  // POST /pattern-book/designs/:id/permit-checklist — Jurisdiction permit requirements
  fastify.post('/designs/:id/permit-checklist', {
    preHandler: [authenticateUser],
    handler: async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const { jurisdictionId } = request.body as { jurisdictionId: string }
        if (!jurisdictionId) {
          return reply.status(400).send({ success: false, error: 'jurisdictionId is required' })
        }
        const result = await patternBookService.getPermitChecklist(id, jurisdictionId)
        return reply.send({ success: true, data: result })
      } catch (error: any) {
        request.log.error(error, 'Permit checklist failed')
        return reply.status(error.statusCode || 500).send({ success: false, error: sanitizeErrorMessage(error) })
      }
    },
  })
}
