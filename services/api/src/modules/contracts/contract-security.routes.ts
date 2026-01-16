import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../auth/auth.middleware'
import { validateParams } from '../../middleware/validation.middleware'
import { contractSecurityService } from './contract-security.service'

export async function contractSecurityRoutes(fastify: FastifyInstance) {
  // Test document access permissions (Prompt 2.8)
  fastify.get(
    '/:contractId/security/access',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ contractId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { contractId } = request.params as { contractId: string }
      const access = await contractSecurityService.testDocumentAccess(contractId, user.id)
      return reply.send(access)
    }
  )

  // Test signature fraud prevention (Prompt 2.8)
  fastify.get(
    '/:contractId/security/signature',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ contractId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { contractId } = request.params as { contractId: string }
      const security = await contractSecurityService.testSignatureFraudPrevention(contractId, user.id)
      return reply.send(security)
    }
  )

  // Test audit log completeness (Prompt 2.8)
  fastify.get(
    '/:contractId/security/audit',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ contractId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { contractId } = request.params as { contractId: string }
      const audit = await contractSecurityService.testAuditLogCompleteness(contractId, user.id)
      return reply.send(audit)
    }
  )

  // Test data encryption (Prompt 2.8)
  fastify.get(
    '/:contractId/security/encryption',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ contractId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const { contractId } = request.params as { contractId: string }
      const encryption = await contractSecurityService.testDataEncryption(contractId)
      return reply.send(encryption)
    }
  )

  // Test GDPR/CCPA compliance (Prompt 2.8)
  fastify.get(
    '/:contractId/security/gdpr',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ contractId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { contractId } = request.params as { contractId: string }
      const compliance = await contractSecurityService.testGDPRCompliance(contractId, user.id)
      return reply.send(compliance)
    }
  )
}
