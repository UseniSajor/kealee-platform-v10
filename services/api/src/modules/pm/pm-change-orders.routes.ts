import { FastifyInstance } from 'fastify'
import { changeOrderService } from './pm-change-orders.service'
import { authenticateUser } from '../auth/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../../middleware/validation.middleware'
import { z } from 'zod'

export async function pmChangeOrderRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: [authenticateUser, validateQuery(z.object({ projectId: z.string().uuid().optional(), status: z.string().optional(), requestedBy: z.string().optional(), search: z.string().optional(), page: z.coerce.number().default(1), limit: z.coerce.number().default(50) }))] }, async (request, reply) => {
    const query = request.query as any
    const result = await changeOrderService.list(query)
    return reply.send(result)
  })

  fastify.get('/stats', { preHandler: [authenticateUser, validateQuery(z.object({ projectId: z.string().uuid().optional() }))] }, async (request, reply) => {
    const { projectId } = request.query as any
    const stats = await changeOrderService.getStats(projectId)
    return reply.send({ stats })
  })

  fastify.get('/:id', { preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() }))] }, async (request, reply) => {
    const { id } = request.params as any
    const item = await changeOrderService.getById(id)
    if (!item) return reply.code(404).send({ error: 'Change order not found' })
    return reply.send({ changeOrder: item })
  })

  fastify.post('/', { preHandler: [authenticateUser, validateBody(z.object({ projectId: z.string().uuid(), title: z.string(), description: z.string().optional(), reason: z.string().optional(), originalAmount: z.number(), totalCost: z.number(), scheduleDays: z.number().default(0), lineItems: z.array(z.object({ description: z.string(), quantity: z.number(), unit: z.string(), unitCost: z.number(), totalCost: z.number(), category: z.string().optional() })).optional() }))] }, async (request, reply) => {
    const user = (request as any).user
    const body = request.body as any
    const co = await changeOrderService.create({ ...body, requestedBy: user.id, changeOrderNumber: `CO-${Date.now()}` })
    return reply.code(201).send({ changeOrder: co })
  })

  fastify.patch('/:id', { preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() })), validateBody(z.object({ title: z.string().optional(), description: z.string().optional(), reason: z.string().optional(), totalCost: z.number().optional(), scheduleDays: z.number().optional(), lineItems: z.array(z.object({ description: z.string(), quantity: z.number(), unit: z.string(), unitCost: z.number(), totalCost: z.number(), category: z.string().optional() })).optional() }))] }, async (request, reply) => {
    const { id } = request.params as any
    const co = await changeOrderService.update(id, request.body)
    return reply.send({ changeOrder: co })
  })

  fastify.delete('/:id', { preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() }))] }, async (request, reply) => {
    const { id } = request.params as any
    await changeOrderService.softDelete(id)
    return reply.send({ ok: true })
  })

  fastify.post('/:id/submit', { preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() }))] }, async (request, reply) => {
    const { id } = request.params as any
    const co = await changeOrderService.submit(id)
    return reply.send({ changeOrder: co })
  })

  fastify.post('/:id/approve', { preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() })), validateBody(z.object({ role: z.string(), comments: z.string().optional() }))] }, async (request, reply) => {
    const { id } = request.params as any
    const user = (request as any).user
    const { role, comments } = request.body as any
    const co = await changeOrderService.approve(id, { approverId: user.id, role, comments })
    return reply.send({ changeOrder: co })
  })

  fastify.post('/:id/reject', { preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() })), validateBody(z.object({ role: z.string(), reason: z.string() }))] }, async (request, reply) => {
    const { id } = request.params as any
    const user = (request as any).user
    const { role, reason } = request.body as any
    const co = await changeOrderService.reject(id, { approverId: user.id, role, reason })
    return reply.send({ changeOrder: co })
  })
}
