/**
 * Architect Review Workflow Routes
 * Handles deliverable review and approval
 */

import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../auth/auth.middleware'
import { validateParams, validateBody } from '../../middleware/validation.middleware'
import { architectReviewWorkflowService } from './architect-review-workflow.service'

const submitDeliverableSchema = z.object({
  notes: z.string().optional(),
})

const addCommentSchema = z.object({
  comment: z.string().min(1),
  fileId: z.string().uuid().optional(),
  x: z.number().optional(),
  y: z.number().optional(),
})

const reviewDeliverableSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED']),
  feedback: z.string().optional(),
})

export async function architectReviewWorkflowRoutes(fastify: FastifyInstance) {
  // POST /architect/deliverables/:id/submit - Submit deliverable for review
  fastify.post(
    '/deliverables/:id/submit',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(submitDeliverableSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const { id } = request.params as { id: string }
        const { notes } = (request.body as { notes?: string }) || {}

        const result = await architectReviewWorkflowService.submitDeliverableForReview(
          id,
          user.id,
          notes
        )

        return reply.send(result)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to submit deliverable',
        })
      }
    }
  )

  // POST /architect/deliverables/:id/comments - Add comment to deliverable
  fastify.post(
    '/deliverables/:id/comments',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(addCommentSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const { id } = request.params as { id: string }
        const { comment, fileId, x, y } = request.body as {
          comment: string
          fileId?: string
          x?: number
          y?: number
        }

        const result = await architectReviewWorkflowService.addComment(
          id,
          user.id,
          comment,
          fileId,
          x,
          y
        )

        return reply.send({ comment: result })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to add comment',
        })
      }
    }
  )

  // PATCH /architect/deliverables/:id/review - Approve/reject deliverable
  fastify.patch(
    '/deliverables/:id/review',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(reviewDeliverableSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const { id } = request.params as { id: string }
        const { decision, feedback } = request.body as {
          decision: 'APPROVED' | 'REJECTED'
          feedback?: string
        }

        const result = await architectReviewWorkflowService.reviewDeliverable(
          id,
          user.id,
          decision,
          feedback
        )

        return reply.send({ deliverable: result })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to review deliverable',
        })
      }
    }
  )

  // GET /architect/deliverables/:id/review-status - Get review status
  fastify.get(
    '/deliverables/:id/review-status',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const { id } = request.params as { id: string }

        const result = await architectReviewWorkflowService.getReviewStatus(id, user.id)
        return reply.send(result)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to get review status',
        })
      }
    }
  )
}
