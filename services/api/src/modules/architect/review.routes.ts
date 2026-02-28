import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../auth/auth.middleware'
import { validateParams, validateBody } from '../../middleware/validation.middleware'
import { reviewService } from './review.service'
import { sanitizeErrorMessage } from '../../utils/sanitize-error'

const createReviewRequestSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  reviewType: z.string().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  deliverableIds: z.array(z.string().uuid()).optional(),
  fileIds: z.array(z.string().uuid()).optional(),
  sheetIds: z.array(z.string().uuid()).optional(),
  modelIds: z.array(z.string().uuid()).optional(),
  reviewerIds: z.array(z.string().uuid()).min(1),
  reviewerTypes: z.record(z.string()).optional(),
  reviewDeadline: z.string().datetime().optional().transform((val) => val ? new Date(val) : undefined),
  reminderDaysBefore: z.number().int().positive().optional(),
})

const createCommentSchema = z.object({
  reviewRequestId: z.string().uuid().optional(),
  commentText: z.string().min(1),
  commentType: z.string().optional(),
  targetType: z.string().optional(),
  targetId: z.string().uuid().optional(),
  pageNumber: z.number().int().positive().optional(),
  coordinates: z.any().optional(),
  markupData: z.any().optional(),
  parentCommentId: z.string().uuid().optional(),
  mentionedUserIds: z.array(z.string().uuid()).optional(),
})

const updateCommentStatusSchema = z.object({
  status: z.enum(['OPEN', 'ADDRESSED', 'CLOSED', 'RESOLVED']),
  addressedNotes: z.string().optional(),
})

const completeReviewSchema = z.object({
  completionNotes: z.string().optional(),
})

const approveReviewSchema = z.object({
  approvalNotes: z.string().optional(),
})

export async function reviewRoutes(fastify: FastifyInstance) {
  // POST /architect/design-projects/:projectId/review-requests - Create review request
  fastify.post(
    '/design-projects/:projectId/review-requests',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
        validateBody(createReviewRequestSchema as any),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { projectId } = request.params as { projectId: string }
        const body = request.body as z.infer<typeof createReviewRequestSchema>
        const reviewRequest = await reviewService.createReviewRequest({
          designProjectId: projectId,
          ...body,
          createdById: user.id,
        })
        return reply.code(201).send({ reviewRequest })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to create review request'),
        })
      }
    }
  )

  // GET /architect/design-projects/:projectId/review-requests - List review requests
  fastify.get(
    '/design-projects/:projectId/review-requests',
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
          reviewerId?: string
        }
        const reviewRequests = await reviewService.listReviewRequests(projectId, query)
        return reply.send({ reviewRequests })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to list review requests'),
        })
      }
    }
  )

  // GET /architect/review-requests/:id - Get review request
  fastify.get(
    '/review-requests/:id',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const reviewRequest = await reviewService.getReviewRequest(id)
        return reply.send({ reviewRequest })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(404).send({
          error: sanitizeErrorMessage(error, 'Review request not found'),
        })
      }
    }
  )

  // POST /architect/review-requests/:id/submit - Submit review request
  fastify.post(
    '/review-requests/:id/submit',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const reviewRequest = await reviewService.submitReviewRequest(id, user.id)
        return reply.send({ reviewRequest })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to submit review request'),
        })
      }
    }
  )

  // POST /architect/review-requests/:id/start - Start review
  fastify.post(
    '/review-requests/:id/start',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const reviewRequest = await reviewService.startReview(id, user.id)
        return reply.send({ reviewRequest })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to start review'),
        })
      }
    }
  )

  // POST /architect/review-requests/:id/complete - Complete review
  fastify.post(
    '/review-requests/:id/complete',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(completeReviewSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof completeReviewSchema>
        const reviewRequest = await reviewService.completeReviewRequest(id, {
          ...body,
          userId: user.id,
        })
        return reply.send({ reviewRequest })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to complete review'),
        })
      }
    }
  )

  // POST /architect/review-requests/:id/approve - Approve review
  fastify.post(
    '/review-requests/:id/approve',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(approveReviewSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof approveReviewSchema>
        const reviewRequest = await reviewService.approveReviewRequest(id, {
          ...body,
          userId: user.id,
        })
        return reply.send({ reviewRequest })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to approve review'),
        })
      }
    }
  )

  // POST /architect/review-requests/:id/comments - Create comment
  fastify.post(
    '/review-requests/:id/comments',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(createCommentSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof createCommentSchema>
        const comment = await reviewService.createComment({
          reviewRequestId: id,
          ...body,
          createdById: user.id,
        })
        return reply.code(201).send({ comment })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to create comment'),
        })
      }
    }
  )

  // PATCH /architect/comments/:id/status - Update comment status
  fastify.patch(
    '/comments/:id/status',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(updateCommentStatusSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof updateCommentStatusSchema>
        const comment = await reviewService.updateCommentStatus(id, {
          ...body,
          userId: user.id,
        })
        return reply.send({ comment })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to update comment status'),
        })
      }
    }
  )

  // GET /architect/design-projects/:projectId/review-requests/overdue - Get overdue reviews
  fastify.get(
    '/design-projects/:projectId/review-requests/overdue',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { projectId } = request.params as { projectId: string }
        const overdue = await reviewService.getOverdueReviewRequests(projectId)
        return reply.send({ reviewRequests: overdue })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to get overdue reviews'),
        })
      }
    }
  )

  // GET /architect/design-projects/:projectId/review-requests/due-soon - Get reviews due soon
  fastify.get(
    '/design-projects/:projectId/review-requests/due-soon',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { projectId } = request.params as { projectId: string }
        const query = request.query as { days?: string }
        const days = query.days ? parseInt(query.days, 10) : 3
        const dueSoon = await reviewService.getReviewRequestsDueSoon(projectId, days)
        return reply.send({ reviewRequests: dueSoon })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to get reviews due soon'),
        })
      }
    }
  )

  // GET /architect/design-projects/:projectId/review-summary - Get review summary
  fastify.get(
    '/design-projects/:projectId/review-summary',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { projectId } = request.params as { projectId: string }
        const summary = await reviewService.getReviewSummary(projectId)
        return reply.send({ summary })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to get review summary'),
        })
      }
    }
  )

  // POST /architect/review-requests/:id/reminders - Send reminder
  fastify.post(
    '/review-requests/:id/reminders',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as { userId?: string; reminderType?: string }
        const reminder = await reviewService.sendReviewReminder(
          id,
          body.userId || user.id,
          body.reminderType || 'DEADLINE_APPROACHING'
        )
        return reply.send({ reminder })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to send reminder'),
        })
      }
    }
  )
}
