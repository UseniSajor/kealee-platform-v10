/**
 * Account Routes - Chart of Accounts CRUD
 * Manages the chart of accounts for double-entry bookkeeping
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { authenticateUser, requireAdmin, requirePM } from '../auth/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../../middleware/validation.middleware'
import { prisma, Decimal } from '@kealee/database'

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const AccountTypeEnum = z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'])

const AccountSubTypeEnum = z.enum([
  'CASH',
  'ESCROW_HOLDINGS',
  'ACCOUNTS_RECEIVABLE',
  'PREPAID_EXPENSES',
  'ACCOUNTS_PAYABLE',
  'ESCROW_LIABILITIES',
  'PLATFORM_FEES_PAYABLE',
  'DEFERRED_REVENUE',
  'RETAINED_EARNINGS',
  'OWNER_EQUITY',
  'PLATFORM_FEES',
  'TRANSACTION_FEES',
  'SUBSCRIPTION_REVENUE',
  'PROCESSING_FEES',
  'OPERATING_EXPENSES',
  'CONTRACTOR_PAYOUTS',
])

const ListAccountsQuerySchema = z.object({
  type: AccountTypeEnum.optional(),
  subType: AccountSubTypeEnum.optional(),
  parentId: z.string().uuid().optional(),
  isActive: z.coerce.boolean().optional(),
  currency: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

const CreateAccountBodySchema = z.object({
  code: z.string().min(1).max(20).optional(),
  name: z.string().min(1).max(255),
  type: AccountTypeEnum,
  subType: AccountSubTypeEnum.optional(),
  description: z.string().max(1000).optional(),
  parentId: z.string().uuid().optional(),
  currency: z.string().length(3).default('USD'),
})

const UpdateAccountBodySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  isActive: z.boolean().optional(),
  subType: AccountSubTypeEnum.optional(),
})

const IdParamSchema = z.object({
  id: z.string().uuid(),
})

const BalancesQuerySchema = z.object({
  type: AccountTypeEnum.optional(),
  isActive: z.coerce.boolean().optional(),
  currency: z.string().optional(),
  asOfDate: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
})

// ============================================================================
// ROUTES
// ============================================================================

export async function accountRoutes(fastify: FastifyInstance) {
  /**
   * GET /
   * List accounts with optional filtering and pagination
   */
  fastify.get(
    '/',
    {
      preHandler: [
        authenticateUser,
        requirePM,
        validateQuery(ListAccountsQuerySchema),
      ],
      schema: {
        tags: ['Finance - Accounts'],
        summary: 'List accounts',
        description: 'List chart of accounts with optional filtering by type, parentId, and pagination',
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const filters = ListAccountsQuerySchema.parse(request.query)

        const where: any = {}
        if (filters.type) where.type = filters.type
        if (filters.subType) where.subType = filters.subType
        if (filters.parentId) where.parentId = filters.parentId
        if (filters.isActive !== undefined) where.isActive = filters.isActive
        if (filters.currency) where.currency = filters.currency

        const skip = (filters.page - 1) * filters.limit

        const [accounts, total] = await Promise.all([
          prisma.account.findMany({
            where,
            include: {
              parent: { select: { id: true, code: true, name: true } },
              children: { select: { id: true, code: true, name: true, type: true, balance: true } },
            },
            skip,
            take: filters.limit,
            orderBy: { code: 'asc' },
          }),
          prisma.account.count({ where }),
        ])

        return reply.send({
          success: true,
          data: accounts,
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
          error: error.message || 'Failed to list accounts',
        })
      }
    }
  )

  /**
   * GET /:id
   * Get a single account with balance information
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
        tags: ['Finance - Accounts'],
        summary: 'Get account by ID',
        description: 'Get a single account with its balance and relationships',
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = IdParamSchema.parse(request.params)

        const account = await prisma.account.findUnique({
          where: { id },
          include: {
            parent: { select: { id: true, code: true, name: true, type: true } },
            children: {
              select: { id: true, code: true, name: true, type: true, subType: true, balance: true, isActive: true },
              orderBy: { code: 'asc' },
            },
            periodBalances: {
              orderBy: [{ fiscalYear: 'desc' }, { fiscalPeriod: 'desc' }],
              take: 12,
            },
          },
        })

        if (!account) {
          return reply.code(404).send({
            success: false,
            error: 'Account not found',
          })
        }

        return reply.send({
          success: true,
          data: account,
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: error.message || 'Failed to get account',
        })
      }
    }
  )

  /**
   * POST /
   * Create a new account in the chart of accounts
   */
  fastify.post(
    '/',
    {
      preHandler: [
        authenticateUser,
        requireAdmin,
        validateBody(CreateAccountBodySchema),
      ],
      schema: {
        tags: ['Finance - Accounts'],
        summary: 'Create account',
        description: 'Create a new account in the chart of accounts',
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user!.id
        const data = CreateAccountBodySchema.parse(request.body)

        // If code is provided, check uniqueness
        if (data.code) {
          const existing = await prisma.account.findUnique({
            where: { code: data.code },
          })
          if (existing) {
            return reply.code(409).send({
              success: false,
              error: `Account code '${data.code}' already exists`,
            })
          }
        }

        // Validate parent account if provided
        if (data.parentId) {
          const parent = await prisma.account.findUnique({
            where: { id: data.parentId },
          })
          if (!parent) {
            return reply.code(404).send({
              success: false,
              error: 'Parent account not found',
            })
          }
          if (parent.type !== data.type) {
            return reply.code(400).send({
              success: false,
              error: `Parent account type (${parent.type}) must match child account type (${data.type})`,
            })
          }
        }

        // Auto-generate code if not provided
        let accountCode = data.code
        if (!accountCode) {
          const ACCOUNT_CODE_RANGES: Record<string, { min: number; max: number }> = {
            ASSET: { min: 1000, max: 1999 },
            LIABILITY: { min: 2000, max: 2999 },
            EQUITY: { min: 3000, max: 3999 },
            REVENUE: { min: 4000, max: 4999 },
            EXPENSE: { min: 5000, max: 5999 },
          }
          const range = ACCOUNT_CODE_RANGES[data.type]
          const highestAccount = await prisma.account.findFirst({
            where: {
              type: data.type as any,
              code: { gte: range.min.toString(), lte: range.max.toString() },
            },
            orderBy: { code: 'desc' },
          })
          const nextCode = highestAccount
            ? parseInt(highestAccount.code, 10) + 1
            : range.min
          if (nextCode > range.max) {
            return reply.code(400).send({
              success: false,
              error: `Account code range exhausted for type ${data.type}`,
            })
          }
          accountCode = nextCode.toString()
        }

        const account = await prisma.account.create({
          data: {
            code: accountCode,
            name: data.name,
            type: data.type as any,
            subType: data.subType as any,
            description: data.description,
            parentId: data.parentId,
            currency: data.currency,
            balance: new Decimal(0),
            isActive: true,
            createdBy: userId,
          },
          include: {
            parent: { select: { id: true, code: true, name: true } },
          },
        })

        return reply.code(201).send({
          success: true,
          data: account,
          message: 'Account created successfully',
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: error.message || 'Failed to create account',
        })
      }
    }
  )

  /**
   * PATCH /:id
   * Update an existing account
   */
  fastify.patch(
    '/:id',
    {
      preHandler: [
        authenticateUser,
        requireAdmin,
        validateParams(IdParamSchema),
        validateBody(UpdateAccountBodySchema),
      ],
      schema: {
        tags: ['Finance - Accounts'],
        summary: 'Update account',
        description: 'Update an existing account in the chart of accounts',
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = IdParamSchema.parse(request.params)
        const data = UpdateAccountBodySchema.parse(request.body)

        const existing = await prisma.account.findUnique({ where: { id } })
        if (!existing) {
          return reply.code(404).send({
            success: false,
            error: 'Account not found',
          })
        }

        const account = await prisma.account.update({
          where: { id },
          data: {
            ...(data.name !== undefined && { name: data.name }),
            ...(data.description !== undefined && { description: data.description }),
            ...(data.isActive !== undefined && { isActive: data.isActive }),
            ...(data.subType !== undefined && { subType: data.subType as any }),
          },
          include: {
            parent: { select: { id: true, code: true, name: true } },
          },
        })

        return reply.send({
          success: true,
          data: account,
          message: 'Account updated successfully',
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: error.message || 'Failed to update account',
        })
      }
    }
  )

  /**
   * GET /balances
   * Get all account balances (summary view)
   */
  fastify.get(
    '/balances',
    {
      preHandler: [
        authenticateUser,
        requirePM,
        validateQuery(BalancesQuerySchema),
      ],
      schema: {
        tags: ['Finance - Accounts'],
        summary: 'Get account balances',
        description: 'Get all account balances with optional filtering',
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const filters = BalancesQuerySchema.parse(request.query)

        const where: any = {}
        if (filters.type) where.type = filters.type
        if (filters.isActive !== undefined) where.isActive = filters.isActive
        if (filters.currency) where.currency = filters.currency

        const skip = (filters.page - 1) * filters.limit

        const [accounts, total] = await Promise.all([
          prisma.account.findMany({
            where,
            select: {
              id: true,
              code: true,
              name: true,
              type: true,
              subType: true,
              balance: true,
              currency: true,
              isActive: true,
            },
            skip,
            take: filters.limit,
            orderBy: { code: 'asc' },
          }),
          prisma.account.count({ where }),
        ])

        // Calculate totals by type
        const allAccountsForTotals = await prisma.account.findMany({
          where,
          select: { type: true, balance: true },
        })

        const totals: Record<string, { count: number; total: Decimal }> = {}
        for (const acct of allAccountsForTotals) {
          if (!totals[acct.type]) {
            totals[acct.type] = { count: 0, total: new Decimal(0) }
          }
          totals[acct.type].count += 1
          totals[acct.type].total = totals[acct.type].total.add(acct.balance)
        }

        return reply.send({
          success: true,
          data: accounts,
          totals,
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
          error: error.message || 'Failed to get account balances',
        })
      }
    }
  )
}
