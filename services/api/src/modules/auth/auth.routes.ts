import { FastifyInstance } from 'fastify'
import rateLimit from '@fastify/rate-limit'
import { authService } from './auth.service'
import { authenticateUser } from './auth.middleware'
import { validateBody } from '../../middleware/validation.middleware'
import { signupSchema, loginSchema, verifyTokenSchema } from '../../schemas'
import { NotFoundError, AuthenticationError } from '../../errors/app.error'
import { RATE_LIMIT_CONFIG } from '../../middleware/rate-limit.middleware'
import { prisma } from '@kealee/database'

export async function authRoutes(fastify: FastifyInstance) {
  // Register stricter rate limiting for auth routes (prevent brute force)
  await fastify.register(rateLimit, {
    max: 10, // Lower limit for auth endpoints
    timeWindow: '1 minute',
    keyGenerator: (request) => {
      // Rate limit by IP for auth endpoints
      return request.ip || 'unknown'
    },
  })

  // POST /auth/signup
  fastify.post(
    '/signup',
    {
      schema: {
        description: 'Create a new user account',
        tags: ['auth'],
        body: {
          type: 'object',
          required: ['email', 'password', 'name'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
            name: { type: 'string', minLength: 1 },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  name: { type: 'string' },
                },
              },
              session: { type: 'object' },
            },
          },
          400: {
            type: 'object',
            properties: {
              error: {
                type: 'object',
                required: ['message', 'statusCode', 'timestamp'],
                properties: {
                  message: { type: 'string' },
                  code: { type: 'string' },
                  statusCode: { type: 'number' },
                  details: {},
                  timestamp: { type: 'string' },
                  path: { type: 'string' },
                },
              },
            },
          },
        },
      },
      preHandler: validateBody(signupSchema),
    },
    async (request, reply) => {
      try {
        const { email, password, name } = request.body as {
          email: string
          password: string
          name: string
        }

        const result = await authService.signup(email, password, name)

        return reply.code(201).send({
          user: {
            id: result.user.id,
            email: result.user.email,
            name: result.user.name,
          },
          session: result.session,
        })
      } catch (error: any) {
        fastify.log.error({ err: error }, 'Signup failed')

        const message =
          typeof error?.message === 'string'
            ? error.message
            : error instanceof Error
              ? error.message
              : typeof error === 'string'
                ? error
                : 'Signup failed'

        return reply.code(400).send({
          error: {
            message,
            statusCode: 400,
            timestamp: new Date().toISOString(),
            path: request.url,
          },
        })
      }
  })

  // POST /auth/login
  fastify.post(
    '/login',
    {
      schema: {
        description: 'Login with email and password',
        tags: ['auth'],
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              session: { type: 'object' },
            },
          },
          401: {
            type: 'object',
            properties: {
              error: { type: 'object' },
            },
          },
        },
      },
      preHandler: validateBody(loginSchema),
    },
    async (request, reply) => {
      try {
        const { email, password } = request.body as {
          email: string
          password: string
        }

        const result = await authService.login(email, password)

      return reply.send({
        session: result.session,
      })
    } catch (error: any) {
      throw new AuthenticationError(error.message || 'Login failed')
    }
  })

  // POST /auth/logout
  fastify.post(
    '/logout',
    { preHandler: authenticateUser },
    async (request, reply) => {
      try {
        const authHeader = request.headers.authorization
        const token = authHeader!.substring(7) // Already validated by middleware

        await authService.logout(token)

        return reply.send({
          message: 'Logged out successfully',
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Logout failed',
        })
      }
    }
  )

  // POST /auth/verify
  fastify.post(
    '/verify',
    { preHandler: validateBody(verifyTokenSchema) },
    async (request, reply) => {
      try {
        const { token } = request.body as {
          token: string
        }

        const user = await authService.verifyToken(token)

      return reply.send({
        valid: true,
        user: {
          id: user.id,
          email: user.email,
        },
      })
    } catch (error: any) {
      fastify.log.error(error)
      return reply.code(401).send({
        valid: false,
        error: error.message || 'Invalid or expired token',
      })
    }
  })

  // GET /auth/me - Get current authenticated user
  fastify.get(
    '/me',
    {
      schema: {
        description: 'Get current authenticated user',
        tags: ['auth'],
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  name: { type: 'string' },
                  phone: { type: 'string', nullable: true },
                  avatar: { type: 'string', nullable: true },
                  status: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
          401: {
            type: 'object',
            properties: {
              error: { type: 'object' },
            },
          },
        },
      },
      preHandler: authenticateUser,
    },
    async (request, reply) => {
      try {
        const user = (request as any).user

        // Fetch full user details from database
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            avatar: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        })

        if (!dbUser) {
          return reply.code(404).send({
            error: 'User not found',
          })
        }

        return reply.send({
          user: dbUser,
        })
      } catch (error: any) {
        throw error // Let global error handler process it
      }
    }
  )
}
