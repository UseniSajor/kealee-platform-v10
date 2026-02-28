/**
 * OFAC Routes
 * API endpoints for OFACScreening and OFACCache management.
 */

import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { prisma } from '@kealee/database'
import { authenticateUser, requireAdmin } from '../../middleware/auth.middleware'
import {
  validateQuery,
  validateParams,
  validateBody,
}
import { sanitizeErrorMessage } from '../../utils/sanitize-error' from '../../middleware/validation.middleware'

// ---------------------------------------------------------------------------
// Zod Schemas
// ---------------------------------------------------------------------------

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
})

const idParamsSchema = z.object({
  id: z.string().uuid(),
})

// -- OFAC Screening ---------------------------------------------------------

const screenSchema = z.object({
  entityName: z.string().min(1).max(500),
  entityType: z.string().min(1), // "individual", "organization", "vessel", etc.
  requestData: z.any().optional(), // Additional search context
})

const screeningQuerySchema = paginationSchema.extend({
  entityName: z.string().optional(),
  entityType: z.string().optional(),
  matchFound: z.coerce.boolean().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
})

// -- OFAC Cache -------------------------------------------------------------

const cacheQuerySchema = paginationSchema.extend({
  key: z.string().optional(),
  expiredOnly: z.coerce.boolean().optional(),
})

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export async function ofacRoutes(fastify: FastifyInstance) {
  // All OFAC routes require admin authentication
  fastify.addHook('onRequest', async (request, reply) => {
    await authenticateUser(request, reply);
    await requireAdmin(request, reply);
  });

  // ========================================================================
  // OFAC SCREENING
  // ========================================================================

  /**
   * POST /screen
   * Perform an OFAC screening against the SDN list.
   * Checks the cache first; if a recent result exists it is returned.
   */
  fastify.post(
    '/screen',
    { preHandler: [validateBody(screenSchema)] },
    async (request, reply) => {
      try {
        const { entityName, entityType, requestData } =
          request.body as z.infer<typeof screenSchema>

        // Build a cache key from the entity details
        const cacheKey = `ofac:${entityType}:${entityName.toLowerCase().trim()}`

        // Check cache for a recent result
        const cached = await prisma.oFACCache.findUnique({
          where: { key: cacheKey },
        })

        if (cached && cached.expiresAt > new Date()) {
          return reply.send({
            success: true,
            data: {
              ...(cached.data as any),
              source: 'cache',
            },
          })
        }

        // Perform screening (placeholder logic - in production this would
        // call the US Treasury OFAC SDN API or a third-party service).
        const screeningId = randomUUID()
        const matchFound = false
        const matchScore = 0.0

        const screening = await prisma.oFACScreening.create({
          data: {
            screeningId,
            entityName,
            entityType,
            matchFound,
            matchScore,
            requestData: requestData ?? undefined,
          },
        })

        // Cache the result for 24 hours
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
        await prisma.oFACCache.upsert({
          where: { key: cacheKey },
          create: {
            key: cacheKey,
            data: {
              screeningId: screening.id,
              entityName,
              entityType,
              matchFound,
              matchScore,
            },
            expiresAt,
          },
          update: {
            data: {
              screeningId: screening.id,
              entityName,
              entityType,
              matchFound,
              matchScore,
            },
            expiresAt,
          },
        })

        return reply.code(201).send({
          success: true,
          data: {
            id: screening.id,
            screeningId: screening.screeningId,
            entityName: screening.entityName,
            entityType: screening.entityType,
            matchFound: screening.matchFound,
            matchScore: screening.matchScore,
            matchDetails: screening.matchDetails,
            screenedAt: screening.screenedAt,
            source: 'live',
          },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to perform OFAC screening'),
        })
      }
    },
  )

  /**
   * GET /screenings
   * List past OFAC screenings with filtering and pagination.
   */
  fastify.get(
    '/screenings',
    { preHandler: [validateQuery(screeningQuerySchema)] },
    async (request, reply) => {
      try {
        const {
          page, limit, entityName, entityType, matchFound, startDate, endDate,
        } = request.query as z.infer<typeof screeningQuerySchema>

        const where: any = {}
        if (entityName) {
          where.entityName = { contains: entityName, mode: 'insensitive' }
        }
        if (entityType) where.entityType = entityType
        if (matchFound !== undefined) where.matchFound = matchFound
        if (startDate || endDate) {
          where.screenedAt = {}
          if (startDate) where.screenedAt.gte = startDate
          if (endDate) where.screenedAt.lte = endDate
        }

        const skip = (page - 1) * limit

        const [screenings, total] = await Promise.all([
          prisma.oFACScreening.findMany({
            where,
            orderBy: { screenedAt: 'desc' },
            skip,
            take: limit,
          }),
          prisma.oFACScreening.count({ where }),
        ])

        return reply.send({
          success: true,
          data: screenings,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to fetch OFAC screenings'),
        })
      }
    },
  )

  /**
   * GET /screenings/:id
   * Get a single OFAC screening by ID.
   */
  fastify.get(
    '/screenings/:id',
    { preHandler: [validateParams(idParamsSchema)] },
    async (request, reply) => {
      try {
        const { id } = request.params as z.infer<typeof idParamsSchema>

        const screening = await prisma.oFACScreening.findUnique({
          where: { id },
        })

        if (!screening) {
          return reply.code(404).send({
            success: false,
            error: 'OFAC screening not found',
          })
        }

        return reply.send({ success: true, data: screening })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to fetch OFAC screening'),
        })
      }
    },
  )

  // ========================================================================
  // OFAC CACHE
  // ========================================================================

  /**
   * GET /cache
   * List OFAC cache entries.
   */
  fastify.get(
    '/cache',
    { preHandler: [validateQuery(cacheQuerySchema)] },
    async (request, reply) => {
      try {
        const { page, limit, key, expiredOnly } =
          request.query as z.infer<typeof cacheQuerySchema>

        const where: any = {}
        if (key) {
          where.key = { contains: key, mode: 'insensitive' }
        }
        if (expiredOnly) {
          where.expiresAt = { lt: new Date() }
        }

        const skip = (page - 1) * limit

        const [entries, total] = await Promise.all([
          prisma.oFACCache.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
          }),
          prisma.oFACCache.count({ where }),
        ])

        return reply.send({
          success: true,
          data: entries,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to fetch OFAC cache entries'),
        })
      }
    },
  )

  /**
   * DELETE /cache/:id
   * Clear a specific OFAC cache entry.
   */
  fastify.delete(
    '/cache/:id',
    { preHandler: [validateParams(idParamsSchema)] },
    async (request, reply) => {
      try {
        const { id } = request.params as z.infer<typeof idParamsSchema>

        const existing = await prisma.oFACCache.findUnique({ where: { id } })
        if (!existing) {
          return reply.code(404).send({
            success: false,
            error: 'OFAC cache entry not found',
          })
        }

        await prisma.oFACCache.delete({ where: { id } })

        return reply.send({
          success: true,
          message: 'Cache entry deleted successfully',
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to delete OFAC cache entry'),
        })
      }
    },
  )
}
