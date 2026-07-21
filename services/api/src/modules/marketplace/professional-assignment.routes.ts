/**
 * professional-assignment.routes.ts
 *
 * REST endpoints for the Kealee rotating professional lead assignment system.
 *
 * Mount point (configured in the parent router):
 *   /marketplace
 *
 * Endpoints added here:
 *   POST  /marketplace/leads/:leadId/route              – Trigger lead routing
 *   POST  /marketplace/assignments/:assignmentId/accept – Accept assignment
 *   POST  /marketplace/assignments/:assignmentId/decline – Decline assignment
 *   GET   /marketplace/assignments/:assignmentId        – Fetch single assignment
 *   GET   /marketplace/leads/:leadId/assignments        – List all offers for a lead
 *   GET   /marketplace/queue/:professionalType          – Admin: view rotation queue
 *   POST  /marketplace/queue/register                   – Register / update queue entry
 *   POST  /marketplace/contractors/engage               – Engage a contractor (CONSTRUCTION_READY gate)
 */

import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../auth/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../../middleware/validation.middleware'
import { professionalAssignmentService } from './professional-assignment.service'
import { sanitizeErrorMessage } from '../../utils/sanitize-error'

// ─── Schemas ─────────────────────────────────────────────────────────────────

const professionalTypeSchema = z.enum(['ARCHITECT', 'ENGINEER', 'CONTRACTOR', 'DESIGN_BUILD'])
const sourceTypeSchema        = z.enum(['SPONSORED_AD', 'PLATFORM_SERVICE', 'OWNER_INVITED'])

const routeLeadBodySchema = z.object({
  professionalType:  professionalTypeSchema,
  sourceType:        sourceTypeSchema,
  /** Required when sourceType = OWNER_INVITED or SPONSORED_AD */
  invitedProfileId:  z.string().uuid().optional(),
})

const declineBodySchema = z.object({
  reason: z.string().max(500).optional(),
})

const registerQueueEntryBodySchema = z.object({
  profileId:          z.string().uuid(),
  professionalType:   professionalTypeSchema,
  softwareAccessOnly: z.boolean().optional(),
  licenseVerified:    z.boolean().optional(),
  insuranceVerified:  z.boolean().optional(),
})

const engageContractorBodySchema = z.object({
  leadId:    z.string().uuid(),
  profileId: z.string().uuid(),
})

const assignmentIdParamSchema = z.object({
  assignmentId: z.string().uuid(),
})

const leadIdParamSchema = z.object({
  leadId: z.string().uuid(),
})

const professionalTypeParamSchema = z.object({
  professionalType: professionalTypeSchema,
})

// ─── Routes ──────────────────────────────────────────────────────────────────

