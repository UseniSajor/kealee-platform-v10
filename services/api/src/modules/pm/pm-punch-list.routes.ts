import { FastifyInstance } from 'fastify'
import { punchListService } from './pm-punch-list.service'
import { authenticateUser } from '../auth/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../../middleware/validation.middleware'
import { z } from 'zod'

export async function pmPunchListRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: [authenticateUser, validateQuery(z.object({ projectId: z.string().uuid().optional(), status: z.string().optional(), severity: z.string().optional(), type: z.string().optional(), assignedTo: z.string().optional(), location: z.string().optional(), page: z.coerce.number().default(1), limit: z.coerce.number().default(50) }))] }, async (request, reply) => {
    const result = await punchListService.list(request.query as any)
    return reply.send(result)
  })

  fastify.get('/stats', { preHandler: [authenticateUser, validateQuery(z.object({ projectId: z.string().uuid().optional() }))] }, async (request, reply) => {
    const { projectId } = request.query as any
    const stats = await punchListService.getStats(projectId)
    return reply.send({ stats })
  })

  fastify.get('/:id', { preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() }))] }, async (request, reply) => {
    const { id } = request.params as any
    const item = await punchListService.getById(id)
    if (!item) return reply.code(404).send({ error: 'Punch list item not found' })
    return reply.send({ punchItem: item })
  })

  fastify.post('/', { preHandler: [authenticateUser, validateBody(z.object({ projectId: z.string().uuid(), title: z.string(), description: z.string(), type: z.string().default('WORKMANSHIP'), severity: z.string().default('MODERATE'), location: z.string().optional(), assignedTo: z.string().optional(), dueDate: z.string().optional(), photos: z.array(z.string()).optional() }))] }, async (request, reply) => {
    const body = request.body as any
    const user = (request as any).user
    const item = await punchListService.create({ ...body, detectedBy: 'USER', dueDate: body.dueDate ? new Date(body.dueDate) : undefined })
    return reply.code(201).send({ punchItem: item })
  })

  fastify.patch('/:id', { preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() })), validateBody(z.object({ title: z.string().optional(), description: z.string().optional(), severity: z.string().optional(), assignedTo: z.string().optional(), location: z.string().optional(), dueDate: z.string().optional(), photos: z.array(z.string()).optional() }))] }, async (request, reply) => {
    const { id } = request.params as any
    const item = await punchListService.update(id, request.body)
    return reply.send({ punchItem: item })
  })

  fastify.delete('/:id', { preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() }))] }, async (request, reply) => {
    const { id } = request.params as any
    await punchListService.softDelete(id)
    return reply.send({ ok: true })
  })

  fastify.post('/:id/resolve', { preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() })), validateBody(z.object({ resolution: z.string() }))] }, async (request, reply) => {
    const { id } = request.params as any
    const user = (request as any).user
    const { resolution } = request.body as any
    const item = await punchListService.resolve(id, { resolution, resolvedBy: user.id })
    return reply.send({ punchItem: item })
  })

  fastify.post('/:id/verify', { preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() }))] }, async (request, reply) => {
    const { id } = request.params as any
    const user = (request as any).user
    const item = await punchListService.verify(id, { verifiedBy: user.id })
    return reply.send({ punchItem: item })
  })

  fastify.post('/:id/reopen', { preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() }))] }, async (request, reply) => {
    const { id } = request.params as any
    const item = await punchListService.reopen(id)
    return reply.send({ punchItem: item })
  })
}
