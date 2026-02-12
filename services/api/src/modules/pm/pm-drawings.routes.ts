import { FastifyInstance } from 'fastify'
import { drawingService } from './pm-drawings.service'
import { authenticateUser } from '../auth/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../../middleware/validation.middleware'
import { z } from 'zod'

export async function pmDrawingRoutes(fastify: FastifyInstance) {
  // GET / - List drawings
  fastify.get(
    '/',
    {
      preHandler: [
        authenticateUser,
        validateQuery(z.object({
          projectId: z.string().uuid().optional(),
          discipline: z.string().optional(),
          status: z.string().optional(),
          search: z.string().optional(),
          page: z.coerce.number().default(1),
          limit: z.coerce.number().default(25),
        })),
      ],
    },
    async (request, reply) => {
      const result = await drawingService.list(request.query as any)
      return reply.send(result)
    }
  )

  // GET /sets - Drawing sets by discipline
  fastify.get(
    '/sets',
    {
      preHandler: [
        authenticateUser,
        validateQuery(z.object({ projectId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const { projectId } = request.query as { projectId: string }
      const sets = await drawingService.getSets(projectId)
      return reply.send({ sets })
    }
  )

  // GET /current - Current set only
  fastify.get(
    '/current',
    {
      preHandler: [
        authenticateUser,
        validateQuery(z.object({ projectId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const { projectId } = request.query as { projectId: string }
      const drawings = await drawingService.getCurrent(projectId)
      return reply.send({ drawings })
    }
  )

  // GET /:id - Get drawing detail
  fastify.get(
    '/:id',
    {
      preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() }))],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const drawing = await drawingService.getById(id)
      if (!drawing) return reply.code(404).send({ error: 'Drawing not found' })
      return reply.send({ drawing })
    }
  )

  // POST / - Upload drawing
  fastify.post(
    '/',
    {
      preHandler: [
        authenticateUser,
        validateBody(z.object({
          projectId: z.string().uuid(),
          name: z.string().min(1),
          description: z.string().optional(),
          fileUrl: z.string().optional(),
          format: z.string().optional(),
          size: z.number().optional(),
          discipline: z.string().optional(),
          drawingNumber: z.string().optional(),
          tags: z.array(z.string()).optional(),
        })),
      ],
    },
    async (request, reply) => {
      const body = request.body as any
      const drawing = await drawingService.upload(body)
      return reply.code(201).send({ drawing })
    }
  )

  // PATCH /:id - Update metadata
  fastify.patch(
    '/:id',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(z.object({
          name: z.string().min(1).optional(),
          description: z.string().optional(),
          discipline: z.string().optional(),
          drawingNumber: z.string().optional(),
          tags: z.array(z.string()).optional(),
          status: z.string().optional(),
        })),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const drawing = await drawingService.update(id, request.body as any)
      if (!drawing) return reply.code(404).send({ error: 'Drawing not found' })
      return reply.send({ drawing })
    }
  )

  // DELETE /:id - Archive
  fastify.delete(
    '/:id',
    {
      preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() }))],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      await drawingService.archive(id)
      return reply.send({ ok: true })
    }
  )

  // POST /:id/revisions - Add revision
  fastify.post(
    '/:id/revisions',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(z.object({
          fileUrl: z.string().optional(),
          format: z.string().optional(),
          size: z.number().optional(),
          description: z.string().optional(),
        })),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const revision = await drawingService.addRevision(id, request.body as any)
      if (!revision) return reply.code(404).send({ error: 'Drawing not found' })
      return reply.code(201).send({ drawing: revision })
    }
  )

  // GET /:id/revisions - Get revisions
  fastify.get(
    '/:id/revisions',
    {
      preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() }))],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const revisions = await drawingService.getRevisions(id)
      return reply.send({ revisions })
    }
  )
}
