/**
 * Journal Entry Routes - Double-entry bookkeeping journal entries
 * Manages journal entries and their line items with approval workflow
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { authenticateUser, requireAdmin, requirePM } from '../../middleware/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../../middleware/validation.middleware'
import { prisma, Decimal } from '@kealee/database'

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const JournalEntryStatusEnum = z.enum(['DRAFT', 'POSTED', 'VOID'])

const ListJournalEntriesQuerySchema = z.object({
  status: JournalEntryStatusEnum.optional(),
  accountId: z.string().uuid().optional(),
  reference: z.string().optional(),
  referenceId: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  requiresApproval: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

const JournalEntryLineSchema = z.object({
  accountId: z.string().uuid(),
  lineOrder: z.number().int().min(0).optional(),
  debit: z.number().min(0).default(0),
  credit: z.number().min(0).default(0),
  description: z.string().max(500).optional(),
})

const CreateJournalEntryBodySchema = z.object({
  description: z.string().min(1).max(1000),
  reference: z.string().max(100).optional(),
  referenceId: z.string().uuid().optional(),
  entryDate: z.coerce.date().optional(),
  lines: z.array(JournalEntryLineSchema).min(2),
})

const IdParamSchema = z.object({
  id: z.string().uuid(),
})

const ApproveBodySchema = z.object({
  notes: z.string().max(500).optional(),
})

// ============================================================================
// HELPER: Generate entry number
// ============================================================================

async function generateEntryNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `JE-${year}-`

  const lastEntry = await prisma.journalEntry.findFirst({
    where: {
      entryNumber: { startsWith: prefix },
    },
    orderBy: { entryNumber: 'desc' },
  })

  let nextNum = 1
  if (lastEntry) {
    const lastNum = parseInt(lastEntry.entryNumber.replace(prefix, ''), 10)
    if (!isNaN(lastNum)) {
      nextNum = lastNum + 1
    }
  }

  return `${prefix}${nextNum.toString().padStart(6, '0')}`
}

// ============================================================================
// ROUTES
// ============================================================================

export async function journalEntryRoutes(fastify: FastifyInstance) {
  /**
   * GET /
   * List journal entries with filtering and pagination
   */
  fastify.get(
    '/',
    {
      preHandler: [
        authenticateUser,
        requirePM,
        validateQuery(ListJournalEntriesQuerySchema),
      ],
      schema: {
        tags: ['Finance - Journal Entries'],
        summary: 'List journal entries',
        description: 'List journal entries with optional filtering by status, date range, and account',
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const filters = ListJournalEntriesQuerySchema.parse(request.query)

        const where: any = {}
        if (filters.status) where.status = filters.status
        if (filters.reference) where.reference = filters.reference
        if (filters.referenceId) where.referenceId = filters.referenceId
        if (filters.requiresApproval !== undefined) where.requiresApproval = filters.requiresApproval

        // Date range filter
        if (filters.dateFrom || filters.dateTo) {
          where.entryDate = {}
          if (filters.dateFrom) where.entryDate.gte = filters.dateFrom
          if (filters.dateTo) where.entryDate.lte = filters.dateTo
        }

        // Account filter via lines
        if (filters.accountId) {
          where.lines = {
            some: { accountId: filters.accountId },
          }
        }

        const skip = (filters.page - 1) * filters.limit

        const [entries, total] = await Promise.all([
          prisma.journalEntry.findMany({
            where,
            include: {
              lines: {
                include: {
                  account: { select: { id: true, code: true, name: true, type: true } },
                },
                orderBy: { lineOrder: 'asc' },
              },
            },
            skip,
            take: filters.limit,
            orderBy: { entryDate: 'desc' },
          }),
          prisma.journalEntry.count({ where }),
        ])

        return reply.send({
          success: true,
          data: entries,
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
          error: error.message || 'Failed to list journal entries',
        })
      }
    }
  )

  /**
   * GET /:id
   * Get a single journal entry with all lines
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
        tags: ['Finance - Journal Entries'],
        summary: 'Get journal entry by ID',
        description: 'Get a single journal entry with all its line items',
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = IdParamSchema.parse(request.params)

        const entry = await prisma.journalEntry.findUnique({
          where: { id },
          include: {
            lines: {
              include: {
                account: { select: { id: true, code: true, name: true, type: true, subType: true } },
              },
              orderBy: { lineOrder: 'asc' },
            },
            escrowTransaction: true,
          },
        })

        if (!entry) {
          return reply.code(404).send({
            success: false,
            error: 'Journal entry not found',
          })
        }

        return reply.send({
          success: true,
          data: entry,
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: error.message || 'Failed to get journal entry',
        })
      }
    }
  )

  /**
   * POST /
   * Create a new journal entry with lines
   * Validates that debits equal credits (balanced entry)
   */
  fastify.post(
    '/',
    {
      preHandler: [
        authenticateUser,
        requirePM,
        validateBody(CreateJournalEntryBodySchema),
      ],
      schema: {
        tags: ['Finance - Journal Entries'],
        summary: 'Create journal entry',
        description: 'Create a new journal entry with line items. Debits must equal credits.',
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user!.id
        const data = CreateJournalEntryBodySchema.parse(request.body)

        // Validate debits equal credits
        let totalDebits = new Decimal(0)
        let totalCredits = new Decimal(0)
        for (const line of data.lines) {
          totalDebits = totalDebits.add(new Decimal(line.debit))
          totalCredits = totalCredits.add(new Decimal(line.credit))
        }

        if (!totalDebits.equals(totalCredits)) {
          return reply.code(400).send({
            success: false,
            error: `Journal entry is not balanced. Total debits (${totalDebits}) must equal total credits (${totalCredits})`,
          })
        }

        if (totalDebits.equals(0)) {
          return reply.code(400).send({
            success: false,
            error: 'Journal entry must have non-zero amounts',
          })
        }

        // Validate each line has either debit or credit, not both
        for (const line of data.lines) {
          if (line.debit > 0 && line.credit > 0) {
            return reply.code(400).send({
              success: false,
              error: 'Each journal entry line must have either a debit or a credit, not both',
            })
          }
          if (line.debit === 0 && line.credit === 0) {
            return reply.code(400).send({
              success: false,
              error: 'Each journal entry line must have a non-zero debit or credit',
            })
          }
        }

        // Validate all account IDs exist
        const accountIds = data.lines.map((l) => l.accountId)
        const accounts = await prisma.account.findMany({
          where: { id: { in: accountIds } },
          select: { id: true, isActive: true },
        })

        const foundIds = new Set(accounts.map((a) => a.id))
        const missingIds = accountIds.filter((id) => !foundIds.has(id))
        if (missingIds.length > 0) {
          return reply.code(400).send({
            success: false,
            error: `Account(s) not found: ${missingIds.join(', ')}`,
          })
        }

        const inactiveAccounts = accounts.filter((a) => !a.isActive)
        if (inactiveAccounts.length > 0) {
          return reply.code(400).send({
            success: false,
            error: `Cannot post to inactive account(s): ${inactiveAccounts.map((a) => a.id).join(', ')}`,
          })
        }

        // Auto-set approval requirement for large transactions (> $10,000)
        const requiresApproval = totalDebits.greaterThan(10000)

        // Generate entry number
        const entryNumber = await generateEntryNumber()

        // Create entry with lines in a transaction
        const entry = await prisma.$transaction(async (tx) => {
          const journalEntry = await tx.journalEntry.create({
            data: {
              entryNumber,
              description: data.description,
              reference: data.reference,
              referenceId: data.referenceId,
              entryDate: data.entryDate || new Date(),
              status: 'DRAFT',
              requiresApproval,
              createdBy: userId,
              lines: {
                create: data.lines.map((line, index) => ({
                  accountId: line.accountId,
                  lineOrder: line.lineOrder ?? index,
                  debit: new Decimal(line.debit),
                  credit: new Decimal(line.credit),
                  description: line.description,
                })),
              },
            },
            include: {
              lines: {
                include: {
                  account: { select: { id: true, code: true, name: true, type: true } },
                },
                orderBy: { lineOrder: 'asc' },
              },
            },
          })

          return journalEntry
        })

        return reply.code(201).send({
          success: true,
          data: entry,
          message: 'Journal entry created successfully',
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: error.message || 'Failed to create journal entry',
        })
      }
    }
  )

  /**
   * POST /:id/post
   * Post (finalize) a journal entry - makes it immutable and updates account balances
   */
  fastify.post(
    '/:id/post',
    {
      preHandler: [
        authenticateUser,
        requireAdmin,
        validateParams(IdParamSchema),
      ],
      schema: {
        tags: ['Finance - Journal Entries'],
        summary: 'Post journal entry',
        description: 'Post (finalize) a journal entry, updating account balances. Entry becomes immutable.',
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user!.id
        const { id } = IdParamSchema.parse(request.params)

        const entry = await prisma.journalEntry.findUnique({
          where: { id },
          include: {
            lines: {
              include: { account: true },
            },
          },
        })

        if (!entry) {
          return reply.code(404).send({
            success: false,
            error: 'Journal entry not found',
          })
        }

        if (entry.status !== 'DRAFT') {
          return reply.code(400).send({
            success: false,
            error: `Cannot post entry with status '${entry.status}'. Only DRAFT entries can be posted.`,
          })
        }

        // Check approval requirement
        if (entry.requiresApproval && !entry.approvedBy) {
          return reply.code(400).send({
            success: false,
            error: 'This entry requires approval before posting. Please approve first.',
          })
        }

        // Post entry and update account balances in a transaction
        const postedEntry = await prisma.$transaction(async (tx) => {
          // Update entry status
          const updated = await tx.journalEntry.update({
            where: { id },
            data: {
              status: 'POSTED',
              postedAt: new Date(),
              postedBy: userId,
            },
          })

          // Update account balances
          for (const line of entry.lines) {
            const account = line.account
            let balanceChange: Decimal

            // Assets and Expenses: Debits increase, Credits decrease
            // Liabilities, Equity, Revenue: Credits increase, Debits decrease
            if (account.type === 'ASSET' || account.type === 'EXPENSE') {
              balanceChange = line.debit.sub(line.credit)
            } else {
              balanceChange = line.credit.sub(line.debit)
            }

            await tx.account.update({
              where: { id: line.accountId },
              data: {
                balance: { increment: balanceChange },
              },
            })
          }

          return updated
        })

        // Re-fetch with full includes
        const result = await prisma.journalEntry.findUnique({
          where: { id },
          include: {
            lines: {
              include: {
                account: { select: { id: true, code: true, name: true, type: true, balance: true } },
              },
              orderBy: { lineOrder: 'asc' },
            },
          },
        })

        return reply.send({
          success: true,
          data: result,
          message: 'Journal entry posted successfully',
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: error.message || 'Failed to post journal entry',
        })
      }
    }
  )

  /**
   * POST /:id/approve
   * Approve a journal entry that requires approval
   */
  fastify.post(
    '/:id/approve',
    {
      preHandler: [
        authenticateUser,
        requireAdmin,
        validateParams(IdParamSchema),
        validateBody(ApproveBodySchema),
      ],
      schema: {
        tags: ['Finance - Journal Entries'],
        summary: 'Approve journal entry',
        description: 'Approve a journal entry that requires approval before posting',
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user!.id
        const { id } = IdParamSchema.parse(request.params)

        const entry = await prisma.journalEntry.findUnique({ where: { id } })

        if (!entry) {
          return reply.code(404).send({
            success: false,
            error: 'Journal entry not found',
          })
        }

        if (entry.status !== 'DRAFT') {
          return reply.code(400).send({
            success: false,
            error: `Cannot approve entry with status '${entry.status}'. Only DRAFT entries can be approved.`,
          })
        }

        if (!entry.requiresApproval) {
          return reply.code(400).send({
            success: false,
            error: 'This entry does not require approval',
          })
        }

        if (entry.approvedBy) {
          return reply.code(400).send({
            success: false,
            error: 'This entry has already been approved',
          })
        }

        // Cannot approve your own entry
        if (entry.createdBy === userId) {
          return reply.code(400).send({
            success: false,
            error: 'Cannot approve your own journal entry',
          })
        }

        const approved = await prisma.journalEntry.update({
          where: { id },
          data: {
            approvedBy: userId,
            approvedAt: new Date(),
          },
          include: {
            lines: {
              include: {
                account: { select: { id: true, code: true, name: true, type: true } },
              },
              orderBy: { lineOrder: 'asc' },
            },
          },
        })

        return reply.send({
          success: true,
          data: approved,
          message: 'Journal entry approved successfully',
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: error.message || 'Failed to approve journal entry',
        })
      }
    }
  )
}
