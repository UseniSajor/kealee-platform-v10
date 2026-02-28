import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../auth/auth.middleware'
import { validateParams, validateBody } from '../../middleware/validation.middleware'
import { servicePlanService, PACKAGE_TIERS } from './service-plan.service'
import { sanitizeErrorMessage } from '../../utils/sanitize-error'

const createServicePlanSchema = z.object({
  packageTier: z.enum(['A', 'B', 'C', 'D']),
  stripeSubscriptionId: z.string().optional(),
})

const updateServicePlanSchema = z.object({
  packageTier: z.enum(['A', 'B', 'C', 'D']).optional(),
  status: z.enum(['ACTIVE', 'CANCELLED', 'EXPIRED']).optional(),
  stripeSubscriptionId: z.string().optional(),
})

export async function servicePlanRoutes(fastify: FastifyInstance) {
  // GET /ops-services/package-tiers - Get available package tiers
  fastify.get(
    '/package-tiers',
    {
      preHandler: [authenticateUser],
    },
    async (request, reply) => {
      try {
        return reply.send({ packageTiers: PACKAGE_TIERS })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to get package tiers'),
        })
      }
    }
  )

  // POST /ops-services/service-plans - Create service plan
  fastify.post(
    '/service-plans',
    {
      preHandler: [
        authenticateUser,
        validateBody(createServicePlanSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const body = request.body as z.infer<typeof createServicePlanSchema>
        const servicePlan = await servicePlanService.createServicePlan({
          ...body,
          userId: user.id,
        })
        return reply.code(201).send({ servicePlan })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to create service plan'),
        })
      }
    }
  )

  // GET /ops-services/service-plans/me - Get current user's service plan
  fastify.get(
    '/service-plans/me',
    {
      preHandler: [authenticateUser],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const servicePlan = await servicePlanService.getUserServicePlan(user.id)
        if (!servicePlan) {
          return reply.code(404).send({
            error: 'No active service plan found',
          })
        }
        return reply.send({ servicePlan })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to get service plan'),
        })
      }
    }
  )

  // GET /ops-services/service-plans/:id - Get service plan
  fastify.get(
    '/service-plans/:id',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const servicePlan = await servicePlanService.getServicePlan(id, user.id)
        return reply.send({ servicePlan })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(404).send({
          error: sanitizeErrorMessage(error, 'Service plan not found'),
        })
      }
    }
  )

  // GET /ops-services/service-plans - List service plans
  fastify.get(
    '/service-plans',
    {
      preHandler: [authenticateUser],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const query = request.query as {
          status?: string
          packageTier?: string
        }
        const servicePlans = await servicePlanService.listServicePlans({
          userId: user.id,
          ...query,
        })
        return reply.send({ servicePlans })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to list service plans'),
        })
      }
    }
  )

  // PATCH /ops-services/service-plans/:id - Update service plan
  fastify.patch(
    '/service-plans/:id',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(updateServicePlanSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof updateServicePlanSchema>
        const servicePlan = await servicePlanService.updateServicePlan(id, {
          ...body,
          userId: user.id,
        })
        return reply.send({ servicePlan })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to update service plan'),
        })
      }
    }
  )

  // POST /ops-services/service-plans/:id/cancel - Cancel service plan
  fastify.post(
    '/service-plans/:id/cancel',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const servicePlan = await servicePlanService.cancelServicePlan(id, {
          userId: user.id,
        })
        return reply.send({ servicePlan })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to cancel service plan'),
        })
      }
    }
  )
}
