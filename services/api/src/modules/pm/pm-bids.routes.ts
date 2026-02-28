/**
 * PM Bids Routes
 */
import { FastifyInstance } from 'fastify'
import { bidService } from './pm-bids.service'
import { authenticateUser } from '../auth/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../../middleware/validation.middleware'
import { z } from 'zod'

export async function pmBidRoutes(fastify: FastifyInstance) {
  // GET / - List bids
  fastify.get(
    '/',
    {
      preHandler: [
        authenticateUser,
        validateQuery(z.object({
          projectId: z.string().uuid().optional(),
          status: z.string().optional(),
          search: z.string().optional(),
          page: z.coerce.number().default(1),
          limit: z.coerce.number().default(25),
        })),
      ],
    },
    async (request, reply) => {
      try {
        const query = request.query as any
        const result = await bidService.list(query)
        return reply.send(result)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: sanitizeErrorMessage(error)})
      }
    }
  )

  // GET /:id - Get bid detail
  fastify.get(
    '/:id',
    {
      preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() }))],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const bid = await bidService.getById(id)
        return reply.send({ bid })
      } catch (error: any) {
        fastify.log.error(error)
        const code = error.message?.includes('not found') ? 404 : 400
        return reply.code(code).send({ error: sanitizeErrorMessage(error)})
      }
    }
  )

  // POST / - Create bid
  fastify.post(
    '/',
    {
      preHandler: [
        authenticateUser,
        validateBody(z.object({
          projectId: z.string().uuid(),
          title: z.string().min(1),
          description: z.string().optional(),
          dueDate: z.string().optional(),
          scopeOfWork: z.string().optional(),
          tradeCategory: z.string().optional(),
        })),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const body = request.body as any
        const bid = await bidService.create({ ...body, createdById: user.id })
        return reply.code(201).send({ bid })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: sanitizeErrorMessage(error)})
      }
    }
  )

  // PATCH /:id - Update bid
  fastify.patch(
    '/:id',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(z.object({
          title: z.string().min(1).optional(),
          description: z.string().optional(),
          dueDate: z.string().optional(),
          scopeOfWork: z.string().optional(),
          tradeCategory: z.string().optional(),
          status: z.string().optional(),
        })),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const body = request.body as any
        const bid = await bidService.update(id, body)
        return reply.send({ bid })
      } catch (error: any) {
        fastify.log.error(error)
        const code = error.message?.includes('not found') ? 404 : 400
        return reply.code(code).send({ error: sanitizeErrorMessage(error)})
      }
    }
  )

  // POST /:id/close - Close bidding
  fastify.post(
    '/:id/close',
    {
      preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() }))],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const bid = await bidService.close(id)
        return reply.send({ bid })
      } catch (error: any) {
        fastify.log.error(error)
        const code = error.message?.includes('not found') ? 404 : 400
        return reply.code(code).send({ error: sanitizeErrorMessage(error)})
      }
    }
  )

  // GET /:id/comparison - Compare submissions
  fastify.get(
    '/:id/comparison',
    {
      preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() }))],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const comparison = await bidService.getComparison(id)
        return reply.send(comparison)
      } catch (error: any) {
        fastify.log.error(error)
        const code = error.message?.includes('not found') ? 404 : 400
        return reply.code(code).send({ error: sanitizeErrorMessage(error)})
      }
    }
  )

  // POST /:id/award - Award bid
  fastify.post(
    '/:id/award',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(z.object({
          submissionId: z.string().uuid(),
        })),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const body = request.body as any
        const bid = await bidService.award(id, body)
        return reply.send({ bid })
      } catch (error: any) {
        fastify.log.error(error)
        const code = error.message?.includes('not found') ? 404 : 400
        return reply.code(code).send({ error: sanitizeErrorMessage(error)})
      }
    }
  )
}
