import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../auth/auth.middleware'
import { validateParams, validateQuery } from '../../middleware/validation.middleware'
import { contractComplianceService } from './contract-compliance.service'

export async function contractComplianceRoutes(fastify: FastifyInstance) {
  // Validate contract compliance (Prompt 2.7)
  fastify.get(
    '/:contractId/compliance',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ contractId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const { contractId } = request.params as { contractId: string }
      const validation = await contractComplianceService.validateContract(contractId)
      return reply.send(validation)
    }
  )

  // Get state-specific compliance requirements (Prompt 2.7)
  fastify.get(
    '/compliance/state/:state',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ state: z.string().length(2) })),
      ],
    },
    async (request, reply) => {
      const { state } = request.params as { state: string }
      const compliance = await contractComplianceService.getStateCompliance(state.toUpperCase())
      return reply.send({ compliance })
    }
  )

  // Add statutory language to contract (Prompt 2.7)
  fastify.post(
    '/:contractId/add-statutory-language',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ contractId: z.string().uuid() })),
        validateQuery(z.object({ autoAppend: z.string().transform((val) => val === 'true').optional() })),
      ],
    },
    async (request, reply) => {
      const { contractId } = request.params as { contractId: string }
      const { autoAppend } = (request.query as { autoAppend?: boolean }) || {}
      const result = await contractComplianceService.addStatutoryLanguage(contractId, autoAppend || false)
      return reply.send(result)
    }
  )

  // Check document retention requirements (Prompt 2.7)
  fastify.get(
    '/:contractId/retention',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ contractId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const { contractId } = request.params as { contractId: string }
      const retention = await contractComplianceService.checkDocumentRetention(contractId)
      return reply.send(retention)
    }
  )
}
