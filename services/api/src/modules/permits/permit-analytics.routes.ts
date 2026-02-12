/**
 * Permit Analytics Routes
 * Read/write for JurisdictionUsageMetrics, JurisdictionIntegrationLog,
 * JurisdictionAnalytics, PermitCorrection, PermitEvent, ReviewAssignment,
 * InspectionAssignment, RoutingRule, AIReviewResult
 */

import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../../middleware/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../../middleware/validation.middleware'
import { prisma } from '@kealee/database'

// ---------------------------------------------------------------------------
// Zod Schemas
// ---------------------------------------------------------------------------

const paginationQuery = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
})

const correctionCreateSchema = z.object({
  permitId: z.string().uuid(),
  source: z.string().min(1),
  rawText: z.string().min(1),
  parsedIssues: z.any(),
  affectedSheets: z.array(z.string()).optional(),
  severity: z.enum(['MINOR', 'MAJOR', 'CRITICAL']),
  discipline: z.string().optional(),
  assignedTo: z.string().min(1),
  assignedUserId: z.string().uuid().optional(),
  dueDate: z.string().datetime(),
})

const reviewAssignmentCreateSchema = z.object({
  permitId: z.string().uuid(),
  reviewerId: z.string().uuid(),
  jurisdictionId: z.string().uuid(),
  discipline: z.string().min(1),
  priority: z.enum(['STANDARD', 'EXPEDITED', 'URGENT']).optional(),
  estimatedDuration: z.number().int().optional(),
  assignedBy: z.string().min(1),
  dueDate: z.string().datetime(),
})

const inspectionAssignmentCreateSchema = z.object({
  inspectionId: z.string().uuid(),
  inspectorId: z.string().uuid(),
  jurisdictionId: z.string().uuid(),
  scheduledDate: z.string().datetime(),
  timeSlot: z.string().min(1),
  estimatedDuration: z.number().int().min(1),
  routeOrder: z.number().int().optional(),
  travelTime: z.number().int().optional(),
  siteAddress: z.string().min(1),
  siteCoordinates: z.any().optional(),
})

const routingRuleCreateSchema = z.object({
  jurisdictionId: z.string().uuid(),
  ruleName: z.string().min(1),
  ruleDescription: z.string().optional(),
  conditions: z.any(),
  requiredDisciplines: z.array(z.string()),
  optionalDisciplines: z.array(z.string()).optional(),
  routingOrder: z.any().optional(),
  priority: z.number().int().optional(),
  isActive: z.boolean().optional(),
})

