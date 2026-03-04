/**
 * Report Generation Routes (Command Center)
 *
 * Queue-based report generation and weekly report history.
 *
 * Prefix: /api/v1/reports
 */

import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '@kealee/database'
import { Queue } from 'bullmq'
import Redis from 'ioredis'
import {
  authenticateUser,
  type AuthenticatedRequest,
} from '../../middleware/auth.middleware'
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../middleware/validation.middleware'
import { sanitizeErrorMessage } from '../../utils/sanitize-error'

// ---------------------------------------------------------------------------
// Queue infrastructure (matches automation package queue names)
// ---------------------------------------------------------------------------

function getQueue(): Queue {
  const connection = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  })
  return new Queue('report-generator', {
    connection: connection as any,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: { count: 1000 },
      removeOnFail: { count: 5000 },
    },
  })
}

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const projectIdParamsSchema = z.object({
  projectId: z.string().uuid(),
})

const generateBodySchema = z.object({
  type: z.enum(['weekly', 'milestone', 'closeout']),
})

const reportQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
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

export async function ccReportRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('onRequest', async (request, reply) => {
    await authenticateUser(request, reply)
  })

  // -------------------------------------------------------------------------
  // POST /generate/:projectId — queue a report generation job
  // -------------------------------------------------------------------------
  fastify.post(
    '/generate/:projectId',
    {
      preHandler: [
        validateParams(projectIdParamsSchema),
        validateBody(generateBodySchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as AuthenticatedRequest).user!
        const { projectId } = request.params as z.infer<typeof projectIdParamsSchema>
        const { type } = request.body as z.infer<typeof generateBodySchema>

        const isMember = await verifyProjectMembershipLocal(user.id, projectId, user.email, user.organizationId)
        if (!isMember && user.role !== 'admin') {
          return reply.code(403).send({ error: 'Not a member of this project' })
        }

        const queue = getQueue()
        const job = await queue.add(`generate-${type}`, {
          projectId,
          reportType: type,
          requestedBy: user.id,
          requestedAt: new Date().toISOString(),
        })
        await queue.close()

        return reply.code(201).send({
          jobId: job.id,
          status: 'queued',
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to queue report') })
      }
    },
  )

  // -------------------------------------------------------------------------
  // GET /project/:projectId — weekly reports for a project
  // -------------------------------------------------------------------------
  fastify.get(
    '/project/:projectId',
    {
      preHandler: [
        validateParams(projectIdParamsSchema),
        validateQuery(reportQuerySchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as AuthenticatedRequest).user!
        const { projectId } = request.params as z.infer<typeof projectIdParamsSchema>
        const { limit, after } = request.query as z.infer<typeof reportQuerySchema>

        const isMember = await verifyProjectMembershipLocal(user.id, projectId, user.email, user.organizationId)
        if (!isMember && user.role !== 'admin') {
          return reply.code(403).send({ error: 'Not a member of this project' })
        }

        const findArgs: any = {
          where: { projectId },
          orderBy: { weekEnd: 'desc' as const },
          take: limit + 1,
        }

        if (after) {
          findArgs.cursor = { id: after }
          findArgs.skip = 1
        }

        const rows = await prisma.weeklyReport.findMany(findArgs)
        const hasMore = rows.length > limit
        const reports = hasMore ? rows.slice(0, limit) : rows
        const cursor = hasMore ? reports[reports.length - 1].id : null

        return reply.send({
          reports: reports.map((r) => ({
            id: r.id,
            projectId: r.projectId,
            weekStart: r.weekStart.toISOString(),
            weekEnd: r.weekEnd.toISOString(),
            summary: r.summary,
            metrics: r.metrics,
            risks: r.risks,
            photos: r.photos,
            fileUrl: r.fileUrl,
            sentToClient: r.sentToClient,
            createdAt: r.createdAt.toISOString(),
          })),
          cursor,
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to get reports') })
      }
    },
  )
}
