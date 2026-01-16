import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../auth/auth.middleware'
import { validateParams, validateBody } from '../../middleware/validation.middleware'
import { collaborationService } from './collaboration.service'

const updatePresenceSchema = z.object({
  targetType: z.string(),
  targetId: z.string().uuid(),
  status: z.enum(['ONLINE', 'VIEWING', 'EDITING', 'AWAY', 'OFFLINE']).optional(),
  viewportPosition: z.any().optional(),
  cursorPosition: z.any().optional(),
})

const recordChangeSchema = z.object({
  targetType: z.string(),
  targetId: z.string().uuid(),
  changeType: z.enum(['CREATED', 'UPDATED', 'DELETED', 'MOVED', 'RENAMED']),
  changeDescription: z.string().optional(),
  oldValue: z.any().optional(),
  newValue: z.any().optional(),
  diffData: z.any().optional(),
  pageNumber: z.number().int().positive().optional(),
  sectionPath: z.string().optional(),
  coordinates: z.any().optional(),
  versionBefore: z.string().optional(),
  versionAfter: z.string().optional(),
})

const createSignatureRequestSchema = z.object({
  targetType: z.string(),
  targetId: z.string().uuid(),
  signerId: z.string().uuid(),
  expiresAt: z.string().datetime().optional().transform((val) => val ? new Date(val) : undefined),
  approvalNotes: z.string().optional(),
})

const signDocumentSchema = z.object({
  signatureData: z.any().optional(),
  signatureImageUrl: z.string().url().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
})

const createMeetingMinuteSchema = z.object({
  title: z.string().min(1),
  meetingDate: z.string().datetime().transform((val) => new Date(val)),
  meetingDurationMinutes: z.number().int().positive().optional(),
  location: z.string().optional(),
  meetingType: z.string().optional(),
  attendeeIds: z.array(z.string().uuid()).min(1),
  organizerId: z.string().uuid(),
  agenda: z.string().optional(),
  discussionNotes: z.string().optional(),
  decisionsMade: z.any().optional(),
  attachments: z.array(z.string()).optional(),
  nextMeetingDate: z.string().datetime().optional().transform((val) => val ? new Date(val) : undefined),
})

const createActionItemSchema = z.object({
  sourceType: z.string(),
  sourceId: z.string().uuid().optional(),
  meetingMinuteId: z.string().uuid().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  assignedToId: z.string().uuid().optional(),
  assignedById: z.string().uuid(),
  dueDate: z.string().datetime().optional().transform((val) => val ? new Date(val) : undefined),
  relatedDeliverableIds: z.array(z.string().uuid()).optional(),
  relatedFileIds: z.array(z.string().uuid()).optional(),
})

const updateActionItemStatusSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  completionNotes: z.string().optional(),
})

const createDesignDecisionSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  decisionText: z.string().min(1),
  rationale: z.string().optional(),
  alternativesConsidered: z.string().optional(),
  impactScope: z.string().optional(),
  affectedDeliverableIds: z.array(z.string().uuid()).optional(),
  affectedFileIds: z.array(z.string().uuid()).optional(),
  supportingDocumentIds: z.array(z.string()).optional(),
  referenceLinks: z.array(z.string().url()).optional(),
  relatedPhaseId: z.string().uuid().optional(),
  relatedReviewRequestId: z.string().uuid().optional(),
  proposedById: z.string().uuid(),
})

const updateDecisionStatusSchema = z.object({
  status: z.enum(['DRAFT', 'PROPOSED', 'APPROVED', 'REJECTED', 'IMPLEMENTED']),
})

