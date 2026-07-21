/**
 * contractor-leads.routes.ts
 *
 * Authenticated contractor-facing lead dashboard endpoints.
 * Registered at prefix /marketplace, so final paths are:
 *
 *   GET /marketplace/contractors/leads  — list own ProfessionalAssignment records
 *
 * The accept and decline actions re-use the existing routes in
 * professional-assignment.routes.ts:
 *   POST /marketplace/assignments/:assignmentId/accept
 *   POST /marketplace/assignments/:assignmentId/decline
 */

import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../../middleware/auth.middleware'
import { prismaAny } from '../../utils/prisma-helper'
import { sanitizeErrorMessage } from '../../utils/sanitize-error'

// ─── Query schema ─────────────────────────────────────────────────────────────

const leadsQuerySchema = z.object({
  /** Filter by tab: active | history | all (default: all) */
  tab:    z.enum(['active', 'history', 'all']).optional().default('all'),
  /** Cursor-based pagination — pass the last assignment's assignedAt as ISO string */
  cursor: z.string().optional(),
  limit:  z.coerce.number().int().min(1).max(100).optional().default(50),
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Map AssignmentStatus → display bucket */
function isActive(status: string): boolean {
  return status === 'PENDING' || status === 'ACCEPTED'
}

function buildLeadSummary(assignment: any) {
  const lead    = assignment.lead
  const project = lead?.project ?? null

  return {
    // Assignment
    assignmentId:    assignment.id,
    status:          assignment.status,
    professionalType: assignment.professionalType,
    sourceType:      assignment.sourceType,
    assignedAt:      assignment.assignedAt,
    acceptDeadline:  assignment.acceptDeadline,
    respondedAt:     assignment.respondedAt ?? null,
    forwardedAt:     assignment.forwardedAt ?? null,
    declineReason:   assignment.declineReason ?? null,
    adminOverride:   assignment.adminOverride ?? false,

    // Lead
    leadId:       lead?.id ?? null,
    category:     lead?.category ?? null,
    description:  lead?.description ?? null,
    location:     lead?.location ?? null,
    city:         lead?.city ?? null,
    state:        lead?.state ?? null,
    projectType:  lead?.projectType ?? null,
    sqft:         lead?.sqft ? Number(lead.sqft) : null,
    qualityTier:  lead?.qualityTier ?? null,
    estimatedValue: lead?.estimatedValue ? Number(lead.estimatedValue) : null,
    budget:         lead?.budget ? Number(lead.budget) : null,
    leadStage:      lead?.stage ?? null,

    // Project (may be null for standalone leads)
    projectId:    project?.id ?? null,
    projectName:  project?.name ?? null,
    projectCity:  project?.city ?? null,
    projectState: project?.state ?? null,
    constructionReadiness: project?.constructionReadiness ?? null,

    // Derived
    isActive: isActive(assignment.status),
    isExpired: assignment.status === 'EXPIRED' || (
      assignment.status === 'PENDING' &&
      new Date(assignment.acceptDeadline) < new Date()
    ),
  }
}

// ─── Route registration ───────────────────────────────────────────────────────

export async function contractorLeadsRoutes(fastify: FastifyInstance) {
  /**
   * GET /contractors/leads
   *
   * Returns all ProfessionalAssignment records for the authenticated contractor,
   * sorted: PENDING (by acceptDeadline ASC) → ACCEPTED → then history (by assignedAt DESC).
   *
   * Query params:
   *   tab    — active | history | all (default: all)
   *   cursor — ISO timestamp of last assignedAt for pagination
   *   limit  — default 50, max 100
   */
  fastify.get(
    '/contractors/leads',
    { preHandler: [authenticateUser] },
    async (request: any, reply) => {
      const userId = request.user.id

      const queryParse = leadsQuerySchema.safeParse(request.query)
      if (!queryParse.success) {
        return reply.code(400).send({
          error: queryParse.error.issues[0]?.message ?? 'Invalid query parameters',
        })
      }
      const { tab, cursor, limit } = queryParse.data

      try {
        // 1. Resolve MarketplaceProfile for this user
        const marketplace = await prismaAny.marketplaceProfile.findUnique({
          where: { userId },
        })

        if (!marketplace) {
          // No marketplace profile yet — return empty state, not 404
          return reply.send({
            assignments: [],
            counts: { pending: 0, accepted: 0, active: 0, history: 0, total: 0 },
            profileExists: false,
          })
        }

        // 2. Build status filter for the requested tab
        const statusFilter: string[] | undefined =
          tab === 'active'  ? ['PENDING', 'ACCEPTED'] :
          tab === 'history' ? ['DECLINED', 'EXPIRED', 'FORFEITED'] :
          undefined // 'all' — no filter

        // 3. Fetch assignments with lead + project included
        const rawAssignments = await prismaAny.professionalAssignment.findMany({
          where: {
            profileId: marketplace.id,
            ...(statusFilter ? { status: { in: statusFilter } } : {}),
            ...(cursor ? { assignedAt: { lt: new Date(cursor) } } : {}),
          },
          include: {
            lead: {
              include: {
                project: {
                  select: {
                    id:                   true,
                    name:                 true,
                    city:                 true,
                    state:                true,
                    constructionReadiness: true,
                  },
                },
              },
            },
          },
          orderBy: [
            // PENDING comes first, sorted by deadline (soonest first)
            { assignedAt: 'desc' },
          ],
          take: limit,
        })

        // 4. Sort: PENDING (deadline ASC) → ACCEPTED → history (assignedAt DESC)
        const sorted = [...rawAssignments].sort((a: any, b: any) => {
          const order: Record<string, number> = {
            PENDING:   0,
            ACCEPTED:  1,
            DECLINED:  2,
            EXPIRED:   3,
            FORFEITED: 4,
          }
          const oa = order[a.status] ?? 5
          const ob = order[b.status] ?? 5
          if (oa !== ob) return oa - ob
          // Within PENDING: sort by acceptDeadline ASC (soonest expires first)
          if (a.status === 'PENDING' && b.status === 'PENDING') {
            return new Date(a.acceptDeadline).getTime() - new Date(b.acceptDeadline).getTime()
          }
          // Within others: most recent first
          return new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime()
        })

        // 5. Counts (always computed from full set, not cursor-paginated)
        const allAssignments = cursor
          ? await prismaAny.professionalAssignment.findMany({
              where: { profileId: marketplace.id },
              select: { status: true },
            })
          : rawAssignments

        const counts = (allAssignments as any[]).reduce(
          (acc: Record<string, number>, a: any) => {
            acc[a.status] = (acc[a.status] ?? 0) + 1
            return acc
          },
          {} as Record<string, number>,
        )

        const pending   = counts['PENDING']   ?? 0
        const accepted  = counts['ACCEPTED']  ?? 0
        const declined  = counts['DECLINED']  ?? 0
        const expired   = counts['EXPIRED']   ?? 0
        const forfeited = counts['FORFEITED'] ?? 0

        return reply.send({
          assignments:   sorted.map(buildLeadSummary),
          counts: {
            pending,
            accepted,
            active:  pending + accepted,
            history: declined + expired + forfeited,
            total:   pending + accepted + declined + expired + forfeited,
          },
          profileExists: true,
          marketplaceProfileId: marketplace.id,
        })
      } catch (err: any) {
        fastify.log.error({ err, userId }, 'Failed to fetch contractor leads')
        return reply.code(500).send({
          error: sanitizeErrorMessage(err, 'Failed to load leads'),
        })
      }
    },
  )
}
