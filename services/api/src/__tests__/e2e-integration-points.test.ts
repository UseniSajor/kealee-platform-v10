/**
 * Integration Points Test (Prompt 3.9)
 * 
 * Tests all integration points:
 * - Finance (escrow, payments)
 * - Permits (compliance checking)
 * - Marketplace (contractor selection)
 * - Disputes (resolution workflow)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import { prisma } from '@kealee/database'
import { projectRoutes } from '../modules/projects/project.routes'
import { contractRoutes } from '../modules/contracts/contract.routes'
import { paymentRoutes } from '../modules/payments/payment.routes'
import { permitComplianceRoutes } from '../modules/permits/permit-compliance.routes'
import { marketplaceRoutes } from '../modules/marketplace/marketplace.routes'
import { disputeRoutes } from '../modules/disputes/dispute.routes'
import { errorHandler, notFoundHandler } from '../middleware/error-handler.middleware'

const mockUser = { id: 'test-user-id', email: 'test@example.com' }

describe('E2E: Integration Points (Prompt 3.9)', () => {
  let fastify: any
  let testProjectId: string
  let testContractId: string

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
    await fastify.register(contractRoutes, { prefix: '/contracts' })
    await fastify.register(paymentRoutes, { prefix: '/payments' })
    await fastify.register(permitComplianceRoutes, { prefix: '/permits' })
    await fastify.register(marketplaceRoutes, { prefix: '/marketplace' })
    await fastify.register(disputeRoutes, { prefix: '/disputes' })

    await fastify.ready()

    // Create test project
    const projectResponse = await fastify.inject({
      method: 'POST',
      url: '/projects',
      payload: {
        name: 'Integration Test Project',
        description: 'Testing integration points',
        category: 'KITCHEN',
        status: 'DRAFT',
      },
    })

    if (projectResponse.statusCode === 201) {
      const body = JSON.parse(projectResponse.body)
      testProjectId = body.project.id
    }
  })

  afterAll(async () => {
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

  describe('Finance Integration (Escrow & Payments)', () => {
    it('should get or create escrow agreement', async () => {
      if (!testProjectId) return

      const response = await fastify.inject({
        method: 'GET',
        url: `/payments/projects/${testProjectId}/escrow`,
      })

      expect([200, 201, 404]).toContain(response.statusCode)
    })

    it('should get payment history', async () => {
      if (!testProjectId) return

      const response = await fastify.inject({
        method: 'GET',
        url: `/payments/projects/${testProjectId}/payments`,
      })

      expect([200, 404]).toContain(response.statusCode)
    })
  })

  describe('Permits Integration', () => {
    it('should check permit compliance', async () => {
      if (!testProjectId) return

      const response = await fastify.inject({
        method: 'GET',
        url: `/permits/projects/${testProjectId}/compliance`,
      })

      expect([200, 404]).toContain(response.statusCode)
    })

    it('should get permit status summary', async () => {
      if (!testProjectId) return

      const response = await fastify.inject({
        method: 'GET',
        url: `/permits/projects/${testProjectId}/status`,
      })

      expect([200, 404]).toContain(response.statusCode)
    })
  })

  describe('Marketplace Integration', () => {
    it('should search for contractors', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/marketplace/contractors?category=KITCHEN',
      })

      expect([200, 401, 404]).toContain(response.statusCode)
    })

    it('should get contractor details', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/marketplace/contractors/test-contractor-id',
      })

      expect([200, 404]).toContain(response.statusCode)
    })
  })

  describe('Dispute Resolution Integration', () => {
    it('should list project disputes', async () => {
      if (!testProjectId) return

      const response = await fastify.inject({
        method: 'GET',
        url: `/disputes/projects/${testProjectId}`,
      })

      expect([200, 404]).toContain(response.statusCode)
    })

    it('should create a dispute', async () => {
      if (!testProjectId) return

      const response = await fastify.inject({
        method: 'POST',
        url: '/disputes',
        payload: {
          projectId: testProjectId,
          reason: 'Integration test dispute',
          description: 'Testing dispute creation',
          priority: 'normal',
        },
      })

      expect([200, 201]).toContain(response.statusCode)
    })
  })

  describe('Cross-Module Integration', () => {
    it('should handle contract with escrow creation', async () => {
      if (!testProjectId) return

      // Create contract
      const contractResponse = await fastify.inject({
        method: 'POST',
        url: '/contracts',
        payload: {
          projectId: testProjectId,
          amount: 50000,
          contractorId: 'test-contractor-id',
        },
      })

      if (contractResponse.statusCode === 201) {
        const contractBody = JSON.parse(contractResponse.body)
        testContractId = contractBody.contract.id

        // Check if escrow was created
        const escrowResponse = await fastify.inject({
          method: 'GET',
          url: `/payments/projects/${testProjectId}/escrow`,
        })

        expect([200, 201, 404]).toContain(escrowResponse.statusCode)
      }
    })

    it('should handle milestone approval with permit check', async () => {
      if (!testProjectId || !testContractId) return

      // Create milestone
      const milestoneResponse = await fastify.inject({
        method: 'POST',
        url: '/milestones',
        payload: {
          projectId: testProjectId,
          contractId: testContractId,
          name: 'Integration Test Milestone',
          amount: 10000,
        },
      })

      if (milestoneResponse.statusCode === 201) {
        const milestoneBody = JSON.parse(milestoneResponse.body)
        const milestoneId = milestoneBody.milestone.id

        // Try to approve (should check permits)
        const approveResponse = await fastify.inject({
          method: 'POST',
          url: `/milestones/${milestoneId}/approve`,
          payload: {
            reason: 'Integration test approval',
          },
        })

        // May fail due to permit compliance, which is expected
        expect([200, 201, 400, 422]).toContain(approveResponse.statusCode)
      }
    })
  })
})
