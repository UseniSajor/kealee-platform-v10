/**
 * construction-engagement.routes.ts
 *
 * REST endpoints for the CONSTRUCTION_READY → engagement automation flow.
 *
 * Mount point: /marketplace  (registered alongside other marketplace routes)
 *
 * Endpoints:
 *   POST  /marketplace/projects/:projectId/construction-ready
 *       Mark project as CONSTRUCTION_READY (canonical gate).
 *       Validates PreConProject.phase >= BIDDING_OPEN before setting field.
 *
 *   GET   /marketplace/projects/:projectId/readiness
 *       Return Project.constructionReadiness + PreConPhase context.
 *
 *   GET   /marketplace/leads/:leadId/engagement
 *       Return engagement status: contract, milestones, escrow for a lead.
 *
 *   POST  /marketplace/leads/:leadId/engagement/initialize
 *       Manually (re-)trigger the engagement automation sequence.
 *       Used when auto-initialization partially failed in engageContractor().
 */

import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../auth/auth.middleware'
import { validateBody, validateParams } from '../../middleware/validation.middleware'
import { constructionEngagementService } from './construction-engagement.service'
import { sanitizeErrorMessage } from '../../utils/sanitize-error'

// ─── Schemas ─────────────────────────────────────────────────────────────────

const projectIdParamSchema = z.object({
  projectId: z.string().uuid(),
})

const leadIdParamSchema = z.object({
  leadId: z.string().uuid(),
})

const markReadyBodySchema = z.object({
  reason: z.string().max(500).optional(),
})

const projectCategorySchema = z.enum([
  'RESIDENTIAL',
  'COMMERCIAL',
  'MULTIFAMILY',
  'MIXED_USE',
])

const manualInitBodySchema = z.object({
  contractorUserId:  z.string().uuid(),
  ownerUserId:       z.string().uuid(),
  projectId:         z.string().uuid(),
  contractAmount:    z.number().positive(),
  profileId:         z.string().uuid(),
  /** Used to select the correct milestone template. */
  projectCategory:   projectCategorySchema.optional(),
})

// ─── Routes ──────────────────────────────────────────────────────────────────

