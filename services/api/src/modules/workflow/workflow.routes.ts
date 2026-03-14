import { FastifyInstance } from 'fastify'
import { authenticateUser } from '../auth/auth.middleware'
import { requireAdmin } from '../../middleware/auth.middleware'
import { workflowService } from './workflow.service'
import { workflowStageService } from './workflow-stage.service'
import { workItemService } from './work-item.service'
import { workflowEventService } from './workflow-event.service'
import { z } from 'zod'
import { validateParams, validateQuery } from '../../middleware/validation.middleware'
import { sanitizeErrorMessage } from '../../utils/sanitize-error'

const subjectTypeSchema = z.enum([
  'PROJECT',
  'ENGAGEMENT',
  'PROFESSIONAL_ASSIGNMENT',
  'ORGANIZATION',
  'VERIFICATION_PROFILE',
])

const workflowPhaseSchema = z.enum(['INITIATION', 'PLANNING', 'EXECUTION', 'MONITORING', 'CLOSEOUT'])

export async function workflowRoutes(fastify: FastifyInstance) {
  // GET /workflow/status/:projectId - Get workflow status for a project
  fastify.get(
    '/status/:projectId',
    {
      preHandler: [authenticateUser, validateParams(z.object({ projectId: z.string().uuid() }))],
    },
    async (request, reply) => {
      try {
        const { projectId } = request.params as { projectId: string }
        const { phase } = request.query as { phase?: string }

        if (!phase || !workflowPhaseSchema.safeParse(phase).success) {
          return reply.code(400).send({
            error: 'Valid phase parameter required (INITIATION, PLANNING, EXECUTION, MONITORING, CLOSEOUT)',
          })
        }

        const status = await workflowService.getWorkflowStatus(projectId, phase as any)
        return reply.send({ status })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: sanitizeErrorMessage(error, 'Failed to get workflow status'),
        })
      }
    }
  )

  // GET /workflow/gate/:phase/:projectId - Check if a gate can be passed
  fastify.get(
    '/gate/:phase/:projectId',
    {
      preHandler: [
        authenticateUser,
        validateParams(
          z.object({
            phase: workflowPhaseSchema,
            projectId: z.string().uuid(),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const { phase, projectId } = request.params as { phase: string; projectId: string }
        const result = await workflowService.checkGate(phase as any, projectId)
        return reply.send(result)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: sanitizeErrorMessage(error, 'Failed to check gate'),
        })
      }
    }
  )

  // GET /workflow/can-advance/:projectId - Check if project can advance to a phase
  fastify.get(
    '/can-advance/:projectId',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
        validateQuery(z.object({ phase: workflowPhaseSchema })),
      ],
    },
    async (request, reply) => {
      try {
        const { projectId } = request.params as { projectId: string }
        const { phase } = request.query as { phase: string }
        const result = await workflowService.canAdvanceToPhase(projectId, phase as any)
        return reply.send(result)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: sanitizeErrorMessage(error, 'Failed to check phase advancement'),
        })
      }
    }
  )

  // GET /workflow/phases - Get all phase configurations
  fastify.get(
    '/phases',
    { preHandler: authenticateUser },
    async (request, reply) => {
      try {
        const phases = workflowService.getPhaseConfigs()
        return reply.send({ phases })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: sanitizeErrorMessage(error, 'Failed to get phase configurations'),
        })
      }
    }
  )
}

// ── Workflow Primitive Routes ──────────────────────────────────────────────────
//
// These endpoints expose the new lifecycle primitives (WorkflowStage, WorkItem,
// WorkflowEvent) added in the v20 workflow engine. They are additive — they do
// NOT replace the phase-gate routes above.
//
// Prefix: /workflow (same as workflowRoutes, registered together via re-export)