export async function collaborationRoutes(fastify: FastifyInstance) {
  // POST /architect/design-projects/:projectId/presence - Update presence
  fastify.post(
    '/design-projects/:projectId/presence',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
        validateBody(updatePresenceSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { projectId } = request.params as { projectId: string }
        const body = request.body as z.infer<typeof updatePresenceSchema>
        const presence = await collaborationService.updatePresence({
          designProjectId: projectId,
          ...body,
          userId: user.id,
        })
        return reply.send({ presence })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to update presence',
        })
      }
    }
  )

  // GET /architect/design-projects/:projectId/presence - Get presence
  fastify.get(
    '/design-projects/:projectId/presence',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { projectId } = request.params as { projectId: string }
        const query = request.query as { targetType?: string; targetId?: string }
        if (!query.targetType || !query.targetId) {
          return reply.code(400).send({
            error: 'targetType and targetId are required',
          })
        }
        const presence = await collaborationService.getPresence(projectId, query.targetType, query.targetId)
        return reply.send({ presence })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to get presence',
        })
      }
    }
  )

  // DELETE /architect/presence - Remove presence
  fastify.delete(
    '/presence',
    {
      preHandler: [
        authenticateUser,
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const query = request.query as { targetType?: string; targetId?: string }
        if (!query.targetType || !query.targetId) {
          return reply.code(400).send({
            error: 'targetType and targetId are required',
          })
        }
        await collaborationService.removePresence(query.targetType, query.targetId, user.id)
        return reply.code(204).send()
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to remove presence',
        })
      }
    }
  )

  // POST /architect/design-projects/:projectId/changes - Record change
  fastify.post(
    '/design-projects/:projectId/changes',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
        validateBody(recordChangeSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { projectId } = request.params as { projectId: string }
        const body = request.body as z.infer<typeof recordChangeSchema>
        const change = await collaborationService.recordChange({
          designProjectId: projectId,
          ...body,
          createdById: user.id,
        })
        return reply.code(201).send({ change })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to record change',
        })
      }
    }
  )

  // GET /architect/design-projects/:projectId/changes - Get changes
  fastify.get(
    '/design-projects/:projectId/changes',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { projectId } = request.params as { projectId: string }
        const query = request.query as {
          targetType?: string
          targetId?: string
          changeType?: string
          fromDate?: string
          toDate?: string
        }
        if (!query.targetType || !query.targetId) {
          return reply.code(400).send({
            error: 'targetType and targetId are required',
          })
        }
        const changes = await collaborationService.getChanges(projectId, query.targetType, query.targetId, {
          changeType: query.changeType,
          fromDate: query.fromDate ? new Date(query.fromDate) : undefined,
          toDate: query.toDate ? new Date(query.toDate) : undefined,
        })
        return reply.send({ changes })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to get changes',
        })
      }
    }
  )

  // POST /architect/design-projects/:projectId/signatures - Create signature request
  fastify.post(
    '/design-projects/:projectId/signatures',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
        validateBody(createSignatureRequestSchema as any),
      ],
    },
    async (request, reply) => {
      try {
        const { projectId } = request.params as { projectId: string }
        const body = request.body as z.infer<typeof createSignatureRequestSchema>
        const signature = await collaborationService.createSignatureRequest({
          designProjectId: projectId,
          ...body,
        })
        return reply.code(201).send({ signature })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to create signature request',
        })
      }
    }
  )

  // POST /architect/signatures/:id/sign - Sign document
  fastify.post(
    '/signatures/:id/sign',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(signDocumentSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof signDocumentSchema>
        const signature = await collaborationService.signDocument(id, {
          ...body,
          userId: user.id,
        })
        return reply.send({ signature })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to sign document',
        })
      }
    }
  )

  // GET /architect/design-projects/:projectId/signatures - Get signatures
  fastify.get(
    '/design-projects/:projectId/signatures',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { projectId } = request.params as { projectId: string }
        const query = request.query as { targetType?: string; targetId?: string }
        if (!query.targetType || !query.targetId) {
          return reply.code(400).send({
            error: 'targetType and targetId are required',
          })
        }
        const signatures = await collaborationService.getSignatures(projectId, query.targetType, query.targetId)
        return reply.send({ signatures })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to get signatures',
        })
      }
    }
  )

  // POST /architect/design-projects/:projectId/meetings - Create meeting minute
  fastify.post(
    '/design-projects/:projectId/meetings',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
        validateBody(createMeetingMinuteSchema as any),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { projectId } = request.params as { projectId: string }
        const body = request.body as z.infer<typeof createMeetingMinuteSchema>
        const meeting = await collaborationService.createMeetingMinute({
          designProjectId: projectId,
          ...body,
          createdById: user.id,
        })
        return reply.code(201).send({ meeting })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to create meeting minute',
        })
      }
    }
  )

  // GET /architect/meetings/:id - Get meeting minute
  fastify.get(
    '/meetings/:id',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const meeting = await collaborationService.getMeetingMinute(id)
        return reply.send({ meeting })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(404).send({
          error: error.message || 'Meeting minute not found',
        })
      }
    }
  )

  // GET /architect/design-projects/:projectId/meetings - List meeting minutes
  fastify.get(
    '/design-projects/:projectId/meetings',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { projectId } = request.params as { projectId: string }
        const query = request.query as {
          fromDate?: string
          toDate?: string
          meetingType?: string
        }
        const meetings = await collaborationService.listMeetingMinutes(projectId, {
          fromDate: query.fromDate ? new Date(query.fromDate) : undefined,
          toDate: query.toDate ? new Date(query.toDate) : undefined,
          meetingType: query.meetingType,
        })
        return reply.send({ meetings })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to list meeting minutes',
        })
      }
    }
  )

  // POST /architect/design-projects/:projectId/action-items - Create action item
  fastify.post(
    '/design-projects/:projectId/action-items',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
        validateBody(createActionItemSchema as any),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { projectId } = request.params as { projectId: string }
        const body = request.body as z.infer<typeof createActionItemSchema>
        const actionItem = await collaborationService.createActionItem({
          designProjectId: projectId,
          ...body,
          createdById: user.id,
        })
        return reply.code(201).send({ actionItem })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to create action item',
        })
      }
    }
  )

  // PATCH /architect/action-items/:id/status - Update action item status
  fastify.patch(
    '/action-items/:id/status',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(updateActionItemStatusSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof updateActionItemStatusSchema>
        const actionItem = await collaborationService.updateActionItemStatus(id, {
          ...body,
          userId: user.id,
        })
        return reply.send({ actionItem })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to update action item status',
        })
      }
    }
  )

  // GET /architect/design-projects/:projectId/action-items - List action items
  fastify.get(
    '/design-projects/:projectId/action-items',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { projectId } = request.params as { projectId: string }
        const query = request.query as {
          status?: string
          assignedToId?: string
          sourceType?: string
          sourceId?: string
        }
        const actionItems = await collaborationService.listActionItems(projectId, query)
        return reply.send({ actionItems })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to list action items',
        })
      }
    }
  )

  // POST /architect/design-projects/:projectId/decisions - Create design decision
  fastify.post(
    '/design-projects/:projectId/decisions',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
        validateBody(createDesignDecisionSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { projectId } = request.params as { projectId: string }
        const body = request.body as z.infer<typeof createDesignDecisionSchema>
        const decision = await collaborationService.createDesignDecision({
          designProjectId: projectId,
          ...body,
          createdById: user.id,
        })
        return reply.code(201).send({ decision })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to create design decision',
        })
      }
    }
  )

  // PATCH /architect/decisions/:id/status - Update decision status
  fastify.patch(
    '/decisions/:id/status',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(updateDecisionStatusSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof updateDecisionStatusSchema>
        const decision = await collaborationService.updateDecisionStatus(id, {
          ...body,
          userId: user.id,
        })
        return reply.send({ decision })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to update decision status',
        })
      }
    }
  )

  // GET /architect/decisions/:id - Get design decision
  fastify.get(
    '/decisions/:id',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const decision = await collaborationService.getDesignDecision(id)
        return reply.send({ decision })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(404).send({
          error: error.message || 'Design decision not found',
        })
      }
    }
  )

  // GET /architect/design-projects/:projectId/decisions - List design decisions
  fastify.get(
    '/design-projects/:projectId/decisions',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { projectId } = request.params as { projectId: string }
        const query = request.query as {
          status?: string
          relatedPhaseId?: string
          relatedReviewRequestId?: string
        }
        const decisions = await collaborationService.listDesignDecisions(projectId, query)
        return reply.send({ decisions })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to list design decisions',
        })
      }
    }
  )
}
