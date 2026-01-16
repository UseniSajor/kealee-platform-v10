import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../auth/auth.middleware'
import { validateParams, validateBody } from '../../middleware/validation.middleware'
import { paymentService } from './payment.service'

const releasePaymentSchema = z.object({
  skipHoldback: z.boolean().optional(),
  notes: z.string().optional(),
})

export async function paymentRoutes(fastify: FastifyInstance) {
  // Get escrow agreement for project (Prompt 3.4)
  fastify.get(
    '/projects/:projectId/escrow',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { projectId } = request.params as { projectId: string }
      const escrow = await paymentService.getEscrowAgreement(projectId, user.id)
      return reply.send({ escrow })
    }
  )

  // Check if payment can be released (Prompt 3.4)
  fastify.get(
    '/milestones/:milestoneId/can-release',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ milestoneId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { milestoneId } = request.params as { milestoneId: string }
      const result = await paymentService.canReleasePayment(milestoneId, user.id)
      return reply.send(result)
    }
  )

  // Release payment for milestone (Prompt 3.4)
  fastify.post(
    '/milestones/:milestoneId/release-payment',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ milestoneId: z.string().uuid() })),
        validateBody(releasePaymentSchema),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { milestoneId } = request.params as { milestoneId: string }
      const { skipHoldback, notes } = (request.body as { skipHoldback?: boolean; notes?: string }) || {}
      const result = await paymentService.releasePayment(milestoneId, user.id, {
        skipHoldback,
        notes,
      })
      return reply.send({ success: true, ...result })
    }
  )

  // Get payment history (Prompt 3.4)
  fastify.get(
    '/projects/:projectId/payments',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { projectId } = request.params as { projectId: string }
      const history = await paymentService.getPaymentHistory(projectId, user.id)
      return reply.send(history)
    }
  )
}
