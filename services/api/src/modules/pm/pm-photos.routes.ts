import { FastifyInstance } from 'fastify'
import { photoService } from './pm-photos.service'
import { authenticateUser } from '../auth/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../../middleware/validation.middleware'
import { z } from 'zod'

export async function pmPhotoRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: [authenticateUser, validateQuery(z.object({ projectId: z.string().uuid().optional(), category: z.string().optional(), startDate: z.string().optional(), endDate: z.string().optional(), page: z.coerce.number().default(1), limit: z.coerce.number().default(50) }))] }, async (request, reply) => {
    const result = await photoService.list(request.query as any)
    return reply.send(result)
  })

  fastify.get('/timeline', { preHandler: [authenticateUser, validateQuery(z.object({ projectId: z.string().uuid() }))] }, async (request, reply) => {
    const { projectId } = request.query as any
    const timeline = await photoService.getTimeline(projectId)
    return reply.send({ timeline })
  })

  fastify.get('/categories', { preHandler: [authenticateUser, validateQuery(z.object({ projectId: z.string().uuid() }))] }, async (request, reply) => {
    const { projectId } = request.query as any
    const categories = await photoService.getCategories(projectId)
    return reply.send({ categories })
  })

  fastify.get('/:id', { preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() }))] }, async (request, reply) => {
    const { id } = request.params as any
    const photo = await photoService.getById(id)
    if (!photo) return reply.code(404).send({ error: 'Photo not found' })
    return reply.send({ photo })
  })

  fastify.post('/', { preHandler: [authenticateUser, validateBody(z.object({ projectId: z.string().uuid(), url: z.string(), thumbnailUrl: z.string().optional(), caption: z.string().optional(), category: z.string().optional(), takenAt: z.string().optional(), metadata: z.any().optional() }))] }, async (request, reply) => {
    const user = (request as any).user
    const body = request.body as any
    const photo = await photoService.create({ ...body, takenBy: user.id, takenAt: body.takenAt ? new Date(body.takenAt) : undefined })
    return reply.code(201).send({ photo })
  })

  fastify.patch('/:id', { preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() })), validateBody(z.object({ caption: z.string().optional(), category: z.string().optional(), metadata: z.any().optional() }))] }, async (request, reply) => {
    const { id } = request.params as any
    const photo = await photoService.update(id, request.body)
    return reply.send({ photo })
  })

  fastify.delete('/:id', { preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() }))] }, async (request, reply) => {
    const { id } = request.params as any
    await photoService.delete(id)
    return reply.send({ ok: true })
  })
}
