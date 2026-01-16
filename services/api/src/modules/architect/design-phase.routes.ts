import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../auth/auth.middleware'
import { validateParams, validateBody } from '../../middleware/validation.middleware'
import { designPhaseService } from './design-phase.service'

const approvePhaseSchema = z.object({
  notes: z.string().optional(),
})

const completePhaseSchema = z.object({
  completionNotes: z.string().optional(),
  signOffDocumentUrl: z.string().url().optional(),
})

const updateDeliverablesSchema = z.object({
  deliverables: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']),
      completedAt: z.string().optional(),
    })
  ),
})

const updateTimelineSchema = z.object({
  plannedStartDate: z.string().datetime().optional(),
  plannedEndDate: z.string().datetime().optional(),
  estimatedDurationDays: z.number().int().positive().optional(),
})

export async function designPhaseRoutes(fastify: FastifyInstance) {
  // GET /architect/phases/:id - Get phase
  fastify.get(
    '/phases/:id',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const phase = await designPhaseService.getPhase(id)
        return reply.send({ phase })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(404).send({
          error: error.message || 'Phase not found',
        })
      }
    }
  )

  // POST /architect/phases/:id/start - Start phase
  fastify.post(
    '/phases/:id/start',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const phase = await designPhaseService.startPhase(id, user.id)
        return reply.send({ phase })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to start phase',
        })
      }
    }
  )

  // POST /architect/phases/:id/approve - Approve phase (phase gate)
  fastify.post(
    '/phases/:id/approve',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(approvePhaseSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof approvePhaseSchema>
        const phase = await designPhaseService.approvePhase(id, user.id, body.notes)
        return reply.send({ phase })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to approve phase',
        })
      }
    }
  )

  // POST /architect/phases/:id/complete - Complete phase
  fastify.post(
    '/phases/:id/complete',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(completePhaseSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof completePhaseSchema>
        const phase = await designPhaseService.completePhase(id, user.id, body)
        return reply.send({ phase })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to complete phase',
        })
      }
    }
  )

  // PATCH /architect/phases/:id/deliverables - Update deliverables checklist
  fastify.patch(
    '/phases/:id/deliverables',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(updateDeliverablesSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof updateDeliverablesSchema>
        const phase = await designPhaseService.updateDeliverablesChecklist(id, user.id, body.deliverables)
        return reply.send({ phase })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to update deliverables',
        })
      }
    }
  )

  // PATCH /architect/phases/:id/timeline - Update phase timeline
  fastify.patch(
    '/phases/:id/timeline',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(updateTimelineSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof updateTimelineSchema>
        const phase = await designPhaseService.updatePhaseTimeline(id, user.id, body)
        return reply.send({ phase })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to update timeline',
        })
      }
    }
  )

  // GET /architect/design-projects/:projectId/phases/timeline - Get phase timeline
  fastify.get(
    '/design-projects/:projectId/phases/timeline',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { projectId } = request.params as { projectId: string }
        const timeline = await designPhaseService.getPhaseTimeline(projectId)
        return reply.send({ timeline })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to get timeline',
        })
      }
    }
  )

  // GET /architect/design-projects/:projectId/phases/delays - Check for phase delays
  fastify.get(
    '/design-projects/:projectId/phases/delays',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { projectId } = request.params as { projectId: string }
        const delays = await designPhaseService.checkPhaseDelays(projectId)
        return reply.send({ delays })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to check delays',
        })
      }
    }
  )
}
