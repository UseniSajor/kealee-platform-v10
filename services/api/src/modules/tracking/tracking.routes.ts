/**
 * Tracking Routes
 * Read/write for UserAction, QuickEstimate, AutomationEvent, CrewCheckIn
 */

import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../../middleware/auth.middleware'
import { validateBody, validateQuery } from '../../middleware/validation.middleware'
import { prisma } from '@kealee/database'
import { sanitizeErrorMessage } from '../../utils/sanitize-error'

// ---------------------------------------------------------------------------
// Zod Schemas
// ---------------------------------------------------------------------------

const quickEstimateCreateSchema = z.object({
  projectId: z.string().uuid().optional(),
  leadId: z.string().uuid().optional(),
  projectType: z.string().min(1),
  sqft: z.number().min(0).optional(),
  location: z.string().min(1),
  qualityTier: z.enum(['low', 'mid', 'high']).optional(),
  description: z.string().optional(),
  materialTotal: z.number().min(0),
  laborTotal: z.number().min(0),
  subtotal: z.number().min(0),
  overhead: z.number().min(0),
  profit: z.number().min(0),
  contingency: z.number().min(0),
  grandTotal: z.number().min(0),
  priceLow: z.number().min(0),
  priceMid: z.number().min(0),
  priceHigh: z.number().min(0),
})

const crewCheckInCreateSchema = z.object({
  projectId: z.string().uuid(),
  type: z.enum(['ARRIVE', 'DEPART']),
  latitude: z.number(),
  longitude: z.number(),
  verified: z.boolean().optional(),
  distance: z.number().optional(),
  hoursOnSite: z.number().optional(),
  notes: z.string().optional(),
  photo: z.string().url().optional(),
})

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export async function trackingRoutes(fastify: FastifyInstance) {
  // Apply auth to all routes
  fastify.addHook('onRequest', async (request, reply) => {
    await authenticateUser(request, reply)
  })

  // ========================================================================
  // USER ACTIONS
  // ========================================================================

  // GET /user-actions - List user actions (filter by userId, type)
  fastify.get(
    '/user-actions',
    {
      preHandler: [
        validateQuery(
          z.object({
            page: z.string().optional(),
            limit: z.string().optional(),
            userId: z.string().uuid().optional(),
            action: z.string().optional(),
            entity: z.string().optional(),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const query = request.query as {
          page?: string; limit?: string; userId?: string; action?: string; entity?: string
        }
        const page = Math.max(1, parseInt(query.page || '1', 10))
        const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)))
        const skip = (page - 1) * limit

        const where: any = {}
        if (query.userId) where.userId = query.userId
        if (query.action) where.action = query.action
        if (query.entity) where.entity = query.entity

        const [actions, total] = await Promise.all([
          (prisma as any).userAction.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
          }),
          (prisma as any).userAction.count({ where }),
        ])

        return reply.send({
          data: actions,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to list user actions') })
      }
    }
  )

  // ========================================================================
  // QUICK ESTIMATES
  // ========================================================================

  // GET /quick-estimates - List quick estimates (filter by userId)
  fastify.get(
    '/quick-estimates',
    {
      preHandler: [
        validateQuery(
          z.object({
            page: z.string().optional(),
            limit: z.string().optional(),
            userId: z.string().uuid().optional(),
            projectType: z.string().optional(),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const query = request.query as {
          page?: string; limit?: string; userId?: string; projectType?: string
        }
        const page = Math.max(1, parseInt(query.page || '1', 10))
        const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)))
        const skip = (page - 1) * limit

        const where: any = {}
        if (query.userId) where.createdBy = query.userId
        if (query.projectType) where.projectType = query.projectType

        const [estimates, total] = await Promise.all([
          (prisma as any).quickEstimate.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
          }),
          (prisma as any).quickEstimate.count({ where }),
        ])

        return reply.send({
          data: estimates,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to list quick estimates') })
      }
    }
  )

  // POST /quick-estimates - Create quick estimate
  fastify.post(
    '/quick-estimates',
    {
      preHandler: [validateBody(quickEstimateCreateSchema)],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const body = request.body as z.infer<typeof quickEstimateCreateSchema>

        const estimate = await (prisma as any).quickEstimate.create({
          data: {
            ...body,
            createdBy: user.id,
          },
        })

        return reply.code(201).send({ data: estimate })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: sanitizeErrorMessage(error, 'Failed to create quick estimate') })
      }
    }
  )

  // ========================================================================
  // AUTOMATION EVENTS
  // ========================================================================

  // GET /automation-events - List automation events (filter by appId, type)
  fastify.get(
    '/automation-events',
    {
      preHandler: [
        validateQuery(
          z.object({
            page: z.string().optional(),
            limit: z.string().optional(),
            sourceApp: z.string().optional(),
            eventType: z.string().optional(),
            projectId: z.string().uuid().optional(),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const query = request.query as {
          page?: string; limit?: string; sourceApp?: string; eventType?: string; projectId?: string
        }
        const page = Math.max(1, parseInt(query.page || '1', 10))
        const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)))
        const skip = (page - 1) * limit

        const where: any = {}
        if (query.sourceApp) where.sourceApp = query.sourceApp
        if (query.eventType) where.eventType = query.eventType
        if (query.projectId) where.projectId = query.projectId

        const [events, total] = await Promise.all([
          (prisma as any).automationEvent.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
          }),
          (prisma as any).automationEvent.count({ where }),
        ])

        return reply.send({
          data: events,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to list automation events') })
      }
    }
  )

  // ========================================================================
  // CREW CHECK-INS
  // ========================================================================

  // GET /crew-check-ins - List crew check-ins (filter by projectId, date)
  fastify.get(
    '/crew-check-ins',
    {
      preHandler: [
        validateQuery(
          z.object({
            page: z.string().optional(),
            limit: z.string().optional(),
            projectId: z.string().uuid().optional(),
            userId: z.string().uuid().optional(),
            date: z.string().optional(), // ISO date string
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const query = request.query as {
          page?: string; limit?: string; projectId?: string; userId?: string; date?: string
        }
        const page = Math.max(1, parseInt(query.page || '1', 10))
        const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)))
        const skip = (page - 1) * limit

        const where: any = {}
        if (query.projectId) where.projectId = query.projectId
        if (query.userId) where.userId = query.userId
        if (query.date) {
          const dateStart = new Date(query.date)
          const dateEnd = new Date(query.date)
          dateEnd.setDate(dateEnd.getDate() + 1)
          where.createdAt = { gte: dateStart, lt: dateEnd }
        }

        const [checkIns, total] = await Promise.all([
          (prisma as any).crewCheckIn.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
          }),
          (prisma as any).crewCheckIn.count({ where }),
        ])

        return reply.send({
          data: checkIns,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to list crew check-ins') })
      }
    }
  )

  // POST /crew-check-ins - Create crew check-in
  fastify.post(
    '/crew-check-ins',
    {
      preHandler: [validateBody(crewCheckInCreateSchema)],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const body = request.body as z.infer<typeof crewCheckInCreateSchema>

        const checkIn = await (prisma as any).crewCheckIn.create({
          data: {
            ...body,
            userId: user.id,
          },
        })

        return reply.code(201).send({ data: checkIn })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: sanitizeErrorMessage(error, 'Failed to create crew check-in') })
      }
    }
  )
}
