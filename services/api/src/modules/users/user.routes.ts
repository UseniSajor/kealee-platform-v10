import { FastifyInstance } from 'fastify'
import rateLimit from '@fastify/rate-limit'
import { userService } from './user.service'
import { authenticateUser } from '../auth/auth.middleware'
import { validateBody, validateQuery, validateParams } from '../../middleware/validation.middleware'
import { updateUserSchema, listUsersQuerySchema } from '../../schemas'
import { NotFoundError, AuthorizationError } from '../../errors/app.error'
import { RATE_LIMIT_CONFIG } from '../../middleware/rate-limit.middleware'
import { z } from 'zod'

export async function userRoutes(fastify: FastifyInstance) {
  // Register per-user rate limiting for user routes
  await fastify.register(rateLimit, {
    max: RATE_LIMIT_CONFIG.perUser.max,
    timeWindow: RATE_LIMIT_CONFIG.perUser.timeWindow,
    keyGenerator: (request) => {
      const user = (request as any).user
      return user?.id ? `user:${user.id}` : request.ip || 'unknown'
    },
  })

  // GET /users - List users
  fastify.get(
    '/',
    { preHandler: authenticateUser },
    async (request, reply) => {
      try {
        const { page, limit, status, search, role } = request.query as {
          page?: string
          limit?: string
          status?: 'ACTIVE' | 'SUSPENDED' | 'DELETED'
          search?: string
          role?: string
        }

        const result = await userService.listUsers({
          page: page ? parseInt(page) : undefined,
          limit: limit ? parseInt(limit) : undefined,
          status,
          search,
          role,
        })

        return reply.send(result)
      } catch (error: any) {
        throw error // Let global error handler process it
      }
    }
  )

  // GET /users/:id - Get user by ID
  fastify.get(
    '/:id',
    {
      schema: {
        description: 'Get user by ID',
        tags: ['users'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              user: { type: 'object' },
            },
          },
          404: {
            type: 'object',
            properties: {
              error: { type: 'object' },
            },
          },
        },
      },
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const user = await userService.getUserById(id)

        return reply.send({ user })
      } catch (error: any) {
        fastify.log.error(error)
        const statusCode = error.message === 'User not found' ? 404 : 500
        return reply.code(statusCode).send({
          error: error.message || 'Failed to get user',
        })
      }
    }
  )

  // PUT /users/:id - Update user
  fastify.put(
    '/:id',
    { preHandler: authenticateUser },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const { id } = request.params as { id: string }
        const { name, phone, avatar } = request.body as {
          name?: string
          phone?: string
          avatar?: string
        }

        // Users can only update their own profile unless they have admin permissions
        if (user.id !== id) {
          // TODO: Check if user has admin permission
          throw new AuthorizationError('You can only update your own profile')
        }

        const updatedUser = await userService.updateUser(id, {
          name,
          phone,
          avatar,
        })

        return reply.send({ user: updatedUser })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to update user',
        })
      }
    }
  )

  // GET /users/:id/orgs - Get user's organizations
  fastify.get(
    '/:id/orgs',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const orgs = await userService.getUserOrganizations(id)

        return reply.send({ orgs })
      } catch (error: any) {
        throw error // Let global error handler process it
      }
    }
  )
}
