/**
 * Payout Routes - Internal payout tracking and connected account management
 * Manages payout records and connected account status (internal tracking, not Stripe Connect API)
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { authenticateUser, requireAdmin, requirePM } from '../../middleware/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../../middleware/validation.middleware'
import { prisma, Decimal } from '@kealee/database'

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const PayoutStatusEnum = z.enum(['PENDING', 'PAID', 'FAILED', 'CANCELED'])
const PayoutMethodEnum = z.enum(['STANDARD', 'INSTANT'])

const ListPayoutsQuerySchema = z.object({
  status: PayoutStatusEnum.optional(),
  connectedAccountId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  milestoneId: z.string().uuid().optional(),
  method: PayoutMethodEnum.optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

const CreatePayoutBodySchema = z.object({
  connectedAccountId: z.string().uuid(),
  escrowTransactionId: z.string().uuid().optional(),
  milestoneId: z.string().uuid().optional(),
  amount: z.number().positive(),
  currency: z.string().length(3).default('USD'),
  method: PayoutMethodEnum.default('STANDARD'),
  stripePayoutId: z.string().optional(),
  stripeTransferId: z.string().optional(),
  arrivalDate: z.coerce.date().optional(),
  platformFee: z.number().min(0).default(0),
  stripeFee: z.number().min(0).default(0),
  instantPayoutFee: z.number().min(0).default(0),
  metadata: z.record(z.any()).optional(),
})

const UpdatePayoutBodySchema = z.object({
  status: PayoutStatusEnum.optional(),
  stripePayoutId: z.string().optional(),
  stripeTransferId: z.string().optional(),
  arrivalDate: z.coerce.date().optional(),
  processedAt: z.coerce.date().optional(),
  failedAt: z.coerce.date().optional(),
  failureCode: z.string().max(100).optional(),
  failureMessage: z.string().max(1000).optional(),
  metadata: z.record(z.any()).optional(),
})

const IdParamSchema = z.object({
  id: z.string().uuid(),
})

// ============================================================================
// ROUTES
// ============================================================================

export async function payoutRoutes(fastify: FastifyInstance) {
  /**
   * GET /payouts
   * List payouts with filtering and pagination
   */
  fastify.get(
    '/payouts',
    {
      preHandler: [
        authenticateUser,
        requirePM,
        validateQuery(ListPayoutsQuerySchema),
      ],
      schema: {
        tags: ['Finance - Payouts'],
        summary: 'List payouts',
        description: 'List payout records with optional filtering by status, user, and date range',
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const filters = ListPayoutsQuerySchema.parse(request.query)

        const where: any = {}
        if (filters.status) where.status = filters.status
        if (filters.connectedAccountId) where.connectedAccountId = filters.connectedAccountId
        if (filters.milestoneId) where.milestoneId = filters.milestoneId
        if (filters.method) where.method = filters.method

        // Filter by user via connected account
        if (filters.userId) {
          where.connectedAccount = { userId: filters.userId }
        }

        // Date range filter
        if (filters.dateFrom || filters.dateTo) {
          where.createdAt = {}
          if (filters.dateFrom) where.createdAt.gte = filters.dateFrom
          if (filters.dateTo) where.createdAt.lte = filters.dateTo
        }

        const skip = (filters.page - 1) * filters.limit

        const [payouts, total] = await Promise.all([
          prisma.payout.findMany({
            where,
            include: {
              connectedAccount: {
                select: {
                  id: true,
                  userId: true,
                  stripeAccountId: true,
                  status: true,
                  email: true,
                  country: true,
                  currency: true,
                },
              },
              milestone: {
                select: { id: true, name: true },
              },
              initiator: {
                select: { id: true, name: true, email: true },
              },
              approver: {
                select: { id: true, name: true, email: true },
              },
            },
            skip,
            take: filters.limit,
            orderBy: { createdAt: 'desc' },
          }),
          prisma.payout.count({ where }),
        ])

        return reply.send({
          success: true,
          data: payouts,
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
          error: error.message || 'Failed to list payouts',
        })
      }
    }
  )

  /**
   * GET /payouts/:id
   * Get a single payout with full details
   */
  fastify.get(
    '/payouts/:id',
    {
      preHandler: [
        authenticateUser,
        requirePM,
        validateParams(IdParamSchema),
      ],
      schema: {
        tags: ['Finance - Payouts'],
        summary: 'Get payout by ID',
        description: 'Get a single payout record with all associated details',
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = IdParamSchema.parse(request.params)

        const payout = await prisma.payout.findUnique({
          where: { id },
          include: {
            connectedAccount: {
              select: {
                id: true,
                userId: true,
                stripeAccountId: true,
                accountType: true,
                status: true,
                email: true,
                country: true,
                currency: true,
                payoutsEnabled: true,
              },
            },
            escrowTransaction: true,
            milestone: {
              select: { id: true, name: true, status: true },
            },
            initiator: {
              select: { id: true, name: true, email: true },
            },
            approver: {
              select: { id: true, name: true, email: true },
            },
          },
        })

        if (!payout) {
          return reply.code(404).send({
            success: false,
            error: 'Payout not found',
          })
        }

        return reply.send({
          success: true,
          data: payout,
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: error.message || 'Failed to get payout',
        })
      }
    }
  )

  /**
   * POST /payouts
   * Create a new payout record
   */
  fastify.post(
    '/payouts',
    {
      preHandler: [
        authenticateUser,
        requireAdmin,
        validateBody(CreatePayoutBodySchema),
      ],
      schema: {
        tags: ['Finance - Payouts'],
        summary: 'Create payout record',
        description: 'Create a new payout record for tracking purposes',
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user!.id
        const data = CreatePayoutBodySchema.parse(request.body)

        // Validate connected account exists
        const connectedAccount = await prisma.connectedAccount.findUnique({
          where: { id: data.connectedAccountId },
        })

        if (!connectedAccount) {
          return reply.code(404).send({
            success: false,
            error: 'Connected account not found',
          })
        }

        // Validate connected account is active and payouts enabled
        if (connectedAccount.status !== 'ACTIVE') {
          return reply.code(400).send({
            success: false,
            error: `Connected account is not active (status: ${connectedAccount.status})`,
          })
        }

        if (!connectedAccount.payoutsEnabled) {
          return reply.code(400).send({
            success: false,
            error: 'Payouts are not enabled for this connected account',
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

        // Validate escrow transaction if provided
        if (data.escrowTransactionId) {
          const escrowTx = await prisma.escrowTransaction.findUnique({
            where: { id: data.escrowTransactionId },
          })
          if (!escrowTx) {
            return reply.code(404).send({
              success: false,
              error: 'Escrow transaction not found',
            })
          }
        }

        const payout = await prisma.payout.create({
          data: {
            connectedAccountId: data.connectedAccountId,
            escrowTransactionId: data.escrowTransactionId,
            milestoneId: data.milestoneId,
            amount: new Decimal(data.amount),
            currency: data.currency,
            method: data.method as any,
            status: 'PENDING',
            stripePayoutId: data.stripePayoutId,
            stripeTransferId: data.stripeTransferId,
            arrivalDate: data.arrivalDate,
            platformFee: new Decimal(data.platformFee),
            stripeFee: new Decimal(data.stripeFee),
            instantPayoutFee: new Decimal(data.instantPayoutFee),
            initiatedBy: userId,
            metadata: data.metadata || {},
          },
          include: {
            connectedAccount: {
              select: { id: true, userId: true, stripeAccountId: true, email: true },
            },
            initiator: {
              select: { id: true, name: true, email: true },
            },
          },
        })

        return reply.code(201).send({
          success: true,
          data: payout,
          message: 'Payout record created successfully',
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: error.message || 'Failed to create payout',
        })
      }
    }
  )

  /**
   * PATCH /payouts/:id
   * Update payout status and details
   */
  fastify.patch(
    '/payouts/:id',
    {
      preHandler: [
        authenticateUser,
        requireAdmin,
        validateParams(IdParamSchema),
        validateBody(UpdatePayoutBodySchema),
      ],
      schema: {
        tags: ['Finance - Payouts'],
        summary: 'Update payout',
        description: 'Update a payout record status or details',
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user!.id
        const { id } = IdParamSchema.parse(request.params)
        const data = UpdatePayoutBodySchema.parse(request.body)

        const existing = await prisma.payout.findUnique({ where: { id } })

        if (!existing) {
          return reply.code(404).send({
            success: false,
            error: 'Payout not found',
          })
        }

        // Prevent updating completed payouts
        if (existing.status === 'PAID' && data.status !== 'FAILED') {
          return reply.code(400).send({
            success: false,
            error: 'Cannot update a completed payout',
          })
        }

        // Build update data
        const updateData: any = {}
        if (data.status) updateData.status = data.status
        if (data.stripePayoutId) updateData.stripePayoutId = data.stripePayoutId
        if (data.stripeTransferId) updateData.stripeTransferId = data.stripeTransferId
        if (data.arrivalDate) updateData.arrivalDate = data.arrivalDate
        if (data.processedAt) updateData.processedAt = data.processedAt
        if (data.failedAt) updateData.failedAt = data.failedAt
        if (data.failureCode) updateData.failureCode = data.failureCode
        if (data.failureMessage) updateData.failureMessage = data.failureMessage
        if (data.metadata) updateData.metadata = data.metadata

        // Auto-set timestamps based on status change
        if (data.status === 'PAID' && !data.processedAt) {
          updateData.processedAt = new Date()
          updateData.approvedBy = userId
        }
        if (data.status === 'FAILED' && !data.failedAt) {
          updateData.failedAt = new Date()
        }

        const payout = await prisma.payout.update({
          where: { id },
          data: updateData,
          include: {
            connectedAccount: {
              select: { id: true, userId: true, stripeAccountId: true, email: true },
            },
            initiator: {
              select: { id: true, name: true, email: true },
            },
            approver: {
              select: { id: true, name: true, email: true },
            },
          },
        })

        return reply.send({
          success: true,
          data: payout,
          message: 'Payout updated successfully',
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: error.message || 'Failed to update payout',
        })
      }
    }
  )
}
