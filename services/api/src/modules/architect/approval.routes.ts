import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../auth/auth.middleware'
import { validateParams, validateBody } from '../../middleware/validation.middleware'
import { approvalService } from './approval.service'
import { sanitizeErrorMessage } from '../../utils/sanitize-error'

const createWorkflowSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  workflowType: z.string().min(1),
  appliesToEntityType: z.array(z.enum(['SHEET', 'DELIVERABLE', 'PHASE', 'PROJECT', 'VALIDATION', 'REVISION', 'OTHER'])),
  appliesToProjectTypes: z.array(z.string()).optional(),
  appliesToPhases: z.array(z.string()).optional(),
  steps: z.array(z.any()).min(1),
  conditionalLogic: z.any().optional(),
  isDefault: z.boolean().optional(),
})

const createApprovalRequestSchema = z.object({
  entityType: z.enum(['SHEET', 'DELIVERABLE', 'PHASE', 'PROJECT', 'VALIDATION', 'REVISION', 'OTHER']),
  entityId: z.string().uuid(),
  workflowId: z.string().uuid().optional(),
  requestTitle: z.string().min(1),
  requestDescription: z.string().optional(),
  requestNotes: z.string().optional(),
  priority: z.string().optional(),
  deadline: z.string().optional(),
})

const approveStepSchema = z.object({
  approvalNotes: z.string().optional(),
  signatureData: z.any().optional(),
  signatureImageUrl: z.string().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  location: z.string().optional(),
})

const rejectStepSchema = z.object({
  rejectionReason: z.string().min(1),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  location: z.string().optional(),
})

const delegateApprovalSchema = z.object({
  toUserId: z.string().uuid(),
  delegationReason: z.string().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
})

const revokeDelegationSchema = z.object({
  revokedReason: z.string().optional(),
})

const generateCertificateSchema = z.object({
  certificateTitle: z.string().min(1),
  certificateDescription: z.string().optional(),
  certificateData: z.any().optional(),
  certificateFormat: z.enum(['PDF', 'PNG', 'JPG']).optional(),
  issuedTo: z.string().optional(),
  issuedBy: z.string().optional(),
})

