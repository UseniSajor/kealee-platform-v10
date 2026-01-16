import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../auth/auth.middleware'
import { validateBody, validateParams } from '../../middleware/validation.middleware'
import { contractDashboardService } from './contract-dashboard.service'

// Note: This routes file should be registered AFTER contractRoutes to avoid route conflicts

const cancelContractSchema = z.object({
  reason: z.string().min(1),
})

export async function contractDashboardRoutes(fastify: FastifyInstance) {
  // Get user's contracts dashboard (Prompt 2.5)
  fastify.get(
    '/dashboard',
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const contracts = await contractDashboardService.getUserContracts(user.id)
      return reply.send({ contracts })
    }
  )

  // Get signing audit trail (Prompt 2.5)
  fastify.get(
    '/:contractId/audit-trail',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ contractId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { contractId } = request.params as { contractId: string }
      const trail = await contractDashboardService.getSigningAuditTrail(contractId, user.id)
      return reply.send(trail)
    }
  )

  // Get pending signatures (Prompt 2.5)
  fastify.get(
    '/pending-signatures',
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const pending = await contractDashboardService.getPendingSignatures(user.id)
      return reply.send({ pending })
    }
  )

  // Cancel contract (Prompt 2.6)
  fastify.post(
    '/:contractId/cancel',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ contractId: z.string().uuid() })),
        validateBody(cancelContractSchema),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { contractId } = request.params as { contractId: string }
      const { reason } = request.body as { reason: string }
      const contract = await contractDashboardService.cancelContract(contractId, user.id, reason)
      return reply.send({ contract })
    }
  )

  // Archive contract (Prompt 2.6)
  fastify.post(
    '/:contractId/archive',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ contractId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { contractId } = request.params as { contractId: string }
      const contract = await contractDashboardService.archiveContract(contractId, user.id)
      return reply.send({ contract })
    }
  )
}
