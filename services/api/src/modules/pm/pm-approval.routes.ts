/**
 * Approval Workflow Routes
 * Handles all approval workflow endpoints
 */

import { FastifyInstance } from 'fastify'
import { approvalWorkflowService } from './pm-approval.service'
import { authenticateUser } from '../auth/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../../middleware/validation.middleware'
import { z } from 'zod'
import multipart from '@fastify/multipart'
import { fileService } from '../files/file.service'

export async function pmApprovalRoutes(fastify: FastifyInstance) {
  // Register multipart for file uploads
  await fastify.register(multipart)

  // ============================================================================
  // APPROVAL REQUESTS
  // ============================================================================

  // GET /pm/approvals - List approval requests
  fastify.get(
    '/approvals',
    {
      preHandler: [authenticateUser, validateQuery(z.object({
        type: z.string().optional(),
        status: z.string().optional(),
        requesterId: z.string().uuid().optional(),
        approverId: z.string().uuid().optional(),
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
        search: z.string().optional(),
        page: z.coerce.number().default(1),
        limit: z.coerce.number().default(50),
      }))],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const query = request.query as any

        // If requesterId is 'me', use current user ID
        if (query.requesterId === 'me') {
          query.requesterId = user.id
        }

        const result = await approvalWorkflowService.getApprovalRequests({
          ...query,
          startDate: query.startDate ? new Date(query.startDate) : undefined,
          endDate: query.endDate ? new Date(query.endDate) : undefined,
        })

        return reply.send(result)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to fetch approval requests',
        })
      }
    }
  )

  // GET /pm/approvals/:id - Get approval request
  fastify.get(
    '/approvals/:id',
    {
      preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() }))],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const { id } = request.params as { id: string }

        const request_data = await approvalWorkflowService.getApprovalRequest(id, user.id)
        return reply.send({ request: request_data })
      } catch (error: any) {
        fastify.log.error(error)
        const statusCode = error.message?.includes('not found') ? 404 : error.message?.includes('authorized') ? 403 : 400
        return reply.code(statusCode).send({
          error: error.message || 'Failed to fetch approval request',
        })
      }
    }
  )

  // POST /pm/approvals - Create approval request
  fastify.post(
    '/approvals',
    {
      preHandler: authenticateUser,
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const contentType = request.headers['content-type'] || ''

        let requestData: any
        const attachments: any[] = []

        // Check if multipart/form-data (has files)
        if (contentType.includes('multipart/form-data')) {
          const data = await request.file()

          if (!data) {
            return reply.code(400).send({ error: 'No data provided' })
          }

          // Parse JSON data from form field
          const dataField = (data.fields as any)?.data
          if (!dataField || !dataField.value) {
            return reply.code(400).send({ error: 'Missing data field' })
          }

          requestData = JSON.parse(dataField.value)

          // Handle file attachments
          if (data.file) {
            const buffer = await data.toBuffer()
            const uploadedFile = await fileService.uploadFile(
              buffer,
              data.filename,
              data.mimetype,
              data.file.bytesRead,
              user.id,
              'approvals'
            )

            attachments.push({
              fileId: uploadedFile.id,
              fileName: uploadedFile.fileName,
              fileUrl: uploadedFile.url,
              fileType: (uploadedFile as any).mimetype || (uploadedFile as any).mimeType || 'application/octet-stream',
              fileSize: (uploadedFile as any).file?.bytesRead || (uploadedFile as any).size || 0,
            })
          }

          // Handle multiple files if provided
          const files = await request.saveRequestFiles()
          for (const file of files) {
            if ((file as any).filename !== data.filename) {
              const buffer = await file.toBuffer()
              const uploadedFile = await fileService.uploadFile(
                buffer,
                file.filename,
                file.mimetype,
                file.file.bytesRead,
                user.id,
                'approvals'
              )

              attachments.push({
                fileId: uploadedFile.id,
                fileName: uploadedFile.fileName,
                fileUrl: uploadedFile.url,
                fileType: uploadedFile.mimeType,
                fileSize: uploadedFile.size,
              })
            }
          }
        } else {
          // JSON-only request
          requestData = request.body as any
        }

        const result = await approvalWorkflowService.createApprovalRequest(
          {
            ...requestData,
            attachments: attachments.length > 0 ? attachments : undefined,
          },
          user.id
        )

        return reply.code(201).send({ request: result })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to create approval request',
        })
      }
    }
  )

  // POST /pm/approvals/:id/submit - Submit approval request
  fastify.post(
    '/approvals/:id/submit',
    {
      preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() }))],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const { id } = request.params as { id: string }

        const result = await approvalWorkflowService.submitApprovalRequest(id, user.id)
        return reply.send({ request: result })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to submit approval request',
        })
      }
    }
  )

  // POST /pm/approvals/:id/approve - Approve request
  fastify.post(
    '/approvals/:id/approve',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(z.object({ comments: z.string().optional() })),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const { id } = request.params as { id: string }
        const { comments } = request.body as { comments?: string }

        const result = await approvalWorkflowService.approveRequest(id, user.id, comments)
        return reply.send({ request: result })
      } catch (error: any) {
        fastify.log.error(error)
        const statusCode = error.message?.includes('authorized') ? 403 : 400
        return reply.code(statusCode).send({
          error: error.message || 'Failed to approve request',
        })
      }
    }
  )

  // POST /pm/approvals/:id/reject - Reject request
  fastify.post(
    '/approvals/:id/reject',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(z.object({ comments: z.string().min(1) })),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const { id } = request.params as { id: string }
        const { comments } = request.body as { comments: string }

        const result = await approvalWorkflowService.rejectRequest(id, user.id, comments)
        return reply.send({ request: result })
      } catch (error: any) {
        fastify.log.error(error)
        const statusCode = error.message?.includes('authorized') ? 403 : 400
        return reply.code(statusCode).send({
          error: error.message || 'Failed to reject request',
        })
      }
    }
  )

  // POST /pm/approvals/:id/cancel - Cancel request
  fastify.post(
    '/approvals/:id/cancel',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(z.object({ reason: z.string().optional() })),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const { id } = request.params as { id: string }
        const { reason } = request.body as { reason?: string }

        const result = await approvalWorkflowService.cancelRequest(id, user.id, reason)
        return reply.send({ request: result })
      } catch (error: any) {
        fastify.log.error(error)
        const statusCode = error.message?.includes('authorized') ? 403 : 400
        return reply.code(statusCode).send({
          error: error.message || 'Failed to cancel request',
        })
      }
    }
  )

  // GET /pm/approvals/my-pending - Get my pending approvals
  fastify.get(
    '/approvals/my-pending',
    {
      preHandler: [authenticateUser, validateQuery(z.object({
        type: z.string().optional(),
        page: z.coerce.number().default(1),
        limit: z.coerce.number().default(50),
      }))],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const query = request.query as any

        const result = await approvalWorkflowService.getMyPendingApprovals(user.id, query)
        return reply.send(result)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to fetch pending approvals',
        })
      }
    }
  )

  // ============================================================================
  // APPROVAL RULES
  // ============================================================================

  // GET /pm/approval-rules - List approval rules
  fastify.get(
    '/approval-rules',
    {
      preHandler: [authenticateUser, validateQuery(z.object({
        type: z.string().optional(),
        active: z.string().optional().transform(val => val === 'true'),
        page: z.coerce.number().default(1),
        limit: z.coerce.number().default(50),
      }))],
    },
    async (request, reply) => {
      try {
        const query = request.query as any
        const result = await approvalWorkflowService.getApprovalRules(query)
        return reply.send(result)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to fetch approval rules',
        })
      }
    }
  )

  // GET /pm/approval-rules/:id - Get approval rule
  fastify.get(
    '/approval-rules/:id',
    {
      preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() }))],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const rules = await approvalWorkflowService.getApprovalRules({})
        const rule = rules.rules.find((r: any) => r.id === id)

        if (!rule) {
          return reply.code(404).send({ error: 'Approval rule not found' })
        }

        return reply.send({ rule })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to fetch approval rule',
        })
      }
    }
  )

  // POST /pm/approval-rules - Create approval rule
  fastify.post(
    '/approval-rules',
    {
      preHandler: [
        authenticateUser,
        validateBody(z.object({
          name: z.string().min(1),
          type: z.string().min(1),
          subtype: z.string().optional(),
          conditions: z.array(z.object({
            field: z.string(),
            operator: z.string(),
            value: z.any(),
          })),
          approvalChain: z.array(z.object({
            role: z.string(),
            department: z.string().optional(),
            order: z.number(),
            required: z.boolean(),
            fallbackApproverId: z.string().uuid().optional(),
          })),
          priority: z.string().optional(),
          sla: z.number().optional(),
          active: z.boolean().optional(),
        })),
      ],
    },
    async (request, reply) => {
      try {
        const body = request.body as any
        const rule = await approvalWorkflowService.createApprovalRule(body)
        return reply.code(201).send({ rule })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to create approval rule',
        })
      }
    }
  )

  // PATCH /pm/approval-rules/:id - Update approval rule
  fastify.patch(
    '/approval-rules/:id',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(z.object({
          name: z.string().min(1).optional(),
          type: z.string().min(1).optional(),
          subtype: z.string().optional(),
          conditions: z.array(z.object({
            field: z.string(),
            operator: z.string(),
            value: z.any(),
          })).optional(),
          approvalChain: z.array(z.object({
            role: z.string(),
            department: z.string().optional(),
            order: z.number(),
            required: z.boolean(),
            fallbackApproverId: z.string().uuid().optional(),
          })).optional(),
          priority: z.string().optional(),
          sla: z.number().optional(),
          active: z.boolean().optional(),
        })),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const body = request.body as any
        const rule = await approvalWorkflowService.updateApprovalRule(id, body)
        return reply.send({ rule })
      } catch (error: any) {
        fastify.log.error(error)
        const statusCode = error.message?.includes('not found') ? 404 : 400
        return reply.code(statusCode).send({
          error: error.message || 'Failed to update approval rule',
        })
      }
    }
  )

  // DELETE /pm/approval-rules/:id - Delete approval rule
  fastify.delete(
    '/approval-rules/:id',
    {
      preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() }))],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        await approvalWorkflowService.deleteApprovalRule(id)
        return reply.send({ success: true })
      } catch (error: any) {
        fastify.log.error(error)
        const statusCode = error.message?.includes('not found') ? 404 : 400
        return reply.code(statusCode).send({
          error: error.message || 'Failed to delete approval rule',
        })
      }
    }
  )

  // ============================================================================
  // ATTACHMENTS
  // ============================================================================

  // POST /pm/approvals/:id/attachments - Add attachment
  fastify.post(
    '/approvals/:id/attachments',
    {
      preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() }))],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const { id } = request.params as { id: string }
        const data = await request.file()

        if (!data) {
          return reply.code(400).send({ error: 'No file provided' })
        }

        const buffer = await data.toBuffer()
        const uploadedFile = await fileService.uploadFile(
          buffer,
          data.filename,
          data.mimetype,
          data.file.bytesRead,
          user.id,
          'approvals'
        )

        const attachment = await approvalWorkflowService.addAttachment(
          id,
          uploadedFile.id,
          uploadedFile.fileName,
          uploadedFile.url,
          (uploadedFile as any).mimetype || (uploadedFile as any).mimeType || 'application/octet-stream',
          (uploadedFile as any).file?.bytesRead || (uploadedFile as any).size || 0
        )

        return reply.code(201).send({ attachment })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to add attachment',
        })
      }
    }
  )

  // DELETE /pm/approvals/:id/attachments/:attachmentId - Delete attachment
  fastify.delete(
    '/approvals/:id/attachments/:attachmentId',
    {
      preHandler: [authenticateUser, validateParams(z.object({
        id: z.string().uuid(),
        attachmentId: z.string().uuid(),
      }))],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const { id, attachmentId } = request.params as { id: string; attachmentId: string }

        await approvalWorkflowService.deleteAttachment(id, attachmentId, user.id)
        return reply.send({ success: true })
      } catch (error: any) {
        fastify.log.error(error)
        const statusCode = error.message?.includes('authorized') ? 403 : 400
        return reply.code(statusCode).send({
          error: error.message || 'Failed to delete attachment',
        })
      }
    }
  )

  // ============================================================================
  // COMMENTS
  // ============================================================================

  // POST /pm/approvals/:id/comments - Add comment
  fastify.post(
    '/approvals/:id/comments',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(z.object({ content: z.string().min(1) })),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const { id } = request.params as { id: string }
        const { content } = request.body as { content: string }

        const comment = await approvalWorkflowService.addComment(id, user.id, content)
        return reply.code(201).send({ comment })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to add comment',
        })
      }
    }
  )

  // GET /pm/approvals/:id/comments - Get comments
  fastify.get(
    '/approvals/:id/comments',
    {
      preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() }))],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const { id } = request.params as { id: string }

        const result = await approvalWorkflowService.getComments(id, user.id)
        return reply.send(result)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to fetch comments',
        })
      }
    }
  )

  // ============================================================================
  // REPORTS
  // ============================================================================

  // GET /pm/reports/approvals - Get approval report
  fastify.get(
    '/reports/approvals',
    {
      preHandler: [authenticateUser, validateQuery(z.object({
        startDate: z.string().datetime(),
        endDate: z.string().datetime(),
        type: z.string().optional(),
        department: z.string().optional(),
      }))],
    },
    async (request, reply) => {
      try {
        const query = request.query as any
        const result = await approvalWorkflowService.getApprovalReport({
          startDate: new Date(query.startDate),
          endDate: new Date(query.endDate),
          type: query.type,
          department: query.department,
        })
        return reply.send(result)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to generate approval report',
        })
      }
    }
  )
}
