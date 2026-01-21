import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../auth/auth.middleware'
import { validateParams, validateBody } from '../../middleware/validation.middleware'
import { milestoneService } from './milestone.service'

const reviewMilestoneSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'NEEDS_REVISION']),
  notes: z.string().optional(),
  reviewerComments: z.string().optional(),
})

export async function milestoneReviewRoutes(fastify: FastifyInstance) {
  // Review milestone
  fastify.post(
    '/milestones/:milestoneId/review',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ milestoneId: z.string().uuid() })),
        validateBody(reviewMilestoneSchema),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { milestoneId } = request.params as { milestoneId: string }
      const data = request.body as z.infer<typeof reviewMilestoneSchema>
      // Use milestone service methods
      if (data.status === 'APPROVED') {
        const result = await milestoneService.approveMilestone(milestoneId, user.id, data.notes)
        return reply.send(result)
      } else if (data.status === 'REJECTED') {
        const result = await milestoneService.rejectMilestone(milestoneId, user.id, data.notes || '')
        return reply.send(result)
      } else {
        // Needs revision - update milestone status
        const result = await milestoneService.updateMilestone(milestoneId, {
          status: 'NEEDS_REVISION',
          reviewerNotes: data.notes,
        }, user.id)
        return reply.send(result)
      }
    }
  )

  // Get milestone review history
  fastify.get(
    '/milestones/:milestoneId/reviews',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ milestoneId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const { milestoneId } = request.params as { milestoneId: string }
      const user = (request as any).user as { id: string }
      const milestone = await milestoneService.getMilestone(milestoneId, user.id)
      return reply.send({
        reviews: milestone.reviews || [],
        currentStatus: milestone.status,
      })
    }
  )
}


