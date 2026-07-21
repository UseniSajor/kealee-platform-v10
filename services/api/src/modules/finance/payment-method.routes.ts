/**
 * Payment Method Routes - Payment methods, deposit requests, and tax forms
 * Manages user payment methods, escrow deposit requests, and tax form records
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

const ListPaymentMethodsQuerySchema = z.object({
  userId: z.string().uuid().optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  isDefault: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

const CreatePaymentMethodBodySchema = z.object({
  userId: z.string().uuid(),
  type: z.enum(['CARD', 'ACH', 'WIRE']),
  stripePaymentMethodId: z.string().min(1),
  last4: z.string().length(4),
  brand: z.string().max(50).optional(),
  bankName: z.string().max(255).optional(),
  isDefault: z.boolean().default(false),
  isVerified: z.boolean().default(false),
  status: z.enum(['ACTIVE', 'VERIFICATION_PENDING', 'FAILED', 'REMOVED']).default('ACTIVE'),
  expiryMonth: z.number().int().min(1).max(12).optional(),
  expiryYear: z.number().int().min(2024).max(2100).optional(),
})

const IdParamSchema = z.object({
  id: z.string().uuid(),
})

const ListDepositRequestsQuerySchema = z.object({
  escrowId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  status: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

const CreateDepositRequestBodySchema = z.object({
  escrowId: z.string().uuid(),
  paymentMethodId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().length(3).default('USD'),
  requiresVerification: z.boolean().default(false),
  expectedClearanceDate: z.coerce.date().optional(),
})

const ListTaxFormsQuerySchema = z.object({
  userId: z.string().uuid().optional(),
  taxYear: z.coerce.number().int().optional(),
  formType: z.string().optional(),
  status: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

const CreateTaxFormBodySchema = z.object({
  userId: z.string().uuid(),
  taxYear: z.number().int().min(2020).max(2100),
  formType: z.enum(['1099_NEC', '1099_K', 'W9']),
  totalAmount: z.number().min(0),
  status: z.enum(['NOT_FILED', 'FILED', '1099_READY', 'NOT_REQUIRED']).default('NOT_FILED'),
  documentUrl: z.string().url().optional(),
  metadata: z.record(z.any()).optional(),
})

// ============================================================================
// ROUTES
// ============================================================================

export async function paymentMethodRoutes(fastify: FastifyInstance) {
  // ==========================================================================
  // PAYMENT METHODS
  // ==========================================================================

  /**
   * GET /payment-methods
   * List user's payment methods
   */
  fastify.get(
    '/payment-methods',
    {
      preHandler: [
        authenticateUser,
        validateQuery(ListPaymentMethodsQuerySchema),
      ],
      schema: {
        tags: ['Finance - Payment Methods'],
        summary: 'List payment methods',
        description: 'List payment methods for the authenticated user or a specified user (admin)',
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const currentUser = (request as any).user!
        const filters = ListPaymentMethodsQuerySchema.parse(request.query)

        // Non-admins can only see their own payment methods
        const targetUserId = filters.userId || currentUser.id
        if (targetUserId !== currentUser.id && !['admin', 'super_admin'].includes(currentUser.role)) {
          return reply.code(403).send({
            success: false,
            error: 'You can only view your own payment methods',
          })
        }

        const where: any = { userId: targetUserId }
        if (filters.type) where.type = filters.type
        if (filters.status) where.status = filters.status
        if (filters.isDefault !== undefined) where.isDefault = filters.isDefault

        const skip = (filters.page - 1) * filters.limit

        const [methods, total] = await Promise.all([
          prisma.paymentMethod.findMany({
            where,
            skip,
            take: filters.limit,
            orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
          }),
          prisma.paymentMethod.count({ where }),
        ])

        return reply.send({
          success: true,
          data: methods,
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
          error: sanitizeErrorMessage(error, 'Failed to list payment methods'),
        })
      }
    }
  )

  /**
   * POST /payment-methods
   * Add a payment method for a user
   */
  fastify.post(
    '/payment-methods',
    {
      preHandler: [
        authenticateUser,
        requirePM,
        validateBody(CreatePaymentMethodBodySchema),
      ],
      schema: {
        tags: ['Finance - Payment Methods'],
        summary: 'Add payment method',
        description: 'Add a new payment method for a user',
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const data = CreatePaymentMethodBodySchema.parse(request.body)

        // Validate user exists
        const user = await prisma.user.findUnique({
          where: { id: data.userId },
          select: { id: true },
        })
        if (!user) {
          return reply.code(404).send({
            success: false,
            error: 'User not found',
          })
        }

        // Check for duplicate stripe payment method
        const existingMethod = await prisma.paymentMethod.findUnique({
          where: { stripePaymentMethodId: data.stripePaymentMethodId },
        })
        if (existingMethod) {
          return reply.code(409).send({
            success: false,
            error: 'Payment method already exists',
          })
        }

        // If setting as default, unset any existing default
        if (data.isDefault) {
          await prisma.paymentMethod.updateMany({
            where: { userId: data.userId, isDefault: true },
            data: { isDefault: false },
          })
        }

        const method = await prisma.paymentMethod.create({
          data: {
            userId: data.userId,
            type: data.type,
            stripePaymentMethodId: data.stripePaymentMethodId,
            last4: data.last4,
            brand: data.brand,
            bankName: data.bankName,
            isDefault: data.isDefault,
            isVerified: data.isVerified,
            status: data.status,
            expiryMonth: data.expiryMonth,
            expiryYear: data.expiryYear,
          },
        })

        return reply.code(201).send({
          success: true,
          data: method,
          message: 'Payment method added successfully',
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to add payment method'),
        })
      }
    }
  )

  /**
   * DELETE /payment-methods/:id
   * Remove a payment method (soft delete by setting status to REMOVED)
   */
  fastify.delete(
    '/payment-methods/:id',
    {
      preHandler: [
        authenticateUser,
        validateParams(IdParamSchema),
      ],
      schema: {
        tags: ['Finance - Payment Methods'],
        summary: 'Remove payment method',
        description: 'Remove a payment method by setting its status to REMOVED',
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const currentUser = (request as any).user!
        const { id } = IdParamSchema.parse(request.params)

        const method = await prisma.paymentMethod.findUnique({ where: { id } })

        if (!method) {
          return reply.code(404).send({
            success: false,
            error: 'Payment method not found',
          })
        }

        // Non-admins can only remove their own payment methods
        if (method.userId !== currentUser.id && !['admin', 'super_admin'].includes(currentUser.role)) {
          return reply.code(403).send({
            success: false,
            error: 'You can only remove your own payment methods',
          })
        }

        // Check for active deposit requests using this method
        const activeDeposits = await prisma.depositRequest.count({
          where: {
            paymentMethodId: id,
            status: { in: ['PENDING', 'PROCESSING', 'CLEARING'] },
          },
        })

        if (activeDeposits > 0) {
          return reply.code(400).send({
            success: false,
            error: `Cannot remove payment method with ${activeDeposits} active deposit request(s)`,
          })
        }

        await prisma.paymentMethod.update({
          where: { id },
          data: { status: 'REMOVED', isDefault: false },
        })

        return reply.send({
          success: true,
          message: 'Payment method removed successfully',
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to remove payment method'),
        })
      }
    }
  )

  // ==========================================================================
  // DEPOSIT REQUESTS
  // ==========================================================================

  /**
   * GET /deposit-requests
   * List deposit requests
   */
  fastify.get(
    '/deposit-requests',
    {
      preHandler: [
        authenticateUser,
        requirePM,
        validateQuery(ListDepositRequestsQuerySchema),
      ],
      schema: {
        tags: ['Finance - Deposit Requests'],
        summary: 'List deposit requests',
        description: 'List deposit requests with optional filtering',
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const filters = ListDepositRequestsQuerySchema.parse(request.query)

        const where: any = {}
        if (filters.escrowId) where.escrowId = filters.escrowId
        if (filters.userId) where.userId = filters.userId
        if (filters.status) where.status = filters.status

        const skip = (filters.page - 1) * filters.limit

        const [requests, total] = await Promise.all([
          prisma.depositRequest.findMany({
            where,
            include: {
              paymentMethod: {
                select: { id: true, type: true, last4: true, brand: true, bankName: true },
              },
              user: {
                select: { id: true, name: true, email: true },
              },
              escrow: {
                select: { id: true, status: true, contractId: true },
              },
            },
            skip,
            take: filters.limit,
            orderBy: { createdAt: 'desc' },
          }),
          prisma.depositRequest.count({ where }),
        ])

        return reply.send({
          success: true,
          data: requests,
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
          error: sanitizeErrorMessage(error, 'Failed to list deposit requests'),
        })
      }
    }
  )

  /**
   * POST /deposit-requests
   * Create a deposit request
   */
  fastify.post(
    '/deposit-requests',
    {
      preHandler: [
        authenticateUser,
        requirePM,
        validateBody(CreateDepositRequestBodySchema),
      ],
      schema: {
        tags: ['Finance - Deposit Requests'],
        summary: 'Create deposit request',
        description: 'Create a new deposit request for an escrow agreement',
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user!.id
        const data = CreateDepositRequestBodySchema.parse(request.body)

        // Validate escrow agreement exists
        const escrow = await prisma.escrowAgreement.findUnique({
          where: { id: data.escrowId },
        })
        if (!escrow) {
          return reply.code(404).send({
            success: false,
            error: 'Escrow agreement not found',
          })
        }

        // Validate payment method exists and is active
        const paymentMethod = await prisma.paymentMethod.findUnique({
          where: { id: data.paymentMethodId },
        })
        if (!paymentMethod) {
          return reply.code(404).send({
            success: false,
            error: 'Payment method not found',
          })
        }
        if (paymentMethod.status !== 'ACTIVE') {
          return reply.code(400).send({
            success: false,
            error: `Payment method is not active (status: ${paymentMethod.status})`,
          })
        }

        const depositRequest = await prisma.depositRequest.create({
          data: {
            escrowId: data.escrowId,
            paymentMethodId: data.paymentMethodId,
            userId,
            amount: new Decimal(data.amount),
            currency: data.currency,
            status: 'PENDING',
            requiresVerification: data.requiresVerification,
            expectedClearanceDate: data.expectedClearanceDate,
          },
          include: {
            paymentMethod: {
              select: { id: true, type: true, last4: true, brand: true },
            },
            escrow: {
              select: { id: true, status: true, contractId: true },
            },
          },
        })

        return reply.code(201).send({
          success: true,
          data: depositRequest,
          message: 'Deposit request created successfully',
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to create deposit request'),
        })
      }
    }
  )

  // ==========================================================================
  // TAX FORMS
  // ==========================================================================

  /**
   * GET /tax-forms
   * List tax forms
   */
  fastify.get(
    '/tax-forms',
    {
      preHandler: [
        authenticateUser,
        requirePM,
        validateQuery(ListTaxFormsQuerySchema),
      ],
      schema: {
        tags: ['Finance - Tax Forms'],
        summary: 'List tax forms',
        description: 'List tax forms with optional filtering by user, year, and type',
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const filters = ListTaxFormsQuerySchema.parse(request.query)

        const where: any = {}
        if (filters.userId) where.userId = filters.userId
        if (filters.taxYear) where.taxYear = filters.taxYear
        if (filters.formType) where.formType = filters.formType
        if (filters.status) where.status = filters.status

        const skip = (filters.page - 1) * filters.limit

        const [forms, total] = await Promise.all([
          prisma.taxForm.findMany({
            where,
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
            skip,
            take: filters.limit,
            orderBy: [{ taxYear: 'desc' }, { createdAt: 'desc' }],
          }),
          prisma.taxForm.count({ where }),
        ])

        return reply.send({
          success: true,
          data: forms,
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
          error: sanitizeErrorMessage(error, 'Failed to list tax forms'),
        })
      }
    }
  )

  /**
   * POST /tax-forms
   * Create a tax form record
   */
  fastify.post(
    '/tax-forms',
    {
      preHandler: [
        authenticateUser,
        requireAdmin,
        validateBody(CreateTaxFormBodySchema),
      ],
      schema: {
        tags: ['Finance - Tax Forms'],
        summary: 'Create tax form',
        description: 'Create a new tax form record for a user',
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const data = CreateTaxFormBodySchema.parse(request.body)

        // Validate user exists
        const user = await prisma.user.findUnique({
          where: { id: data.userId },
          select: { id: true },
        })
        if (!user) {
          return reply.code(404).send({
            success: false,
            error: 'User not found',
          })
        }

        // Check for duplicate form (same user, year, type)
        const existingForm = await prisma.taxForm.findFirst({
          where: {
            userId: data.userId,
            taxYear: data.taxYear,
            formType: data.formType,
          },
        })
        if (existingForm) {
          return reply.code(409).send({
            success: false,
            error: `A ${data.formType} form for tax year ${data.taxYear} already exists for this user`,
          })
        }

        const form = await prisma.taxForm.create({
          data: {
            userId: data.userId,
            taxYear: data.taxYear,
            formType: data.formType,
            totalAmount: new Decimal(data.totalAmount),
            status: data.status,
            documentUrl: data.documentUrl,
            metadata: data.metadata || {},
          },
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        })

        return reply.code(201).send({
          success: true,
          data: form,
          message: 'Tax form created successfully',
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to create tax form'),
        })
      }
    }
  )
}
