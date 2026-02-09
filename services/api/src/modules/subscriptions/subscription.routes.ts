/**
 * Subscription Routes
 * CRUD for PMServiceSubscription, PermitServiceSubscription,
 * ALaCarteService, MarketplaceFeeConfig, ServicePlan
 */

import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../../middleware/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../../middleware/validation.middleware'
import { prisma } from '@kealee/database'

// ---------------------------------------------------------------------------
// Zod Schemas
// ---------------------------------------------------------------------------

const pmSubscriptionCreateSchema = z.object({
  clientId: z.string().uuid(),
  orgId: z.string().uuid().optional(),
  packageTier: z.string().min(1),
  monthlyPrice: z.number().min(0),
  hoursPerWeek: z.number().int().min(1),
  maxConcurrentProjects: z.number().int().min(1),
  supportLevel: z.string().optional(),
  responseTime: z.number().int().optional(),
  includesPermitMgmt: z.boolean().optional(),
  includesSiteVisits: z.boolean().optional(),
  siteVisitsPerMonth: z.number().int().optional(),
  stripePriceId: z.string().optional(),
})

const pmSubscriptionUpdateSchema = z.object({
  status: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  cancelledAt: z.string().datetime().optional(),
  cancelReason: z.string().optional(),
  stripeSubscriptionId: z.string().optional(),
})

const permitSubscriptionCreateSchema = z.object({
  clientId: z.string().uuid(),
  projectId: z.string().uuid().optional(),
  packageTier: z.string().min(1),
  price: z.number().min(0),
  isRecurring: z.boolean().optional(),
  maxPermitTypes: z.number().int().optional(),
  includesExpediting: z.boolean().optional(),
  includesInspectionCoord: z.boolean().optional(),
  resubmittalsIncluded: z.number().int().optional(),
  turnaroundDays: z.number().int().optional(),
})

const aLaCarteServiceCreateSchema = z.object({
  clientId: z.string().uuid(),
  projectId: z.string().uuid().optional(),
  serviceType: z.string().min(1),
  serviceName: z.string().min(1),
  price: z.number().min(0),
  isRecurring: z.boolean().optional(),
  recurringInterval: z.string().optional(),
})

const marketplaceFeeCreateSchema = z.object({
  standardPlatformFee: z.number().min(0).max(1).optional(),
  packageCDFee: z.number().min(0).max(1).optional(),
  escrowFeeStandard: z.number().min(0).max(1).optional(),
  escrowFeeReduced: z.number().min(0).max(1).optional(),
  escrowMaxFee: z.number().min(0).optional(),
  maxBidOverSRP: z.number().min(0).max(1).optional(),
  effectiveFrom: z.string().datetime().optional(),
  effectiveTo: z.string().datetime().optional(),
})

const marketplaceFeeUpdateSchema = marketplaceFeeCreateSchema.extend({
  isActive: z.boolean().optional(),
})

