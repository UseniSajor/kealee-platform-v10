/**
 * Site Visit Routes
 *
 * Surfaces the visit schedule and completion workflow for PMs.
 *
 * Prefix: /api/v1/visits
 */

import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '@kealee/database'
import {
  authenticateUser,
  requirePM,
  type AuthenticatedRequest,
} from '../../middleware/auth.middleware'
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../middleware/validation.middleware'

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const pmIdParamsSchema = z.object({
  pmId: z.string().uuid(),
})

const visitIdParamsSchema = z.object({
  id: z.string().uuid(),
})

const scheduleQuerySchema = z.object({
  week: z.enum(['current', 'next', 'all']).default('current'),
})

const completeVisitBodySchema = z.object({
  notes: z.string().min(1),
  photos: z.array(z.string().url()).default([]),
  checklist: z.record(z.boolean()).default({}),
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getWeekRange(week: 'current' | 'next' | 'all'): { start: Date; end: Date } | null {
  if (week === 'all') return null

  const now = new Date()
  const dayOfWeek = now.getDay()
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek

  const start = new Date(now)
  start.setDate(now.getDate() + diffToMonday)
  start.setHours(0, 0, 0, 0)

  if (week === 'next') {
    start.setDate(start.getDate() + 7)
  }

  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)

  return { start, end }
}

// ---------------------------------------------------------------------------
// Route plugin
// ---------------------------------------------------------------------------

export async function visitRoutes(fastify: FastifyInstance) {
  // All routes require authentication + PM role
  fastify.addHook('onRequest', async (request, reply) => {
    await authenticateUser(request, reply)
    await requirePM(request, reply)
  })

  // -------------------------------------------------------------------------
  // GET /schedule/:pmId — upcoming visits for a PM
  // -------------------------------------------------------------------------
  fastify.get(
    '/schedule/:pmId',
    {
      preHandler: [
        validateParams(pmIdParamsSchema),
        validateQuery(scheduleQuerySchema),
      ],
    },
    async (request, reply) => {
      try {
        const { pmId } = request.params as z.infer<typeof pmIdParamsSchema>
        const { week } = request.query as z.infer<typeof scheduleQuerySchema>

        const where: any = {
          pmId,
          status: { in: ['SCHEDULED', 'IN_PROGRESS', 'RESCHEDULED'] },
        }

        const range = getWeekRange(week)
        if (range) {
          where.scheduledAt = {
            gte: range.start,
            lte: range.end,
          }
        }

        const visits = await prisma.siteVisit.findMany({
          where,
          orderBy: { scheduledAt: 'asc' },
          include: {
            project: {
              select: { id: true, name: true },
            },
          },
        })

        return reply.send({
          visits: visits.map((v) => ({
            id: v.id,
            projectId: v.projectId,
            projectName: v.project.name,
            pmId: v.pmId,
            type: v.type,
            status: v.status,
            priority: v.priority,
            scheduledAt: v.scheduledAt.toISOString(),
            estimatedDurationMinutes: v.estimatedDurationMinutes,
            address: v.address,
            purpose: v.purpose,
            clientName: v.clientName,
            clientEmail: v.clientEmail,
            clientPhone: v.clientPhone,
            calendarEventId: v.calendarEventId,
            createdAt: v.createdAt.toISOString(),
          })),
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to get visit schedule' })
      }
    },
  )

  // -------------------------------------------------------------------------
  // POST /:id/complete — mark a visit as completed
  // -------------------------------------------------------------------------
  fastify.post(
    '/:id/complete',
    {
      preHandler: [
        validateParams(visitIdParamsSchema),
        validateBody(completeVisitBodySchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as AuthenticatedRequest).user!
        const { id } = request.params as z.infer<typeof visitIdParamsSchema>
        const { notes, photos, checklist } = request.body as z.infer<typeof completeVisitBodySchema>

        const visit = await prisma.siteVisit.findUnique({ where: { id } })
        if (!visit) {
          return reply.code(404).send({ error: 'Site visit not found' })
        }

        if (visit.pmId !== user.id && user.role !== 'admin') {
          return reply.code(403).send({ error: 'Not assigned to this visit' })
        }

        if (visit.status === 'COMPLETED') {
          return reply.code(409).send({ error: 'Visit already completed' })
        }

        const now = new Date()
        const duration =
          visit.startedAt
            ? Math.round((now.getTime() - visit.startedAt.getTime()) / 60000)
            : null

        await prisma.siteVisit.update({
          where: { id },
          data: {
            status: 'COMPLETED',
            completedAt: now,
            notes,
            photos,
            checklistData: checklist,
            duration,
          },
        })

        return reply.send({ completed: true })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to complete visit' })
      }
    },
  )
}
