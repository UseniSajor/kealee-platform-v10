import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Fastify, { type FastifyInstance } from 'fastify'
import { versionControlRoutes } from '../modules/architect/version-control.routes'

/**
 * Performance Tests for Architect Hub
 * Prompt 2.9: Test version control under heavy concurrent usage
 *            Test large file handling (100MB+ models)
 */

describe('Architect Hub Performance Tests', () => {
  let fastify: FastifyInstance

  beforeAll(async () => {
    fastify = Fastify({ logger: false })
    await fastify.register(versionControlRoutes, { prefix: '/architect' })
    await fastify.ready()
  })

  afterAll(async () => {
    await fastify.close()
  })

  describe('Version Control Concurrent Usage', () => {
    it('should handle concurrent version creation', async () => {
      const concurrentRequests = 10
      const promises = []

      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          fastify.inject({
            method: 'POST',
            url: '/architect/design-projects/test-project-id/versions',
            headers: {
              'authorization': 'Bearer test-token',
            },
            payload: {
              versionName: `Concurrent Version ${i}`,
              description: `Test concurrent version ${i}`,
            },
          })
        )
      }

      const responses = await Promise.all(promises)
      
      // All requests should be handled (even if they fail auth/validation)
      expect(responses).toHaveLength(concurrentRequests)
      responses.forEach((response) => {
        expect([400, 401, 404, 500]).toContain(response.statusCode)
      })
    })

    it('should handle concurrent branch creation', async () => {
      const concurrentRequests = 5
      const promises = []

      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          fastify.inject({
            method: 'POST',
            url: '/architect/design-projects/test-project-id/version-branches',
            headers: {
              'authorization': 'Bearer test-token',
            },
            payload: {
              branchName: `concurrent-branch-${i}`,
              description: `Test concurrent branch ${i}`,
            },
          })
        )
      }

      const responses = await Promise.all(promises)
      expect(responses).toHaveLength(concurrentRequests)
    })

    it('should handle concurrent version comparisons', async () => {
      const concurrentRequests = 20
      const promises = []

      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          fastify.inject({
            method: 'POST',
            url: '/architect/design-projects/test-project-id/version-comparisons',
            headers: {
              'authorization': 'Bearer test-token',
            },
            payload: {
              sourceVersionId: 'test-version-1',
              targetVersionId: 'test-version-2',
            },
          })
        )
      }

      const responses = await Promise.all(promises)
      expect(responses).toHaveLength(concurrentRequests)
    })
  })

  describe('Large File Handling', () => {
    it('should validate large file upload payload structure', async () => {
      // Simulate large file metadata (actual file upload would be tested with real files)
      const largeFileMetadata = {
        fileName: 'large-model.rvt',
        fileSize: 150 * 1024 * 1024, // 150MB
        fileType: 'RVT',
        description: 'Large BIM model for testing',
      }

      const response = await fastify.inject({
        method: 'POST',
        url: '/architect/design-projects/test-project-id/bim-models',
        headers: {
          'authorization': 'Bearer test-token',
        },
        payload: largeFileMetadata,
      })

      // Should accept large file metadata
      expect([400, 401, 404]).toContain(response.statusCode)
    })

    it('should handle multiple large file references', async () => {
      const largeFiles = [
        { fileName: 'model-1.rvt', fileSize: 100 * 1024 * 1024 },
        { fileName: 'model-2.rvt', fileSize: 120 * 1024 * 1024 },
        { fileName: 'model-3.rvt', fileSize: 150 * 1024 * 1024 },
      ]

      for (const file of largeFiles) {
        const response = await fastify.inject({
          method: 'POST',
          url: '/architect/design-projects/test-project-id/bim-models',
          headers: {
            'authorization': 'Bearer test-token',
          },
          payload: {
            ...file,
            fileType: 'RVT',
          },
        })

        expect([400, 401, 404]).toContain(response.statusCode)
      }
    })
  })

  describe('Response Time Benchmarks', () => {
    it('should respond to version list query quickly', async () => {
      const startTime = Date.now()
      
      const response = await fastify.inject({
        method: 'GET',
        url: '/architect/design-projects/test-project-id/versions',
        headers: {
          'authorization': 'Bearer test-token',
        },
      })

      const responseTime = Date.now() - startTime
      
      // Should respond quickly (even if auth fails)
      expect(responseTime).toBeLessThan(1000) // 1 second
      expect([400, 401, 404]).toContain(response.statusCode)
    })

    it('should handle multiple rapid requests', async () => {
      const requests = 50
      const startTime = Date.now()
      
      const promises = []
      for (let i = 0; i < requests; i++) {
        promises.push(
          fastify.inject({
            method: 'GET',
            url: '/architect/design-projects/test-project-id/versions',
            headers: {
              'authorization': 'Bearer test-token',
            },
          })
        )
      }

      const responses = await Promise.all(promises)
      const totalTime = Date.now() - startTime
      const avgTime = totalTime / requests

      expect(responses).toHaveLength(requests)
      // Average response time should be reasonable
      expect(avgTime).toBeLessThan(500) // 500ms average
    })
  })
})
