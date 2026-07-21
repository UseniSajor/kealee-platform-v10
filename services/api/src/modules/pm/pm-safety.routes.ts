import { FastifyInstance } from 'fastify'
import { safetyService } from './pm-safety.service'
import { authenticateUser } from '../auth/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../../middleware/validation.middleware'
import { z } from 'zod'

export async function pmSafetyRoutes(fastify: FastifyInstance) {
  // ── Incidents ──

  // GET /incidents - List incidents
  fastify.get(
    '/incidents',
    {
      preHandler: [
        authenticateUser,
        validateQuery(z.object({
          projectId: z.string().uuid().optional(),
          severity: z.enum(['NEAR_MISS', 'FIRST_AID', 'MEDICAL', 'LOST_TIME', 'FATALITY']).optional(),
          status: z.enum(['REPORTED', 'INVESTIGATING', 'CORRECTIVE_ACTION', 'CLOSED']).optional(),
          page: z.coerce.number().default(1),
          limit: z.coerce.number().default(25),
        })),
      ],
    },
    async (request, reply) => {
      const result = await safetyService.listIncidents(request.query as any)
      return reply.send(result)
    }
  )

  // GET /incidents/stats - Incident stats
  fastify.get(
    '/incidents/stats',
    {
      preHandler: [
        authenticateUser,
        validateQuery(z.object({ projectId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const { projectId } = request.query as { projectId: string }
      const stats = await safetyService.getIncidentStats(projectId)
      return reply.send({ stats })
    }
  )

  // GET /incidents/:id - Get incident
  fastify.get(
    '/incidents/:id',
    {
      preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() }))],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const incident = await safetyService.getIncidentById(id)
      if (!incident) return reply.code(404).send({ error: 'Incident not found' })
      return reply.send({ incident })
    }
  )

  // POST /incidents - Report incident
  fastify.post(
    '/incidents',
    {
      preHandler: [
        authenticateUser,
        validateBody(z.object({
          projectId: z.string().uuid(),
          title: z.string().min(1),
          description: z.string().min(1),
          date: z.string(),
          time: z.string().optional(),
          location: z.string().optional(),
          severity: z.enum(['NEAR_MISS', 'FIRST_AID', 'MEDICAL', 'LOST_TIME', 'FATALITY']).optional(),
          witnesses: z.array(z.string()).optional(),
          injuredParty: z.string().optional(),
          injuryDescription: z.string().optional(),
          immediateAction: z.string().optional(),
          photos: z.array(z.string()).optional(),
          oshaRecordable: z.boolean().optional(),
        })),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user
      const body = request.body as any
      const incident = await safetyService.createIncident({ ...body, reportedById: user.id })
      return reply.code(201).send({ incident })
    }
  )

  // PATCH /incidents/:id - Update incident
  fastify.patch(
    '/incidents/:id',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(z.object({
          title: z.string().min(1).optional(),
          description: z.string().optional(),
          date: z.string().optional(),
          time: z.string().optional(),
          location: z.string().optional(),
          severity: z.enum(['NEAR_MISS', 'FIRST_AID', 'MEDICAL', 'LOST_TIME', 'FATALITY']).optional(),
          witnesses: z.array(z.string()).optional(),
          injuredParty: z.string().optional(),
          injuryDescription: z.string().optional(),
          immediateAction: z.string().optional(),
          photos: z.array(z.string()).optional(),
          oshaRecordable: z.boolean().optional(),
          notifiedParties: z.array(z.string()).optional(),
        })),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const incident = await safetyService.updateIncident(id, request.body as any)
      return reply.send({ incident })
    }
  )

  // POST /incidents/:id/investigate - Add investigation
  fastify.post(
    '/incidents/:id/investigate',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(z.object({
          rootCause: z.string().min(1),
        })),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const body = request.body as any
      const incident = await safetyService.investigateIncident(id, body)
      return reply.send({ incident })
    }
  )

  // POST /incidents/:id/corrective-action - Log corrective action
  fastify.post(
    '/incidents/:id/corrective-action',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(z.object({
          correctiveAction: z.string().min(1),
          correctiveActionDueDate: z.string().optional(),
        })),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const body = request.body as any
      const incident = await safetyService.addCorrectiveAction(id, body)
      return reply.send({ incident })
    }
  )

  // POST /incidents/:id/close - Close incident
  fastify.post(
    '/incidents/:id/close',
    {
      preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() }))],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const incident = await safetyService.closeIncident(id)
      return reply.send({ incident })
    }
  )

  // ── Toolbox Talks ──

  // GET /toolbox-talks - List toolbox talks
  fastify.get(
    '/toolbox-talks',
    {
      preHandler: [
        authenticateUser,
        validateQuery(z.object({
          projectId: z.string().uuid().optional(),
          page: z.coerce.number().default(1),
          limit: z.coerce.number().default(25),
        })),
      ],
    },
    async (request, reply) => {
      const result = await safetyService.listToolboxTalks(request.query as any)
      return reply.send(result)
    }
  )

  // GET /toolbox-talks/:id - Get toolbox talk
  fastify.get(
    '/toolbox-talks/:id',
    {
      preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() }))],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const toolboxTalk = await safetyService.getToolboxTalkById(id)
      if (!toolboxTalk) return reply.code(404).send({ error: 'Toolbox talk not found' })
      return reply.send({ toolboxTalk })
    }
  )

  // POST /toolbox-talks - Create toolbox talk
  fastify.post(
    '/toolbox-talks',
    {
      preHandler: [
        authenticateUser,
        validateBody(z.object({
          projectId: z.string().uuid(),
          title: z.string().min(1),
          topic: z.string().min(1),
          content: z.string().optional(),
          presenterId: z.string().uuid().optional(),
          presenterName: z.string().optional(),
          date: z.string(),
          duration: z.number().optional(),
          weatherConditions: z.string().optional(),
        })),
      ],
    },
    async (request, reply) => {
      const body = request.body as any
      const toolboxTalk = await safetyService.createToolboxTalk(body)
      return reply.code(201).send({ toolboxTalk })
    }
  )

  // PATCH /toolbox-talks/:id - Update toolbox talk
  fastify.patch(
    '/toolbox-talks/:id',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(z.object({
          title: z.string().min(1).optional(),
          topic: z.string().optional(),
          content: z.string().optional(),
          presenterId: z.string().uuid().optional(),
          presenterName: z.string().optional(),
          date: z.string().optional(),
          duration: z.number().optional(),
          weatherConditions: z.string().optional(),
          signInSheetUrl: z.string().optional(),
        })),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const toolboxTalk = await safetyService.updateToolboxTalk(id, request.body as any)
      return reply.send({ toolboxTalk })
    }
  )

  // POST /toolbox-talks/:id/attendance - Record attendance
  fastify.post(
    '/toolbox-talks/:id/attendance',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(z.object({
          attendees: z.array(z.object({
            name: z.string().min(1),
            company: z.string().optional(),
            trade: z.string().optional(),
          })).min(1),
        })),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const { attendees } = request.body as any
      const result = await safetyService.recordAttendance(id, attendees)
      return reply.code(201).send({ attendees: result })
    }
  )

  // ── Dashboard ──

  // GET /dashboard - Safety dashboard
  fastify.get(
    '/dashboard',
    {
      preHandler: [
        authenticateUser,
        validateQuery(z.object({ projectId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const { projectId } = request.query as { projectId: string }
      const dashboard = await safetyService.getSafetyDashboard(projectId)
      return reply.send({ dashboard })
    }
  )
}
