import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../auth/auth.middleware'
import { validateParams, validateBody } from '../../middleware/validation.middleware'
import { milestoneService } from './milestone.service'

const submitMilestoneSchema = z.object({
  evidence: z.array(
    z.object({
      type: z.string().min(1),
      fileUrl: z.string().url(),
      caption: z.string().optional(),
    })
  ).min(1),
})

const approveMilestoneSchema = z.object({
  notes: z.string().optional(),
})

const rejectMilestoneSchema = z.object({
  reason: z.string().min(1),
})

export async function milestoneRoutes(fastify: FastifyInstance) {
  // Get contract milestones dashboard (Prompt 3.1)
  fastify.get(
    '/contracts/:contractId/milestones',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ contractId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { contractId } = request.params as { contractId: string }
      const result = await milestoneService.getContractMilestones(contractId, user.id)
      return reply.send(result)
    }
  )

  // Get single milestone (Prompt 3.1)
  fastify.get(
    '/:milestoneId',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ milestoneId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { milestoneId } = request.params as { milestoneId: string }
      const milestone = await milestoneService.getMilestone(milestoneId, user.id)
      return reply.send({ milestone })
    }
  )

  // Submit milestone for approval (Prompt 3.2)
  fastify.post(
    '/:milestoneId/submit',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ milestoneId: z.string().uuid() })),
        validateBody(submitMilestoneSchema),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { milestoneId } = request.params as { milestoneId: string }
      const { evidence } = request.body as { evidence: Array<{ type: string; fileUrl: string; caption?: string }> }
      const milestone = await milestoneService.submitMilestone(milestoneId, user.id, evidence)
      return reply.code(201).send({ milestone })
    }
  )

  // Approve milestone (Prompt 3.1)
  fastify.post(
    '/:milestoneId/approve',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ milestoneId: z.string().uuid() })),
        validateBody(approveMilestoneSchema),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { milestoneId } = request.params as { milestoneId: string }
      const { notes } = request.body as { notes?: string }
      const milestone = await milestoneService.approveMilestone(milestoneId, user.id, notes)
      return reply.send({ milestone })
    }
  )

  // Reject milestone (Prompt 3.1)
  fastify.post(
    '/:milestoneId/reject',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ milestoneId: z.string().uuid() })),
        validateBody(rejectMilestoneSchema),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { milestoneId } = request.params as { milestoneId: string }
      const { reason } = request.body as { reason: string }
      const milestone = await milestoneService.rejectMilestone(milestoneId, user.id, reason)
      return reply.send({ milestone })
    }
  )

  // ========================================================================
  // MULTI-PARTY APPROVAL (Backend Consolidation v10)
  // ========================================================================

  // Submit milestone for multi-party approval
  fastify.post(
    '/:milestoneId/submit-approval',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ milestoneId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { milestoneId } = request.params as { milestoneId: string }
      const milestone = await milestoneService.submitForApproval(milestoneId, user.id)
      return reply.code(201).send({ milestone })
    }
  )

  // Process multi-party approval decision
  fastify.post(
    '/:milestoneId/approval',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ milestoneId: z.string().uuid() })),
        validateBody(z.object({
          approved: z.boolean(),
          notes: z.string().optional(),
          approverType: z.enum(['HOMEOWNER', 'CONTRACTOR', 'LENDER', 'INSPECTOR']).optional(),
        })),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { milestoneId } = request.params as { milestoneId: string }
      const body = request.body as { approved: boolean; notes?: string; approverType?: string }
      const milestone = await milestoneService.processApproval(milestoneId, user.id, body)
      return reply.send({ milestone })
    }
  )

  // Get approval status for a milestone
  fastify.get(
    '/:milestoneId/approvals',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ milestoneId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const { milestoneId } = request.params as { milestoneId: string }
      const approvals = await milestoneService.getApprovals(milestoneId)
      return reply.send({ approvals })
    }
  )
}