export async function constructionEngagementRoutes(fastify: FastifyInstance) {

  /**
   * POST /projects/:projectId/construction-ready
   *
   * Canonically marks a project CONSTRUCTION_READY.
   * Validates PreConProject.phase >= BIDDING_OPEN before writing.
   *
   * Body: { reason? }
   *
   * After this is set, professional-assignment.service.ts will use the
   * canonical Project.constructionReadiness field instead of the
   * CONSTRUCTION_READY_PHASES Set fallback.
   */
  fastify.post(
    '/projects/:projectId/construction-ready',
    {
      preHandler: [
        authenticateUser,
        validateParams(projectIdParamSchema),
        validateBody(markReadyBodySchema),
      ],
    },
    async (request, reply) => {
      try {
        const user        = (request as any).user as { id: string }
        const { projectId } = request.params as { projectId: string }
        const { reason }    = request.body as z.infer<typeof markReadyBodySchema>

        const project = await constructionEngagementService.markConstructionReady({
          projectId,
          confirmedBy: user.id,
          reason,
        })

        return reply.send({
          success:               true,
          projectId,
          constructionReadiness: 'CONSTRUCTION_READY',
          project,
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(422).send({
          error: sanitizeErrorMessage(error, 'Cannot mark project as construction-ready'),
        })
      }
    }
  )

  /**
   * GET /projects/:projectId/readiness
   *
   * Returns construction readiness status with PreConPhase context.
   *
   * Response fields:
   *   constructionReadiness   — canonical field value
   *   preConPhase             — current PreConProject.phase (or null)
   *   isReady                 — true if constructionReadiness === CONSTRUCTION_READY
   *   proxyWouldPass          — true if PreConPhase fallback would also pass
   *   constructionReadinessUpdatedAt / ConfirmedBy — audit fields
   */
  fastify.get(
    '/projects/:projectId/readiness',
    {
      preHandler: [
        authenticateUser,
        validateParams(projectIdParamSchema),
      ],
    },
    async (request, reply) => {
      try {
        const { projectId } = request.params as { projectId: string }
        const status = await constructionEngagementService.getReadinessStatus(projectId)
        return reply.send(status)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(404).send({
          error: sanitizeErrorMessage(error, 'Project readiness status not found'),
        })
      }
    }
  )

  /**
   * GET /leads/:leadId/engagement
   *
   * Returns engagement status for a lead:
   *   - constructionReadiness on the linked project
   *   - Most recent ContractAgreement (with milestones + escrow)
   *
   * Used by owner and contractor portals to show engagement progress.
   */
  fastify.get(
    '/leads/:leadId/engagement',
    {
      preHandler: [
        authenticateUser,
        validateParams(leadIdParamSchema),
      ],
    },
    async (request, reply) => {
      try {
        const { leadId } = request.params as { leadId: string }
        const status = await constructionEngagementService.getEngagementStatus(leadId)
        return reply.send(status)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(404).send({
          error: sanitizeErrorMessage(error, 'Engagement status not found'),
        })
      }
    }
  )

  /**
   * POST /leads/:leadId/engagement/initialize
   *
   * Manually trigger (or retry) the engagement automation sequence.
   *
   * Use this when:
   *   - engageContractor() completed but auto-initialization partially failed
   *     (e.g. escrow creation failed due to a Stripe transient error)
   *   - The lead was awarded before the automation existed (backfill)
   *
   * Body: { contractorUserId, ownerUserId, projectId, contractAmount,
   *         profileId, projectCategory? }
   *
   * This endpoint is idempotent with respect to ContractAgreement creation
   * (it will create a new DRAFT contract on each call — callers are responsible
   * for not calling it twice on the same fully-initialized engagement).
   */
  fastify.post(
    '/leads/:leadId/engagement/initialize',
    {
      preHandler: [
        authenticateUser,
        validateParams(leadIdParamSchema),
        validateBody(manualInitBodySchema),
      ],
    },
    async (request, reply) => {
      try {
        const user     = (request as any).user as { id: string }
        const { leadId } = request.params as { leadId: string }
        const body       = request.body as z.infer<typeof manualInitBodySchema>

        const result = await constructionEngagementService.initializeEngagement({
          leadId,
          profileId:         body.profileId,
          contractorUserId:  body.contractorUserId,
          ownerUserId:       body.ownerUserId,
          projectId:         body.projectId,
          contractAmount:    body.contractAmount,
          projectCategory:   body.projectCategory,
          triggeredByUserId: user.id,
        })

        const statusCode = result.success ? 201 : 207 // 207 Multi-Status for partial success
        return reply.code(statusCode).send(result)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Engagement initialization failed'),
        })
      }
    }
  )

  /**
   * GET /engagement/milestone-templates/:category
   *
   * Preview the milestone payment schedule template for a given project category.
   * Useful for admin / owner review before contract finalization.
   */
  fastify.get(
    '/engagement/milestone-templates/:category',
    {
      preHandler: [authenticateUser],
    },
    async (request, reply) => {
      try {
        const { category } = request.params as { category: string }
        const validCategories = ['RESIDENTIAL', 'COMMERCIAL', 'MULTIFAMILY', 'MIXED_USE']

        if (!validCategories.includes(category.toUpperCase())) {
          return reply.code(400).send({
            error: `Invalid category. Must be one of: ${validCategories.join(', ')}`,
          })
        }

        const template = constructionEngagementService.getMilestoneTemplate(
          category.toUpperCase() as any
        )

        return reply.send({
          category: category.toUpperCase(),
          milestones: template,
          totalPct: template.reduce((sum, m) => sum + m.pct, 0),
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to fetch milestone template'),
        })
      }
    }
  )
}
