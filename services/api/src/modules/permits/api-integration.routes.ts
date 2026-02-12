/**
 * API Integration Routes
 * CRUD for APIIntegration, APICall, WebhookEvent
 */

import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../../middleware/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../../middleware/validation.middleware'
import { prisma } from '@kealee/database'

// ---------------------------------------------------------------------------
// Zod Schemas
// ---------------------------------------------------------------------------

const integrationCreateSchema = z.object({
  jurisdictionId: z.string().uuid(),
  provider: z.string().min(1),
  integrationType: z.string().min(1),
  apiUrl: z.string().url(),
  apiKey: z.string().min(1),
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  endpoints: z.any(),
  fieldMappings: z.any(),
  webhookUrl: z.string().url().optional(),
  webhookSecret: z.string().optional(),
})

const integrationUpdateSchema = z.object({
  provider: z.string().min(1).optional(),
  integrationType: z.string().min(1).optional(),
  apiUrl: z.string().url().optional(),
  apiKey: z.string().min(1).optional(),
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  endpoints: z.any().optional(),
  fieldMappings: z.any().optional(),
  webhookUrl: z.string().url().optional(),
  webhookSecret: z.string().optional(),
  isActive: z.boolean().optional(),
})

const paginationQuery = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
})

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export async function apiIntegrationRoutes(fastify: FastifyInstance) {
  // Apply auth to all routes
  fastify.addHook('onRequest', async (request, reply) => {
    await authenticateUser(request, reply)
  })

  // ========================================================================
  // API INTEGRATIONS
  // ========================================================================

  // GET /integrations - List API integrations (filter by jurisdictionId)
  fastify.get(
    '/integrations',
    {
      preHandler: [
        validateQuery(
          z.object({
            page: z.string().optional(),
            limit: z.string().optional(),
            jurisdictionId: z.string().uuid().optional(),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const query = request.query as { page?: string; limit?: string; jurisdictionId?: string }
        const page = Math.max(1, parseInt(query.page || '1', 10))
        const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)))
        const skip = (page - 1) * limit

        const where: any = {}
        if (query.jurisdictionId) where.jurisdictionId = query.jurisdictionId

        const [integrations, total] = await Promise.all([
          (prisma as any).aPIIntegration.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
          }),
          (prisma as any).aPIIntegration.count({ where }),
        ])

        return reply.send({
          data: integrations,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to list integrations' })
      }
    }
  )

  // POST /integrations - Create API integration
  fastify.post(
    '/integrations',
    {
      preHandler: [validateBody(integrationCreateSchema)],
    },
    async (request, reply) => {
      try {
        const body = request.body as z.infer<typeof integrationCreateSchema>

        const integration = await (prisma as any).aPIIntegration.create({
          data: body,
        })

        return reply.code(201).send({ data: integration })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: error.message || 'Failed to create integration' })
      }
    }
  )

  // PATCH /integrations/:id - Update API integration
  fastify.patch(
    '/integrations/:id',
    {
      preHandler: [
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(integrationUpdateSchema),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof integrationUpdateSchema>

        const updated = await (prisma as any).aPIIntegration.update({
          where: { id },
          data: body,
        })

        return reply.send({ data: updated })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: error.message || 'Failed to update integration' })
      }
    }
  )

  // ========================================================================
  // API CALLS
  // ========================================================================

  // GET /calls - List API calls (filter by integrationId, status)
  fastify.get(
    '/calls',
    {
      preHandler: [
        validateQuery(
          z.object({
            page: z.string().optional(),
            limit: z.string().optional(),
            integrationId: z.string().uuid().optional(),
            success: z.string().optional(),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const query = request.query as {
          page?: string; limit?: string; integrationId?: string; success?: string
        }
        const page = Math.max(1, parseInt(query.page || '1', 10))
        const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)))
        const skip = (page - 1) * limit

        const where: any = {}
        if (query.integrationId) where.integrationId = query.integrationId
        if (query.success !== undefined) where.success = query.success === 'true'

        const [calls, total] = await Promise.all([
          (prisma as any).aPICall.findMany({
            where,
            skip,
            take: limit,
            orderBy: { executedAt: 'desc' },
          }),
          (prisma as any).aPICall.count({ where }),
        ])

        return reply.send({
          data: calls,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to list API calls' })
      }
    }
  )

  // ========================================================================
  // WEBHOOK EVENTS
  // ========================================================================

  // GET /webhook-events - List webhook events
  fastify.get(
    '/webhook-events',
    {
      preHandler: [
        validateQuery(
          z.object({
            page: z.string().optional(),
            limit: z.string().optional(),
            status: z.string().optional(),
            integrationId: z.string().uuid().optional(),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const query = request.query as {
          page?: string; limit?: string; status?: string; integrationId?: string
        }
        const page = Math.max(1, parseInt(query.page || '1', 10))
        const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)))
        const skip = (page - 1) * limit

        const where: any = {}
        if (query.status) where.status = query.status
        if (query.integrationId) where.integrationId = query.integrationId

        const [events, total] = await Promise.all([
          (prisma as any).webhookEvent.findMany({
            where,
            skip,
            take: limit,
            orderBy: { receivedAt: 'desc' },
          }),
          (prisma as any).webhookEvent.count({ where }),
        ])

        return reply.send({
          data: events,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to list webhook events' })
      }
    }
  )
}
