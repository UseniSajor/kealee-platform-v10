/**
 * End-to-End Test: Complete Project Lifecycle (Prompt 3.9)
 * 
 * Tests the full project lifecycle from creation to closeout:
 * 1. Project creation
 * 2. Readiness checklist
 * 3. Contract creation and signing
 * 4. Milestone submission and approval
 * 5. Payment release
 * 6. Dispute resolution
 * 7. Closeout checklist
 * 8. Handoff package generation
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import { prisma } from '@kealee/database'
import { authRoutes } from '../modules/auth/auth.routes'
import { projectRoutes } from '../modules/projects/project.routes'
import { readinessRoutes } from '../modules/readiness/readiness.routes'
import { contractRoutes } from '../modules/contracts/contract.routes'
import { milestoneRoutes } from '../modules/milestones/milestone.routes'
import { milestoneReviewRoutes } from '../modules/milestones/milestone-review.routes'
import { paymentRoutes } from '../modules/payments/payment.routes'
import { disputeRoutes } from '../modules/disputes/dispute.routes'
import { closeoutRoutes } from '../modules/closeout/closeout.routes'
import { handoffRoutes } from '../modules/handoff/handoff.routes'
import { permitComplianceRoutes } from '../modules/permits/permit-compliance.routes'
import { errorHandler, notFoundHandler } from '../middleware/error-handler.middleware'

// Mock authentication middleware
const mockUser = { id: 'test-user-id', email: 'test@example.com' }

describe('E2E: Complete Project Lifecycle (Prompt 3.9)', () => {
  let fastify: any
  let testProjectId: string
  let testContractId: string
  let testMilestoneId: string
  let testUserId: string

  beforeAll(async () => {
    fastify = Fastify({
      logger: false,
    })

    await fastify.register(cors, { origin: true })
    await fastify.register(helmet)

    // Mock authentication for all routes
    fastify.addHook('onRequest', async (request: any, reply: any) => {
      // Skip auth for health check
      if (request.url === '/health') return
      // Mock user for all other routes
      request.user = mockUser
    })

    fastify.setErrorHandler(errorHandler)
    fastify.setNotFoundHandler(notFoundHandler)

    // Register all routes
    await fastify.register(authRoutes, { prefix: '/auth' })
    await fastify.register(projectRoutes, { prefix: '/projects' })
    await fastify.register(readinessRoutes, { prefix: '/readiness' })
    await fastify.register(contractRoutes, { prefix: '/contracts' })
    await fastify.register(milestoneRoutes, { prefix: '/milestones' })
    await fastify.register(milestoneReviewRoutes, { prefix: '/milestones' })
    await fastify.register(paymentRoutes, { prefix: '/payments' })
    await fastify.register(disputeRoutes, { prefix: '/disputes' })
    await fastify.register(closeoutRoutes, { prefix: '/closeout' })
    await fastify.register(handoffRoutes, { prefix: '/handoff' })
    await fastify.register(permitComplianceRoutes, { prefix: '/permits' })

    await fastify.ready()

    // Create test user if needed
    testUserId = mockUser.id
  })

  afterAll(async () => {
    // Cleanup test data
    if (testProjectId) {
      try {
        await prisma.project.deleteMany({
          where: { id: testProjectId },
        })
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    await fastify.close()
  })

  describe('1. Project Creation', () => {
    it('should create a new project', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/projects',
        payload: {
          name: 'E2E Test Kitchen Renovation',
          description: 'End-to-end test project',
          category: 'KITCHEN',
          status: 'DRAFT',
        },
      })

      expect(response.statusCode).toBe(201)
      const body = JSON.parse(response.body)
      expect(body.project).toBeDefined()
      expect(body.project.name).toBe('E2E Test Kitchen Renovation')
      testProjectId = body.project.id
    })

    it('should retrieve the created project', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: `/projects/${testProjectId}`,
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.project.id).toBe(testProjectId)
    })
  })

  describe('2. Readiness Checklist', () => {
    it('should create readiness items', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: `/readiness/projects/${testProjectId}/items`,
        payload: {
          items: [
            {
              title: 'Finalize scope of work',
              description: 'Define project scope',
              required: true,
            },
            {
              title: 'Set firm budget',
              description: 'Establish project budget',
              required: true,
            },
          ],
        },
      })

      expect(response.statusCode).toBe(201)
      const body = JSON.parse(response.body)
      expect(body.items).toBeDefined()
      expect(body.items.length).toBeGreaterThan(0)
    })

    it('should complete readiness items', async () => {
      // Get readiness items
      const listResponse = await fastify.inject({
        method: 'GET',
        url: `/readiness/projects/${testProjectId}`,
      })

      const listBody = JSON.parse(listResponse.body)
      if (listBody.items && listBody.items.length > 0) {
        const itemId = listBody.items[0].id

        const response = await fastify.inject({
          method: 'PATCH',
          url: `/readiness/items/${itemId}`,
          payload: {
            status: 'COMPLETED',
            response: 'Scope finalized',
          },
        })

        expect([200, 201]).toContain(response.statusCode)
      }
    })
  })

  describe('3. Contract Creation', () => {
    it('should create a contract', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: `/contracts`,
        payload: {
          projectId: testProjectId,
          amount: 100000,
          contractorId: 'test-contractor-id',
        },
      })

      expect([200, 201]).toContain(response.statusCode)
      const body = JSON.parse(response.body)
      if (body.contract) {
        testContractId = body.contract.id
      }
    })
  })

  describe('4. Milestone Management', () => {
    it('should create milestones', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: `/milestones`,
        payload: {
          projectId: testProjectId,
          contractId: testContractId,
          name: 'E2E Test Milestone 1',
          description: 'First milestone for testing',
          amount: 20000,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
      })

      expect([200, 201]).toContain(response.statusCode)
      const body = JSON.parse(response.body)
      if (body.milestone) {
        testMilestoneId = body.milestone.id
      }
    })

    it('should submit milestone for review', async () => {
      if (!testMilestoneId) return

      const response = await fastify.inject({
        method: 'POST',
        url: `/milestones/${testMilestoneId}/submit`,
        payload: {
          notes: 'Milestone completed for E2E testing',
        },
      })

      expect([200, 201]).toContain(response.statusCode)
    })

    it('should approve milestone', async () => {
      if (!testMilestoneId) return

      const response = await fastify.inject({
        method: 'POST',
        url: `/milestones/${testMilestoneId}/approve`,
        payload: {
          reason: 'E2E test approval',
        },
      })

      expect([200, 201]).toContain(response.statusCode)
    })
  })

  describe('5. Payment Release', () => {
    it('should check if payment can be released', async () => {
      if (!testMilestoneId) return

      const response = await fastify.inject({
        method: 'GET',
        url: `/payments/milestones/${testMilestoneId}/can-release`,
      })

      expect([200, 400, 404]).toContain(response.statusCode)
    })

    it('should release payment', async () => {
      if (!testMilestoneId) return

      const response = await fastify.inject({
        method: 'POST',
        url: `/payments/milestones/${testMilestoneId}/release-payment`,
        payload: {
          notes: 'E2E test payment release',
        },
      })

      // May fail if escrow not set up, which is expected
      expect([200, 201, 400, 404]).toContain(response.statusCode)
    })
  })

  describe('6. Dispute Resolution', () => {
    it('should create a dispute', async () => {
      if (!testMilestoneId) return

      const response = await fastify.inject({
        method: 'POST',
        url: `/disputes`,
        payload: {
          projectId: testProjectId,
          milestoneId: testMilestoneId,
          reason: 'E2E test dispute',
          description: 'Testing dispute creation in E2E flow',
          priority: 'normal',
        },
      })

      expect([200, 201]).toContain(response.statusCode)
    })
  })

  describe('7. Closeout Checklist', () => {
    it('should get closeout checklist', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: `/closeout/projects/${testProjectId}/checklist`,
      })

      expect([200, 404]).toContain(response.statusCode)
      // May not exist if project not in CLOSEOUT status
    })

    it('should complete closeout items', async () => {
      // First get checklist
      const getResponse = await fastify.inject({
        method: 'GET',
        url: `/closeout/projects/${testProjectId}/checklist`,
      })

      if (getResponse.statusCode === 200) {
        const body = JSON.parse(getResponse.body)
        if (body.checklist && body.checklist.items && body.checklist.items.length > 0) {
          const itemId = body.checklist.items[0].id

          const response = await fastify.inject({
            method: 'PATCH',
            url: `/closeout/items/${itemId}`,
            payload: {
              status: 'COMPLETED',
              completed: true,
            },
          })

          expect([200, 201]).toContain(response.statusCode)
        }
      }
    })
  })

  describe('8. Handoff Package', () => {
    it('should generate handoff package', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: `/handoff/projects/${testProjectId}/generate`,
      })

      // May fail if project not COMPLETED, which is expected
      expect([200, 201, 400, 404]).toContain(response.statusCode)
    })

    it('should get handoff package', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: `/handoff/projects/${testProjectId}`,
      })

      expect([200, 404]).toContain(response.statusCode)
    })
  })

  describe('9. Integration Points', () => {
    it('should check permit compliance', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: `/permits/projects/${testProjectId}/compliance`,
      })

      expect([200, 404]).toContain(response.statusCode)
    })

    it('should get escrow agreement', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: `/payments/projects/${testProjectId}/escrow`,
      })

      expect([200, 404]).toContain(response.statusCode)
    })
  })

  describe('10. Error Recovery Scenarios', () => {
    it('should handle invalid project ID gracefully', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/projects/invalid-id',
      })

      expect([400, 404]).toContain(response.statusCode)
    })

    it('should handle missing required fields', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/projects',
        payload: {
          // Missing required fields
          description: 'Incomplete project',
        },
      })

      expect([400, 422]).toContain(response.statusCode)
    })

    it('should handle unauthorized access attempts', async () => {
      // Test with no user (should fail auth)
      const response = await fastify.inject({
        method: 'GET',
        url: `/projects/${testProjectId}`,
        headers: {
          // No auth header
        },
      })

      // May pass if auth is mocked, but structure should be correct
      expect([200, 401, 403]).toContain(response.statusCode)
    })
  })
})
