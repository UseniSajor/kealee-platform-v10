/**
 * Budget Routes
 *
 * Surfaces budget snapshots and transaction data to project members.
 *
 * Prefix: /api/v1/budget
 */

import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '@kealee/database'
import {
  authenticateUser,
  type AuthenticatedRequest,
} from '../../middleware/auth.middleware'
import { validateParams, validateQuery } from '../../middleware/validation.middleware'

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const projectIdParamsSchema = z.object({
  projectId: z.string().uuid(),
})

const budgetQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

const historyQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  after: z.string().uuid().optional(),
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

export async function budgetRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('onRequest', async (request, reply) => {
    await authenticateUser(request, reply)
  })

  // -------------------------------------------------------------------------
  // GET /project/:projectId — latest snapshot + recent transactions + alerts
  // -------------------------------------------------------------------------
  fastify.get(
    '/project/:projectId',
    {
      preHandler: [
        validateParams(projectIdParamsSchema),
        validateQuery(budgetQuerySchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as AuthenticatedRequest).user!
        const { projectId } = request.params as z.infer<typeof projectIdParamsSchema>
        const { limit } = request.query as z.infer<typeof budgetQuerySchema>

        const isMember = await verifyProjectMembershipLocal(user.id, projectId, user.email, user.organizationId)
        if (!isMember && user.role !== 'admin') {
          return reply.code(403).send({ error: 'Not a member of this project' })
        }

        // Latest budget snapshot
        const snapshot = await prisma.budgetSnapshot.findFirst({
          where: { projectId },
          orderBy: { snapshotDate: 'desc' },
        })

        // Recent transactions (from automation events that are budget-related)
        const transactions = await prisma.automationEvent.findMany({
          where: {
            projectId,
            sourceApp: 'APP-07', // Budget Tracker
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
        })

        // Generate alerts from snapshot data
        const alerts: Array<{ type: string; message: string; severity: 'info' | 'warning' | 'critical' }> = []

        if (snapshot) {
          const variancePercent =
            Number(snapshot.totalBudget) > 0
              ? (Number(snapshot.totalVariance) / Number(snapshot.totalBudget)) * 100
              : 0

          if (variancePercent < -10) {
            alerts.push({
              type: 'over_budget',
              message: `Project is ${Math.abs(variancePercent).toFixed(1)}% over budget`,
              severity: 'critical',
            })
          } else if (variancePercent < -5) {
            alerts.push({
              type: 'budget_warning',
              message: `Project is ${Math.abs(variancePercent).toFixed(1)}% over budget`,
              severity: 'warning',
            })
          }

          const committed = Number(snapshot.totalCommitted)
          const budget = Number(snapshot.totalBudget)
          if (budget > 0 && committed / budget > 0.9) {
            alerts.push({
              type: 'high_commitment',
              message: `${((committed / budget) * 100).toFixed(0)}% of budget is committed`,
              severity: 'warning',
            })
          }

          if (snapshot.forecast) {
            const forecast = Number(snapshot.forecast)
            if (forecast > budget * 1.1) {
              alerts.push({
                type: 'forecast_overrun',
                message: `Forecasted cost $${forecast.toLocaleString()} exceeds budget by ${(((forecast - budget) / budget) * 100).toFixed(1)}%`,
                severity: 'warning',
              })
            }
          }
        }

        return reply.send({
          snapshot: snapshot
            ? {
                id: snapshot.id,
                projectId: snapshot.projectId,
                snapshotDate: snapshot.snapshotDate.toISOString(),
                totalBudget: Number(snapshot.totalBudget),
                totalCommitted: Number(snapshot.totalCommitted),
                totalActual: Number(snapshot.totalActual),
                totalVariance: Number(snapshot.totalVariance),
                percentComplete: Number(snapshot.percentComplete),
                forecast: snapshot.forecast ? Number(snapshot.forecast) : null,
                categories: snapshot.categories,
                notes: snapshot.notes,
                createdAt: snapshot.createdAt.toISOString(),
              }
            : null,
          transactions: transactions.map((t) => ({
            id: t.id,
            eventType: t.eventType,
            payload: t.payload,
            createdAt: t.createdAt.toISOString(),
          })),
          alerts,
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to get budget data' })
      }
    },
  )

  // -------------------------------------------------------------------------
  // GET /project/:projectId/history — all budget snapshots for charting
  // -------------------------------------------------------------------------
  fastify.get(
    '/project/:projectId/history',
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

        const isMember = await verifyProjectMembershipLocal(user.id, projectId, user.email, user.organizationId)
        if (!isMember && user.role !== 'admin') {
          return reply.code(403).send({ error: 'Not a member of this project' })
        }

        const findArgs: any = {
          where: { projectId },
          orderBy: { snapshotDate: 'asc' as const },
          take: limit + 1,
        }

        if (after) {
          findArgs.cursor = { id: after }
          findArgs.skip = 1
        }

        const rows = await prisma.budgetSnapshot.findMany(findArgs)
        const hasMore = rows.length > limit
        const snapshots = hasMore ? rows.slice(0, limit) : rows
        const cursor = hasMore ? snapshots[snapshots.length - 1].id : null

        return reply.send({
          snapshots: snapshots.map((s) => ({
            id: s.id,
            snapshotDate: s.snapshotDate.toISOString(),
            totalBudget: Number(s.totalBudget),
            totalCommitted: Number(s.totalCommitted),
            totalActual: Number(s.totalActual),
            totalVariance: Number(s.totalVariance),
            percentComplete: Number(s.percentComplete),
            forecast: s.forecast ? Number(s.forecast) : null,
            categories: s.categories,
            notes: s.notes,
            createdAt: s.createdAt.toISOString(),
          })),
          cursor,
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to get budget history' })
      }
    },
  )
}
