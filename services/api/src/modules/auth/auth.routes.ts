import { FastifyInstance } from 'fastify'
import rateLimit from '@fastify/rate-limit'
import { authService } from './auth.service'
import { authenticateUser } from './auth.middleware'
import { validateBody } from '../../middleware/validation.middleware'
import { signupSchema, loginSchema, verifyTokenSchema } from '../../schemas'
import { NotFoundError, AuthenticationError } from '../../errors/app.error'
import { RATE_LIMIT_CONFIG } from '../../middleware/rate-limit.middleware'
import { prismaAny } from '../../utils/prisma-helper'
import { sanitizeErrorMessage } from '../../utils/sanitize-error'
import { getSupabaseClient } from '../../utils/supabase-client'

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

        return reply.code(400).send({
          error: {
            message: sanitizeErrorMessage(error, 'Signup failed'),
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
      throw new AuthenticationError(sanitizeErrorMessage(error, 'Login failed'))
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
          error: sanitizeErrorMessage(error, 'Logout failed'),
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
        error: sanitizeErrorMessage(error, 'Invalid or expired token'),
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
        const dbUser = await prismaAny.user.findUnique({
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

  /**
   * POST /auth/setup-account — Set password for users created during checkout
   * Body: { token, email, password }
   * Token format: base64url(userId:timestamp:hmacSignature)
   */
  fastify.post('/setup-account', async (request, reply) => {
    try {
      const { token, email, password } = request.body as {
        token: string
        email: string
        password: string
      }

      if (!token || !email || !password) {
        return reply.status(400).send({ error: 'Token, email, and password are required' })
      }

      if (password.length < 8) {
        return reply.status(400).send({ error: 'Password must be at least 8 characters' })
      }

      // Decode and validate HMAC-signed token
      let userId: string
      let tokenTimestamp: number
      try {
        const { createHmac } = await import('crypto')
        const decoded = Buffer.from(token, 'base64url').toString('utf-8')
        const parts = decoded.split(':')
        if (parts.length < 2) throw new Error('Invalid token format')

        userId = parts[0]
        tokenTimestamp = parseInt(parts[1], 10)
        if (isNaN(tokenTimestamp)) throw new Error('Invalid timestamp')

        // Verify HMAC signature if present (tokens generated after P23 include signature)
        if (parts.length >= 3) {
          const signature = parts.slice(2).join(':')
          const secret = process.env.STRIPE_WEBHOOK_SECRET || 'kealee-setup-secret'
          const expectedSig = createHmac('sha256', secret)
            .update(`${userId}:${parts[1]}`)
            .digest('base64url')
          if (signature !== expectedSig) {
            throw new Error('Invalid signature')
          }
        }
      } catch {
        return reply.status(400).send({ error: 'Invalid setup token' })
      }

      // Check token expiry (48 hours)
      const TOKEN_EXPIRY_MS = 48 * 60 * 60 * 1000
      if (Date.now() - tokenTimestamp > TOKEN_EXPIRY_MS) {
        return reply.status(400).send({ error: 'Setup token has expired. Please contact support.' })
      }

      // Find the Prisma user
      const user = await prismaAny.user.findUnique({ where: { id: userId } })
      if (!user) {
        return reply.status(404).send({ error: 'User not found' })
      }

      // Verify email matches
      if (user.email.toLowerCase() !== email.toLowerCase()) {
        return reply.status(400).send({ error: 'Email does not match the setup token' })
      }

      // Create Supabase auth user with same ID as Prisma user
      const supabase = getSupabaseClient()

      // Check if a Supabase auth user already exists for this email
      const { data: existingUsers } = await supabase.auth.admin.listUsers()
      const existingAuth = existingUsers?.users?.find(
        (u: any) => u.email?.toLowerCase() === email.toLowerCase()
      )

      let session: any = null

      if (existingAuth) {
        // Auth user already exists — update password
        await supabase.auth.admin.updateUserById(existingAuth.id, { password })

        // Sign them in
        const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (signInErr) throw signInErr
        session = signInData.session
      } else {
        // Create new Supabase auth user with the Prisma user's ID
        const { data: newAuth, error: createErr } = await supabase.auth.admin.createUser({
          id: userId,
          email,
          password,
          email_confirm: true,
        })
        if (createErr) throw createErr

        // If Supabase assigned a different ID, update the Prisma user to match
        if (newAuth.user && newAuth.user.id !== userId) {
          // This shouldn't happen since we pass the ID, but handle gracefully
          console.warn(`Supabase assigned different ID: ${newAuth.user.id} vs ${userId}`)
        }

        // Sign them in
        const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (signInErr) throw signInErr
        session = signInData.session
      }

      console.log(`✅ Account setup completed for ${email} (userId: ${userId})`)

      return reply.send({
        success: true,
        session,
        user: { id: user.id, email: user.email, name: user.name },
      })
    } catch (error: any) {
      console.error('Account setup error:', error)
      return reply.status(500).send({
        error: sanitizeErrorMessage(error, 'Account setup failed'),
      })
    }
  })
}
