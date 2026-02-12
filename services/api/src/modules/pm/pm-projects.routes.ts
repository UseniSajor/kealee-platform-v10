/**
 * PM Projects Routes
 */
import { FastifyInstance } from 'fastify'
import { projectService } from './pm-projects.service'
import { authenticateUser } from '../auth/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../../middleware/validation.middleware'
import { z } from 'zod'

export async function pmProjectRoutes(fastify: FastifyInstance) {
  // GET / - List projects
  fastify.get(
    '/',
    {
      preHandler: [
        authenticateUser,
        validateQuery(z.object({
          clientId: z.string().uuid().optional(),
          status: z.string().optional(),
          phase: z.string().optional(),
          search: z.string().optional(),
          page: z.coerce.number().default(1),
          limit: z.coerce.number().default(25),
        })),
      ],
    },
    async (request, reply) => {
      try {
        const query = request.query as any
        const result = await projectService.list(query)
        return reply.send(result)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: error.message })
      }
    }
  )

  // GET /:id - Get project detail
  fastify.get(
    '/:id',
    {
      preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() }))],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const project = await projectService.getById(id)
        return reply.send({ project })
      } catch (error: any) {
        fastify.log.error(error)
        const code = error.message?.includes('not found') ? 404 : 400
        return reply.code(code).send({ error: error.message })
      }
    }
  )

  // GET /:id/overview - Project dashboard overview
  fastify.get(
    '/:id/overview',
    {
      preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() }))],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const overview = await projectService.getOverview(id)
        return reply.send(overview)
      } catch (error: any) {
        fastify.log.error(error)
        const code = error.message?.includes('not found') ? 404 : 400
        return reply.code(code).send({ error: error.message })
      }
    }
  )

  // GET /:id/activity - Activity feed
  fastify.get(
    '/:id/activity',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateQuery(z.object({
          page: z.coerce.number().default(1),
          limit: z.coerce.number().default(20),
        })),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const query = request.query as any
        const activity = await projectService.getActivity(id, query)
        return reply.send(activity)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: error.message })
      }
    }
  )

  // GET /:id/reports/status - Status report
  fastify.get(
    '/:id/reports/status',
    {
      preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() }))],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const report = await projectService.getStatusReport(id)
        return reply.send(report)
      } catch (error: any) {
        fastify.log.error(error)
        const code = error.message?.includes('not found') ? 404 : 400
        return reply.code(code).send({ error: error.message })
      }
    }
  )

  // POST / - Create project
  fastify.post(
    '/',
    {
      preHandler: [
        authenticateUser,
        validateBody(z.object({
          name: z.string().min(1),
          description: z.string().optional(),
          clientId: z.string().uuid().optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          budget: z.number().optional(),
          address: z.string().optional(),
          orgId: z.string().uuid(),
        })),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const body = request.body as any
        const project = await projectService.create({ ...body, createdById: user.id })
        return reply.code(201).send({ project })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: error.message })
      }
    }
  )

  // PATCH /:id - Update project
  fastify.patch(
    '/:id',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(z.object({
          name: z.string().min(1).optional(),
          description: z.string().optional(),
          clientId: z.string().uuid().optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          budget: z.number().optional(),
          address: z.string().optional(),
          status: z.string().optional(),
          phase: z.string().optional(),
        })),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const body = request.body as any
        const project = await projectService.update(id, body)
        return reply.send({ project })
      } catch (error: any) {
        fastify.log.error(error)
        const code = error.message?.includes('not found') ? 404 : 400
        return reply.code(code).send({ error: error.message })
      }
    }
  )

  // DELETE /:id - Archive project
  fastify.delete(
    '/:id',
    {
      preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() }))],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const project = await projectService.archive(id)
        return reply.send({ project })
      } catch (error: any) {
        fastify.log.error(error)
        const code = error.message?.includes('not found') ? 404 : 400
        return reply.code(code).send({ error: error.message })
      }
    }
  )
}