const paginationQuery = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
})

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export async function subscriptionRoutes(fastify: FastifyInstance) {
  // Apply auth to all routes
  fastify.addHook('onRequest', async (request, reply) => {
    await authenticateUser(request, reply)
  })

  // ========================================================================
  // PM SERVICE SUBSCRIPTIONS
  // ========================================================================

  // GET /pm-subscriptions - List PM service subscriptions
  fastify.get(
    '/pm-subscriptions',
    {
      preHandler: [
        validateQuery(
          z.object({
            page: z.string().optional(),
            limit: z.string().optional(),
            clientId: z.string().uuid().optional(),
            status: z.string().optional(),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const query = request.query as {
          page?: string; limit?: string; clientId?: string; status?: string
        }
        const page = Math.max(1, parseInt(query.page || '1', 10))
        const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)))
        const skip = (page - 1) * limit

        const where: any = {}
        if (query.clientId) where.clientId = query.clientId
        if (query.status) where.status = query.status

        const [subscriptions, total] = await Promise.all([
          (prisma as any).pMServiceSubscription.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
          }),
          (prisma as any).pMServiceSubscription.count({ where }),
        ])

        return reply.send({
          data: subscriptions,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to list PM subscriptions' })
      }
    }
  )

  // POST /pm-subscriptions - Create PM subscription
  fastify.post(
    '/pm-subscriptions',
    {
      preHandler: [validateBody(pmSubscriptionCreateSchema)],
    },
    async (request, reply) => {
      try {
        const body = request.body as z.infer<typeof pmSubscriptionCreateSchema>

        const subscription = await (prisma as any).pMServiceSubscription.create({
          data: body,
        })

        return reply.code(201).send({ data: subscription })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: error.message || 'Failed to create PM subscription' })
      }
    }
  )

  // PATCH /pm-subscriptions/:id - Update PM subscription
  fastify.patch(
    '/pm-subscriptions/:id',
    {
      preHandler: [
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(pmSubscriptionUpdateSchema),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof pmSubscriptionUpdateSchema>

        const updateData: any = { ...body }
        if (body.startDate) updateData.startDate = new Date(body.startDate)
        if (body.endDate) updateData.endDate = new Date(body.endDate)
        if (body.cancelledAt) updateData.cancelledAt = new Date(body.cancelledAt)

        const updated = await (prisma as any).pMServiceSubscription.update({
          where: { id },
          data: updateData,
        })

        return reply.send({ data: updated })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: error.message || 'Failed to update PM subscription' })
      }
    }
  )

  // ========================================================================
  // PERMIT SERVICE SUBSCRIPTIONS
  // ========================================================================

  // GET /permit-subscriptions - List permit subscriptions
  fastify.get(
    '/permit-subscriptions',
    {
      preHandler: [
        validateQuery(
          z.object({
            page: z.string().optional(),
            limit: z.string().optional(),
            clientId: z.string().uuid().optional(),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const query = request.query as { page?: string; limit?: string; clientId?: string }
        const page = Math.max(1, parseInt(query.page || '1', 10))
        const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)))
        const skip = (page - 1) * limit

        const where: any = {}
        if (query.clientId) where.clientId = query.clientId

        const [subscriptions, total] = await Promise.all([
          (prisma as any).permitServiceSubscription.findMany({
            where,
            skip,
            take: limit,
            orderBy: { purchasedAt: 'desc' },
          }),
          (prisma as any).permitServiceSubscription.count({ where }),
        ])

        return reply.send({
          data: subscriptions,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to list permit subscriptions' })
      }
    }
  )

  // POST /permit-subscriptions - Create permit subscription
  fastify.post(
    '/permit-subscriptions',
    {
      preHandler: [validateBody(permitSubscriptionCreateSchema)],
    },
    async (request, reply) => {
      try {
        const body = request.body as z.infer<typeof permitSubscriptionCreateSchema>

        const subscription = await (prisma as any).permitServiceSubscription.create({
          data: body,
        })

        return reply.code(201).send({ data: subscription })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: error.message || 'Failed to create permit subscription' })
      }
    }
  )

  // ========================================================================
  // A LA CARTE SERVICES
  // ========================================================================

  // GET /a-la-carte - List a la carte services
  fastify.get(
    '/a-la-carte',
    {
      preHandler: [
        validateQuery(
          z.object({
            page: z.string().optional(),
            limit: z.string().optional(),
            clientId: z.string().uuid().optional(),
            status: z.string().optional(),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const query = request.query as {
          page?: string; limit?: string; clientId?: string; status?: string
        }
        const page = Math.max(1, parseInt(query.page || '1', 10))
        const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)))
        const skip = (page - 1) * limit

        const where: any = {}
        if (query.clientId) where.clientId = query.clientId
        if (query.status) where.status = query.status

        const [services, total] = await Promise.all([
          (prisma as any).aLaCarteService.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
          }),
          (prisma as any).aLaCarteService.count({ where }),
        ])

        return reply.send({
          data: services,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to list a la carte services' })
      }
    }
  )

  // POST /a-la-carte - Create a la carte service
  fastify.post(
    '/a-la-carte',
    {
      preHandler: [validateBody(aLaCarteServiceCreateSchema)],
    },
    async (request, reply) => {
      try {
        const body = request.body as z.infer<typeof aLaCarteServiceCreateSchema>

        const service = await (prisma as any).aLaCarteService.create({
          data: body,
        })

        return reply.code(201).send({ data: service })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: error.message || 'Failed to create a la carte service' })
      }
    }
  )

  // ========================================================================
  // MARKETPLACE FEE CONFIGS
  // ========================================================================

  // GET /marketplace-fees - List fee configs
  fastify.get(
    '/marketplace-fees',
    {
      preHandler: [validateQuery(paginationQuery)],
    },
    async (request, reply) => {
      try {
        const query = request.query as { page?: string; limit?: string }
        const page = Math.max(1, parseInt(query.page || '1', 10))
        const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)))
        const skip = (page - 1) * limit

        const [configs, total] = await Promise.all([
          (prisma as any).marketplaceFeeConfig.findMany({
            skip,
            take: limit,
            orderBy: { effectiveFrom: 'desc' },
          }),
          (prisma as any).marketplaceFeeConfig.count(),
        ])

        return reply.send({
          data: configs,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to list marketplace fees' })
      }
    }
  )

  // POST /marketplace-fees - Create fee config
  fastify.post(
    '/marketplace-fees',
    {
      preHandler: [validateBody(marketplaceFeeCreateSchema)],
    },
    async (request, reply) => {
      try {
        const body = request.body as z.infer<typeof marketplaceFeeCreateSchema>

        const config = await (prisma as any).marketplaceFeeConfig.create({
          data: {
            ...body,
            effectiveFrom: body.effectiveFrom ? new Date(body.effectiveFrom) : undefined,
            effectiveTo: body.effectiveTo ? new Date(body.effectiveTo) : undefined,
          },
        })

        return reply.code(201).send({ data: config })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: error.message || 'Failed to create fee config' })
      }
    }
  )

  // PATCH /marketplace-fees/:id - Update fee config
  fastify.patch(
    '/marketplace-fees/:id',
    {
      preHandler: [
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(marketplaceFeeUpdateSchema),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof marketplaceFeeUpdateSchema>

        const updateData: any = { ...body }
        if (body.effectiveFrom) updateData.effectiveFrom = new Date(body.effectiveFrom)
        if (body.effectiveTo) updateData.effectiveTo = new Date(body.effectiveTo)

        const updated = await (prisma as any).marketplaceFeeConfig.update({
          where: { id },
          data: updateData,
        })

        return reply.send({ data: updated })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: error.message || 'Failed to update fee config' })
      }
    }
  )

  // ========================================================================
  // SERVICE PLANS (read-only listing + create)
  // ========================================================================

  // GET /service-plans - List service plans (not in url but bundled here)
  fastify.get(
    '/service-plans',
    {
      preHandler: [validateQuery(paginationQuery)],
    },
    async (request, reply) => {
      try {
        const query = request.query as { page?: string; limit?: string }
        const page = Math.max(1, parseInt(query.page || '1', 10))
        const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)))
        const skip = (page - 1) * limit

        const [plans, total] = await Promise.all([
          (prisma as any).servicePlan.findMany({
            where: { isActive: true },
            skip,
            take: limit,
            orderBy: { order: 'asc' },
          }),
          (prisma as any).servicePlan.count({ where: { isActive: true } }),
        ])

        return reply.send({
          data: plans,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to list service plans' })
      }
    }
  )
}
