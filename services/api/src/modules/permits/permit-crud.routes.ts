/**
 * Permit CRUD Routes
 * Basic permit management endpoints: list, get, update, delete, submit, withdraw,
 * comments, inspections, and dashboard.
 */

import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../auth/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../../middleware/validation.middleware'
import { prismaAny } from '../../utils/prisma-helper'
import { sanitizeErrorMessage } from '../../utils/sanitize-error'

// ── Validation Schemas ──────────────────────────────────────────────────────

const permitListQuerySchema = z.object({
  status: z.string().optional(),
  jurisdictionId: z.string().optional(),
  permitType: z.string().optional(),
  projectId: z.string().optional(),
  applicantId: z.string().optional(),
  search: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

const idParamSchema = z.object({ id: z.string() })

const updatePermitSchema = z.object({
  status: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  scope: z.string().optional(),
  valuation: z.number().positive().optional(),
  squareFootage: z.number().int().positive().optional(),
  expedited: z.boolean().optional(),
})

const withdrawSchema = z.object({
  reason: z.string().min(1, 'Withdrawal reason is required'),
})

const addCommentSchema = z.object({
  message: z.string().min(1, 'Comment message is required'),
})

const scheduleInspectionSchema = z.object({
  inspectionType: z.string().min(1),
  description: z.string().optional(),
  scheduledDate: z.string().min(1, 'Scheduled date is required'),
  preferredTime: z.string().optional(),
  notes: z.string().optional(),
})

// ── Route Registration ──────────────────────────────────────────────────────

export async function permitCrudRoutes(fastify: FastifyInstance) {

  // ────────────────────────────────────────────────────────────────────────
  // GET /permits/dashboard  (must be registered BEFORE /:id to avoid clash)
  // ────────────────────────────────────────────────────────────────────────
  fastify.get(
    '/dashboard',
    {
      preHandler: [authenticateUser],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }

        // Counts by status
        const permits = await prismaAny.permit.findMany({
          where: {
            OR: [
              { applicantId: user.id },
              { clientId: user.id },
              { pmUserId: user.id },
            ],
          },
          select: {
            id: true,
            permitNumber: true,
            permitType: true,
            status: true,
            kealeeStatus: true,
            address: true,
            applicantName: true,
            createdAt: true,
            updatedAt: true,
            submittedAt: true,
            approvedAt: true,
            expiresAt: true,
          },
          orderBy: { updatedAt: 'desc' },
        })

        // Aggregate counts by status
        const statusCounts: Record<string, number> = {}
        for (const p of permits) {
          const s = p.kealeeStatus || p.status || 'UNKNOWN'
          statusCounts[s] = (statusCounts[s] || 0) + 1
        }

        // Recent permits (last 10)
        const recentPermits = permits.slice(0, 10)

        // Upcoming inspections
        const upcomingInspections = await prismaAny.inspection.findMany({
          where: {
            permit: {
              OR: [
                { applicantId: user.id },
                { clientId: user.id },
                { pmUserId: user.id },
              ],
            },
            scheduledDate: { gte: new Date() },
            result: null, // Not yet completed
          },
          include: {
            permit: {
              select: {
                id: true,
                permitNumber: true,
                address: true,
              },
            },
          },
          orderBy: { scheduledDate: 'asc' },
          take: 10,
        })

        return reply.send({
          statusCounts,
          totalPermits: permits.length,
          recentPermits,
          upcomingInspections,
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: sanitizeErrorMessage(error, 'Failed to load dashboard data'),
        })
      }
    }
  )

  // ────────────────────────────────────────────────────────────────────────
  // 1. GET /permits - List all permits for current user
  // ────────────────────────────────────────────────────────────────────────
  fastify.get(
    '/',
    {
      preHandler: [authenticateUser, validateQuery(permitListQuerySchema)],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const query = request.query as z.infer<typeof permitListQuerySchema>

        const where: any = {
          OR: [
            { applicantId: user.id },
            { clientId: user.id },
            { pmUserId: user.id },
          ],
        }

        if (query.status) {
          where.kealeeStatus = query.status
        }
        if (query.jurisdictionId) {
          where.jurisdictionId = query.jurisdictionId
        }
        if (query.permitType) {
          where.permitType = query.permitType
        }
        if (query.projectId) {
          where.projectId = query.projectId
        }
        if (query.applicantId) {
          where.applicantId = query.applicantId
        }
        if (query.search) {
          where.OR = [
            { permitNumber: { contains: query.search, mode: 'insensitive' } },
            { address: { contains: query.search, mode: 'insensitive' } },
            { applicantName: { contains: query.search, mode: 'insensitive' } },
            { scope: { contains: query.search, mode: 'insensitive' } },
          ]
        }
        if (query.startDate) {
          where.createdAt = { ...(where.createdAt || {}), gte: new Date(query.startDate) }
        }
        if (query.endDate) {
          where.createdAt = { ...(where.createdAt || {}), lte: new Date(query.endDate) }
        }

        const skip = (query.page - 1) * query.limit

        const [permits, total] = await Promise.all([
          prismaAny.permit.findMany({
            where,
            include: {
              jurisdiction: {
                select: { id: true, name: true, state: true, county: true },
              },
            },
            orderBy: { updatedAt: 'desc' },
            skip,
            take: query.limit,
          }),
          prismaAny.permit.count({ where }),
        ])

        return reply.send({
          permits,
          pagination: {
            page: query.page,
            limit: query.limit,
            total,
            totalPages: Math.ceil(total / query.limit),
          },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: sanitizeErrorMessage(error, 'Failed to list permits'),
        })
      }
    }
  )

  // ────────────────────────────────────────────────────────────────────────
  // 2. GET /permits/:id - Get single permit with relations
  // ────────────────────────────────────────────────────────────────────────
  fastify.get(
    '/:id',
    {
      preHandler: [authenticateUser, validateParams(idParamSchema)],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }

        const permit = await prismaAny.permit.findFirst({
          where: {
            id,
            OR: [
              { applicantId: user.id },
              { clientId: user.id },
              { pmUserId: user.id },
            ],
          },
          include: {
            jurisdiction: true,
            submissions: { orderBy: { submittedAt: 'desc' } },
            corrections: { orderBy: { receivedAt: 'desc' } },
            inspections: { orderBy: { requestedDate: 'desc' } },
            events: { orderBy: { occurredAt: 'desc' }, take: 50 },
            activities: { orderBy: { createdAt: 'desc' }, take: 50 },
            aiReviews: { orderBy: { reviewedAt: 'desc' }, take: 5 },
            reviewAssignments: true,
          },
        })

        if (!permit) {
          return reply.code(404).send({ error: 'Permit not found' })
        }

        return reply.send({ permit })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: sanitizeErrorMessage(error, 'Failed to get permit'),
        })
      }
    }
  )

  // ────────────────────────────────────────────────────────────────────────
  // 3. PATCH /permits/:id - Update permit
  // ────────────────────────────────────────────────────────────────────────
  fastify.patch(
    '/:id',
    {
      preHandler: [
        authenticateUser,
        validateParams(idParamSchema),
        validateBody(updatePermitSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const updates = request.body as z.infer<typeof updatePermitSchema>

        // Verify permit exists and user has access
        const existing = await prismaAny.permit.findFirst({
          where: {
            id,
            OR: [
              { applicantId: user.id },
              { clientId: user.id },
              { pmUserId: user.id },
            ],
          },
        })

        if (!existing) {
          return reply.code(404).send({ error: 'Permit not found' })
        }

        // Build update data, mapping status -> kealeeStatus
        const data: any = {}
        if (updates.status !== undefined) {
          data.kealeeStatus = updates.status
          data.status = updates.status
        }
        if (updates.scope !== undefined) data.scope = updates.scope
        if (updates.valuation !== undefined) data.valuation = updates.valuation
        if (updates.squareFootage !== undefined) data.squareFootage = updates.squareFootage
        if (updates.expedited !== undefined) data.expedited = updates.expedited
        if (updates.notes !== undefined) {
          // Store notes in an event record
          await prismaAny.permitEvent.create({
            data: {
              permitId: id,
              userId: user.id,
              eventType: 'NOTE_ADDED',
              description: updates.notes,
              source: 'USER',
            },
          })
        }

        const permit = await prismaAny.permit.update({
          where: { id },
          data,
        })

        return reply.send({ permit })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to update permit'),
        })
      }
    }
  )

  // ────────────────────────────────────────────────────────────────────────
  // 4. DELETE /permits/:id - Soft delete (set status to CANCELLED)
  // ────────────────────────────────────────────────────────────────────────
  fastify.delete(
    '/:id',
    {
      preHandler: [authenticateUser, validateParams(idParamSchema)],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }

        const existing = await prismaAny.permit.findFirst({
          where: {
            id,
            OR: [
              { applicantId: user.id },
              { clientId: user.id },
              { pmUserId: user.id },
            ],
          },
        })

        if (!existing) {
          return reply.code(404).send({ error: 'Permit not found' })
        }

        // Soft delete — mark as CANCELLED
        const permit = await prismaAny.permit.update({
          where: { id },
          data: {
            status: 'CANCELLED',
            kealeeStatus: 'CANCELLED',
          },
        })

        // Log the event
        await prismaAny.permitEvent.create({
          data: {
            permitId: id,
            userId: user.id,
            eventType: 'STATUS_CHANGE',
            description: 'Permit withdrawn / deleted by user',
            metadata: { previousStatus: existing.kealeeStatus },
            source: 'USER',
          },
        })

        return reply.send({ permit, message: 'Permit withdrawn successfully' })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to delete permit'),
        })
      }
    }
  )

  // ────────────────────────────────────────────────────────────────────────
  // 5. POST /permits/:id/submit - Submit permit for review
  // ────────────────────────────────────────────────────────────────────────
  fastify.post(
    '/:id/submit',
    {
      preHandler: [authenticateUser, validateParams(idParamSchema)],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }

        const existing = await prismaAny.permit.findFirst({
          where: {
            id,
            OR: [
              { applicantId: user.id },
              { clientId: user.id },
              { pmUserId: user.id },
            ],
          },
        })

        if (!existing) {
          return reply.code(404).send({ error: 'Permit not found' })
        }

        if (existing.kealeeStatus !== 'DRAFT' && existing.kealeeStatus !== 'READY_TO_SUBMIT') {
          return reply.code(400).send({
            error: `Cannot submit permit with status ${existing.kealeeStatus}. Must be DRAFT or READY_TO_SUBMIT.`,
          })
        }

        const permit = await prismaAny.permit.update({
          where: { id },
          data: {
            status: 'SUBMITTED',
            kealeeStatus: 'SUBMITTED',
            submittedAt: new Date(),
          },
        })

        // Log the submission event
        await prismaAny.permitEvent.create({
          data: {
            permitId: id,
            userId: user.id,
            eventType: 'STATUS_CHANGE',
            description: 'Permit submitted for review',
            metadata: { previousStatus: existing.kealeeStatus, newStatus: 'SUBMITTED' },
            source: 'USER',
          },
        })

        return reply.send({ permit, message: 'Permit submitted successfully' })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to submit permit'),
        })
      }
    }
  )

  // ────────────────────────────────────────────────────────────────────────
  // 6. POST /permits/:id/withdraw - Withdraw permit
  // ────────────────────────────────────────────────────────────────────────
  fastify.post(
    '/:id/withdraw',
    {
      preHandler: [
        authenticateUser,
        validateParams(idParamSchema),
        validateBody(withdrawSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const { reason } = request.body as z.infer<typeof withdrawSchema>

        const existing = await prismaAny.permit.findFirst({
          where: {
            id,
            OR: [
              { applicantId: user.id },
              { clientId: user.id },
              { pmUserId: user.id },
            ],
          },
        })

        if (!existing) {
          return reply.code(404).send({ error: 'Permit not found' })
        }

        const permit = await prismaAny.permit.update({
          where: { id },
          data: {
            status: 'CANCELLED',
            kealeeStatus: 'CANCELLED',
          },
        })

        // Log the withdrawal
        await prismaAny.permitEvent.create({
          data: {
            permitId: id,
            userId: user.id,
            eventType: 'STATUS_CHANGE',
            description: `Permit withdrawn: ${reason}`,
            metadata: {
              previousStatus: existing.kealeeStatus,
              newStatus: 'CANCELLED',
              reason,
            },
            source: 'USER',
          },
        })

        return reply.send({ permit, message: 'Permit withdrawn successfully' })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to withdraw permit'),
        })
      }
    }
  )

  // ────────────────────────────────────────────────────────────────────────
  // 7. GET /permits/:id/comments - Get permit comments (via PermitActivity)
  // ────────────────────────────────────────────────────────────────────────
  fastify.get(
    '/:id/comments',
    {
      preHandler: [authenticateUser, validateParams(idParamSchema)],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }

        // Verify access
        const permit = await prismaAny.permit.findFirst({
          where: {
            id,
            OR: [
              { applicantId: user.id },
              { clientId: user.id },
              { pmUserId: user.id },
            ],
          },
          select: { id: true },
        })

        if (!permit) {
          return reply.code(404).send({ error: 'Permit not found' })
        }

        // Comments are stored as PermitActivity records with action = 'COMMENT'
        // and also PermitEvent records with eventType = 'COMMENT' or 'NOTE_ADDED'
        const [activities, events] = await Promise.all([
          prismaAny.permitActivity.findMany({
            where: {
              permitId: id,
              action: { in: ['COMMENT', 'COMMENTS_RECEIVED'] },
            },
            orderBy: { createdAt: 'desc' },
          }),
          prismaAny.permitEvent.findMany({
            where: {
              permitId: id,
              eventType: { in: ['COMMENT', 'NOTE_ADDED'] },
            },
            orderBy: { occurredAt: 'desc' },
          }),
        ])

        // Merge and sort
        const comments = [
          ...activities.map((a: any) => ({
            id: a.id,
            permitId: a.permitId,
            userId: null,
            message: a.description || '',
            type: a.action,
            metadata: a.metadata,
            createdAt: a.createdAt,
            source: 'activity',
          })),
          ...events.map((e: any) => ({
            id: e.id,
            permitId: e.permitId,
            userId: e.userId,
            message: e.description || '',
            type: e.eventType,
            metadata: e.metadata,
            createdAt: e.occurredAt,
            source: 'event',
          })),
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

        return reply.send({ comments })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: sanitizeErrorMessage(error, 'Failed to get comments'),
        })
      }
    }
  )

  // ────────────────────────────────────────────────────────────────────────
  // 8. POST /permits/:id/comments - Add comment
  // ────────────────────────────────────────────────────────────────────────
  fastify.post(
    '/:id/comments',
    {
      preHandler: [
        authenticateUser,
        validateParams(idParamSchema),
        validateBody(addCommentSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string; email?: string }
        const { id } = request.params as { id: string }
        const { message } = request.body as z.infer<typeof addCommentSchema>

        // Verify access
        const permit = await prismaAny.permit.findFirst({
          where: {
            id,
            OR: [
              { applicantId: user.id },
              { clientId: user.id },
              { pmUserId: user.id },
            ],
          },
          select: { id: true },
        })

        if (!permit) {
          return reply.code(404).send({ error: 'Permit not found' })
        }

        // Store as PermitEvent (has userId field)
        const comment = await prismaAny.permitEvent.create({
          data: {
            permitId: id,
            userId: user.id,
            eventType: 'COMMENT',
            description: message,
            source: 'USER',
          },
        })

        // Also log as PermitActivity for Command Center compatibility
        await prismaAny.permitActivity.create({
          data: {
            permitId: id,
            action: 'COMMENT',
            type: 'COMMENT',
            description: message,
            metadata: { userId: user.id },
          },
        })

        return reply.code(201).send({ comment })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to add comment'),
        })
      }
    }
  )

  // ────────────────────────────────────────────────────────────────────────
  // 9. GET /permits/:id/inspections - List inspections for permit
  // ────────────────────────────────────────────────────────────────────────
  fastify.get(
    '/:id/inspections',
    {
      preHandler: [authenticateUser, validateParams(idParamSchema)],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }

        // Verify access
        const permit = await prismaAny.permit.findFirst({
          where: {
            id,
            OR: [
              { applicantId: user.id },
              { clientId: user.id },
              { pmUserId: user.id },
            ],
          },
          select: { id: true, projectId: true, jurisdictionId: true },
        })

        if (!permit) {
          return reply.code(404).send({ error: 'Permit not found' })
        }

        const inspections = await prismaAny.inspection.findMany({
          where: { permitId: id },
          include: {
            preparationItems: true,
            findings: true,
          },
          orderBy: { requestedDate: 'desc' },
        })

        return reply.send({ inspections })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: sanitizeErrorMessage(error, 'Failed to list inspections'),
        })
      }
    }
  )

  // ────────────────────────────────────────────────────────────────────────
  // 10. POST /permits/:id/inspections - Schedule inspection
  // ────────────────────────────────────────────────────────────────────────
  fastify.post(
    '/:id/inspections',
    {
      preHandler: [
        authenticateUser,
        validateParams(idParamSchema),
        validateBody(scheduleInspectionSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof scheduleInspectionSchema>

        // Verify access and get permit details
        const permit = await prismaAny.permit.findFirst({
          where: {
            id,
            OR: [
              { applicantId: user.id },
              { clientId: user.id },
              { pmUserId: user.id },
            ],
          },
          select: { id: true, projectId: true, jurisdictionId: true },
        })

        if (!permit) {
          return reply.code(404).send({ error: 'Permit not found' })
        }

        const inspection = await prismaAny.inspection.create({
          data: {
            permitId: id,
            projectId: permit.projectId,
            jurisdictionId: permit.jurisdictionId,
            inspectionType: body.inspectionType,
            description: body.description || null,
            requestedDate: new Date(body.scheduledDate),
            requestedBy: user.id,
            scheduledDate: new Date(body.scheduledDate),
            scheduledWindow: body.preferredTime || null,
            notes: body.notes || null,
          },
        })

        // Log the event
        await prismaAny.permitEvent.create({
          data: {
            permitId: id,
            userId: user.id,
            eventType: 'INSPECTION_SCHEDULED',
            description: `Inspection scheduled: ${body.inspectionType} on ${body.scheduledDate}`,
            metadata: {
              inspectionId: inspection.id,
              inspectionType: body.inspectionType,
              scheduledDate: body.scheduledDate,
            },
            source: 'USER',
          },
        })

        return reply.code(201).send({ inspection })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to schedule inspection'),
        })
      }
    }
  )
}
