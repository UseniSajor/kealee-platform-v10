/**
 * Escrow API Routes
 * Handles escrow agreement creation, deposits, releases, holds, and refunds
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { authenticateUser, requireRole, type AuthenticatedRequest } from '../middleware/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../middleware/validation.middleware'
import { escrowService } from '../modules/escrow/escrow.service'
import { prisma, Decimal } from '@kealee/database'

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const CreateEscrowAgreementSchema = z.object({
  contractId: z.string().uuid(),
  totalContractAmount: z.number().positive(),
  initialDepositPercentage: z.number().min(0).max(100).default(10),
  holdbackPercentage: z.number().min(0).max(100).default(10),
  interestRate: z.number().min(0).max(100).optional(),
})

const RecordDepositSchema = z.object({
  depositId: z.string(),
  amount: z.number().positive(),
  currency: z.string().length(3).default('USD'),
  scheduledDate: z.coerce.date().optional(),
  processedDate: z.coerce.date(),
  metadata: z.record(z.any()).optional(),
})

const ReleasePaymentSchema = z.object({
  milestoneId: z.string().uuid(),
  amount: z.number().positive(),
  recipientAccountId: z.string().uuid(),
  approvedBy: z.string().uuid().optional(),
  metadata: z.record(z.any()).optional(),
})

const PlaceHoldSchema = z.object({
  amount: z.number().positive(),
  reason: z.enum(['DISPUTE', 'COMPLIANCE', 'MANUAL', 'LIEN']),
  notes: z.string().max(1000).optional(),
  expiresAt: z.coerce.date().optional(),
})

const ReleaseHoldSchema = z.object({
  notes: z.string().max(1000).optional(),
})

const ProcessRefundSchema = z.object({
  amount: z.number().positive(),
  reason: z.string().min(10).max(500),
  recipientAccountId: z.string().uuid(),
  approvedBy: z.string().uuid().optional(),
})

const RecordFeeSchema = z.object({
  feeType: z.enum(['PLATFORM', 'PROCESSING', 'INSTANT_PAYOUT']),
  amount: z.number().positive(),
  description: z.string().max(500),
})

const EscrowIdParamSchema = z.object({
  id: z.string().uuid(),
})

const HoldIdParamSchema = z.object({
  holdId: z.string().uuid(),
})

const ContractIdParamSchema = z.object({
  contractId: z.string().uuid(),
})

const ListEscrowsSchema = z.object({
  status: z.enum(['PENDING_DEPOSIT', 'ACTIVE', 'FROZEN', 'CLOSED']).optional(),
  contractId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

// ============================================================================
// ROLE-BASED ACCESS CONTROL
// ============================================================================

const requireFinanceAccess = requireRole(['admin', 'finance', 'pm'])

// ============================================================================
// ROUTES
// ============================================================================

export async function escrowRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/escrow/agreements
   * Create a new escrow agreement (when contract is signed)
   */
  fastify.post(
    '/escrow/agreements',
    {
      preHandler: [authenticateUser, requireFinanceAccess],
      schema: {
        tags: ['Escrow'],
        summary: 'Create a new escrow agreement',
        body: CreateEscrowAgreementSchema,
      },
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      try {
        const userId = request.user!.id
        const data = CreateEscrowAgreementSchema.parse(request.body)

        const escrow = await escrowService.createEscrowAgreement({
          ...data,
          totalContractAmount: new Decimal(data.totalContractAmount),
          createdBy: userId,
        })

        return reply.code(201).send({
          success: true,
          escrow,
          message: 'Escrow agreement created successfully',
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: error.message || 'Failed to create escrow agreement',
        })
      }
    }
  )

  /**
   * GET /api/escrow/agreements
   * List escrow agreements with filtering
   */
  fastify.get(
    '/escrow/agreements',
    {
      preHandler: [authenticateUser, requireFinanceAccess],
      schema: {
        tags: ['Escrow'],
        summary: 'List escrow agreements',
        querystring: ListEscrowsSchema,
      },
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      try {
        const filters = ListEscrowsSchema.parse(request.query)

        // Build where clause
        const where: any = {}
        if (filters.status) where.status = filters.status
        if (filters.contractId) where.contractId = filters.contractId
        if (filters.projectId) {
          where.contract = { projectId: filters.projectId }
        }

        // Pagination
        const skip = (filters.page - 1) * filters.limit

        const [escrows, total] = await Promise.all([
          prisma.escrowAgreement.findMany({
            where,
            include: {
              contract: {
                include: {
                  project: { select: { id: true, name: true } },
                  owner: { select: { id: true, name: true, email: true } },
                  contractor: { select: { id: true, name: true, email: true } },
                },
              },
            },
            skip,
            take: filters.limit,
            orderBy: { createdAt: 'desc' },
          }),
          prisma.escrowAgreement.count({ where }),
        ])

        return reply.send({
          success: true,
          data: escrows,
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
          error: error.message || 'Failed to list escrow agreements',
        })
      }
    }
  )

  /**
   * GET /api/escrow/agreements/:id
   * Get escrow agreement details
   */
  fastify.get(
    '/escrow/agreements/:id',
    {
      preHandler: [authenticateUser],
      schema: {
        tags: ['Escrow'],
        summary: 'Get escrow agreement details',
        params: EscrowIdParamSchema,
      },
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      try {
        const { id } = EscrowIdParamSchema.parse(request.params)

        const escrow = await escrowService.getEscrow(id)

        if (!escrow) {
          return reply.code(404).send({
            success: false,
            error: 'Escrow agreement not found',
          })
        }

        return reply.send({
          success: true,
          escrow,
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: error.message || 'Failed to get escrow agreement',
        })
      }
    }
  )

  /**
   * GET /api/escrow/contract/:contractId
   * Get escrow agreement by contract ID
   */
  fastify.get(
    '/escrow/contract/:contractId',
    {
      preHandler: [authenticateUser],
      schema: {
        tags: ['Escrow'],
        summary: 'Get escrow agreement by contract ID',
        params: ContractIdParamSchema,
      },
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      try {
        const { contractId } = ContractIdParamSchema.parse(request.params)

        const escrow = await prisma.escrowAgreement.findUnique({
          where: { contractId },
          include: {
            contract: {
              include: {
                project: true,
                owner: { select: { id: true, name: true, email: true } },
                contractor: { select: { id: true, name: true, email: true } },
              },
            },
            transactions: {
              orderBy: { createdAt: 'desc' },
              take: 10, // Last 10 transactions
            },
            holds: {
              where: { status: 'ACTIVE' },
            },
          },
        })

        if (!escrow) {
          return reply.code(404).send({
            success: false,
            error: 'Escrow agreement not found for this contract',
          })
        }

        return reply.send({
          success: true,
          escrow,
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: error.message || 'Failed to get escrow agreement',
        })
      }
    }
  )

  /**
   * POST /api/escrow/agreements/:id/deposit
   * Record a deposit into escrow
   */
  fastify.post(
    '/escrow/agreements/:id/deposit',
    {
      preHandler: [authenticateUser, requireFinanceAccess],
      schema: {
        tags: ['Escrow'],
        summary: 'Record a deposit into escrow',
        params: EscrowIdParamSchema,
        body: RecordDepositSchema,
      },
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      try {
        const { id } = EscrowIdParamSchema.parse(request.params)
        const userId = request.user!.id
        const data = RecordDepositSchema.parse(request.body)

        const transaction = await escrowService.recordDeposit({
          escrowId: id,
          ...data,
          amount: new Decimal(data.amount),
          initiatedBy: userId,
        })

        return reply.code(201).send({
          success: true,
          transaction,
          message: 'Deposit recorded successfully',
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: error.message || 'Failed to record deposit',
        })
      }
    }
  )

  /**
   * POST /api/escrow/agreements/:id/release
   * Release payment from escrow
   */
  fastify.post(
    '/escrow/agreements/:id/release',
    {
      preHandler: [authenticateUser, requireFinanceAccess],
      schema: {
        tags: ['Escrow'],
        summary: 'Release payment from escrow',
        params: EscrowIdParamSchema,
        body: ReleasePaymentSchema,
      },
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      try {
        const { id } = EscrowIdParamSchema.parse(request.params)
        const userId = request.user!.id
        const data = ReleasePaymentSchema.parse(request.body)

        const transaction = await escrowService.releasePayment({
          escrowId: id,
          ...data,
          amount: new Decimal(data.amount),
          initiatedBy: userId,
        })

        return reply.send({
          success: true,
          transaction,
          message: 'Payment released successfully',
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: error.message || 'Failed to release payment',
        })
      }
    }
  )

  /**
   * POST /api/escrow/agreements/:id/hold
   * Place a hold on escrow funds
   */
  fastify.post(
    '/escrow/agreements/:id/hold',
    {
      preHandler: [authenticateUser, requireFinanceAccess],
      schema: {
        tags: ['Escrow'],
        summary: 'Place a hold on escrow funds',
        params: EscrowIdParamSchema,
        body: PlaceHoldSchema,
      },
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      try {
        const { id } = EscrowIdParamSchema.parse(request.params)
        const userId = request.user!.id
        const data = PlaceHoldSchema.parse(request.body)

        const hold = await escrowService.placeHold({
          escrowId: id,
          ...data,
          amount: new Decimal(data.amount),
          placedBy: userId,
        })

        return reply.code(201).send({
          success: true,
          hold,
          message: 'Hold placed successfully',
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: error.message || 'Failed to place hold',
        })
      }
    }
  )

  /**
   * POST /api/escrow/holds/:holdId/release
   * Release a hold
   */
  fastify.post(
    '/escrow/holds/:holdId/release',
    {
      preHandler: [authenticateUser, requireFinanceAccess],
      schema: {
        tags: ['Escrow'],
        summary: 'Release a hold',
        params: HoldIdParamSchema,
        body: ReleaseHoldSchema,
      },
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      try {
        const { holdId } = HoldIdParamSchema.parse(request.params)
        const userId = request.user!.id
        const data = ReleaseHoldSchema.parse(request.body)

        const hold = await escrowService.releaseHold({
          holdId,
          releasedBy: userId,
          ...data,
        })

        return reply.send({
          success: true,
          hold,
          message: 'Hold released successfully',
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: error.message || 'Failed to release hold',
        })
      }
    }
  )

  /**
   * POST /api/escrow/agreements/:id/refund
   * Process a refund from escrow
   */
  fastify.post(
    '/escrow/agreements/:id/refund',
    {
      preHandler: [authenticateUser, requireRole(['admin', 'finance'])],
      schema: {
        tags: ['Escrow'],
        summary: 'Process a refund from escrow',
        params: EscrowIdParamSchema,
        body: ProcessRefundSchema,
      },
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      try {
        const { id } = EscrowIdParamSchema.parse(request.params)
        const userId = request.user!.id
        const data = ProcessRefundSchema.parse(request.body)

        const transaction = await escrowService.processRefund({
          escrowId: id,
          ...data,
          amount: new Decimal(data.amount),
          initiatedBy: userId,
        })

        return reply.send({
          success: true,
          transaction,
          message: 'Refund processed successfully',
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: error.message || 'Failed to process refund',
        })
      }
    }
  )

  /**
   * POST /api/escrow/agreements/:id/fee
   * Record a fee transaction
   */
  fastify.post(
    '/escrow/agreements/:id/fee',
    {
      preHandler: [authenticateUser, requireFinanceAccess],
      schema: {
        tags: ['Escrow'],
        summary: 'Record a fee transaction',
        params: EscrowIdParamSchema,
        body: RecordFeeSchema,
      },
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      try {
        const { id } = EscrowIdParamSchema.parse(request.params)
        const userId = request.user!.id
        const data = RecordFeeSchema.parse(request.body)

        const transaction = await escrowService.recordFee(
          id,
          data.feeType,
          new Decimal(data.amount),
          data.description,
          userId
        )

        return reply.send({
          success: true,
          transaction,
          message: 'Fee recorded successfully',
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: error.message || 'Failed to record fee',
        })
      }
    }
  )

  /**
   * POST /api/escrow/agreements/:id/close
   * Close an escrow agreement
   */
  fastify.post(
    '/escrow/agreements/:id/close',
    {
      preHandler: [authenticateUser, requireRole(['admin', 'finance'])],
      schema: {
        tags: ['Escrow'],
        summary: 'Close an escrow agreement',
        params: EscrowIdParamSchema,
      },
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      try {
        const { id } = EscrowIdParamSchema.parse(request.params)
        const userId = request.user!.id

        const escrow = await escrowService.closeEscrow(id, userId)

        return reply.send({
          success: true,
          escrow,
          message: 'Escrow agreement closed successfully',
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: error.message || 'Failed to close escrow agreement',
        })
      }
    }
  )

  /**
   * GET /api/escrow/agreements/:id/transactions
   * Get all transactions for an escrow
   */
  fastify.get(
    '/escrow/agreements/:id/transactions',
    {
      preHandler: [authenticateUser],
      schema: {
        tags: ['Escrow'],
        summary: 'Get all transactions for an escrow',
        params: EscrowIdParamSchema,
      },
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      try {
        const { id } = EscrowIdParamSchema.parse(request.params)

        const transactions = await prisma.escrowTransaction.findMany({
          where: { escrowId: id },
          include: {
            journalEntry: {
              include: {
                lines: {
                  include: {
                    account: { select: { code: true, name: true, type: true } },
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        })

        return reply.send({
          success: true,
          transactions,
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: error.message || 'Failed to get escrow transactions',
        })
      }
    }
  )

  /**
   * POST /api/escrow/transactions/:id/complete
   * Complete an escrow transaction after successful payout
   * Internal endpoint - called by Stripe webhook handler
   */
  fastify.post(
    '/escrow/transactions/:id/complete',
    {
      preHandler: [authenticateUser, requireRole(['admin'])],
      schema: {
        tags: ['Escrow'],
        summary: 'Complete an escrow transaction',
        params: z.object({
          id: z.string().uuid(),
        }),
        body: z.object({
          payoutId: z.string(),
        }),
      },
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      try {
        const { id } = z.object({ id: z.string().uuid() }).parse(request.params)
        const { payoutId } = z.object({ payoutId: z.string() }).parse(request.body)

        const transaction = await escrowService.completeEscrowTransaction(id, payoutId)

        return reply.send({
          success: true,
          transaction,
          message: 'Escrow transaction completed successfully',
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: error.message || 'Failed to complete transaction',
        })
      }
    }
  )

  /**
   * POST /api/escrow/transactions/:id/fail
   * Mark an escrow transaction as failed and rollback balances
   * Internal endpoint - called by Stripe webhook handler
   */
  fastify.post(
    '/escrow/transactions/:id/fail',
    {
      preHandler: [authenticateUser, requireRole(['admin'])],
      schema: {
        tags: ['Escrow'],
        summary: 'Fail an escrow transaction and rollback',
        params: z.object({
          id: z.string().uuid(),
        }),
        body: z.object({
          reason: z.string(),
        }),
      },
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      try {
        const { id } = z.object({ id: z.string().uuid() }).parse(request.params)
        const { reason } = z.object({ reason: z.string() }).parse(request.body)

        const transaction = await escrowService.failEscrowTransaction(id, reason)

        return reply.send({
          success: true,
          transaction,
          message: 'Escrow transaction failed and rolled back',
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: error.message || 'Failed to process transaction failure',
        })
      }
    }
  )
}

