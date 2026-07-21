import { FastifyInstance } from 'fastify'
import { authenticateUser } from '../auth/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../../middleware/validation.middleware'
import { z } from 'zod'
import { meetingService } from './pm-meetings.service'

export async function pmMeetingsRoutes(fastify: FastifyInstance) {
  // GET / - List meetings
  fastify.get(
    '/',
    {
      preHandler: [
        authenticateUser,
        validateQuery(z.object({
          projectId: z.string().uuid(),
          type: z.string().optional(),
          dateFrom: z.string().optional(),
          dateTo: z.string().optional(),
          status: z.string().optional(),
          search: z.string().optional(),
          page: z.coerce.number().default(1),
          limit: z.coerce.number().default(25),
        })),
      ],
    },
    async (request, reply) => {
      const query = request.query as any
      const result = await meetingService.list(query)
      return reply.send(result)
    }
  )

  // GET /action-items - Get open action items across all meetings
  fastify.get(
    '/action-items',
    {
      preHandler: [authenticateUser, validateQuery(z.object({ projectId: z.string().uuid() }))],
    },
    async (request, reply) => {
      const { projectId } = request.query as { projectId: string }
      const items = await meetingService.getOpenActionItems(projectId)
      return reply.send({ actionItems: items })
    }
  )

  // GET /:id - Get meeting by ID
  fastify.get(
    '/:id',
    {
      preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() }))],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const meeting = await meetingService.getById(id)
      return reply.send({ meeting })
    }
  )

  // POST / - Create meeting
  fastify.post(
    '/',
    {
      preHandler: [
        authenticateUser,
        validateBody(z.object({
          projectId: z.string().uuid(),
          title: z.string().min(1),
          type: z.enum(['OAC', 'PROGRESS', 'SAFETY', 'PRECONSTRUCTION', 'COORDINATION', 'OWNER', 'SUBCONTRACTOR', 'CLOSEOUT']).optional(),
          date: z.string(),
          startTime: z.string().optional(),
          endTime: z.string().optional(),
          location: z.string().optional(),
          agenda: z.string().optional(),
          recurringSchedule: z.any().optional(),
        })),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user
      const body = request.body as any
      const meeting = await meetingService.create({ ...body, createdById: user.id })
      return reply.code(201).send({ meeting })
    }
  )

  // PATCH /:id - Update meeting
  fastify.patch(
    '/:id',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(z.object({
          title: z.string().min(1).optional(),
          type: z.string().optional(),
          date: z.string().optional(),
          startTime: z.string().optional(),
          endTime: z.string().optional(),
          location: z.string().optional(),
          agenda: z.string().optional(),
          recurringSchedule: z.any().optional(),
        })),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const body = request.body as any
      const meeting = await meetingService.update(id, body)
      return reply.send({ meeting })
    }
  )

  // DELETE /:id - Cancel meeting
  fastify.delete(
    '/:id',
    {
      preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() }))],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      await meetingService.cancel(id)
      return reply.send({ success: true })
    }
  )

  // POST /:id/attendees - Add attendees
  fastify.post(
    '/:id/attendees',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(z.object({
          attendees: z.array(z.object({
            userId: z.string().uuid().optional(),
            name: z.string().min(1),
            email: z.string().email().optional(),
            company: z.string().optional(),
            role: z.string().optional(),
          })),
        })),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const { attendees } = request.body as any
      const created = await meetingService.addAttendees(id, attendees)
      return reply.code(201).send({ attendees: created })
    }
  )

  // PATCH /:id/attendees/:attendeeId - Update attendee
  fastify.patch(
    '/:id/attendees/:attendeeId',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({
          id: z.string().uuid(),
          attendeeId: z.string().uuid(),
        })),
        validateBody(z.object({
          attended: z.boolean().optional(),
          signatureUrl: z.string().optional(),
          role: z.string().optional(),
        })),
      ],
    },
    async (request, reply) => {
      const { attendeeId } = request.params as any
      const body = request.body as any
      const attendee = await meetingService.updateAttendee(attendeeId, body)
      return reply.send({ attendee })
    }
  )

  // POST /:id/minutes - Save meeting minutes
  fastify.post(
    '/:id/minutes',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(z.object({ minutes: z.string().min(1) })),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const { minutes } = request.body as { minutes: string }
      const meeting = await meetingService.saveMinutes(id, minutes)
      return reply.send({ meeting })
    }
  )

  // POST /:id/action-items - Add action item
  fastify.post(
    '/:id/action-items',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(z.object({
          description: z.string().min(1),
          assignedToId: z.string().uuid().optional(),
          assignedToName: z.string().optional(),
          dueDate: z.string().optional(),
          priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
        })),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const body = request.body as any
      const item = await meetingService.addActionItem(id, body)
      return reply.code(201).send({ actionItem: item })
    }
  )

  // PATCH /:id/action-items/:itemId - Update action item
  fastify.patch(
    '/:id/action-items/:itemId',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({
          id: z.string().uuid(),
          itemId: z.string().uuid(),
        })),
        validateBody(z.object({
          description: z.string().optional(),
          assignedToId: z.string().uuid().optional(),
          assignedToName: z.string().optional(),
          dueDate: z.string().optional(),
          priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
          status: z.enum(['OPEN', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE']).optional(),
          notes: z.string().optional(),
        })),
      ],
    },
    async (request, reply) => {
      const { itemId } = request.params as any
      const body = request.body as any
      const item = await meetingService.updateActionItem(itemId, body)
      return reply.send({ actionItem: item })
    }
  )

  // POST /:id/complete - Complete meeting
  fastify.post(
    '/:id/complete',
    {
      preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() }))],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const meeting = await meetingService.complete(id)
      return reply.send({ meeting })
    }
  )
}
