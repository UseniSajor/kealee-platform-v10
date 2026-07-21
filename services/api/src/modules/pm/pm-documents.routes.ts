import { FastifyInstance } from 'fastify'
import { pmDocumentsService as documentService } from './pm-documents.service'
import { authenticateUser } from '../auth/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../../middleware/validation.middleware'
import { z } from 'zod'

export async function pmDocumentRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: [authenticateUser, validateQuery(z.object({ projectId: z.string().uuid().optional(), type: z.string().optional(), category: z.string().optional(), status: z.string().optional(), search: z.string().optional(), page: z.coerce.number().default(1), limit: z.coerce.number().default(50) }))] }, async (request, reply) => {
    const result = await documentService.list(request.query as any)
    return reply.send(result)
  })

  fastify.get('/search', { preHandler: [authenticateUser, validateQuery(z.object({ projectId: z.string().uuid().optional(), q: z.string().optional(), page: z.coerce.number().default(1), limit: z.coerce.number().default(50) }))] }, async (request, reply) => {
    const result = await documentService.search(request.query as any)
    return reply.send(result)
  })

  fastify.get('/templates', { preHandler: [authenticateUser, validateQuery(z.object({ projectId: z.string().uuid().optional(), category: z.string().optional() }))] }, async (request, reply) => {
    const templates = await documentService.getTemplates(request.query as any)
    return reply.send({ templates })
  })

  fastify.get('/:id', { preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() }))] }, async (request, reply) => {
    const { id } = request.params as any
    const doc = await documentService.getById(id)
    if (!doc) return reply.code(404).send({ error: 'Document not found' })
    return reply.send({ document: doc })
  })

  fastify.post('/', { preHandler: [authenticateUser, validateBody(z.object({ projectId: z.string().uuid(), name: z.string(), type: z.string(), category: z.string(), fileUrl: z.string().optional(), size: z.number().optional(), format: z.string().optional(), description: z.string().optional(), tags: z.array(z.string()).optional() }))] }, async (request, reply) => {
    const body = request.body as any
    const user = (request as any).user
    const doc = await documentService.create(body, user.id)
    return reply.code(201).send({ document: doc })
  })

  fastify.patch('/:id', { preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() })), validateBody(z.object({ name: z.string().optional(), description: z.string().optional(), type: z.string().optional(), category: z.string().optional(), status: z.string().optional(), tags: z.array(z.string()).optional() }))] }, async (request, reply) => {
    const { id } = request.params as any
    const doc = await documentService.update(id, request.body)
    return reply.send({ document: doc })
  })

  fastify.delete('/:id', { preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() }))] }, async (request, reply) => {
    const { id } = request.params as any
    await documentService.softDelete(id)
    return reply.send({ ok: true })
  })

  fastify.post('/:id/versions', { preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() })), validateBody(z.object({ fileUrl: z.string(), fileSize: z.number().optional(), notes: z.string().optional() }))] }, async (request, reply) => {
    const { id } = request.params as any
    const body = request.body as any
    const user = (request as any).user
    const version = await documentService.addVersion(id, body, user.id)
    if (!version) return reply.code(404).send({ error: 'Parent document not found' })
    return reply.code(201).send({ document: version })
  })

  fastify.get('/:id/versions', { preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() }))] }, async (request, reply) => {
    const { id } = request.params as any
    const versions = await documentService.getVersions(id)
    return reply.send({ versions })
  })

  fastify.post('/:id/distribute', { preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() })), validateBody(z.object({ recipientIds: z.array(z.string().uuid()), message: z.string().optional() }))] }, async (request, reply) => {
    const { id } = request.params as any
    const body = request.body as any
    const user = (request as any).user
    const result = await documentService.distribute(id, body, user.id)
    return reply.send({ ok: true, distributions: result.distributions })
  })
}
