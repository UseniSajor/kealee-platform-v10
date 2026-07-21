/**
 * Dispute Resolution API Routes
 * Handles dispute initiation, evidence submission, mediation, and resolution
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { authenticateUser, requireRole, type AuthenticatedRequest } from '../middleware/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../middleware/validation.middleware'
import { DisputeService } from '../modules/disputes/dispute.service'

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const InitiateDisputeSchema = z.object({
  escrowId: z.string().uuid(),  // Changed from escrowAgreementId
  contractId: z.string().uuid(),
  projectId: z.string().uuid(),
  respondentId: z.string().uuid(),
  type: z.enum(['PAYMENT', 'QUALITY', 'SCOPE', 'TIMELINE', 'OTHER']),
  disputedAmount: z.number().positive(),
  description: z.string().min(50).max(2000),
  metadata: z.record(z.any()).optional(),
})

const SubmitEvidenceSchema = z.object({
  evidenceType: z.enum(['DOCUMENT', 'PHOTO', 'VIDEO', 'MESSAGE', 'OTHER']),
  fileUrl: z.string().url(),
  fileName: z.string(),
  fileSize: z.number().positive(),
  description: z.string().max(1000).optional(),
})

const SendMessageSchema = z.object({
  message: z.string().min(1).max(2000),
  isInternal: z.boolean().default(false),
})

const AssignMediatorSchema = z.object({
  mediatorId: z.string().uuid(),
  notes: z.string().max(500).optional(),
})

const ResolveDisputeSchema = z.object({
  resolutionType: z.enum(['FULL_RELEASE', 'PARTIAL_RELEASE', 'NO_RELEASE', 'REFUND']),
  ownerAmount: z.number().min(0),
  contractorAmount: z.number().min(0),
  refundAmount: z.number().min(0).optional(),
  reasoning: z.string().min(100).max(2000),
})

const FileAppealSchema = z.object({
  reason: z.string().min(100).max(2000),
  evidenceIds: z.array(z.string().uuid()).optional(),
})

const ListDisputesSchema = z.object({
  status: z.enum(['OPEN', 'UNDER_REVIEW', 'MEDIATION', 'RESOLVED', 'CLOSED', 'APPEALED']).optional(),
  type: z.enum(['PAYMENT', 'QUALITY', 'SCOPE', 'TIMELINE', 'OTHER']).optional(),
  projectId: z.string().uuid().optional(),
  escrowAgreementId: z.string().uuid().optional(),
  mediatorId: z.string().uuid().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

const DisputeIdParamSchema = z.object({
  id: z.string().uuid(),
})

// ============================================================================
// ROLE-BASED ACCESS CONTROL
// ============================================================================

const requireDisputeAccess = requireRole(['admin', 'mediator', 'finance', 'pm'])
const requireMediatorRole = requireRole(['admin', 'mediator'])

// ============================================================================
// ROUTES
// ============================================================================

export async function disputeRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/disputes
   * Initiate a new dispute
   */
  fastify.post(
    '/disputes',
    {
      preHandler: [authenticateUser],
      schema: {
        tags: ['Disputes'],
        summary: 'Initiate a new dispute',
        body: InitiateDisputeSchema,
      },
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      try {
        const userId = request.user!.id
        const data = InitiateDisputeSchema.parse(request.body)

        const dispute = await DisputeService.initiateDispute({
          ...data,
          initiatedBy: userId,
        })

        return reply.code(201).send({
          success: true,
          dispute,
          message: 'Dispute initiated successfully. Escrow has been frozen.',
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: error.message || 'Failed to initiate dispute',
        })
      }
    }
  )

  /**
   * GET /api/disputes
   * List disputes with filtering
   */
  fastify.get(
    '/disputes',
    {
      preHandler: [authenticateUser, requireDisputeAccess],
      schema: {
        tags: ['Disputes'],
        summary: 'List disputes with filtering',
        querystring: ListDisputesSchema,
      },
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      try {
        const filters = ListDisputesSchema.parse(request.query)

        const result = await DisputeService.listDisputes(filters)

        return reply.send({
          success: true,
          ...result,
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: error.message || 'Failed to list disputes',
        })
      }
    }
  )

  /**
   * GET /api/disputes/:id
   * Get dispute details
   */
  fastify.get(
    '/disputes/:id',
    {
      preHandler: [authenticateUser],
      schema: {
        tags: ['Disputes'],
        summary: 'Get dispute details',
        params: DisputeIdParamSchema,
      },
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      try {
        const { id } = DisputeIdParamSchema.parse(request.params)
        const userId = request.user!.id

        const dispute = await DisputeService.getDispute(id, userId)

        return reply.send({
          success: true,
          dispute,
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: error.message || 'Failed to get dispute',
        })
      }
    }
  )

  /**
   * POST /api/disputes/:id/evidence
   * Submit evidence for a dispute
   */
  fastify.post(
    '/disputes/:id/evidence',
    {
      preHandler: [authenticateUser],
      schema: {
        tags: ['Disputes'],
        summary: 'Submit evidence for a dispute',
        params: DisputeIdParamSchema,
        body: SubmitEvidenceSchema,
      },
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      try {
        const { id } = DisputeIdParamSchema.parse(request.params)
        const userId = request.user!.id
        const data = SubmitEvidenceSchema.parse(request.body)

        const evidence = await DisputeService.submitEvidence({
          disputeId: id,
          submittedBy: userId,
          ...data,
        })

        return reply.code(201).send({
          success: true,
          evidence,
          message: 'Evidence submitted successfully',
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: error.message || 'Failed to submit evidence',
        })
      }
    }
  )

  /**
   * POST /api/disputes/:id/messages
   * Send a message in a dispute thread
   */
  fastify.post(
    '/disputes/:id/messages',
    {
      preHandler: [authenticateUser],
      schema: {
        tags: ['Disputes'],
        summary: 'Send a message in a dispute thread',
        params: DisputeIdParamSchema,
        body: SendMessageSchema,
      },
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      try {
        const { id } = DisputeIdParamSchema.parse(request.params)
        const userId = request.user!.id
        const data = SendMessageSchema.parse(request.body)

        const message = await DisputeService.sendMessage({
          disputeId: id,
          senderId: userId,
          ...data,
        })

        return reply.code(201).send({
          success: true,
          message,
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: error.message || 'Failed to send message',
        })
      }
    }
  )

  /**
   * GET /api/disputes/:id/messages
   * Get messages for a dispute
   */
  fastify.get(
    '/disputes/:id/messages',
    {
      preHandler: [authenticateUser],
      schema: {
        tags: ['Disputes'],
        summary: 'Get messages for a dispute',
        params: DisputeIdParamSchema,
      },
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      try {
        const { id } = DisputeIdParamSchema.parse(request.params)
        const userId = request.user!.id

        // Get dispute to check access
        const dispute = await DisputeService.getDispute(id, userId)

        // Return messages (internal ones filtered by service if user is not mediator)
        return reply.send({
          success: true,
          messages: dispute.messages,
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: error.message || 'Failed to get messages',
        })
      }
    }
  )

  /**
   * POST /api/disputes/:id/assign-mediator
   * Assign a mediator to a dispute (admin/mediator only)
   */
  fastify.post(
    '/disputes/:id/assign-mediator',
    {
      preHandler: [authenticateUser, requireMediatorRole],
      schema: {
        tags: ['Disputes'],
        summary: 'Assign a mediator to a dispute',
        params: DisputeIdParamSchema,
        body: AssignMediatorSchema,
      },
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      try {
        const { id } = DisputeIdParamSchema.parse(request.params)
        const userId = request.user!.id
        const data = AssignMediatorSchema.parse(request.body)

        const dispute = await DisputeService.assignMediator({
          disputeId: id,
          ...data,
          assignedBy: userId,
        })

        return reply.send({
          success: true,
          dispute,
          message: 'Mediator assigned successfully',
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: error.message || 'Failed to assign mediator',
        })
      }
    }
  )

  /**
   * POST /api/disputes/:id/resolve
   * Resolve a dispute (mediator only)
   */
  fastify.post(
    '/disputes/:id/resolve',
    {
      preHandler: [authenticateUser, requireMediatorRole],
      schema: {
        tags: ['Disputes'],
        summary: 'Resolve a dispute',
        params: DisputeIdParamSchema,
        body: ResolveDisputeSchema,
      },
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      try {
        const { id } = DisputeIdParamSchema.parse(request.params)
        const userId = request.user!.id
        const data = ResolveDisputeSchema.parse(request.body)

        const resolution = await DisputeService.resolveDispute({
          disputeId: id,
          mediatorId: userId,
          ...data,
        })

        return reply.send({
          success: true,
          resolution,
          message: 'Dispute resolved successfully. Escrow has been updated.',
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: error.message || 'Failed to resolve dispute',
        })
      }
    }
  )

  /**
   * POST /api/disputes/:id/appeal
   * File an appeal for a dispute resolution
   */
  fastify.post(
    '/disputes/:id/appeal',
    {
      preHandler: [authenticateUser],
      schema: {
        tags: ['Disputes'],
        summary: 'File an appeal for a dispute resolution',
        params: DisputeIdParamSchema,
        body: FileAppealSchema,
      },
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      try {
        const { id } = DisputeIdParamSchema.parse(request.params)
        const userId = request.user!.id
        const data = FileAppealSchema.parse(request.body)

        const appeal = await DisputeService.fileAppeal({
          disputeId: id,
          appealedBy: userId,
          ...data,
        })

        return reply.send({
          success: true,
          appeal,
          message: 'Appeal filed successfully',
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: error.message || 'Failed to file appeal',
        })
      }
    }
  )

  /**
   * GET /api/disputes/mediator/queue
   * Get mediator queue (mediator only)
   */
  fastify.get(
    '/disputes/mediator/queue',
    {
      preHandler: [authenticateUser, requireMediatorRole],
      schema: {
        tags: ['Disputes'],
        summary: 'Get mediator queue',
      },
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      try {
        const userId = request.user!.id

        const queue = await DisputeService.getMediatorQueue(userId)

        return reply.send({
          success: true,
          queue,
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: error.message || 'Failed to get mediator queue',
        })
      }
    }
  )

  /**
   * GET /api/disputes/stats
   * Get dispute statistics (admin only)
   */
  fastify.get(
    '/disputes/stats',
    {
      preHandler: [authenticateUser, requireRole(['admin'])],
      schema: {
        tags: ['Disputes'],
        summary: 'Get dispute statistics',
        querystring: z.object({
          startDate: z.coerce.date().optional(),
          endDate: z.coerce.date().optional(),
          projectId: z.string().uuid().optional(),
        }),
      },
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      try {
        const filters = request.query as any

        const stats = await DisputeService.getDisputeStats(filters)

        return reply.send({
          success: true,
          stats,
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: error.message || 'Failed to get dispute statistics',
        })
      }
    }
  )
}

