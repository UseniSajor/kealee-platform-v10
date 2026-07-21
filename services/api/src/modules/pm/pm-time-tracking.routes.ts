import { FastifyInstance } from 'fastify'
import { timeTrackingService } from './pm-time-tracking.service'
import { authenticateUser } from '../auth/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../../middleware/validation.middleware'
import { z } from 'zod'

export async function pmTimeTrackingRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: [authenticateUser, validateQuery(z.object({ projectId: z.string().uuid(), userId: z.string().uuid().optional(), startDate: z.string().optional(), endDate: z.string().optional(), type: z.string().optional(), approved: z.coerce.boolean().optional(), page: z.coerce.number().default(1), limit: z.coerce.number().default(50) }))] }, async (request, reply) => {
    const query = request.query as any
    const result = await timeTrackingService.list(query)
    return reply.send(result)
  })

  fastify.get('/summary', { preHandler: [authenticateUser, validateQuery(z.object({ projectId: z.string().uuid(), startDate: z.string().optional(), endDate: z.string().optional(), groupBy: z.string().optional() }))] }, async (request, reply) => {
    const query = request.query as any
    const summary = await timeTrackingService.getSummary(query)
    return reply.send({ summary })
  })

  fastify.get('/timesheet', { preHandler: [authenticateUser, validateQuery(z.object({ userId: z.string().uuid(), weekStart: z.string() }))] }, async (request, reply) => {
    const { userId, weekStart } = request.query as any
    const timesheet = await timeTrackingService.getTimesheet(userId, weekStart)
    return reply.send({ timesheet })
  })

  fastify.get('/:id', { preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() }))] }, async (request, reply) => {
    const { id } = request.params as any
    const entry = await timeTrackingService.getById(id)
    return reply.send({ entry })
  })

  fastify.post('/', { preHandler: [authenticateUser, validateBody(z.object({ projectId: z.string().uuid(), date: z.string(), hours: z.number(), type: z.string().optional(), description: z.string().optional(), taskId: z.string().uuid().optional(), trade: z.string().optional(), costCode: z.string().optional(), overtime: z.boolean().optional() }))] }, async (request, reply) => {
    const user = (request as any).user
    const body = request.body as any
    const entry = await timeTrackingService.create({ ...body, userId: user.id })
    return reply.code(201).send({ entry })
  })

  fastify.post('/bulk', { preHandler: [authenticateUser, validateBody(z.object({ entries: z.array(z.object({ projectId: z.string().uuid(), date: z.string(), hours: z.number(), type: z.string().optional(), description: z.string().optional(), taskId: z.string().uuid().optional(), trade: z.string().optional(), costCode: z.string().optional(), overtime: z.boolean().optional() })) }))] }, async (request, reply) => {
    const user = (request as any).user
    const { entries } = request.body as any
    const result = await timeTrackingService.bulkCreate(entries.map((e: any) => ({ ...e, userId: user.id })))
    return reply.code(201).send(result)
  })

  fastify.patch('/:id', { preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() })), validateBody(z.object({ date: z.string().optional(), hours: z.number().optional(), type: z.string().optional(), description: z.string().optional(), taskId: z.string().uuid().optional(), trade: z.string().optional(), costCode: z.string().optional(), overtime: z.boolean().optional() }))] }, async (request, reply) => {
    const { id } = request.params as any
    const entry = await timeTrackingService.update(id, request.body as any)
    return reply.send({ entry })
  })

  fastify.delete('/:id', { preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() }))] }, async (request, reply) => {
    const { id } = request.params as any
    await timeTrackingService.delete(id)
    return reply.send({ ok: true })
  })

  fastify.post('/:id/approve', { preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() }))] }, async (request, reply) => {
    const { id } = request.params as any
    const user = (request as any).user
    const entry = await timeTrackingService.approve(id, user.id)
    return reply.send({ entry })
  })

  fastify.post('/bulk-approve', { preHandler: [authenticateUser, validateBody(z.object({ ids: z.array(z.string().uuid()) }))] }, async (request, reply) => {
    const user = (request as any).user
    const { ids } = request.body as any
    const result = await timeTrackingService.bulkApprove(ids, user.id)
    return reply.send(result)
  })
}
