import { describe, it, expect } from 'vitest'
import Fastify from 'fastify'
import { authRoutes } from '../modules/auth/auth.routes'
import { orgRoutes } from '../modules/orgs/org.routes'
import { userRoutes } from '../modules/users/user.routes'
import { errorHandler, notFoundHandler } from '../middleware/error-handler.middleware'

describe('Performance Tests', () => {
  let fastify: any

  beforeAll(async () => {
    fastify = Fastify({
      logger: false,
    })

    fastify.get('/health', async () => {
      return { status: 'ok' }
    })

    fastify.setErrorHandler(errorHandler)
    fastify.setNotFoundHandler(notFoundHandler)

    await fastify.register(authRoutes, { prefix: '/auth' })
    await fastify.register(orgRoutes, { prefix: '/orgs' })
    await fastify.register(userRoutes, { prefix: '/users' })

    await fastify.ready()
  })

  afterAll(async () => {
    await fastify.close()
  })

  describe('Response Time', () => {
    it('should respond to health check quickly', async () => {
      const start = Date.now()
      const response = await fastify.inject({
        method: 'GET',
        url: '/health',
      })
      const duration = Date.now() - start

      expect(response.statusCode).toBe(200)
      expect(duration).toBeLessThan(100) // Should respond in < 100ms
    })

    it('should handle validation quickly', async () => {
      const start = Date.now()
      const response = await fastify.inject({
        method: 'POST',
        url: '/auth/signup',
        payload: {
          email: 'invalid',
          password: 'short',
        },
      })
      const duration = Date.now() - start

      expect(response.statusCode).toBe(400)
      expect(duration).toBeLessThan(200) // Validation should be fast
    })
  })

  describe('Concurrent Requests', () => {
    it('should handle multiple concurrent requests', async () => {
      const requests = Array.from({ length: 10 }, () =>
        fastify.inject({
          method: 'GET',
          url: '/health',
        })
      )

      const responses = await Promise.all(requests)
      const allSuccessful = responses.every((r) => r.statusCode === 200)

      expect(allSuccessful).toBe(true)
    })
  })
})
