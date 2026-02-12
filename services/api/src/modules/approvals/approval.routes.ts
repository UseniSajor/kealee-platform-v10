/**
 * Approval Routes
 * CRUD for ApprovalRule, ApprovalAttachment, ApprovalComment, AssignmentRequest
 */

import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../../middleware/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../../middleware/validation.middleware'
import { prisma } from '@kealee/database'

// ---------------------------------------------------------------------------
// Zod Schemas
// ---------------------------------------------------------------------------

const approvalRuleCreateSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  subtype: z.string().optional(),
  conditions: z.any(),
  approvalChain: z.any(),
  priority: z.string().optional(),
  sla: z.number().int().optional(),
  active: z.boolean().optional(),
})

const approvalRuleUpdateSchema = approvalRuleCreateSchema.partial()

const attachmentCreateSchema = z.object({
  approvalRequestId: z.string().uuid(),
  fileId: z.string().uuid().optional(),
  fileName: z.string().min(1),
  fileUrl: z.string().url(),
  fileType: z.string().min(1),
  fileSize: z.number().int().min(0),
})

const commentCreateSchema = z.object({
  approvalRequestId: z.string().uuid(),
  content: z.string().min(1),
})

const assignmentRequestCreateSchema = z.object({
  clientId: z.string().uuid(),
  pmUserId: z.string().uuid(),
  message: z.string().optional(),
})

const assignmentRequestUpdateSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
  message: z.string().optional(),
})

const paginationQuery = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
})

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export async function approvalManagementRoutes(fastify: FastifyInstance) {
  // Apply auth to all routes
  fastify.addHook('onRequest', async (request, reply) => {
    await authenticateUser(request, reply)
  })

  // ========================================================================
  // APPROVAL RULES
  // ========================================================================

  // GET /rules - List approval rules
  fastify.get(
    '/rules',
    {
      preHandler: [
        validateQuery(
          z.object({
            page: z.string().optional(),
            limit: z.string().optional(),
            type: z.string().optional(),
            active: z.string().optional(),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const query = request.query as { page?: string; limit?: string; type?: string; active?: string }
        const page = Math.max(1, parseInt(query.page || '1', 10))
        const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)))
        const skip = (page - 1) * limit

        const where: any = {}
        if (query.type) where.type = query.type
        if (query.active !== undefined) where.active = query.active === 'true'

        const [rules, total] = await Promise.all([
          (prisma as any).approvalRule.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
          }),
          (prisma as any).approvalRule.count({ where }),
        ])

        return reply.send({
          data: rules,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to list approval rules' })
      }
    }
  )

  // POST /rules - Create approval rule
  fastify.post(
    '/rules',
    {
      preHandler: [validateBody(approvalRuleCreateSchema)],
    },
    async (request, reply) => {
      try {
        const body = request.body as z.infer<typeof approvalRuleCreateSchema>

        const rule = await (prisma as any).approvalRule.create({
          data: body,
        })

        return reply.code(201).send({ data: rule })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: error.message || 'Failed to create approval rule' })
      }
    }
  )

  // PATCH /rules/:id - Update approval rule
  fastify.patch(
    '/rules/:id',
    {
      preHandler: [
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(approvalRuleUpdateSchema),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof approvalRuleUpdateSchema>

        const updated = await (prisma as any).approvalRule.update({
          where: { id },
          data: body,
        })

        return reply.send({ data: updated })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: error.message || 'Failed to update approval rule' })
      }
    }
  )

  // ========================================================================
  // APPROVAL ATTACHMENTS
  // ========================================================================

  // GET /attachments/:requestId - List attachments for request
  fastify.get(
    '/attachments/:requestId',
    {
      preHandler: [
        validateParams(z.object({ requestId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { requestId } = request.params as { requestId: string }

        const attachments = await (prisma as any).approvalAttachment.findMany({
          where: { approvalRequestId: requestId },
          orderBy: { uploadedAt: 'desc' },
        })

        return reply.send({ data: attachments })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to list attachments' })
      }
    }
  )

  // POST /attachments - Upload attachment
  fastify.post(
    '/attachments',
    {
      preHandler: [validateBody(attachmentCreateSchema)],
    },
    async (request, reply) => {
      try {
        const body = request.body as z.infer<typeof attachmentCreateSchema>

        const attachment = await (prisma as any).approvalAttachment.create({
          data: body,
        })

        return reply.code(201).send({ data: attachment })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: error.message || 'Failed to create attachment' })
      }
    }
  )

  // ========================================================================
  // APPROVAL COMMENTS
  // ========================================================================

  // GET /comments/:requestId - List comments for request
  fastify.get(
    '/comments/:requestId',
    {
      preHandler: [
        validateParams(z.object({ requestId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { requestId } = request.params as { requestId: string }

        const comments = await (prisma as any).approvalComment.findMany({
          where: { approvalRequestId: requestId },
          orderBy: { createdAt: 'asc' },
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        })

        return reply.send({ data: comments })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to list comments' })
      }
    }
  )

  // POST /comments - Add comment
  fastify.post(
    '/comments',
    {
      preHandler: [validateBody(commentCreateSchema)],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const body = request.body as z.infer<typeof commentCreateSchema>

        const comment = await (prisma as any).approvalComment.create({
          data: {
            ...body,
            userId: user.id,
          },
        })

        return reply.code(201).send({ data: comment })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: error.message || 'Failed to add comment' })
      }
    }
  )

  // ========================================================================
  // ASSIGNMENT REQUESTS
  // ========================================================================

  // GET /assignment-requests - List assignment requests
  fastify.get(
    '/assignment-requests',
    {
      preHandler: [
        validateQuery(
          z.object({
            page: z.string().optional(),
            limit: z.string().optional(),
            status: z.string().optional(),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const query = request.query as { page?: string; limit?: string; status?: string }
        const page = Math.max(1, parseInt(query.page || '1', 10))
        const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)))
        const skip = (page - 1) * limit

        const where: any = {}
        if (query.status) where.status = query.status

        const [requests, total] = await Promise.all([
          (prisma as any).assignmentRequest.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
              client: { select: { id: true, name: true, email: true } },
            },
          }),
          (prisma as any).assignmentRequest.count({ where }),
        ])

        return reply.send({
          data: requests,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to list assignment requests' })
      }
    }
  )

  // POST /assignment-requests - Create assignment request
  fastify.post(
    '/assignment-requests',
    {
      preHandler: [validateBody(assignmentRequestCreateSchema)],
    },
    async (request, reply) => {
      try {
        const body = request.body as z.infer<typeof assignmentRequestCreateSchema>

        const assignmentReq = await (prisma as any).assignmentRequest.create({
          data: body,
        })

        return reply.code(201).send({ data: assignmentReq })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: error.message || 'Failed to create assignment request' })
      }
    }
  )

  // PATCH /assignment-requests/:id - Update (approve/reject)
  fastify.patch(
    '/assignment-requests/:id',
    {
      preHandler: [
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(assignmentRequestUpdateSchema),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof assignmentRequestUpdateSchema>

        const updated = await (prisma as any).assignmentRequest.update({
          where: { id },
          data: body,
        })

        return reply.send({ data: updated })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: error.message || 'Failed to update assignment request' })
      }
    }
  )
}