const routingRuleUpdateSchema = routingRuleCreateSchema.partial()

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export async function permitAnalyticsRoutes(fastify: FastifyInstance) {
  // Apply auth to all routes
  fastify.addHook('onRequest', async (request, reply) => {
    await authenticateUser(request, reply)
  })

  // ========================================================================
  // JURISDICTION USAGE METRICS
  // ========================================================================

  // GET /usage-metrics - List usage metrics
  fastify.get(
    '/usage-metrics',
    {
      preHandler: [
        validateQuery(
          z.object({
            page: z.string().optional(),
            limit: z.string().optional(),
            jurisdictionId: z.string().uuid().optional(),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const query = request.query as { page?: string; limit?: string; jurisdictionId?: string }
        const page = Math.max(1, parseInt(query.page || '1', 10))
        const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)))
        const skip = (page - 1) * limit

        const where: any = {}
        if (query.jurisdictionId) where.jurisdictionId = query.jurisdictionId

        const [metrics, total] = await Promise.all([
          (prisma as any).jurisdictionUsageMetrics.findMany({
            where,
            skip,
            take: limit,
            orderBy: [{ year: 'desc' }, { month: 'desc' }],
          }),
          (prisma as any).jurisdictionUsageMetrics.count({ where }),
        ])

        return reply.send({
          data: metrics,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to list usage metrics' })
      }
    }
  )

  // ========================================================================
  // INTEGRATION LOGS
  // ========================================================================

  // GET /integration-logs - List integration logs
  fastify.get(
    '/integration-logs',
    {
      preHandler: [
        validateQuery(
          z.object({
            page: z.string().optional(),
            limit: z.string().optional(),
            jurisdictionId: z.string().uuid().optional(),
            success: z.string().optional(),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const query = request.query as {
          page?: string; limit?: string; jurisdictionId?: string; success?: string
        }
        const page = Math.max(1, parseInt(query.page || '1', 10))
        const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)))
        const skip = (page - 1) * limit

        const where: any = {}
        if (query.jurisdictionId) where.jurisdictionId = query.jurisdictionId
        if (query.success !== undefined) where.success = query.success === 'true'

        const [logs, total] = await Promise.all([
          (prisma as any).jurisdictionIntegrationLog.findMany({
            where,
            skip,
            take: limit,
            orderBy: { executedAt: 'desc' },
          }),
          (prisma as any).jurisdictionIntegrationLog.count({ where }),
        ])

        return reply.send({
          data: logs,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to list integration logs' })
      }
    }
  )

  // ========================================================================
  // JURISDICTION ANALYTICS
  // ========================================================================

  // GET /analytics - Jurisdiction analytics
  fastify.get(
    '/analytics',
    {
      preHandler: [
        validateQuery(
          z.object({
            page: z.string().optional(),
            limit: z.string().optional(),
            jurisdictionId: z.string().uuid().optional(),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const query = request.query as { page?: string; limit?: string; jurisdictionId?: string }
        const page = Math.max(1, parseInt(query.page || '1', 10))
        const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)))
        const skip = (page - 1) * limit

        const where: any = {}
        if (query.jurisdictionId) where.jurisdictionId = query.jurisdictionId

        const [analytics, total] = await Promise.all([
          (prisma as any).jurisdictionAnalytics.findMany({
            where,
            skip,
            take: limit,
            orderBy: { periodStart: 'desc' },
          }),
          (prisma as any).jurisdictionAnalytics.count({ where }),
        ])

        return reply.send({
          data: analytics,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to list analytics' })
      }
    }
  )

  // ========================================================================
  // PERMIT CORRECTIONS
  // ========================================================================

  // GET /corrections - List permit corrections
  fastify.get(
    '/corrections',
    {
      preHandler: [
        validateQuery(
          z.object({
            page: z.string().optional(),
            limit: z.string().optional(),
            permitId: z.string().uuid().optional(),
            status: z.string().optional(),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const query = request.query as {
          page?: string; limit?: string; permitId?: string; status?: string
        }
        const page = Math.max(1, parseInt(query.page || '1', 10))
        const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)))
        const skip = (page - 1) * limit

        const where: any = {}
        if (query.permitId) where.permitId = query.permitId
        if (query.status) where.status = query.status

        const [corrections, total] = await Promise.all([
          (prisma as any).permitCorrection.findMany({
            where,
            skip,
            take: limit,
            orderBy: { receivedAt: 'desc' },
          }),
          (prisma as any).permitCorrection.count({ where }),
        ])

        return reply.send({
          data: corrections,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to list corrections' })
      }
    }
  )

  // POST /corrections - Create permit correction
  fastify.post(
    '/corrections',
    {
      preHandler: [validateBody(correctionCreateSchema)],
    },
    async (request, reply) => {
      try {
        const body = request.body as z.infer<typeof correctionCreateSchema>

        const correction = await (prisma as any).permitCorrection.create({
          data: {
            ...body,
            affectedSheets: body.affectedSheets ?? [],
            dueDate: new Date(body.dueDate),
          },
        })

        return reply.code(201).send({ data: correction })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: error.message || 'Failed to create correction' })
      }
    }
  )

  // ========================================================================
  // PERMIT EVENTS
  // ========================================================================

  // GET /events - List permit events (filter by permitId)
  fastify.get(
    '/events',
    {
      preHandler: [
        validateQuery(
          z.object({
            page: z.string().optional(),
            limit: z.string().optional(),
            permitId: z.string().uuid().optional(),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const query = request.query as { page?: string; limit?: string; permitId?: string }
        const page = Math.max(1, parseInt(query.page || '1', 10))
        const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)))
        const skip = (page - 1) * limit

        const where: any = {}
        if (query.permitId) where.permitId = query.permitId

        const [events, total] = await Promise.all([
          (prisma as any).permitEvent.findMany({
            where,
            skip,
            take: limit,
            orderBy: { occurredAt: 'desc' },
          }),
          (prisma as any).permitEvent.count({ where }),
        ])

        return reply.send({
          data: events,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to list permit events' })
      }
    }
  )

  // ========================================================================
  // REVIEW ASSIGNMENTS
  // ========================================================================

  // GET /review-assignments - List review assignments
  fastify.get(
    '/review-assignments',
    {
      preHandler: [
        validateQuery(
          z.object({
            page: z.string().optional(),
            limit: z.string().optional(),
            permitId: z.string().uuid().optional(),
            status: z.string().optional(),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const query = request.query as {
          page?: string; limit?: string; permitId?: string; status?: string
        }
        const page = Math.max(1, parseInt(query.page || '1', 10))
        const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)))
        const skip = (page - 1) * limit

        const where: any = {}
        if (query.permitId) where.permitId = query.permitId
        if (query.status) where.status = query.status

        const [assignments, total] = await Promise.all([
          (prisma as any).reviewAssignment.findMany({
            where,
            skip,
            take: limit,
            orderBy: { assignedAt: 'desc' },
          }),
          (prisma as any).reviewAssignment.count({ where }),
        ])

        return reply.send({
          data: assignments,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to list review assignments' })
      }
    }
  )

  // POST /review-assignments - Create review assignment
  fastify.post(
    '/review-assignments',
    {
      preHandler: [validateBody(reviewAssignmentCreateSchema)],
    },
    async (request, reply) => {
      try {
        const body = request.body as z.infer<typeof reviewAssignmentCreateSchema>

        const assignment = await (prisma as any).reviewAssignment.create({
          data: {
            ...body,
            dueDate: new Date(body.dueDate),
          },
        })

        return reply.code(201).send({ data: assignment })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: error.message || 'Failed to create review assignment' })
      }
    }
  )

  // ========================================================================
  // INSPECTION ASSIGNMENTS
  // ========================================================================

  // GET /inspection-assignments - List inspection assignments
  fastify.get(
    '/inspection-assignments',
    {
      preHandler: [
        validateQuery(
          z.object({
            page: z.string().optional(),
            limit: z.string().optional(),
            jurisdictionId: z.string().uuid().optional(),
            status: z.string().optional(),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const query = request.query as {
          page?: string; limit?: string; jurisdictionId?: string; status?: string
        }
        const page = Math.max(1, parseInt(query.page || '1', 10))
        const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)))
        const skip = (page - 1) * limit

        const where: any = {}
        if (query.jurisdictionId) where.jurisdictionId = query.jurisdictionId
        if (query.status) where.status = query.status

        const [assignments, total] = await Promise.all([
          (prisma as any).inspectionAssignment.findMany({
            where,
            skip,
            take: limit,
            orderBy: { scheduledDate: 'desc' },
          }),
          (prisma as any).inspectionAssignment.count({ where }),
        ])

        return reply.send({
          data: assignments,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to list inspection assignments' })
      }
    }
  )

  // POST /inspection-assignments - Create inspection assignment
  fastify.post(
    '/inspection-assignments',
    {
      preHandler: [validateBody(inspectionAssignmentCreateSchema)],
    },
    async (request, reply) => {
      try {
        const body = request.body as z.infer<typeof inspectionAssignmentCreateSchema>

        const assignment = await (prisma as any).inspectionAssignment.create({
          data: {
            ...body,
            scheduledDate: new Date(body.scheduledDate),
          },
        })

        return reply.code(201).send({ data: assignment })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: error.message || 'Failed to create inspection assignment' })
      }
    }
  )

  // ========================================================================
  // ROUTING RULES
  // ========================================================================

  // GET /routing-rules - List routing rules
  fastify.get(
    '/routing-rules',
    {
      preHandler: [
        validateQuery(
          z.object({
            page: z.string().optional(),
            limit: z.string().optional(),
            jurisdictionId: z.string().uuid().optional(),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const query = request.query as { page?: string; limit?: string; jurisdictionId?: string }
        const page = Math.max(1, parseInt(query.page || '1', 10))
        const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)))
        const skip = (page - 1) * limit

        const where: any = { isActive: true }
        if (query.jurisdictionId) where.jurisdictionId = query.jurisdictionId

        const [rules, total] = await Promise.all([
          (prisma as any).routingRule.findMany({
            where,
            skip,
            take: limit,
            orderBy: { priority: 'desc' },
          }),
          (prisma as any).routingRule.count({ where }),
        ])

        return reply.send({
          data: rules,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to list routing rules' })
      }
    }
  )

  // POST /routing-rules - Create routing rule
  fastify.post(
    '/routing-rules',
    {
      preHandler: [validateBody(routingRuleCreateSchema)],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const body = request.body as z.infer<typeof routingRuleCreateSchema>

        const rule = await (prisma as any).routingRule.create({
          data: {
            ...body,
            optionalDisciplines: body.optionalDisciplines ?? [],
            createdById: user.id,
          },
        })

        return reply.code(201).send({ data: rule })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: error.message || 'Failed to create routing rule' })
      }
    }
  )

  // PATCH /routing-rules/:id - Update routing rule
  fastify.patch(
    '/routing-rules/:id',
    {
      preHandler: [
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(routingRuleUpdateSchema),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof routingRuleUpdateSchema>

        const updated = await (prisma as any).routingRule.update({
          where: { id },
          data: body,
        })

        return reply.send({ data: updated })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: error.message || 'Failed to update routing rule' })
      }
    }
  )

  // ========================================================================
  // AI REVIEW RESULTS
  // ========================================================================

  // GET /ai-reviews - List AI review results
  fastify.get(
    '/ai-reviews',
    {
      preHandler: [
        validateQuery(
          z.object({
            page: z.string().optional(),
            limit: z.string().optional(),
            permitId: z.string().uuid().optional(),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const query = request.query as { page?: string; limit?: string; permitId?: string }
        const page = Math.max(1, parseInt(query.page || '1', 10))
        const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)))
        const skip = (page - 1) * limit

        const where: any = {}
        if (query.permitId) where.permitId = query.permitId

        const [reviews, total] = await Promise.all([
          (prisma as any).aIReviewResult.findMany({
            where,
            skip,
            take: limit,
            orderBy: { reviewedAt: 'desc' },
          }),
          (prisma as any).aIReviewResult.count({ where }),
        ])

        return reply.send({
          data: reviews,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to list AI reviews' })
      }
    }
  )
}
