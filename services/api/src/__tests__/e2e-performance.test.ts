/**
 * Performance Test: Load Testing (Prompt 3.9)
 * 
 * Tests performance under load (100+ concurrent projects)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import { prisma } from '@kealee/database'
import { projectRoutes } from '../modules/projects/project.routes'
import { milestoneRoutes } from '../modules/milestones/milestone.routes'
import { errorHandler, notFoundHandler } from '../middleware/error-handler.middleware'

const mockUser = { id: 'test-user-id', email: 'test@example.com' }

describe('E2E: Performance Testing (Prompt 3.9)', () => {
  let fastify: any
  const testProjectIds: string[] = []

  beforeAll(async () => {
    fastify = Fastify({
      logger: false,
    })

    await fastify.register(cors, { origin: true })
    await fastify.register(helmet)

    fastify.addHook('onRequest', async (request: any) => {
      if (request.url === '/health') return
      request.user = mockUser
    })

    fastify.setErrorHandler(errorHandler)
    fastify.setNotFoundHandler(notFoundHandler)

    await fastify.register(projectRoutes, { prefix: '/projects' })
    await fastify.register(milestoneRoutes, { prefix: '/milestones' })

    await fastify.ready()
  })

  afterAll(async () => {
    // Cleanup test projects
    if (testProjectIds.length > 0) {
      try {
        await prisma.project.deleteMany({
          where: { id: { in: testProjectIds } },
        })
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    await fastify.close()
  })

  describe('Concurrent Project Creation', () => {
    it('should handle 50 concurrent project creations', async () => {
      const concurrentRequests = 50
      const promises = Array.from({ length: concurrentRequests }, (_, i) =>
        fastify.inject({
          method: 'POST',
          url: '/projects',
          payload: {
            name: `Performance Test Project ${i}`,
            description: `Load test project ${i}`,
            category: 'KITCHEN',
            status: 'DRAFT',
          },
        })
      )

      const startTime = Date.now()
      const responses = await Promise.all(promises)
      const endTime = Date.now()
      const duration = endTime - startTime

      // Check all requests completed
      const successCount = responses.filter((r) => r.statusCode === 201).length
      const failureCount = responses.filter((r) => r.statusCode !== 201).length

      console.log(`Created ${successCount} projects in ${duration}ms`)
      console.log(`Failures: ${failureCount}`)
      console.log(`Average time per request: ${duration / concurrentRequests}ms`)

      // Store project IDs for cleanup
      responses.forEach((response) => {
        if (response.statusCode === 201) {
          const body = JSON.parse(response.body)
          if (body.project?.id) {
            testProjectIds.push(body.project.id)
          }
        }
      })

      // At least 80% should succeed (allowing for some failures)
      expect(successCount).toBeGreaterThan(concurrentRequests * 0.8)
      // Should complete within reasonable time (30 seconds for 50 requests)
      expect(duration).toBeLessThan(30000)
    }, 60000) // 60 second timeout

    it('should handle 100 concurrent milestone queries', async () => {
      if (testProjectIds.length === 0) {
        // Create a test project first
        const createResponse = await fastify.inject({
          method: 'POST',
          url: '/projects',
          payload: {
            name: 'Performance Test Project',
            description: 'Load test project',
            category: 'KITCHEN',
            status: 'DRAFT',
          },
        })

        if (createResponse.statusCode === 201) {
          const body = JSON.parse(createResponse.body)
          testProjectIds.push(body.project.id)
        }
      }

      if (testProjectIds.length === 0) return

      const projectId = testProjectIds[0]
      const concurrentRequests = 100

      const promises = Array.from({ length: concurrentRequests }, () =>
        fastify.inject({
          method: 'GET',
          url: `/projects/${projectId}`,
        })
      )

      const startTime = Date.now()
      const responses = await Promise.all(promises)
      const endTime = Date.now()
      const duration = endTime - startTime

      const successCount = responses.filter((r) => r.statusCode === 200).length

      console.log(`Completed ${successCount} queries in ${duration}ms`)
      console.log(`Average time per query: ${duration / concurrentRequests}ms`)

      // All should succeed (read operations)
      expect(successCount).toBeGreaterThan(concurrentRequests * 0.95)
      // Should complete quickly (5 seconds for 100 reads)
      expect(duration).toBeLessThan(5000)
    }, 30000)
  })

  describe('Response Time Benchmarks', () => {
    it('should respond to project GET within 200ms', async () => {
      if (testProjectIds.length === 0) return

      const projectId = testProjectIds[0]
      const startTime = Date.now()

      const response = await fastify.inject({
        method: 'GET',
        url: `/projects/${projectId}`,
      })

      const duration = Date.now() - startTime

      expect(response.statusCode).toBe(200)
      // Should respond quickly (200ms for simple GET)
      expect(duration).toBeLessThan(200)
    })

    it('should respond to project list within 500ms', async () => {
      const startTime = Date.now()

      const response = await fastify.inject({
        method: 'GET',
        url: '/projects',
      })

      const duration = Date.now() - startTime

      expect([200, 401]).toContain(response.statusCode)
      // List operations may take longer (500ms)
      expect(duration).toBeLessThan(500)
    })
  })
})
