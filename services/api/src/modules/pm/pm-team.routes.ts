/**
 * PM Team Routes
 */
import { FastifyInstance } from 'fastify'
import { teamService } from './pm-team.service'
import { authenticateUser } from '../auth/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../../middleware/validation.middleware'
import { z } from 'zod'
import { sanitizeErrorMessage } from '../../utils/sanitize-error'

export async function pmTeamRoutes(fastify: FastifyInstance) {
  // GET / - List team members
  fastify.get(
    '/',
    {
      preHandler: [
        authenticateUser,
        validateQuery(z.object({
          projectId: z.string().uuid().optional(),
          role: z.string().optional(),
          search: z.string().optional(),
          page: z.coerce.number().default(1),
          limit: z.coerce.number().default(25),
        })),
      ],
    },
    async (request, reply) => {
      try {
        const query = request.query as any
        const result = await teamService.list(query)
        return reply.send(result)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: sanitizeErrorMessage(error)})
      }
    }
  )

  // GET /directory - Org directory
  fastify.get(
    '/directory',
    {
      preHandler: [
        authenticateUser,
        validateQuery(z.object({
          orgId: z.string().uuid(),
        })),
      ],
    },
    async (request, reply) => {
      try {
        const { orgId } = request.query as { orgId: string }
        const result = await teamService.getDirectory(orgId)
        return reply.send(result)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: sanitizeErrorMessage(error)})
      }
    }
  )

  // GET /workload - Team workload
  fastify.get(
    '/workload',
    {
      preHandler: [
        authenticateUser,
        validateQuery(z.object({
          projectId: z.string().uuid(),
        })),
      ],
    },
    async (request, reply) => {
      try {
        const { projectId } = request.query as { projectId: string }
        const result = await teamService.getWorkload(projectId)
        return reply.send(result)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: sanitizeErrorMessage(error)})
      }
    }
  )

  // POST / - Add team member
  fastify.post(
    '/',
    {
      preHandler: [
        authenticateUser,
        validateBody(z.object({
          projectId: z.string().uuid(),
          userId: z.string().uuid(),
          role: z.string().min(1),
        })),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const body = request.body as any
        const member = await teamService.add({ ...body, addedById: user.id })
        return reply.code(201).send({ member })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: sanitizeErrorMessage(error)})
      }
    }
  )

  // PATCH /:memberId - Update role
  fastify.patch(
    '/:memberId',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ memberId: z.string().uuid() })),
        validateBody(z.object({
          role: z.string().min(1),
        })),
      ],
    },
    async (request, reply) => {
      try {
        const { memberId } = request.params as { memberId: string }
        const body = request.body as any
        const member = await teamService.updateRole(memberId, body)
        return reply.send({ member })
      } catch (error: any) {
        fastify.log.error(error)
        const code = (error instanceof Error && error.message?.includes('not found')) ? 404 : 400
        return reply.code(code).send({ error: sanitizeErrorMessage(error)})
      }
    }
  )

  // DELETE /:memberId - Remove member
  fastify.delete(
    '/:memberId',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ memberId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { memberId } = request.params as { memberId: string }
        await teamService.remove(memberId)
        return reply.send({ success: true })
      } catch (error: any) {
        fastify.log.error(error)
        const code = (error instanceof Error && error.message?.includes('not found')) ? 404 : 400
        return reply.code(code).send({ error: sanitizeErrorMessage(error)})
      }
    }
  )
}
