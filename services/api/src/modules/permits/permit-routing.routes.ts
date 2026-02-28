import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prismaAny } from '../../utils/prisma-helper'
import { authenticateUser } from '../auth/auth.middleware'
import { validateParams, validateBody } from '../../middleware/validation.middleware'
import { permitRoutingService } from './permit-routing.service'
import { sanitizeErrorMessage } from '../../utils/sanitize-error'

const reRoutePermitSchema = z.object({
  reason: z.string().min(1),
  discipline: z.string().optional(),
})

const escalateRoutingSchema = z.object({
  reason: z.string().min(1),
  escalatedToId: z.string().uuid().optional(),
})

export async function permitRoutingRoutes(fastify: FastifyInstance) {
  // POST /permits/permits/:id/route - Route permit to review disciplines
  fastify.post(
    '/permits/:id/route',
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
        const result = await permitRoutingService.routePermit(id, {
          routedById: user.id,
        })
        return reply.send(result)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to route permit'),
        })
      }
    }
  )

  // POST /permits/routings/:id/assign - Auto-assign reviewer
  fastify.post(
    '/routings/:id/assign',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const routing = await prismaAny.permitRouting.findUnique({
          where: { id },
          include: {
            permit: {
              select: {
                jurisdictionId: true,
              },
            },
          },
        })

        if (!routing) {
          return reply.code(404).send({ error: 'Routing not found' })
        }

        const updated = await permitRoutingService.autoAssignReviewer(id, {
          discipline: routing.discipline,
          jurisdictionId: routing.permit.jurisdictionId,
          isExpedited: routing.isExpedited,
          priority: routing.routingPriority,
        })
        return reply.send({ routing: updated })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to assign reviewer'),
        })
      }
    }
  )

  // POST /permits/permits/:id/re-route - Re-route permit
  fastify.post(
    '/permits/:id/re-route',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(reRoutePermitSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof reRoutePermitSchema>
        const result = await permitRoutingService.reRoutePermit(id, {
          ...body,
          reRoutedById: user.id,
        })
        return reply.send(result)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to re-route permit'),
        })
      }
    }
  )

  // POST /permits/routings/:id/escalate - Escalate routing
  fastify.post(
    '/routings/:id/escalate',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(escalateRoutingSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof escalateRoutingSchema>
        const routing = await permitRoutingService.escalateRouting(id, {
          ...body,
          escalatedById: user.id,
        })
        return reply.send({ routing })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to escalate routing'),
        })
      }
    }
  )

  // POST /permits/jurisdictions/:id/check-delayed - Check for delayed reviews
  fastify.post(
    '/jurisdictions/:id/check-delayed',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const result = await permitRoutingService.checkDelayedReviews(id)
        return reply.send(result)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to check delayed reviews'),
        })
      }
    }
  )

  // GET /permits/permits/:id/routing-status - Get routing status
  fastify.get(
    '/permits/:id/routing-status',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const status = await permitRoutingService.getRoutingStatus(id)
        return reply.send(status)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(404).send({
          error: sanitizeErrorMessage(error, 'Permit not found'),
        })
      }
    }
  )

  // POST /permits/routings/:id/complete - Complete routing
  fastify.post(
    '/routings/:id/complete',
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
        const routing = await permitRoutingService.completeRouting(id, {
          completedById: user.id,
        })
        return reply.send({ routing })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to complete routing'),
        })
      }
    }
  )

  // GET /permits/notifications - Get user's notifications
  fastify.get(
    '/notifications',
    {
      preHandler: [authenticateUser],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const query = request.query as {
          read?: string
          type?: string
        }

        const where: any = {
          recipientId: user.id,
        }

        if (query.read === 'true') {
          where.read = true
        } else if (query.read === 'false') {
          where.read = false
        }

        if (query.type) {
          where.notificationType = query.type
        }

        const notifications = await prismaAny.permitNotification.findMany({
          where,
          include: {
            permit: {
              select: {
                id: true,
                permitNumber: true,
                status: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 50,
        })

        return reply.send({ notifications })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to get notifications'),
        })
      }
    }
  )

  // POST /permits/notifications/:id/read - Mark notification as read
  fastify.post(
    '/notifications/:id/read',
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
        const notification = await prismaAny.permitNotification.update({
          where: { id },
          data: {
            read: true,
            readAt: new Date(),
          },
        })

        if (notification.recipientId !== user.id) {
          return reply.code(403).send({ error: 'Unauthorized' })
        }

        return reply.send({ notification })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to mark notification as read'),
        })
      }
    }
  )
}
