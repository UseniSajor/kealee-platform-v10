/**
 * QA Inspection Routes
 *
 * Surfaces QA inspection results for project members.
 *
 * Prefix: /api/v1/qa
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

const siteVisitIdParamsSchema = z.object({
  siteVisitId: z.string().uuid(),
})

const qaQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  after: z.string().uuid().optional(),
  reviewedOnly: z.coerce.boolean().optional(),
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

export async function qaRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('onRequest', async (request, reply) => {
    await authenticateUser(request, reply)
  })

  // -------------------------------------------------------------------------
  // GET /project/:projectId — QA results for a project
  // -------------------------------------------------------------------------
  fastify.get(
    '/project/:projectId',
    {
      preHandler: [
        validateParams(projectIdParamsSchema),
        validateQuery(qaQuerySchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as AuthenticatedRequest).user!
        const { projectId } = request.params as z.infer<typeof projectIdParamsSchema>
        const { limit, after, reviewedOnly } = request.query as z.infer<typeof qaQuerySchema>

        const isMember = await verifyProjectMembershipLocal(user.id, projectId, user.email, user.organizationId)
        if (!isMember && user.role !== 'admin') {
          return reply.code(403).send({ error: 'Not a member of this project' })
        }

        const where: any = { projectId }
        if (reviewedOnly) {
          where.reviewedByPm = true
        }

        const findArgs: any = {
          where,
          orderBy: { createdAt: 'desc' as const },
          take: limit + 1,
        }

        if (after) {
          findArgs.cursor = { id: after }
          findArgs.skip = 1
        }

        const rows = await prisma.qAInspectionResult.findMany(findArgs)
        const hasMore = rows.length > limit
        const results = hasMore ? rows.slice(0, limit) : rows
        const cursor = hasMore ? results[results.length - 1].id : null

        // Compute aggregate metrics
        const allResults = await prisma.qAInspectionResult.findMany({
          where: { projectId },
          select: { overallScore: true, issuesFound: true, reviewedByPm: true },
        })

        let scoreSum = 0
        let scoreCount = 0
        let openIssues = 0

        for (const r of allResults) {
          if (r.overallScore) {
            scoreSum += Number(r.overallScore)
            scoreCount++
          }
          if (r.issuesFound) {
            const issues = r.issuesFound as any[]
            if (Array.isArray(issues)) {
              openIssues += issues.filter((i: any) => i.status !== 'resolved').length
            }
          }
        }

        const avgScore = scoreCount > 0 ? Math.round((scoreSum / scoreCount) * 100) / 100 : null

        return reply.send({
          results: results.map((r) => ({
            id: r.id,
            projectId: r.projectId,
            siteVisitId: r.siteVisitId,
            photoUrl: r.photoUrl,
            analysisResult: r.analysisResult,
            issuesFound: r.issuesFound,
            overallScore: r.overallScore ? Number(r.overallScore) : null,
            reviewedByPm: r.reviewedByPm,
            createdAt: r.createdAt.toISOString(),
          })),
          avgScore,
          openIssues,
          cursor,
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to get QA results' })
      }
    },
  )

  // -------------------------------------------------------------------------
  // GET /visit/:siteVisitId — QA results for a specific site visit
  // -------------------------------------------------------------------------
  fastify.get(
    '/visit/:siteVisitId',
    {
      preHandler: [validateParams(siteVisitIdParamsSchema)],
    },
    async (request, reply) => {
      try {
        const user = (request as AuthenticatedRequest).user!
        const { siteVisitId } = request.params as z.infer<typeof siteVisitIdParamsSchema>

        // Look up the visit to verify project membership
        const visit = await prisma.siteVisit.findUnique({
          where: { id: siteVisitId },
          select: { projectId: true },
        })

        if (!visit) {
          return reply.code(404).send({ error: 'Site visit not found' })
        }

        const isMember = await verifyProjectMembershipLocal(user.id, visit.projectId, user.email, user.organizationId)
        if (!isMember && user.role !== 'admin') {
          return reply.code(403).send({ error: 'Not a member of this project' })
        }

        const results = await prisma.qAInspectionResult.findMany({
          where: { siteVisitId },
          orderBy: { createdAt: 'desc' },
        })

        return reply.send({
          results: results.map((r) => ({
            id: r.id,
            projectId: r.projectId,
            siteVisitId: r.siteVisitId,
            photoUrl: r.photoUrl,
            analysisResult: r.analysisResult,
            issuesFound: r.issuesFound,
            overallScore: r.overallScore ? Number(r.overallScore) : null,
            reviewedByPm: r.reviewedByPm,
            createdAt: r.createdAt.toISOString(),
          })),
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to get QA results for visit' })
      }
    },
  )
}
