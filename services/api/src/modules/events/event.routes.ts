import { FastifyInstance } from 'fastify'
import { eventService } from './event.service'
import { authenticateUser } from '../auth/auth.middleware'
import { sanitizeErrorMessage } from '../../utils/sanitize-error'

export async function eventRoutes(fastify: FastifyInstance) {
  // POST /events - Record an event
  fastify.post(
    '/',
    { preHandler: authenticateUser },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const { type, entityType, entityId, orgId, payload } = request.body as {
          type: string
          entityType: string
          entityId: string
          orgId?: string
          payload?: any
        }

        if (!type || !entityType || !entityId) {
          return reply.code(400).send({
            error: 'Missing required fields: type, entityType, entityId',
          })
        }

        const event = await eventService.recordEvent({
          type,
          entityType,
          entityId,
          userId: user.id,
          orgId,
          payload,
        })

        return reply.code(201).send({ event })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to record event'),
        })
      }
    }
  )

  // GET /events - Get events with filtering
  fastify.get('/', async (request, reply) => {
    try {
      const {
        type,
        entityType,
        entityId,
        userId,
        orgId,
        startDate,
        endDate,
        page,
        limit,
      } = request.query as {
        type?: string
        entityType?: string
        entityId?: string
        userId?: string
        orgId?: string
        startDate?: string
        endDate?: string
        page?: string
        limit?: string
      }

      const result = await eventService.getEvents({
        type,
        entityType,
        entityId,
        userId,
        orgId,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
      })

      return reply.send(result)
    } catch (error: any) {
      fastify.log.error(error)
      return reply.code(500).send({
        error: sanitizeErrorMessage(error, 'Failed to get events'),
      })
    }
  })

  // GET /events/:id - Get event by ID
  fastify.get('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const event = await eventService.getEventById(id)
      return reply.send({ event })
    } catch (error: any) {
      fastify.log.error(error)
      const statusCode = error.message === 'Event not found' ? 404 : 500
      return reply.code(statusCode).send({
        error: sanitizeErrorMessage(error, 'Failed to get event'),
      })
    }
  })

  // GET /events/entity/:entityType/:entityId - Get events for an entity
  fastify.get('/entity/:entityType/:entityId', async (request, reply) => {
    try {
      const { entityType, entityId } = request.params as {
        entityType: string
        entityId: string
      }
      const { limit } = request.query as { limit?: string }

      const events = await eventService.getEntityEvents(
        entityType,
        entityId,
        limit ? parseInt(limit) : undefined
      )

      return reply.send({ events })
    } catch (error: any) {
      fastify.log.error(error)
      return reply.code(500).send({
        error: sanitizeErrorMessage(error, 'Failed to get entity events'),
      })
    }
  })

  // GET /events/user/:userId - Get events for a user
  fastify.get('/user/:userId', async (request, reply) => {
    try {
      const { userId } = request.params as { userId: string }
      const { limit } = request.query as { limit?: string }

      const events = await eventService.getUserEvents(
        userId,
        limit ? parseInt(limit) : undefined
      )

      return reply.send({ events })
    } catch (error: any) {
      fastify.log.error(error)
      return reply.code(500).send({
        error: sanitizeErrorMessage(error, 'Failed to get user events'),
      })
    }
  })

  // GET /events/org/:orgId - Get events for an organization
  fastify.get('/org/:orgId', async (request, reply) => {
    try {
      const { orgId } = request.params as { orgId: string }
      const { limit } = request.query as { limit?: string }

      const events = await eventService.getOrgEvents(
        orgId,
        limit ? parseInt(limit) : undefined
      )

      return reply.send({ events })
    } catch (error: any) {
      fastify.log.error(error)
      return reply.code(500).send({
        error: sanitizeErrorMessage(error, 'Failed to get org events'),
      })
    }
  })

  // GET /events/type/:type - Get events by type
  fastify.get('/type/:type', async (request, reply) => {
    try {
      const { type } = request.params as { type: string }
      const { limit } = request.query as { limit?: string }

      const events = await eventService.getEventsByType(
        type,
        limit ? parseInt(limit) : undefined
      )

      return reply.send({ events })
    } catch (error: any) {
      fastify.log.error(error)
      return reply.code(500).send({
        error: sanitizeErrorMessage(error, 'Failed to get events by type'),
      })
    }
  })

  // GET /events/recent - Get recent events
  fastify.get('/recent', async (request, reply) => {
    try {
      const { limit } = request.query as { limit?: string }

      const events = await eventService.getRecentEvents(
        limit ? parseInt(limit) : 50
      )

      return reply.send({ events })
    } catch (error: any) {
      fastify.log.error(error)
      return reply.code(500).send({
        error: sanitizeErrorMessage(error, 'Failed to get recent events'),
      })
    }
  })

  // GET /events/stats - Get event statistics
  fastify.get(
    '/stats',
    { preHandler: authenticateUser },
    async (request, reply) => {
      try {
        const { orgId, startDate, endDate } = request.query as {
          orgId?: string
          startDate?: string
          endDate?: string
        }

        const stats = await eventService.getEventStats({
          orgId,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
        })

        return reply.send({ stats })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: sanitizeErrorMessage(error, 'Failed to get event stats'),
        })
      }
    }
  )
}
