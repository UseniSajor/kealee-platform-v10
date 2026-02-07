/**
 * Bid Evaluation Routes
 *
 * Surfaces bid evaluations and bid acceptance to PMs and project members.
 *
 * Prefix: /api/v1/bids
 */

import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '@kealee/database'
import {
  authenticateUser,
  requireProjectMembership,
  type AuthenticatedRequest,
} from '../../middleware/auth.middleware'
import { validateParams } from '../../middleware/validation.middleware'

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const projectIdParamsSchema = z.object({
  projectId: z.string().uuid(),
})

const acceptBidParamsSchema = z.object({
  id: z.string().uuid(),
  bidId: z.string().uuid(),
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function verifyProjectMembershipLocal(
  userId: string,
  projectId: string,
  userEmail?: string,
  organizationId?: string | null,
): Promise<boolean> {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { pmId: userId },
        { projectManagers: { some: { userId } } },
        ...(userEmail ? [{ client: { email: userEmail } }] : []),
        ...(organizationId ? [{ orgId: organizationId }] : []),
      ],
    },
    select: { id: true },
  })
  return !!project
}

// ---------------------------------------------------------------------------
// Route plugin
// ---------------------------------------------------------------------------

export async function bidRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('onRequest', async (request, reply) => {
    await authenticateUser(request, reply)
  })

  // -------------------------------------------------------------------------
  // GET /evaluations/:projectId — all evaluations with bids for a project
  // -------------------------------------------------------------------------
  fastify.get(
    '/evaluations/:projectId',
    {
      preHandler: [validateParams(projectIdParamsSchema)],
    },
    async (request, reply) => {
      try {
        const user = (request as AuthenticatedRequest).user!
        const { projectId } = request.params as z.infer<typeof projectIdParamsSchema>

        const isMember = await verifyProjectMembershipLocal(user.id, projectId, user.email, user.organizationId)
        if (!isMember && user.role !== 'admin') {
          return reply.code(403).send({ error: 'Not a member of this project' })
        }

        const evaluations = await prisma.bidEvaluation.findMany({
          where: { projectId },
          include: {
            bids: {
              orderBy: { totalScore: 'desc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        })

        return reply.send({
          evaluations: evaluations.map((e) => ({
            id: e.id,
            projectId: e.projectId,
            trade: e.trade,
            status: e.status,
            weights: {
              price: Number(e.weightPrice),
              timeline: Number(e.weightTimeline),
              quality: Number(e.weightQuality),
              proximity: Number(e.weightProximity),
              availability: Number(e.weightAvailability),
            },
            dueDate: e.dueDate?.toISOString() ?? null,
            selectedBidId: e.selectedBidId,
            aiRecommendation: e.aiRecommendation,
            createdAt: e.createdAt.toISOString(),
            updatedAt: e.updatedAt.toISOString(),
            bids: e.bids.map((b) => ({
              id: b.id,
              contractorId: b.contractorId,
              amount: Number(b.amount),
              timeline: b.timeline,
              qualityScore: b.qualityScore ? Number(b.qualityScore) : null,
              proximityScore: b.proximityScore ? Number(b.proximityScore) : null,
              availabilityScore: b.availabilityScore ? Number(b.availabilityScore) : null,
              totalScore: b.totalScore ? Number(b.totalScore) : null,
              rank: b.rank,
              notes: b.notes,
              scope: b.scope,
              status: b.status,
              createdAt: b.createdAt.toISOString(),
            })),
          })),
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to get evaluations' })
      }
    },
  )

  // -------------------------------------------------------------------------
  // POST /evaluations/:id/accept/:bidId — accept a bid
  // -------------------------------------------------------------------------
  fastify.post(
    '/evaluations/:id/accept/:bidId',
    {
      preHandler: [validateParams(acceptBidParamsSchema)],
    },
    async (request, reply) => {
      try {
        const user = (request as AuthenticatedRequest).user!
        const { id, bidId } = request.params as z.infer<typeof acceptBidParamsSchema>

        // Verify evaluation exists and user has access
        const evaluation = await prisma.bidEvaluation.findUnique({
          where: { id },
          include: { bids: true },
        })

        if (!evaluation) {
          return reply.code(404).send({ error: 'Evaluation not found' })
        }

        const isMember = await verifyProjectMembershipLocal(user.id, evaluation.projectId, user.email, user.organizationId)
        if (!isMember && user.role !== 'admin') {
          return reply.code(403).send({ error: 'Not a member of this project' })
        }

        // Verify bid belongs to this evaluation
        const bid = evaluation.bids.find((b) => b.id === bidId)
        if (!bid) {
          return reply.code(404).send({ error: 'Bid not found in this evaluation' })
        }

        if (evaluation.selectedBidId) {
          return reply.code(409).send({ error: 'A bid has already been accepted for this evaluation' })
        }

        // Accept the bid — update evaluation and bid status
        const [updatedEval] = await prisma.$transaction([
          prisma.bidEvaluation.update({
            where: { id },
            data: {
              selectedBidId: bidId,
              status: 'awarded',
            },
          }),
          prisma.bid.update({
            where: { id: bidId },
            data: { status: 'accepted' },
          }),
          // Reject remaining bids
          prisma.bid.updateMany({
            where: {
              evaluationId: id,
              id: { not: bidId },
              status: 'submitted',
            },
            data: { status: 'rejected' },
          }),
        ])

        return reply.send({
          accepted: true,
          contractId: updatedEval.id, // evaluation ID serves as contract reference
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to accept bid' })
      }
    },
  )
}
