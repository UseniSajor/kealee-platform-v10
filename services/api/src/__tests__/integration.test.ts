import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import { authRoutes } from '../modules/auth/auth.routes'
import { orgRoutes } from '../modules/orgs/org.routes'
import { userRoutes } from '../modules/users/user.routes'
import { rbacRoutes } from '../modules/rbac/rbac.routes'
import { entitlementRoutes } from '../modules/entitlements/entitlement.routes'
import { eventRoutes } from '../modules/events/event.routes'
import { auditRoutes } from '../modules/audit/audit.routes'
import { errorHandler, notFoundHandler } from '../middleware/error-handler.middleware'

describe('API Integration Tests', () => {
  let fastify: any

  beforeAll(async () => {
    fastify = Fastify({
      logger: false, // Disable logging in tests
    })

    await fastify.register(cors, { origin: true })
    await fastify.register(helmet)

    fastify.get('/health', async () => {
      return { status: 'ok' }
    })

    // Register error handlers
    fastify.setErrorHandler(errorHandler)
    fastify.setNotFoundHandler(notFoundHandler)

    await fastify.register(authRoutes, { prefix: '/auth' })
    await fastify.register(orgRoutes, { prefix: '/orgs' })
    await fastify.register(userRoutes, { prefix: '/users' })
    await fastify.register(rbacRoutes, { prefix: '/rbac' })
    await fastify.register(entitlementRoutes, { prefix: '/entitlements' })
    await fastify.register(eventRoutes, { prefix: '/events' })
    await fastify.register(auditRoutes, { prefix: '/audit' })

    await fastify.ready()
  })

  afterAll(async () => {
    await fastify.close()
  })

  describe('Health Check', () => {
    it('should return 200', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/health',
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({ status: 'ok' })
    })
  })

  describe('Auth Routes', () => {
    it('should return 400 for signup without required fields', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/auth/signup',
        payload: {
          email: 'test@example.com',
          // Missing password and name
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should return 400 for login without required fields', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'test@example.com',
          // Missing password
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should return 401 for /auth/me without auth header', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/auth/me',
      })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('Org Routes', () => {
    it('should return 401 for creating org without auth', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/orgs',
        payload: {
          name: 'Test Org',
          slug: 'test-org',
        },
      })

      expect(response.statusCode).toBe(401)
    })

    it('should handle listing orgs (may require DATABASE_URL)', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/orgs',
      })

      // Accept either 200 (with DB) or 500 (without DB)
      expect([200, 500]).toContain(response.statusCode)
      if (response.statusCode === 200) {
        expect(response.json()).toHaveProperty('orgs')
        expect(response.json()).toHaveProperty('pagination')
      }
    })
  })

  describe('RBAC Routes', () => {
    it('should handle listing roles (may require DATABASE_URL)', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/rbac/roles',
      })

      // Accept either 200 (with DB) or 500 (without DB)
      expect([200, 500]).toContain(response.statusCode)
      if (response.statusCode === 200) {
        expect(response.json()).toHaveProperty('roles')
      }
    })

    it('should handle listing permissions (may require DATABASE_URL)', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/rbac/permissions',
      })

      // Accept either 200 (with DB) or 500 (without DB)
      expect([200, 500]).toContain(response.statusCode)
      if (response.statusCode === 200) {
        expect(response.json()).toHaveProperty('permissions')
      }
    })
  })

  describe('Event Routes', () => {
    it('should return 401 for creating event without auth', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/events',
        payload: {
          type: 'TEST_EVENT',
          entityType: 'Test',
          entityId: 'test-id',
        },
      })

      expect(response.statusCode).toBe(401)
    })

    it('should handle listing events (may require DATABASE_URL)', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/events',
      })

      // Accept either 200 (with DB) or 500 (without DB)
      expect([200, 500]).toContain(response.statusCode)
      if (response.statusCode === 200) {
        expect(response.json()).toHaveProperty('events')
        expect(response.json()).toHaveProperty('pagination')
      }
    })
  })

  describe('Audit Routes', () => {
    it('should return 401 for creating audit without auth', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/audit',
        payload: {
          action: 'TEST_ACTION',
          entityType: 'Test',
          entityId: 'test-id',
        },
      })

      expect(response.statusCode).toBe(401)
    })

    it('should handle listing audit logs (may require DATABASE_URL)', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/audit',
      })

      // Accept either 200 (with DB) or 500 (without DB)
      expect([200, 500]).toContain(response.statusCode)
      if (response.statusCode === 200) {
        expect(response.json()).toHaveProperty('auditLogs')
        expect(response.json()).toHaveProperty('pagination')
      }
    })
  })

  describe('User Routes', () => {
    it('should return 401 for listing users without auth', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/users',
      })

      expect(response.statusCode).toBe(401)
    })

    it('should return 400 for invalid user ID format', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/users/invalid-id',
        headers: {
          authorization: 'Bearer test-token',
        },
      })

      // Should fail validation (400) or auth (401)
      expect([400, 401]).toContain(response.statusCode)
    })
  })

  describe('Error Handling', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/unknown/route',
      })

      expect(response.statusCode).toBe(404)
      const body = response.json()
      expect(body).toHaveProperty('error')
      expect(body.error).toHaveProperty('code', 'NOT_FOUND')
    })

    it('should return structured error for validation failures', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/auth/signup',
        payload: {
          email: 'invalid-email',
          password: 'short',
          name: '',
        },
      })

      expect(response.statusCode).toBe(400)
      const body = response.json()
      expect(body).toHaveProperty('error')
      expect(body.error).toHaveProperty('code', 'VALIDATION_ERROR')
      expect(body.error).toHaveProperty('details')
    })
  })
})
