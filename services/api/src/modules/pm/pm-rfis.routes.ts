import { FastifyInstance } from 'fastify'
import { authenticateUser } from '../auth/auth.middleware'
import { requireRole } from '../auth/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../../middleware/validation.middleware'
import { z } from 'zod'
import { rfiService } from './pm-rfis.service'
import { triggerRfiReminderScan } from './rfi-reminder.worker'

export async function pmRfisRoutes(fastify: FastifyInstance) {
  // GET / - List RFIs
  fastify.get(
    '/',
    {
      preHandler: [
        authenticateUser,
        validateQuery(z.object({
          projectId: z.string().uuid(),
          status: z.string().optional(),
          priority: z.string().optional(),
          assignedTo: z.string().uuid().optional(),
          dateFrom: z.string().optional(),
          dateTo: z.string().optional(),
          search: z.string().optional(),
          page: z.coerce.number().default(1),
          limit: z.coerce.number().default(25),
        })),
      ],
    },
    async (request, reply) => {
      const query = request.query as any
      const result = await rfiService.list(query)
      return reply.send(result)
    }
  )

  // GET /stats - Get RFI statistics
  fastify.get(
    '/stats',
    {
      preHandler: [
        authenticateUser,
        validateQuery(z.object({ projectId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const { projectId } = request.query as { projectId: string }
      const stats = await rfiService.getStats(projectId)
      return reply.send({ stats })
    }
  )

  // GET /:id - Get RFI by ID
  fastify.get(
    '/:id',
    {
      preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() }))],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const rfi = await rfiService.getById(id)
      return reply.send({ rfi })
    }
  )

  // POST / - Create RFI
  fastify.post(
    '/',
    {
      preHandler: [
        authenticateUser,
        validateBody(z.object({
          projectId: z.string().uuid(),
          subject: z.string().min(1),
          question: z.string().min(1),
          priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
          assignedToId: z.string().uuid().optional(),
          dueDate: z.string().optional(),
          costImpact: z.boolean().optional(),
          scheduleImpact: z.boolean().optional(),
          drawingRef: z.string().optional(),
          specSection: z.string().optional(),
          distributionList: z.array(z.string()).optional(),
        })),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user
      const body = request.body as any
      const rfi = await rfiService.create({ ...body, createdById: user.id })
      return reply.code(201).send({ rfi })
    }
  )

  // PATCH /:id - Update RFI
  fastify.patch(
    '/:id',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(z.object({
          subject: z.string().min(1).optional(),
          question: z.string().min(1).optional(),
          priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
          status: z.enum(['DRAFT', 'OPEN', 'ANSWERED', 'CLOSED', 'VOID']).optional(),
          assignedToId: z.string().uuid().optional(),
          dueDate: z.string().optional(),
          costImpact: z.boolean().optional(),
          scheduleImpact: z.boolean().optional(),
          drawingRef: z.string().optional(),
          specSection: z.string().optional(),
          distributionList: z.array(z.string()).optional(),
        })),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const body = request.body as any
      const rfi = await rfiService.update(id, body)
      return reply.send({ rfi })
    }
  )

  // DELETE /:id - Soft delete RFI
  fastify.delete(
    '/:id',
    {
      preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() }))],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      await rfiService.softDelete(id)
      return reply.send({ success: true })
    }
  )

  // POST /:id/responses - Add response
  fastify.post(
    '/:id/responses',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(z.object({
          response: z.string().min(1),
          isOfficial: z.boolean().optional(),
          attachmentIds: z.array(z.string()).optional(),
        })),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user
      const { id } = request.params as { id: string }
      const body = request.body as any
      const response = await rfiService.addResponse({
        rfiId: id,
        responderId: user.id,
        ...body,
      })
      return reply.code(201).send({ response })
    }
  )

  // PATCH /:id/responses/:responseId - Edit response
  fastify.patch(
    '/:id/responses/:responseId',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({
          id: z.string().uuid(),
          responseId: z.string().uuid(),
        })),
        validateBody(z.object({
          response: z.string().min(1).optional(),
          isOfficial: z.boolean().optional(),
        })),
      ],
    },
    async (request, reply) => {
      const { responseId } = request.params as { id: string; responseId: string }
      const body = request.body as any
      const response = await rfiService.editResponse(responseId, body)
      return reply.send({ response })
    }
  )

  // POST /:id/close - Close RFI
  fastify.post(
    '/:id/close',
    {
      preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() }))],
    },
    async (request, reply) => {
      const user = (request as any).user
      const { id } = request.params as { id: string }
      const rfi = await rfiService.close(id, user.id)
      return reply.send({ rfi })
    }
  )

  // POST /:id/reopen - Reopen RFI
  fastify.post(
    '/:id/reopen',
    {
      preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() }))],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const rfi = await rfiService.reopen(id)
      return reply.send({ rfi })
    }
  )

  // POST /reminders/trigger - Manually trigger RFI reminder scan (admin only)
  fastify.post(
    '/reminders/trigger',
    {
      preHandler: [authenticateUser, requireRole(['admin', 'ADMIN', 'pm', 'PM'])],
    },
    async (request, reply) => {
      try {
        const result = await triggerRfiReminderScan()
        return reply.send({ success: true, ...result })
      } catch (error: any) {
        return reply.code(500).send({
          error: 'Failed to trigger reminder scan',
          message: error.message,
        })
      }
    }
  )
}
