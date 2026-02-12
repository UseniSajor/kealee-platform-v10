import { FastifyInstance } from 'fastify'
import { warrantyService } from './pm-warranty.service'
import { authenticateUser } from '../auth/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../../middleware/validation.middleware'
import { z } from 'zod'

export async function pmWarrantyRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: [authenticateUser, validateQuery(z.object({ projectId: z.string().uuid(), status: z.string().optional(), type: z.string().optional(), page: z.coerce.number().default(1), limit: z.coerce.number().default(50) }))] }, async (request, reply) => {
    const query = request.query as any
    const result = await warrantyService.list(query)
    return reply.send(result)
  })

  fastify.get('/expiring', { preHandler: [authenticateUser, validateQuery(z.object({ projectId: z.string().uuid() }))] }, async (request, reply) => {
    const { projectId } = request.query as any
    const warranties = await warrantyService.getExpiring(projectId)
    return reply.send({ warranties })
  })

  fastify.get('/stats', { preHandler: [authenticateUser, validateQuery(z.object({ projectId: z.string().uuid() }))] }, async (request, reply) => {
    const { projectId } = request.query as any
    const stats = await warrantyService.getStats(projectId)
    return reply.send({ stats })
  })

  fastify.get('/:id', { preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() }))] }, async (request, reply) => {
    const { id } = request.params as any
    const warranty = await warrantyService.getById(id)
    return reply.send({ warranty })
  })

  fastify.post('/', { preHandler: [authenticateUser, validateBody(z.object({ projectId: z.string().uuid(), title: z.string(), description: z.string().optional(), type: z.string().optional(), contractor: z.string().optional(), manufacturer: z.string().optional(), startDate: z.string(), endDate: z.string(), coverageDetails: z.string().optional(), contactInfo: z.string().optional(), documentUrl: z.string().optional() }))] }, async (request, reply) => {
    const user = (request as any).user
    const body = request.body as any
    const warranty = await warrantyService.create({ ...body, createdById: user.id })
    return reply.code(201).send({ warranty })
  })

  fastify.patch('/:id', { preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() })), validateBody(z.object({ title: z.string().optional(), description: z.string().optional(), type: z.string().optional(), contractor: z.string().optional(), manufacturer: z.string().optional(), startDate: z.string().optional(), endDate: z.string().optional(), coverageDetails: z.string().optional(), contactInfo: z.string().optional(), documentUrl: z.string().optional(), status: z.string().optional() }))] }, async (request, reply) => {
    const { id } = request.params as any
    const warranty = await warrantyService.update(id, request.body as any)
    return reply.send({ warranty })
  })

  fastify.delete('/:id', { preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() }))] }, async (request, reply) => {
    const { id } = request.params as any
    await warrantyService.delete(id)
    return reply.send({ ok: true })
  })

  fastify.post('/:id/claims', { preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() })), validateBody(z.object({ title: z.string(), description: z.string(), severity: z.string().optional(), reportedDate: z.string().optional(), photos: z.array(z.string()).optional() }))] }, async (request, reply) => {
    const { id } = request.params as any
    const user = (request as any).user
    const body = request.body as any
    const claim = await warrantyService.fileClaim(id, { ...body, reportedBy: user.id })
    return reply.code(201).send({ claim })
  })

  fastify.patch('/:id/claims/:claimId', { preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid(), claimId: z.string().uuid() })), validateBody(z.object({ title: z.string().optional(), description: z.string().optional(), severity: z.string().optional(), status: z.string().optional(), photos: z.array(z.string()).optional() }))] }, async (request, reply) => {
    const { claimId } = request.params as any
    const claim = await warrantyService.updateClaim(claimId, request.body as any)
    return reply.send({ claim })
  })

  fastify.post('/:id/claims/:claimId/resolve', { preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid(), claimId: z.string().uuid() })), validateBody(z.object({ resolution: z.string(), resolvedDate: z.string().optional() }))] }, async (request, reply) => {
    const { claimId } = request.params as any
    const user = (request as any).user
    const body = request.body as any
    const claim = await warrantyService.resolveClaim(claimId, { ...body, resolvedBy: user.id })
    return reply.send({ claim })
  })
}
