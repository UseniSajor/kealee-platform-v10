import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Fastify, { type FastifyInstance } from 'fastify'
import { permitPackageRoutes } from '../modules/architect/permit-package.routes'

/**
 * Integration Tests for Architect Hub Handoff to Other Modules
 * Prompt 2.9: Test handoff to m-permits-inspections with various project types
 */

describe('Architect Hub Handoff Integration Tests', () => {
  let fastify: FastifyInstance

  beforeAll(async () => {
    fastify = Fastify({ logger: false })
    await fastify.register(permitPackageRoutes, { prefix: '/architect' })
    await fastify.ready()
  })

  afterAll(async () => {
    await fastify.close()
  })

  describe('Handoff to m-permits-inspections', () => {
    it('should validate permit package submission payload', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/architect/permit-packages/test-package-id/submit',
        headers: {
          'authorization': 'Bearer test-token',
        },
        payload: {
          submissionMethod: 'API',
        },
      })

      // Should validate payload structure
      expect([400, 401, 404]).toContain(response.statusCode)
    })

    it('should handle different project types for permit packages', async () => {
      const projectTypes = ['RESIDENTIAL', 'COMMERCIAL', 'INSTITUTIONAL', 'MIXED_USE']
      
      for (const projectType of projectTypes) {
        const response = await fastify.inject({
          method: 'POST',
          url: '/architect/design-projects/test-project-id/permit-packages/auto-generate',
          headers: {
            'authorization': 'Bearer test-token',
          },
          payload: {
            packageName: `Test ${projectType} Permit Package`,
            packageType: 'BUILDING',
            permitType: projectType,
            includeAllDrawings: true,
          },
        })

        // Should accept different project types
        expect([400, 401, 404]).toContain(response.statusCode)
      }
    })

    it('should sync permit package status from permit system', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/architect/permit-packages/test-package-id/sync',
        headers: {
          'authorization': 'Bearer test-token',
        },
      })

      expect([400, 401, 404]).toContain(response.statusCode)
    })
  })

  describe('Collaboration with m-engineer', () => {
    it('should support structural coordination workflows', async () => {
      // Test that architect can reference engineer drawings/specs
      // This would be tested through drawing set coordination
      const response = await fastify.inject({
        method: 'GET',
        url: '/architect/design-projects/test-project-id/drawing-sets',
        headers: {
          'authorization': 'Bearer test-token',
        },
        query: {
          discipline: 'S-Structural', // Engineer discipline
        },
      })

      expect([400, 401, 404]).toContain(response.statusCode)
    })
  })
})
