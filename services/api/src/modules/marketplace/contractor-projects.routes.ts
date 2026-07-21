/**
 * contractor-projects.routes.ts
 *
 * Authenticated contractor-facing endpoint.
 * Registered at prefix /marketplace, final path:
 *
 *   GET /marketplace/contractors/projects
 *
 * Returns the contractor's active and historical project engagements,
 * derived from ACCEPTED ProfessionalAssignment records that have a
 * linked Project.  Includes ContractAgreement data when present.
 */

import { FastifyInstance } from 'fastify'
import { authenticateUser } from '../../middleware/auth.middleware'
import { prismaAny } from '../../utils/prisma-helper'
import { sanitizeErrorMessage } from '../../utils/sanitize-error'

// ─── Response builder ─────────────────────────────────────────────────────────

function buildProjectSummary(assignment: any) {
  const lead     = assignment.lead       ?? null
  const project  = lead?.project         ?? null
  const contract = assignment.contract   ?? null

  const lifecyclePhase: string = project?.currentPhase ?? project?.phase ?? 'CONSTRUCTION'

  return {
    // Assignment metadata
    assignmentId:    assignment.id,
    assignmentStatus: assignment.status,
    respondedAt:     assignment.respondedAt ?? null,

    // Project identifiers
    projectId:    project?.id   ?? null,
    leadId:       lead?.id      ?? null,

    // Project descriptors
    projectName:  project?.name ?? lead?.description ?? 'Unnamed Project',
    projectType:  lead?.projectType ?? project?.projectType ?? null,
    description:  lead?.description ?? null,

    // Location
    address:   project?.address  ?? null,
    city:      project?.city     ?? lead?.city  ?? null,
    state:     project?.state    ?? lead?.state ?? null,

    // Financials
    contractId:     contract?.id     ?? null,
    contractAmount: contract?.amount  ? Number(contract.amount)  : null,
    contractStatus: contract?.status ?? null,

    // Project phase / progress
    lifecyclePhase,
    constructionReadiness: project?.constructionReadiness ?? null,

    // Specialties
    csiDivisions: lead?.csiDivisions ?? [],

    // Timestamps
    startDate:   contract?.startDate ?? assignment.respondedAt ?? null,
    assignedAt:  assignment.assignedAt,
  }
}

// ─── Route registration ───────────────────────────────────────────────────────

export async function contractorProjectsRoutes(fastify: FastifyInstance) {
  /**
   * GET /contractors/projects
   *
   * Returns ACCEPTED ProfessionalAssignment records for the authenticated
   * contractor that have an associated Project.
   *
   * Query params:
   *   status  — active | completed | all (default: all)
   *   limit   — default 50, max 100
   */
  fastify.get(
    '/contractors/projects',
    { preHandler: [authenticateUser] },
    async (request: any, reply) => {
      const userId = request.user?.userId ?? request.user?.id
      if (!userId) return reply.status(401).send({ error: 'Unauthorized' })

      const { status = 'all', limit = '50' } = request.query as Record<string, string>
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50))

      try {
        // 1. Find this contractor's MarketplaceProfile
        const profile = await prismaAny.marketplaceProfile.findFirst({
          where: {
            userId,
            professionalType: { in: ['CONTRACTOR', 'DESIGN_BUILD'] },
          },
          select: { id: true },
        })

        if (!profile) {
          return reply.send({ projects: [], total: 0 })
        }

        // 2. Build status filter
        let statusFilter: string[]
        if (status === 'active')    statusFilter = ['ACCEPTED']
        else if (status === 'completed') statusFilter = ['COMPLETED', 'CLOSED', 'DECLINED']
        else                        statusFilter = ['ACCEPTED', 'COMPLETED', 'CLOSED', 'DECLINED']

        // 3. Query assignments with lead → project
        const assignments = await prismaAny.professionalAssignment.findMany({
          where: {
            profileId: profile.id,
            status:    { in: statusFilter },
            lead: {
              projectId: { not: null },
            },
          },
          take: limitNum,
          orderBy: { assignedAt: 'desc' },
          include: {
            lead: {
              include: {
                project: {
                  select: {
                    id: true,
                    name: true,
                    address: true,
                    city: true,
                    state: true,
                    projectType: true,
                    currentPhase: true,
                    constructionReadiness: true,
                  },
                },
              },
            },
            // ContractAgreement if one exists for this assignment
            contract: {
              select: {
                id: true,
                amount: true,
                status: true,
                startDate: true,
              },
            },
          },
        })

        const projects = assignments.map(buildProjectSummary)

        return reply.send({ projects, total: projects.length })
      } catch (err: unknown) {
        fastify.log.error(err, 'contractorProjectsRoutes: GET /contractors/projects failed')
        return reply.status(500).send({ error: sanitizeErrorMessage(err) })
      }
    },
  )
}
