import { FastifyInstance } from 'fastify'
import { pmSelectionsService } from './pm-selections.service'
import { authenticateUser } from '../auth/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../../middleware/validation.middleware'
import { z } from 'zod'

export async function pmSelectionRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: [authenticateUser, validateQuery(z.object({ projectId: z.string().uuid(), status: z.string().optional(), category: z.string().optional(), page: z.coerce.number().default(1), limit: z.coerce.number().default(50) }))] }, async (request, reply) => {
    const query = request.query as any
    const result = await pmSelectionsService.list(query)
    return reply.send(result)
  })

  fastify.get('/stats', { preHandler: [authenticateUser, validateQuery(z.object({ projectId: z.string().uuid() }))] }, async (request, reply) => {
    const { projectId } = request.query as any
    const stats = await pmSelectionsService.getStats(projectId)
    return reply.send({ stats })
  })

  fastify.get('/:id', { preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() }))] }, async (request, reply) => {
    const { id } = request.params as any
    const selection = await pmSelectionsService.getById(id)
    return reply.send({ selection })
  })

  fastify.post('/', { preHandler: [authenticateUser, validateBody(z.object({ projectId: z.string().uuid(), title: z.string(), description: z.string().optional(), category: z.string(), specSection: z.string().optional(), location: z.string().optional(), dueDate: z.string().optional(), budgetAllowance: z.number().optional() }))] }, async (request, reply) => {
    const user = (request as any).user
    const body = request.body as any
    const selection = await pmSelectionsService.create({ ...body, createdById: user.id })
    return reply.code(201).send({ selection })
  })

  fastify.patch('/:id', { preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() })), validateBody(z.object({ title: z.string().optional(), description: z.string().optional(), category: z.string().optional(), specSection: z.string().optional(), location: z.string().optional(), status: z.string().optional(), dueDate: z.string().optional(), budgetAllowance: z.number().optional(), actualCost: z.number().optional() }))] }, async (request, reply) => {
    const { id } = request.params as any
    const selection = await pmSelectionsService.update(id, request.body as any)
    return reply.send({ selection })
  })

  fastify.delete('/:id', { preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() }))] }, async (request, reply) => {
    const { id } = request.params as any
    await pmSelectionsService.delete(id)
    return reply.send({ ok: true })
  })

  fastify.post('/:id/options', { preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() })), validateBody(z.object({ name: z.string(), description: z.string().optional(), vendor: z.string().optional(), manufacturer: z.string().optional(), modelNumber: z.string().optional(), color: z.string().optional(), finish: z.string().optional(), leadTime: z.string().optional(), unitCost: z.number().optional(), totalCost: z.number().optional(), isRecommended: z.boolean().optional() }))] }, async (request, reply) => {
    const { id } = request.params as any
    const option = await pmSelectionsService.addOption(id, request.body as any)
    return reply.code(201).send({ option })
  })

  fastify.patch('/:id/options/:optionId', { preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid(), optionId: z.string().uuid() })), validateBody(z.object({ name: z.string().optional(), description: z.string().optional(), vendor: z.string().optional(), manufacturer: z.string().optional(), modelNumber: z.string().optional(), color: z.string().optional(), finish: z.string().optional(), leadTime: z.string().optional(), unitCost: z.number().optional(), totalCost: z.number().optional(), isRecommended: z.boolean().optional() }))] }, async (request, reply) => {
    const { id, optionId } = request.params as any
    const option = await pmSelectionsService.updateOption(id, optionId, request.body as any)
    return reply.send({ option })
  })

  fastify.delete('/:id/options/:optionId', { preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid(), optionId: z.string().uuid() }))] }, async (request, reply) => {
    const { id, optionId } = request.params as any
    await pmSelectionsService.removeOption(id, optionId)
    return reply.send({ ok: true })
  })

  fastify.post('/:id/select', { preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() })), validateBody(z.object({ optionId: z.string().uuid() }))] }, async (request, reply) => {
    const { id } = request.params as any
    const { optionId } = request.body as any
    const selection = await pmSelectionsService.selectOption(id, optionId)
    return reply.send({ selection })
  })

  fastify.post('/:id/approve', { preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() }))] }, async (request, reply) => {
    const { id } = request.params as any
    const user = (request as any).user
    const selection = await pmSelectionsService.approve(id, user.id)
    return reply.send({ selection })
  })
}
