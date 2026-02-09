import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../auth/auth.middleware'
import { validateParams, validateBody } from '../../middleware/validation.middleware'
import { DisputeService } from './dispute.service'

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
  // GET /disputes - Admin list all disputes with optional filters
  fastify.get(
    '/',
    {
      preHandler: [authenticateUser],
    },
    async (request, reply) => {
      const query = request.query as {
        status?: string
        type?: string
        priority?: string
        limit?: string
        offset?: string
      }
      const filters: any = {}
      if (query.status) filters.status = query.status
      if (query.type) filters.type = query.type
      if (query.limit) filters.limit = parseInt(query.limit, 10)
      if (query.offset) filters.offset = parseInt(query.offset, 10)
      const disputes = await DisputeService.listDisputes(filters)
      return reply.send({ disputes })
    }
  )

  // Initiate dispute (Prompt 3.5)
  fastify.post(
    '/',
    {
      preHandler: [authenticateUser, validateBody(initiateDisputeSchema)],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const dispute = await DisputeService.initiateDispute(request.body as any)
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
      const dispute = await DisputeService.getDispute(disputeId)
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
      // TODO: Implement listProjectDisputes filter
      const disputes = await DisputeService.listDisputes({ projectId })
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
      // TODO: Implement requestMediation method
      const dispute = await DisputeService.assignMediator(disputeId, user.id)
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
      const disputeComment = await DisputeService.sendMessage({ disputeId, senderId: user.id, message: comment, isInternal: isInternal || false })
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
      const dispute = await DisputeService.resolveDispute(request.body as any)
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
      const evidence = await DisputeService.submitEvidence(request.body as any)
      return reply.code(201).send({ evidence })
    }
  )
}
