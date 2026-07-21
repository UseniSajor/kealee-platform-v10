import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../auth/auth.middleware'
import { validateParams } from '../../middleware/validation.middleware'
import { permitComplianceService } from './permit-compliance.service'

export async function permitComplianceRoutes(fastify: FastifyInstance) {
  // Check permit compliance for project (Prompt 3.6)
  fastify.get(
    '/projects/:projectId/compliance',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const { projectId } = request.params as { projectId: string }
      const { milestoneId } = (request.query as { milestoneId?: string }) || {}
      const compliance = await permitComplianceService.checkPermitCompliance(projectId, milestoneId)
      return reply.send(compliance)
    }
  )

  // Get permit status summary (Prompt 3.6)
  fastify.get(
    '/projects/:projectId/status',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const { projectId } = request.params as { projectId: string }
      const summary = await permitComplianceService.getPermitStatusSummary(projectId)
      return reply.send(summary)
    }
  )
}
