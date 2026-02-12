import { FastifyInstance } from 'fastify'
import { dailyLogService } from './pm-daily-logs.service'
import { authenticateUser } from '../auth/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../../middleware/validation.middleware'
import { z } from 'zod'

export async function pmDailyLogRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: [authenticateUser, validateQuery(z.object({ projectId: z.string().uuid().optional(), contractorId: z.string().uuid().optional(), startDate: z.string().optional(), endDate: z.string().optional(), page: z.coerce.number().default(1), limit: z.coerce.number().default(50) }))] }, async (request, reply) => {
    const result = await dailyLogService.list(request.query as any)
    return reply.send(result)
  })

  fastify.get('/summary', { preHandler: [authenticateUser, validateQuery(z.object({ projectId: z.string().uuid(), startDate: z.string(), endDate: z.string() }))] }, async (request, reply) => {
    const summary = await dailyLogService.getSummary(request.query as any)
    return reply.send({ summary })
  })

  fastify.get('/:id', { preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() }))] }, async (request, reply) => {
    const { id } = request.params as any
    const log = await dailyLogService.getById(id)
    if (!log) return reply.code(404).send({ error: 'Daily log not found' })
    return reply.send({ dailyLog: log })
  })

  fastify.post('/', { preHandler: [authenticateUser, validateBody(z.object({ projectId: z.string().uuid(), date: z.string().optional(), workPerformed: z.string(), crewCount: z.number().optional(), hoursWorked: z.number().optional(), weather: z.string().optional(), temperature: z.string().optional(), progressNotes: z.string().optional(), issues: z.string().optional(), safetyIncidents: z.string().optional(), materialsDelivered: z.string().optional(), equipmentUsed: z.string().optional(), subsOnSite: z.array(z.string()).optional(), photoIds: z.array(z.string()).optional() }))] }, async (request, reply) => {
    const user = (request as any).user
    const body = request.body as any
    const log = await dailyLogService.create({ ...body, contractorId: user.id, date: body.date ? new Date(body.date) : new Date() })
    return reply.code(201).send({ dailyLog: log })
  })

  fastify.patch('/:id', { preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() })), validateBody(z.object({ workPerformed: z.string().optional(), crewCount: z.number().optional(), hoursWorked: z.number().optional(), weather: z.string().optional(), temperature: z.string().optional(), progressNotes: z.string().optional(), issues: z.string().optional(), materialsDelivered: z.string().optional(), equipmentUsed: z.string().optional(), subsOnSite: z.array(z.string()).optional(), photoIds: z.array(z.string()).optional() }))] }, async (request, reply) => {
    const { id } = request.params as any
    const log = await dailyLogService.update(id, request.body)
    return reply.send({ dailyLog: log })
  })

  fastify.delete('/:id', { preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() }))] }, async (request, reply) => {
    const { id } = request.params as any
    await dailyLogService.delete(id)
    return reply.send({ ok: true })
  })

  fastify.post('/:id/sign-off', { preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() }))] }, async (request, reply) => {
    const { id } = request.params as any
    const user = (request as any).user
    const log = await dailyLogService.signOff(id, user.id)
    return reply.send({ dailyLog: log })
  })
}
