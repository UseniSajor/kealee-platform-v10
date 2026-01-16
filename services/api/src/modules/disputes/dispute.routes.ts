import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../auth/auth.middleware'
import { validateParams, validateBody } from '../../middleware/validation.middleware'
import { disputeService } from './dispute.service'

const initiateDisputeSchema = z.object({
  projectId: z.string().uuid(),
  milestoneId: z.string().uuid().optional(),
  reason: z.string().min(1),
  description: z.string().min(1),
  evidenceIds: z.array(z.string().uuid()).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
})

const requestMediationSchema = z.object({
  notes: z.string().optional(),
})

const resolveDisputeSchema = z.object({
  resolution: z.enum(['OWNER_WINS', 'CONTRACTOR_WINS', 'PARTIAL_OWNER', 'PARTIAL_CONTRACTOR', 'MEDIATED_SETTLEMENT', 'WITHDRAWN']),
  resolutionNotes: z.string().min(1),
  mediatorId: z.string().uuid().optional(),
})

const addCommentSchema = z.object({
  comment: z.string().min(1),
  isInternal: z.boolean().optional(),
})

const addEvidenceSchema = z.object({
  evidenceId: z.string().uuid().optional(),
  url: z.string().url().optional(),
  fileName: z.string().optional(),
  description: z.string().optional(),
})

export async function disputeRoutes(fastify: FastifyInstance) {
  // Initiate dispute (Prompt 3.5)
  fastify.post(
    '/',
    {
      preHandler: [authenticateUser, validateBody(initiateDisputeSchema)],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const dispute = await disputeService.initiateDispute(user.id, request.body as any)
      return reply.code(201).send({ dispute })
    }
  )

  // Get dispute details (Prompt 3.5)
  fastify.get(
    '/:disputeId',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ disputeId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { disputeId } = request.params as { disputeId: string }
      const dispute = await disputeService.getDispute(disputeId, user.id)
      return reply.send({ dispute })
    }
  )

  // List project disputes (Prompt 3.5)
  fastify.get(
    '/projects/:projectId',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { projectId } = request.params as { projectId: string }
      const disputes = await disputeService.listProjectDisputes(projectId, user.id)
      return reply.send({ disputes })
    }
  )

  // Request mediation (Prompt 3.5)
  fastify.post(
    '/:disputeId/mediation',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ disputeId: z.string().uuid() })),
        validateBody(requestMediationSchema),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { disputeId } = request.params as { disputeId: string }
      const { notes } = request.body as { notes?: string }
      const dispute = await disputeService.requestMediation(disputeId, user.id, notes)
      return reply.send({ dispute })
    }
  )

  // Add comment (Prompt 3.5)
  fastify.post(
    '/:disputeId/comments',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ disputeId: z.string().uuid() })),
        validateBody(addCommentSchema),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { disputeId } = request.params as { disputeId: string }
      const { comment, isInternal } = request.body as { comment: string; isInternal?: boolean }
      const disputeComment = await disputeService.addComment(disputeId, user.id, comment, isInternal || false)
      return reply.code(201).send({ comment: disputeComment })
    }
  )

  // Resolve dispute (Prompt 3.5)
  fastify.post(
    '/:disputeId/resolve',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ disputeId: z.string().uuid() })),
        validateBody(resolveDisputeSchema),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { disputeId } = request.params as { disputeId: string }
      const dispute = await disputeService.resolveDispute(disputeId, user.id, request.body as any)
      return reply.send({ dispute })
    }
  )

  // Add evidence (Prompt 3.5)
  fastify.post(
    '/:disputeId/evidence',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ disputeId: z.string().uuid() })),
        validateBody(addEvidenceSchema),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { disputeId } = request.params as { disputeId: string }
      const evidence = await disputeService.addEvidence(disputeId, user.id, request.body as any)
      return reply.code(201).send({ evidence })
    }
  )
}
