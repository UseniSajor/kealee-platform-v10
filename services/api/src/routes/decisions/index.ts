/**
 * Decision Support Routes
 *
 * Surfaces the DecisionQueue to PMs and clients.
 * PM/ADMIN can view the queue and resolve decisions.
 * Project members can view client-facing decisions and history.
 *
 * Prefix: /api/v1/decisions
 */

import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '@kealee/database'
import {
  authenticateUser,
  requirePM,
  type AuthenticatedRequest,
} from '../../middleware/auth.middleware'
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../middleware/validation.middleware'

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const pmIdParamsSchema = z.object({
  pmId: z.string().uuid(),
})

const userIdParamsSchema = z.object({
  userId: z.string().uuid(),
})

const decisionIdParamsSchema = z.object({
  id: z.string().uuid(),
})

const projectIdParamsSchema = z.object({
  projectId: z.string().uuid(),
})

const resolveBodySchema = z.object({
  decision: z.enum(['approved', 'rejected', 'deferred']),
  reasoning: z.string().optional(),
})

const historyQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  after: z.string().uuid().optional(),
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function verifyProjectMembership(
  userId: string,
  projectId: string,
): Promise<boolean> {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { ownerId: userId },
        { members: { some: { userId } } },
      ],
    },
    select: { id: true },
  })
  return !!project
}

// ---------------------------------------------------------------------------
// Route plugin
// ---------------------------------------------------------------------------

export async function decisionRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('onRequest', async (request, reply) => {
    await authenticateUser(request, reply)
  })

  // -------------------------------------------------------------------------
  // GET /queue/:pmId — pending decisions for a PM (PM/ADMIN only)
  // -------------------------------------------------------------------------
  fastify.get(
    '/queue/:pmId',
    {
      preHandler: [
        validateParams(pmIdParamsSchema),
        requirePM,
      ],
    },
    async (request, reply) => {
      try {
        const { pmId } = request.params as z.infer<typeof pmIdParamsSchema>

        const decisions = await prisma.decisionQueue.findMany({
          where: { pmId, decision: null },
          orderBy: { createdAt: 'desc' },
        })

        return reply.send({
          decisions: decisions.map((d) => ({
            id: d.id,
            projectId: d.projectId,
            pmId: d.pmId,
            type: d.type,
            title: d.title,
            context: d.context,
            aiRecommendation: d.aiRecommendation,
            aiConfidence: d.aiConfidence ? Number(d.aiConfidence) : null,
            options: d.options,
            createdAt: d.createdAt.toISOString(),
          })),
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to get pending decisions' })
      }
    },
  )

  // -------------------------------------------------------------------------
  // GET /client/:userId — client-facing decisions (payment approvals only)
  // -------------------------------------------------------------------------
  fastify.get(
    '/client/:userId',
    {
      preHandler: [validateParams(userIdParamsSchema)],
    },
    async (request, reply) => {
      try {
        const user = (request as AuthenticatedRequest).user!
        const { userId } = request.params as z.infer<typeof userIdParamsSchema>

        // Users can only view their own client decisions unless PM/admin
        if (user.id !== userId && user.role !== 'pm' && user.role !== 'admin') {
          return reply.code(403).send({ error: 'Insufficient permissions' })
        }

        // Get projects owned by or involving this user
        const userProjects = await prisma.project.findMany({
          where: {
            OR: [
              { ownerId: userId },
              { members: { some: { userId } } },
            ],
          },
          select: { id: true },
        })

        const projectIds = userProjects.map((p) => p.id)

        const decisions = await prisma.decisionQueue.findMany({
          where: {
            projectId: { in: projectIds },
            type: 'payment_release',
          },
          orderBy: { createdAt: 'desc' },
        })

        return reply.send({
          decisions: decisions.map((d) => ({
            id: d.id,
            projectId: d.projectId,
            type: d.type,
            title: d.title,
            context: d.context,
            options: d.options,
            decision: d.decision,
            decidedAt: d.decidedAt?.toISOString() ?? null,
            reasoning: d.reasoning,
            createdAt: d.createdAt.toISOString(),
          })),
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to get client decisions' })
      }
    },
  )

  // -------------------------------------------------------------------------
  // POST /:id/resolve — resolve a decision (PM/ADMIN only)
  // -------------------------------------------------------------------------
  fastify.post(
    '/:id/resolve',
    {
      preHandler: [
        validateParams(decisionIdParamsSchema),
        validateBody(resolveBodySchema),
        requirePM,
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as AuthenticatedRequest).user!
        const { id } = request.params as z.infer<typeof decisionIdParamsSchema>
        const { decision, reasoning } = request.body as z.infer<typeof resolveBodySchema>

        const existing = await prisma.decisionQueue.findUnique({ where: { id } })
        if (!existing) {
          return reply.code(404).send({ error: 'Decision not found' })
        }
        if (existing.decision) {
          return reply.code(409).send({ error: 'Decision already resolved' })
        }

        const resolved = await prisma.decisionQueue.update({
          where: { id },
          data: {
            decision,
            decidedAt: new Date(),
            decidedBy: user.id,
            reasoning: reasoning ?? null,
          },
        })

        // Determine follow-up actions based on decision type and outcome
        const followUpActions: string[] = []
        if (decision === 'approved') {
          switch (resolved.type) {
            case 'bid_award':
              followUpActions.push('generate_contract', 'notify_contractor')
              break
            case 'change_order':
              followUpActions.push('update_budget', 'update_schedule')
              break
            case 'payment_release':
              followUpActions.push('process_payment', 'notify_client')
              break
            case 'schedule_change':
              followUpActions.push('update_schedule', 'notify_team')
              break
          }
        } else if (decision === 'rejected') {
          followUpActions.push('notify_requester')
        } else {
          followUpActions.push('schedule_followup')
        }

        return reply.send({
          resolved: true,
          followUpActions,
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to resolve decision' })
      }
    },
  )

  // -------------------------------------------------------------------------
  // GET /history/:projectId — decision history for a project
  // -------------------------------------------------------------------------
  fastify.get(
    '/history/:projectId',
    {
      preHandler: [
        validateParams(projectIdParamsSchema),
        validateQuery(historyQuerySchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as AuthenticatedRequest).user!
        const { projectId } = request.params as z.infer<typeof projectIdParamsSchema>
        const { limit, after } = request.query as z.infer<typeof historyQuerySchema>

        // Verify project membership
        const isMember = await verifyProjectMembership(user.id, projectId)
        if (!isMember && user.role !== 'admin') {
          return reply.code(403).send({ error: 'Not a member of this project' })
        }

        const findArgs: any = {
          where: {
            projectId,
            decision: { not: null },
          },
          orderBy: { decidedAt: 'desc' as const },
          take: limit + 1,
        }

        if (after) {
          findArgs.cursor = { id: after }
          findArgs.skip = 1
        }

        const rows = await prisma.decisionQueue.findMany(findArgs)
        const hasMore = rows.length > limit
        const decisions = hasMore ? rows.slice(0, limit) : rows
        const cursor = hasMore ? decisions[decisions.length - 1].id : null

        return reply.send({
          decisions: decisions.map((d) => ({
            id: d.id,
            type: d.type,
            title: d.title,
            context: d.context,
            aiRecommendation: d.aiRecommendation,
            aiConfidence: d.aiConfidence ? Number(d.aiConfidence) : null,
            decision: d.decision,
            decidedAt: d.decidedAt?.toISOString() ?? null,
            decidedBy: d.decidedBy,
            reasoning: d.reasoning,
            createdAt: d.createdAt.toISOString(),
          })),
          cursor,
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to get decision history' })
      }
    },
  )
}