export async function approvalRoutes(fastify: FastifyInstance) {
  // POST /architect/approval-workflows - Create approval workflow
  fastify.post(
    '/approval-workflows',
    {
      preHandler: [
        authenticateUser,
        validateBody(createWorkflowSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const body = request.body as z.infer<typeof createWorkflowSchema>
        const workflow = await approvalService.createApprovalWorkflow({
          ...body,
          createdById: user.id,
        })
        return reply.code(201).send({ workflow })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to create approval workflow'),
        })
      }
    }
  )

  // GET /architect/approval-workflows - List approval workflows
  fastify.get(
    '/approval-workflows',
    {
      preHandler: [authenticateUser],
    },
    async (request, reply) => {
      try {
        const query = request.query as {
          workflowType?: string
          entityType?: string
          isActive?: string
          isDefault?: string
        }
        const workflows = await approvalService.listApprovalWorkflows({
          workflowType: query.workflowType,
          entityType: query.entityType,
          isActive: query.isActive === 'true' ? true : query.isActive === 'false' ? false : undefined,
          isDefault: query.isDefault === 'true' ? true : query.isDefault === 'false' ? false : undefined,
        })
        return reply.send({ workflows })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to list approval workflows'),
        })
      }
    }
  )

  // GET /architect/approval-workflows/:id - Get approval workflow
  fastify.get(
    '/approval-workflows/:id',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const workflow = await approvalService.getApprovalWorkflow(id)
        return reply.send({ workflow })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(404).send({
          error: sanitizeErrorMessage(error, 'Approval workflow not found'),
        })
      }
    }
  )

  // POST /architect/design-projects/:projectId/approval-requests - Create approval request
  fastify.post(
    '/design-projects/:projectId/approval-requests',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
        validateBody(createApprovalRequestSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { projectId } = request.params as { projectId: string }
        const body = request.body as z.infer<typeof createApprovalRequestSchema>
        const approvalRequest = await approvalService.createApprovalRequest({
          designProjectId: projectId,
          ...body,
          deadline: body.deadline ? new Date(body.deadline) : undefined,
          requestedById: user.id,
        })
        return reply.code(201).send({ approvalRequest })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to create approval request'),
        })
      }
    }
  )

  // GET /architect/approval-requests/:id - Get approval request
  fastify.get(
    '/approval-requests/:id',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const approvalRequest = await approvalService.getApprovalRequest(id)
        return reply.send({ approvalRequest })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(404).send({
          error: sanitizeErrorMessage(error, 'Approval request not found'),
        })
      }
    }
  )

  // GET /architect/design-projects/:projectId/approval-requests - List approval requests
  fastify.get(
    '/design-projects/:projectId/approval-requests',
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
          entityType?: string
          entityId?: string
          approvalStatus?: string
          requestedById?: string
        }
        const requests = await approvalService.listApprovalRequests(projectId, query)
        return reply.send({ requests })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to list approval requests'),
        })
      }
    }
  )

  // POST /architect/approval-steps/:id/approve - Approve step
  fastify.post(
    '/approval-steps/:id/approve',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(approveStepSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof approveStepSchema>
        const headers = request.headers
        const step = await approvalService.approveStep(id, {
          ...body,
          ipAddress: body.ipAddress || (headers['x-forwarded-for'] as string) || request.ip,
          userAgent: body.userAgent || (headers['user-agent'] as string),
          userId: user.id,
        })
        return reply.send({ step })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to approve step'),
        })
      }
    }
  )

  // POST /architect/approval-steps/:id/reject - Reject step
  fastify.post(
    '/approval-steps/:id/reject',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(rejectStepSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof rejectStepSchema>
        const headers = request.headers
        const step = await approvalService.rejectStep(id, {
          ...body,
          ipAddress: body.ipAddress || (headers['x-forwarded-for'] as string) || request.ip,
          userAgent: body.userAgent || (headers['user-agent'] as string),
          userId: user.id,
        })
        return reply.send({ step })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to reject step'),
        })
      }
    }
  )

  // POST /architect/approval-requests/:id/delegate - Delegate approval
  fastify.post(
    '/approval-requests/:id/delegate',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(delegateApprovalSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof delegateApprovalSchema>
        const headers = request.headers
        const delegation = await approvalService.delegateApproval(id, {
          fromUserId: user.id,
          toUserId: body.toUserId,
          delegationReason: body.delegationReason,
          ipAddress: body.ipAddress || (headers['x-forwarded-for'] as string) || request.ip,
          userAgent: body.userAgent || (headers['user-agent'] as string),
        })
        return reply.send({ delegation })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to delegate approval'),
        })
      }
    }
  )

  // POST /architect/approval-delegations/:id/revoke - Revoke delegation
  fastify.post(
    '/approval-delegations/:id/revoke',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(revokeDelegationSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof revokeDelegationSchema>
        const delegation = await approvalService.revokeDelegation(id, {
          ...body,
          userId: user.id,
        })
        return reply.send({ delegation })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to revoke delegation'),
        })
      }
    }
  )

  // POST /architect/approval-requests/:id/certificate - Generate approval certificate
  fastify.post(
    '/approval-requests/:id/certificate',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(generateCertificateSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof generateCertificateSchema>
        const certificate = await approvalService.generateApprovalCertificate(id, {
          ...body,
          generatedById: user.id,
        })
        return reply.code(201).send({ certificate })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to generate approval certificate'),
        })
      }
    }
  )

  // GET /architect/approval-requests/:id/history - Get approval history
  fastify.get(
    '/approval-requests/:id/history',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const history = await approvalService.getApprovalHistory(id)
        return reply.send({ history })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to get approval history'),
        })
      }
    }
  )
}
