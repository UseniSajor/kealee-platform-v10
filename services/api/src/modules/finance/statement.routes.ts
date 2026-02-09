/**
 * Statement Routes - Financial statement generation and scheduling
 * Manages statements (monthly, quarterly, annual) and delivery schedules
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { authenticateUser, requireAdmin, requirePM } from '../auth/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../../middleware/validation.middleware'
import { prisma, Decimal } from '@kealee/database'

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const StatementTypeEnum = z.enum(['MONTHLY', 'QUARTERLY', 'ANNUAL', 'CUSTOM'])
const StatementStatusEnum = z.enum(['GENERATED', 'SENT', 'VIEWED', 'ARCHIVED'])
const RecipientRoleEnum = z.enum(['OWNER', 'CONTRACTOR', 'ADMIN', 'FINANCE'])
const DeliveryMethodEnum = z.enum(['EMAIL', 'DOWNLOAD', 'BOTH'])

const ListStatementsQuerySchema = z.object({
  recipientId: z.string().uuid().optional(),
  statementType: StatementTypeEnum.optional(),
  status: StatementStatusEnum.optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

const CreateStatementBodySchema = z.object({
  statementType: StatementTypeEnum,
  recipientId: z.string().uuid(),
  recipientRole: RecipientRoleEnum,
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
  documentUrl: z.string().url().optional(),
  openingBalance: z.number().default(0),
  closingBalance: z.number().default(0),
  totalDeposits: z.number().default(0),
  totalReleases: z.number().default(0),
  totalFees: z.number().default(0),
  transactionCount: z.number().int().min(0).default(0),
  metadata: z.record(z.any()).optional(),
})

const CreateScheduleBodySchema = z.object({
  recipientId: z.string().uuid(),
  statementType: StatementTypeEnum,
  frequency: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUAL']).default('MONTHLY'),
  dayOfMonth: z.number().int().min(1).max(31).default(1),
  deliveryMethod: DeliveryMethodEnum.default('EMAIL'),
  isActive: z.boolean().default(true),
  nextScheduled: z.coerce.date().optional(),
  metadata: z.record(z.any()).optional(),
})

const UpdateScheduleBodySchema = z.object({
  frequency: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUAL']).optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  deliveryMethod: DeliveryMethodEnum.optional(),
  isActive: z.boolean().optional(),
  nextScheduled: z.coerce.date().optional(),
  metadata: z.record(z.any()).optional(),
})

const IdParamSchema = z.object({
  id: z.string().uuid(),
})

const ListSchedulesQuerySchema = z.object({
  recipientId: z.string().uuid().optional(),
  statementType: StatementTypeEnum.optional(),
  isActive: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

// ============================================================================
// ROUTES
// ============================================================================

export async function statementRoutes(fastify: FastifyInstance) {
  /**
   * GET /
   * List statements with filtering and pagination
   */
  fastify.get(
    '/',
    {
      preHandler: [
        authenticateUser,
        requirePM,
        validateQuery(ListStatementsQuerySchema),
      ],
      schema: {
        tags: ['Finance - Statements'],
        summary: 'List statements',
        description: 'List financial statements with optional filtering by recipient, type, and date range',
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const filters = ListStatementsQuerySchema.parse(request.query)

        const where: any = {}
        if (filters.recipientId) where.recipientId = filters.recipientId
        if (filters.statementType) where.statementType = filters.statementType
        if (filters.status) where.status = filters.status

        // Date range filter on period
        if (filters.dateFrom || filters.dateTo) {
          if (filters.dateFrom) {
            where.periodEnd = { ...(where.periodEnd || {}), gte: filters.dateFrom }
          }
          if (filters.dateTo) {
            where.periodStart = { ...(where.periodStart || {}), lte: filters.dateTo }
          }
        }

        const skip = (filters.page - 1) * filters.limit

        const [statements, total] = await Promise.all([
          prisma.statement.findMany({
            where,
            include: {
              recipient: {
                select: { id: true, name: true, email: true },
              },
            },
            skip,
            take: filters.limit,
            orderBy: { generatedAt: 'desc' },
          }),
          prisma.statement.count({ where }),
        ])

        return reply.send({
          success: true,
          data: statements,
          pagination: {
            total,
            page: filters.page,
            pageSize: filters.limit,
            totalPages: Math.ceil(total / filters.limit),
          },
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: error.message || 'Failed to list statements',
        })
      }
    }
  )

  /**
   * GET /:id
   * Get a single statement
   */
  fastify.get(
    '/:id',
    {
      preHandler: [
        authenticateUser,
        requirePM,
        validateParams(IdParamSchema),
      ],
      schema: {
        tags: ['Finance - Statements'],
        summary: 'Get statement by ID',
        description: 'Get a single financial statement with all details',
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = IdParamSchema.parse(request.params)

        const statement = await prisma.statement.findUnique({
          where: { id },
          include: {
            recipient: {
              select: { id: true, name: true, email: true },
            },
          },
        })

        if (!statement) {
          return reply.code(404).send({
            success: false,
            error: 'Statement not found',
          })
        }

        // Mark as viewed if first time
        if (statement.status === 'SENT' && !statement.viewedAt) {
          await prisma.statement.update({
            where: { id },
            data: {
              status: 'VIEWED',
              viewedAt: new Date(),
            },
          })
        }

        return reply.send({
          success: true,
          data: statement,
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: error.message || 'Failed to get statement',
        })
      }
    }
  )

  /**
   * POST /
   * Create a new financial statement
   */
  fastify.post(
    '/',
    {
      preHandler: [
        authenticateUser,
        requireAdmin,
        validateBody(CreateStatementBodySchema),
      ],
      schema: {
        tags: ['Finance - Statements'],
        summary: 'Create statement',
        description: 'Create a new financial statement for a recipient',
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const data = CreateStatementBodySchema.parse(request.body)

        // Validate recipient exists
        const recipient = await prisma.user.findUnique({
          where: { id: data.recipientId },
          select: { id: true, name: true },
        })

        if (!recipient) {
          return reply.code(404).send({
            success: false,
            error: 'Recipient user not found',
          })
        }

        // Validate period dates
        if (data.periodEnd <= data.periodStart) {
          return reply.code(400).send({
            success: false,
            error: 'Period end date must be after period start date',
          })
        }

        const statement = await prisma.statement.create({
          data: {
            statementType: data.statementType as any,
            recipientId: data.recipientId,
            recipientRole: data.recipientRole as any,
            periodStart: data.periodStart,
            periodEnd: data.periodEnd,
            documentUrl: data.documentUrl,
            status: 'GENERATED',
            openingBalance: new Decimal(data.openingBalance),
            closingBalance: new Decimal(data.closingBalance),
            totalDeposits: new Decimal(data.totalDeposits),
            totalReleases: new Decimal(data.totalReleases),
            totalFees: new Decimal(data.totalFees),
            transactionCount: data.transactionCount,
            metadata: data.metadata || {},
            generatedAt: new Date(),
          },
          include: {
            recipient: {
              select: { id: true, name: true, email: true },
            },
          },
        })

        return reply.code(201).send({
          success: true,
          data: statement,
          message: 'Statement created successfully',
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: error.message || 'Failed to create statement',
        })
      }
    }
  )

  /**
   * POST /schedules
   * Create a statement generation schedule
   */
  fastify.post(
    '/schedules',
    {
      preHandler: [
        authenticateUser,
        requireAdmin,
        validateBody(CreateScheduleBodySchema),
      ],
      schema: {
        tags: ['Finance - Statements'],
        summary: 'Create statement schedule',
        description: 'Create a new statement generation schedule for automated delivery',
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const data = CreateScheduleBodySchema.parse(request.body)

        // Validate recipient exists
        const recipient = await prisma.user.findUnique({
          where: { id: data.recipientId },
          select: { id: true, name: true },
        })

        if (!recipient) {
          return reply.code(404).send({
            success: false,
            error: 'Recipient user not found',
          })
        }

        // Calculate next scheduled date if not provided
        let nextScheduled = data.nextScheduled
        if (!nextScheduled) {
          const now = new Date()
          nextScheduled = new Date(now.getFullYear(), now.getMonth() + 1, data.dayOfMonth)
          // If the calculated date is in the past, push to next month
          if (nextScheduled <= now) {
            nextScheduled = new Date(now.getFullYear(), now.getMonth() + 2, data.dayOfMonth)
          }
        }

        const schedule = await prisma.statementSchedule.create({
          data: {
            recipientId: data.recipientId,
            statementType: data.statementType as any,
            frequency: data.frequency,
            dayOfMonth: data.dayOfMonth,
            isActive: data.isActive,
            deliveryMethod: data.deliveryMethod as any,
            nextScheduled,
            metadata: data.metadata || {},
          },
          include: {
            recipient: {
              select: { id: true, name: true, email: true },
            },
          },
        })

        return reply.code(201).send({
          success: true,
          data: schedule,
          message: 'Statement schedule created successfully',
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: error.message || 'Failed to create statement schedule',
        })
      }
    }
  )

  /**
   * GET /schedules
   * List statement schedules
   */
  fastify.get(
    '/schedules',
    {
      preHandler: [
        authenticateUser,
        requirePM,
        validateQuery(ListSchedulesQuerySchema),
      ],
      schema: {
        tags: ['Finance - Statements'],
        summary: 'List statement schedules',
        description: 'List statement generation schedules with optional filtering',
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const filters = ListSchedulesQuerySchema.parse(request.query)

        const where: any = {}
        if (filters.recipientId) where.recipientId = filters.recipientId
        if (filters.statementType) where.statementType = filters.statementType
        if (filters.isActive !== undefined) where.isActive = filters.isActive

        const skip = (filters.page - 1) * filters.limit

        const [schedules, total] = await Promise.all([
          prisma.statementSchedule.findMany({
            where,
            include: {
              recipient: {
                select: { id: true, name: true, email: true },
              },
            },
            skip,
            take: filters.limit,
            orderBy: { createdAt: 'desc' },
          }),
          prisma.statementSchedule.count({ where }),
        ])

        return reply.send({
          success: true,
          data: schedules,
          pagination: {
            total,
            page: filters.page,
            pageSize: filters.limit,
            totalPages: Math.ceil(total / filters.limit),
          },
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: error.message || 'Failed to list statement schedules',
        })
      }
    }
  )

  /**
   * PATCH /schedules/:id
   * Update a statement schedule
   */
  fastify.patch(
    '/schedules/:id',
    {
      preHandler: [
        authenticateUser,
        requireAdmin,
        validateParams(IdParamSchema),
        validateBody(UpdateScheduleBodySchema),
      ],
      schema: {
        tags: ['Finance - Statements'],
        summary: 'Update statement schedule',
        description: 'Update a statement generation schedule',
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = IdParamSchema.parse(request.params)
        const data = UpdateScheduleBodySchema.parse(request.body)

        const existing = await prisma.statementSchedule.findUnique({ where: { id } })

        if (!existing) {
          return reply.code(404).send({
            success: false,
            error: 'Statement schedule not found',
          })
        }

        const updateData: any = {}
        if (data.frequency !== undefined) updateData.frequency = data.frequency
        if (data.dayOfMonth !== undefined) updateData.dayOfMonth = data.dayOfMonth
        if (data.deliveryMethod !== undefined) updateData.deliveryMethod = data.deliveryMethod
        if (data.isActive !== undefined) updateData.isActive = data.isActive
        if (data.nextScheduled !== undefined) updateData.nextScheduled = data.nextScheduled
        if (data.metadata !== undefined) updateData.metadata = data.metadata

        const schedule = await prisma.statementSchedule.update({
          where: { id },
          data: updateData,
          include: {
            recipient: {
              select: { id: true, name: true, email: true },
            },
          },
        })

        return reply.send({
          success: true,
          data: schedule,
          message: 'Statement schedule updated successfully',
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: error.message || 'Failed to update statement schedule',
        })
      }
    }
  )
}