export async function professionalAssignmentRoutes(fastify: FastifyInstance) {

  /**
   * POST /leads/:leadId/route
   *
   * Trigger lead routing.  Determines path from sourceType:
   *   SPONSORED_AD     → direct to invitedProfileId
   *   PLATFORM_SERVICE → next in rotating queue
   *   OWNER_INVITED    → direct to invitedProfileId (must be registered in Kealee)
   *
   * Body: { professionalType, sourceType, invitedProfileId? }
   */
  fastify.post(
    '/leads/:leadId/route',
    {
      preHandler: [
        authenticateUser,
        validateParams(leadIdParamSchema),
        validateBody(routeLeadBodySchema),
      ],
    },
    async (request, reply) => {
      try {
        const user     = (request as any).user as { id: string }
        const { leadId } = request.params as { leadId: string }
        const body     = request.body as z.infer<typeof routeLeadBodySchema>

        const result = await professionalAssignmentService.routeLead({
          leadId,
          professionalType:  body.professionalType,
          sourceType:        body.sourceType,
          invitedProfileId:  body.invitedProfileId,
          triggeredByUserId: user.id,
        })

        if (!result.success) {
          return reply.code(409).send({ error: result.reason, message: result.message })
        }

        return reply.code(201).send({ success: true, assignment: result.assignment })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: sanitizeErrorMessage(error, 'Failed to route lead') })
      }
    }
  )

  /**
   * POST /assignments/:assignmentId/accept
   *
   * Professional accepts their lead offer within the 48-hour window.
   * Updates the lead to DISTRIBUTED stage.
   */
  fastify.post(
    '/assignments/:assignmentId/accept',
    {
      preHandler: [
        authenticateUser,
        validateParams(assignmentIdParamSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user           = (request as any).user as { id: string }
        const { assignmentId } = request.params as { assignmentId: string }

        const assignment = await professionalAssignmentService.acceptAssignment(assignmentId, user.id)
        return reply.send({ success: true, assignment })
      } catch (error: any) {
        fastify.log.error(error)
        const isNotFound = error?.message?.includes('not found')
        return reply.code(isNotFound ? 404 : 400).send({
          error: sanitizeErrorMessage(error, 'Failed to accept assignment'),
        })
      }
    }
  )

  /**
   * POST /assignments/:assignmentId/decline
   *
   * Professional declines their lead offer.
   * Lead is automatically forwarded to the next professional in the rotation queue.
   *
   * Body: { reason? }
   */
  fastify.post(
    '/assignments/:assignmentId/decline',
    {
      preHandler: [
        authenticateUser,
        validateParams(assignmentIdParamSchema),
        validateBody(declineBodySchema),
      ],
    },
    async (request, reply) => {
      try {
        const user           = (request as any).user as { id: string }
        const { assignmentId } = request.params as { assignmentId: string }
        const { reason }       = request.body as z.infer<typeof declineBodySchema>

        const result = await professionalAssignmentService.declineAssignment(
          assignmentId, user.id, reason
        )

        return reply.send({
          success:         true,
          message:         'Assignment declined.  Lead forwarded to next in queue.',
          nextAssignment:  result.assignment ?? null,
          nextRouteResult: result,
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: sanitizeErrorMessage(error, 'Failed to decline assignment') })
      }
    }
  )

  /**
   * GET /assignments/:assignmentId
   *
   * Fetch a single assignment (for the professional or an admin).
   */
  fastify.get(
    '/assignments/:assignmentId',
    {
      preHandler: [
        authenticateUser,
        validateParams(assignmentIdParamSchema),
      ],
    },
    async (request, reply) => {
      try {
        const { assignmentId } = request.params as { assignmentId: string }
        const assignment = await professionalAssignmentService.getAssignment(assignmentId)
        return reply.send({ assignment })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(404).send({ error: sanitizeErrorMessage(error, 'Assignment not found') })
      }
    }
  )

  /**
   * GET /leads/:leadId/assignments
   *
   * List all assignment attempts for a lead (admin / owner view).
   * Shows the full rotation history: who was offered, when, and what happened.
   */
  fastify.get(
    '/leads/:leadId/assignments',
    {
      preHandler: [
        authenticateUser,
        validateParams(leadIdParamSchema),
      ],
    },
    async (request, reply) => {
      try {
        const { leadId } = request.params as { leadId: string }
        const assignments = await professionalAssignmentService.listAssignmentsForLead(leadId)
        return reply.send({ assignments })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: sanitizeErrorMessage(error, 'Failed to list assignments') })
      }
    }
  )

  /**
   * GET /queue/:professionalType
   *
   * Admin view: snapshot of the rotation queue for a given professional type.
   * Shows queue order (by lastAssignedAt ASC NULLS FIRST), eligibility, and stats.
   */
  fastify.get(
    '/queue/:professionalType',
    {
      preHandler: [
        authenticateUser,
        validateParams(professionalTypeParamSchema),
      ],
    },
    async (request, reply) => {
      try {
        const { professionalType } = request.params as {
          professionalType: 'ARCHITECT' | 'ENGINEER' | 'CONTRACTOR' | 'DESIGN_BUILD'
        }
        const queue = await professionalAssignmentService.getQueueSnapshot(professionalType)
        return reply.send({ professionalType, queue, count: queue.length })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: sanitizeErrorMessage(error, 'Failed to fetch queue') })
      }
    }
  )

  /**
   * POST /queue/register
   *
   * Register or update a professional's RotationQueueEntry.
   * Called on onboarding completion or after admin verifies license/insurance.
   *
   * Body: { profileId, professionalType, softwareAccessOnly?, licenseVerified?, insuranceVerified? }
   *
   * PM/Ops professionals:  pass softwareAccessOnly = true  → no license required, not in lead rotation
   * Lead-eligible pros:    licenseVerified = true + insuranceVerified = true → ELIGIBLE status
   */
  fastify.post(
    '/queue/register',
    {
      preHandler: [
        authenticateUser,
        validateBody(registerQueueEntryBodySchema),
      ],
    },
    async (request, reply) => {
      try {
        const body = request.body as z.infer<typeof registerQueueEntryBodySchema>

        const entry = await professionalAssignmentService.upsertQueueEntry({
          profileId:          body.profileId,
          professionalType:   body.professionalType,
          softwareAccessOnly: body.softwareAccessOnly,
          licenseVerified:    body.licenseVerified,
          insuranceVerified:  body.insuranceVerified,
        })

        return reply.code(201).send({ success: true, entry })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: sanitizeErrorMessage(error, 'Failed to register queue entry') })
      }
    }
  )

  /**
   * POST /contractors/engage
   *
   * Formally engage a contractor on a project.
   * Enforces business rules 7–9:
   *   - Contractor must have an ACCEPTED assignment on this lead
   *   - Contractor must have verified license + insurance
   *   - PreConProject.phase must be in CONSTRUCTION_READY_PHASES
   *     (BIDDING_OPEN | AWARDED | CONTRACT_PENDING | CONTRACT_RATIFIED)
   *
   * Body: { leadId, profileId }
   */
  fastify.post(
    '/contractors/engage',
    {
      preHandler: [
        authenticateUser,
        validateBody(engageContractorBodySchema),
      ],
    },
    async (request, reply) => {
      try {
        const user   = (request as any).user as { id: string }
        const body   = request.body as z.infer<typeof engageContractorBodySchema>

        const result = await professionalAssignmentService.engageContractor({
          leadId:    body.leadId,
          profileId: body.profileId,
          userId:    user.id,
        })

        return reply.send({ success: true, lead: result })
      } catch (error: any) {
        fastify.log.error(error)
        const isNotFound = error?.message?.includes('not found')
        return reply.code(isNotFound ? 404 : 422).send({
          error: sanitizeErrorMessage(error, 'Cannot engage contractor'),
        })
      }
    }
  )
}
