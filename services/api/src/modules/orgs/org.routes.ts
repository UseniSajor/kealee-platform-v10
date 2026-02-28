import { FastifyInstance } from 'fastify'
import rateLimit from '@fastify/rate-limit'
import { orgService } from './org.service'
import { authenticateUser } from '../auth/auth.middleware'
import { validateBody, validateQuery, validateParams } from '../../middleware/validation.middleware'
import { createOrgSchema, updateOrgSchema, addMemberSchema, updateMemberRoleSchema, listOrgsQuerySchema } from '../../schemas'
import { NotFoundError, AuthorizationError } from '../../errors/app.error'
import { RATE_LIMIT_CONFIG } from '../../middleware/rate-limit.middleware'
import { z } from 'zod'
import { sanitizeErrorMessage } from '../../utils/sanitize-error'

export async function orgRoutes(fastify: FastifyInstance) {
  // Register per-org rate limiting for org routes
  await fastify.register(rateLimit, {
    max: RATE_LIMIT_CONFIG.perOrg.max,
    timeWindow: RATE_LIMIT_CONFIG.perOrg.timeWindow,
    keyGenerator: (request) => {
      const orgId =
        (request.params as any)?.id ||
        (request.query as any)?.orgId ||
        (request.body as any)?.orgId
      if (orgId) {
        return `org:${orgId}`
      }
      const user = (request as any).user
      return user?.id ? `user:${user.id}` : request.ip || 'unknown'
    },
  })

  // POST /orgs - Create organization
  fastify.post(
    '/',
    {
      schema: {
        description: 'Create a new organization',
        tags: ['orgs'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['name', 'slug'],
          properties: {
            name: { type: 'string', minLength: 1 },
            slug: { type: 'string', pattern: '^[a-z0-9-]+$' },
            description: { type: 'string' },
            logo: { type: 'string', format: 'uri' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              org: { type: 'object' },
            },
          },
        },
      },
      preHandler: [authenticateUser, validateBody(createOrgSchema)],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const { name, slug, description, logo } = request.body as {
          name: string
          slug: string
          description?: string
          logo?: string
        }

        const org = await orgService.createOrg({
          name,
          slug,
          description,
          logo,
          ownerId: user.id,
        })

        return reply.code(201).send({ org })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to create organization'),
        })
      }
    }
  )

  // GET /orgs - List organizations
  fastify.get(
    '/',
    {
      schema: {
        description: 'List organizations with pagination and filtering',
        tags: ['orgs'],
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'number', minimum: 1 },
            limit: { type: 'number', minimum: 1, maximum: 100 },
            status: { type: 'string', enum: ['ACTIVE', 'SUSPENDED', 'DELETED'] },
            search: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              orgs: { type: 'array' },
              pagination: { type: 'object' },
            },
          },
        },
      },
      preHandler: validateQuery(listOrgsQuerySchema as any),
    },
    async (request, reply) => {
      try {
        const { page, limit, status, search } = request.query as {
          page?: number
          limit?: number
          status?: 'ACTIVE' | 'SUSPENDED' | 'DELETED'
          search?: string
        }

      const result = await orgService.listOrgs({
        page,
        limit,
        status,
        ...(search && { search }),
      })

      return reply.send(result)
    } catch (error: any) {
      throw error // Let global error handler process it
    }
  })

  // GET /orgs/:id - Get organization by ID
  fastify.get(
    '/:id',
    { preHandler: validateParams(z.object({ id: z.string().uuid() })) },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const org = await orgService.getOrgById(id)
        return reply.send({ org })
      } catch (error: any) {
        if (error.message === 'Organization not found') {
          const { id } = request.params as { id: string }
          throw new NotFoundError('Organization', id)
      }
      throw error // Let global error handler process it
    }
  })

  // GET /orgs/slug/:slug - Get organization by slug
  fastify.get('/slug/:slug', async (request, reply) => {
    try {
      const { slug } = request.params as { slug: string }
      const org = await orgService.getOrgBySlug(slug)
      return reply.send({ org })
    } catch (error: any) {
      fastify.log.error(error)
      const statusCode = error.message === 'Organization not found' ? 404 : 500
      return reply.code(statusCode).send({
        error: sanitizeErrorMessage(error, 'Failed to get organization'),
      })
    }
  })

  // PUT /orgs/:id - Update organization
  fastify.put(
    '/:id',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(updateOrgSchema),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const data = request.body as {
          name?: string
          description?: string
          logo?: string
        }

        const org = await orgService.updateOrg(id, data)
        return reply.send({ org })
      } catch (error: any) {
        throw error // Let global error handler process it
      }
    }
  )

  // GET /orgs/:id/members - List members with user + role details
  fastify.get(
    '/:id/members',
    {
      preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() }))],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const members = await orgService.getOrgMembers(id)
        return reply.send({ members, count: members.length })
      } catch (error: any) {
        if (error.message === 'Organization not found') {
          const { id } = request.params as { id: string }
          throw new NotFoundError('Organization', id)
        }
        throw error
      }
    }
  )

  // POST /orgs/:id/members - Add member
  fastify.post(
    '/:id/members',
    { preHandler: authenticateUser },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const { userId, roleKey } = request.body as {
          userId: string
          roleKey: string
        }

        if (!userId || !roleKey) {
          return reply.code(400).send({
            error: 'Missing required fields: userId, roleKey',
          })
        }

        const member = await orgService.addMember(id, userId, roleKey)
        return reply.code(201).send({ member })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to add member'),
        })
      }
    }
  )

  // DELETE /orgs/:id/members/:userId - Remove member
  fastify.delete(
    '/:id/members/:userId',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid(), userId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { id, userId } = request.params as { id: string; userId: string }
        await orgService.removeMember(id, userId)
        return reply.send({ message: 'Member removed successfully' })
      } catch (error: any) {
        throw error // Let global error handler process it
      }
    }
  )

  // PUT /orgs/:id/members/:userId - Update member role
  fastify.put(
    '/:id/members/:userId',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid(), userId: z.string().uuid() })),
        validateBody(updateMemberRoleSchema),
      ],
    },
    async (request, reply) => {
      try {
        const { id, userId } = request.params as { id: string; userId: string }
        const { roleKey } = request.body as { roleKey: string }

        const member = await orgService.updateMemberRole(id, userId, roleKey)
        return reply.send({ member })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to update member role'),
        })
      }
    }
  )

  // GET /orgs/my - Get current user's organizations
  fastify.get(
    '/my',
    { preHandler: authenticateUser },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const orgs = await orgService.getUserOrgs(user.id)
        return reply.send({ orgs })
      } catch (error: any) {
        throw error // Let global error handler process it
      }
    }
  )
}