export async function workflowPrimitiveRoutes(fastify: FastifyInstance) {
  // ── Timeline ──────────────────────────────────────────────────────────────

  /**
   * GET /workflow/timeline/:subjectType/:subjectId
   *
   * Returns the append-only stage history for any subject (project, assignment,
   * organisation, etc.).  Useful for dashboards and audit panels.
   */
  fastify.get(
    '/timeline/:subjectType/:subjectId',
    {
      preHandler: [
        authenticateUser,
        validateParams(
          z.object({
            subjectType: subjectTypeSchema,
            subjectId:   z.string().min(1),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const { subjectType, subjectId } = request.params as {
          subjectType: string
          subjectId:   string
        }

        const [timeline, currentStage] = await Promise.all([
          workflowStageService.getTimeline(subjectType as any, subjectId),
          workflowStageService.getCurrentStage(subjectType as any, subjectId),
        ])

        return reply.send({ subjectType, subjectId, currentStage, timeline })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: sanitizeErrorMessage(error, 'Failed to load timeline'),
        })
      }
    }
  )

  // ── Work items ────────────────────────────────────────────────────────────

  /**
   * GET /workflow/work-items/mine
   *
   * Returns all OPEN work items assigned to the authenticated user.
   * Used by the portal dashboards to surface action items.
   */
  fastify.get(
    '/work-items/mine',
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const items = await workItemService.getOpenItemsForUser(user.id)
        return reply.send({ items, count: items.length })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: sanitizeErrorMessage(error, 'Failed to load work items'),
        })
      }
    }
  )

  /**
   * GET /workflow/work-items/subject/:subjectType/:subjectId
   *
   * Returns all OPEN work items attached to a specific subject (e.g. an
   * assignment or project).  Accessible to the owner of the subject or an admin.
   */
  fastify.get(
    '/work-items/subject/:subjectType/:subjectId',
    {
      preHandler: [
        authenticateUser,
        validateParams(
          z.object({
            subjectType: subjectTypeSchema,
            subjectId:   z.string().min(1),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const { subjectType, subjectId } = request.params as {
          subjectType: string
          subjectId:   string
        }
        const items = await workItemService.getOpenItemsForSubject(
          subjectType as any,
          subjectId
        )
        return reply.send({ subjectType, subjectId, items, count: items.length })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: sanitizeErrorMessage(error, 'Failed to load work items for subject'),
        })
      }
    }
  )

  /**
   * GET /workflow/work-items/org/:orgId
   *
   * Returns all OPEN work items assigned to an organisation (e.g. pending
   * verification reviews visible to org admins).
   */
  fastify.get(
    '/work-items/org/:orgId',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ orgId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { orgId } = request.params as { orgId: string }
        const items = await workItemService.getOpenItemsForOrg(orgId)
        return reply.send({ orgId, items, count: items.length })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: sanitizeErrorMessage(error, 'Failed to load org work items'),
        })
      }
    }
  )

  /**
   * GET /workflow/admin/work-items
   *
   * Admin view: all OPEN work items, optionally filtered by type.
   * Query: ?type=VERIFICATION_REVIEW|ASSIGNMENT_ACCEPTANCE|...
   */
  fastify.get(
    '/admin/work-items',
    {
      preHandler: [
        authenticateUser,
        requireAdmin,
        validateQuery(
          z.object({
            type:  z.string().optional(),
            limit: z.coerce.number().int().min(1).max(200).optional().default(50),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const { type, limit } = request.query as { type?: string; limit: number }
        const items = await workItemService.getAdminQueue({ type: type as any, limit })
        return reply.send({ items, count: items.length })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: sanitizeErrorMessage(error, 'Failed to load admin work-item queue'),
        })
      }
    }
  )

  // ── Events (audit log) ────────────────────────────────────────────────────

  /**
   * GET /workflow/events/:subjectType/:subjectId
   *
   * Returns the idempotent event log for a subject.
   * Sorted by createdAt DESC.  Accessible to admins and subject owners.
   */
  fastify.get(
    '/events/:subjectType/:subjectId',
    {
      preHandler: [
        authenticateUser,
        validateParams(
          z.object({
            subjectType: subjectTypeSchema,
            subjectId:   z.string().min(1),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const { subjectType, subjectId } = request.params as {
          subjectType: string
          subjectId:   string
        }
        const events = await workflowEventService.getEventsForSubject(
          subjectType as any,
          subjectId
        )
        return reply.send({ subjectType, subjectId, events, count: events.length })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: sanitizeErrorMessage(error, 'Failed to load workflow events'),
        })
      }
    }
  )
}
