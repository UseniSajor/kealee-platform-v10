/**
 * Scheduled Payment Routes - CRUD for scheduled payments
 * Manages scheduled payments for projects (progress, milestone, retention, final)
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { authenticateUser, requireAdmin, requirePM } from '../../middleware/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../../middleware/validation.middleware'
import { prisma, Decimal } from '@kealee/database'
import { sanitizeErrorMessage } from '../../utils/sanitize-error'

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const ScheduledPaymentStatusEnum = z.enum(['SCHEDULED', 'PENDING_APPROVAL', 'APPROVED', 'PAID', 'CANCELLED'])
const PaymentTypeEnum = z.enum(['PROGRESS', 'MILESTONE', 'RETENTION', 'FINAL'])

const ListScheduledPaymentsQuerySchema = z.object({
  projectId: z.string().uuid().optional(),
  milestoneId: z.string().uuid().optional(),
  contractorId: z.string().uuid().optional(),
  status: ScheduledPaymentStatusEnum.optional(),
  paymentType: PaymentTypeEnum.optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

const CreateScheduledPaymentBodySchema = z.object({
  projectId: z.string().uuid(),
  milestoneId: z.string().uuid().optional(),
  contractorId: z.string().uuid().optional(),
  description: z.string().min(1).max(500),
  amount: z.number().positive(),
  scheduledDate: z.coerce.date(),
  paymentType: PaymentTypeEnum,
  invoiceNumber: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
})

const UpdateScheduledPaymentBodySchema = z.object({
  description: z.string().min(1).max(500).optional(),
  amount: z.number().positive().optional(),
  scheduledDate: z.coerce.date().optional(),
  status: ScheduledPaymentStatusEnum.optional(),
  paymentType: PaymentTypeEnum.optional(),
  invoiceNumber: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
  paidAt: z.coerce.date().optional(),
})

const IdParamSchema = z.object({
  id: z.string().uuid(),
})

// ============================================================================
// ROUTES
// ============================================================================

export async function scheduledPaymentRoutes(fastify: FastifyInstance) {
  /**
   * GET /
   * List scheduled payments with filtering and pagination
   */
  fastify.get(
    '/',
    {
      preHandler: [
        authenticateUser,
        requirePM,
        validateQuery(ListScheduledPaymentsQuerySchema),
      ],
      schema: {
        tags: ['Finance - Scheduled Payments'],
        summary: 'List scheduled payments',
        description: 'List scheduled payments with optional filtering by project, status, and date range',
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const filters = ListScheduledPaymentsQuerySchema.parse(request.query)

        const where: any = {}
        if (filters.projectId) where.projectId = filters.projectId
        if (filters.milestoneId) where.milestoneId = filters.milestoneId
        if (filters.contractorId) where.contractorId = filters.contractorId
        if (filters.status) where.status = filters.status
        if (filters.paymentType) where.paymentType = filters.paymentType

        // Date range filter
        if (filters.dateFrom || filters.dateTo) {
          where.scheduledDate = {}
          if (filters.dateFrom) where.scheduledDate.gte = filters.dateFrom
          if (filters.dateTo) where.scheduledDate.lte = filters.dateTo
        }

        const skip = (filters.page - 1) * filters.limit

        const [payments, total] = await Promise.all([
          prisma.scheduledPayment.findMany({
            where,
            include: {
              project: {
                select: { id: true, name: true },
              },
            },
            skip,
            take: filters.limit,
            orderBy: { scheduledDate: 'asc' },
          }),
          prisma.scheduledPayment.count({ where }),
        ])

        // Calculate summary
        const allPayments = await prisma.scheduledPayment.findMany({
          where,
          select: { amount: true, status: true },
        })

        let totalScheduled = new Decimal(0)
        let totalPaid = new Decimal(0)
        let totalPending = new Decimal(0)
        for (const p of allPayments) {
          if (p.status === 'PAID') {
            totalPaid = totalPaid.add(p.amount)
          } else if (p.status === 'CANCELLED') {
            // Excluded from summary
          } else {
            totalPending = totalPending.add(p.amount)
          }
          totalScheduled = totalScheduled.add(p.amount)
        }

        return reply.send({
          success: true,
          data: payments,
          summary: {
            totalScheduled,
            totalPaid,
            totalPending,
            count: allPayments.length,
          },
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
          error: sanitizeErrorMessage(error, 'Failed to list scheduled payments'),
        })
      }
    }
  )

  /**
   * GET /:id
   * Get a single scheduled payment
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
        tags: ['Finance - Scheduled Payments'],
        summary: 'Get scheduled payment by ID',
        description: 'Get a single scheduled payment with associated project details',
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = IdParamSchema.parse(request.params)

        const payment = await prisma.scheduledPayment.findUnique({
          where: { id },
          include: {
            project: {
              select: { id: true, name: true, status: true },
            },
          },
        })

        if (!payment) {
          return reply.code(404).send({
            success: false,
            error: 'Scheduled payment not found',
          })
        }

        return reply.send({
          success: true,
          data: payment,
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to get scheduled payment'),
        })
      }
    }
  )

  /**
   * POST /
   * Create a new scheduled payment
   */
  fastify.post(
    '/',
    {
      preHandler: [
        authenticateUser,
        requirePM,
        validateBody(CreateScheduledPaymentBodySchema),
      ],
      schema: {
        tags: ['Finance - Scheduled Payments'],
        summary: 'Create scheduled payment',
        description: 'Create a new scheduled payment for a project',
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const data = CreateScheduledPaymentBodySchema.parse(request.body)

        // Validate project exists
        const project = await prisma.project.findUnique({
          where: { id: data.projectId },
          select: { id: true, name: true },
        })
        if (!project) {
          return reply.code(404).send({
            success: false,
            error: 'Project not found',
          })
        }

        // Validate milestone if provided
        if (data.milestoneId) {
          const milestone = await prisma.milestone.findUnique({
            where: { id: data.milestoneId },
          })
          if (!milestone) {
            return reply.code(404).send({
              success: false,
              error: 'Milestone not found',
            })
          }
        }

        const payment = await prisma.scheduledPayment.create({
          data: {
            projectId: data.projectId,
            milestoneId: data.milestoneId,
            contractorId: data.contractorId,
            description: data.description,
            amount: new Decimal(data.amount),
            scheduledDate: data.scheduledDate,
            paymentType: data.paymentType,
            status: 'SCHEDULED',
            invoiceNumber: data.invoiceNumber,
            notes: data.notes,
          },
          include: {
            project: {
              select: { id: true, name: true },
            },
          },
        })

        return reply.code(201).send({
          success: true,
          data: payment,
          message: 'Scheduled payment created successfully',
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to create scheduled payment'),
        })
      }
    }
  )

  /**
   * PATCH /:id
   * Update a scheduled payment
   */
  fastify.patch(
    '/:id',
    {
      preHandler: [
        authenticateUser,
        requirePM,
        validateParams(IdParamSchema),
        validateBody(UpdateScheduledPaymentBodySchema),
      ],
      schema: {
        tags: ['Finance - Scheduled Payments'],
        summary: 'Update scheduled payment',
        description: 'Update a scheduled payment. Cannot update payments that are already paid.',
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = IdParamSchema.parse(request.params)
        const data = UpdateScheduledPaymentBodySchema.parse(request.body)

        const existing = await prisma.scheduledPayment.findUnique({ where: { id } })
        if (!existing) {
          return reply.code(404).send({
            success: false,
            error: 'Scheduled payment not found',
          })
        }

        // Prevent updating paid or cancelled payments
        if (existing.status === 'PAID') {
          return reply.code(400).send({
            success: false,
            error: 'Cannot update a paid scheduled payment',
          })
        }
        if (existing.status === 'CANCELLED') {
          return reply.code(400).send({
            success: false,
            error: 'Cannot update a cancelled scheduled payment',
          })
        }

        // Build update data
        const updateData: any = {}
        if (data.description !== undefined) updateData.description = data.description
        if (data.amount !== undefined) updateData.amount = new Decimal(data.amount)
        if (data.scheduledDate !== undefined) updateData.scheduledDate = data.scheduledDate
        if (data.status !== undefined) updateData.status = data.status
        if (data.paymentType !== undefined) updateData.paymentType = data.paymentType
        if (data.invoiceNumber !== undefined) updateData.invoiceNumber = data.invoiceNumber
        if (data.notes !== undefined) updateData.notes = data.notes
        if (data.paidAt !== undefined) updateData.paidAt = data.paidAt

        // Auto-set paidAt when status changes to PAID
        if (data.status === 'PAID' && !data.paidAt) {
          updateData.paidAt = new Date()
        }

        const payment = await prisma.scheduledPayment.update({
          where: { id },
          data: updateData,
          include: {
            project: {
              select: { id: true, name: true },
            },
          },
        })

        return reply.send({
          success: true,
          data: payment,
          message: 'Scheduled payment updated successfully',
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to update scheduled payment'),
        })
      }
    }
  )

  /**
   * DELETE /:id
   * Cancel a scheduled payment (sets status to CANCELLED)
   */
  fastify.delete(
    '/:id',
    {
      preHandler: [
        authenticateUser,
        requireAdmin,
        validateParams(IdParamSchema),
      ],
      schema: {
        tags: ['Finance - Scheduled Payments'],
        summary: 'Cancel scheduled payment',
        description: 'Cancel a scheduled payment. Cannot cancel payments that are already paid.',
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = IdParamSchema.parse(request.params)

        const existing = await prisma.scheduledPayment.findUnique({ where: { id } })
        if (!existing) {
          return reply.code(404).send({
            success: false,
            error: 'Scheduled payment not found',
          })
        }

        if (existing.status === 'PAID') {
          return reply.code(400).send({
            success: false,
            error: 'Cannot cancel a payment that has already been paid',
          })
        }

        if (existing.status === 'CANCELLED') {
          return reply.code(400).send({
            success: false,
            error: 'Payment is already cancelled',
          })
        }

        const payment = await prisma.scheduledPayment.update({
          where: { id },
          data: { status: 'CANCELLED' },
          include: {
            project: {
              select: { id: true, name: true },
            },
          },
        })

        return reply.send({
          success: true,
          data: payment,
          message: 'Scheduled payment cancelled successfully',
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to cancel scheduled payment'),
        })
      }
    }
  )
}
