/**
 * Accounting Routes
 * REST API for journal entries and chart of accounts
 */

import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { validateBody, validateParams, validateQuery } from '../middleware/validation.middleware'
import { authenticateUser, requireRole, AuthenticatedRequest } from '../middleware/auth.middleware'
import { accountService } from '../modules/finance/account.service'
import { journalEntryService } from '../modules/finance/journal-entry.service'
import {
  CreateJournalEntrySchema,
  CreateAccountSchema,
  PostJournalEntrySchema,
  VoidJournalEntrySchema,
  GetJournalEntriesSchema,
  GetAccountBalanceSchema,
  ReconcileAccountSchema,
} from '../validators/accounting.validators'

// ============================================================================
// Additional Schemas for Routes
// ============================================================================

const EntryIdParamSchema = z.object({
  id: z.string().uuid(),
})

const AccountIdParamSchema = z.object({
  id: z.string().uuid(),
})

const ApproveJournalEntryBodySchema = z.object({
  // Empty body - approver comes from auth
})

// ============================================================================
// Role-based access control
// ============================================================================

const requireFinance = requireRole(['admin', 'finance', 'pm'])
const requireFinanceApprover = requireRole(['admin', 'finance_approver'])

// ============================================================================
// Routes
// ============================================================================

export async function accountingRoutes(fastify: FastifyInstance) {
  
  // ==========================================================================
  // JOURNAL ENTRY ROUTES
  // ==========================================================================

  /**
   * POST /api/accounting/journal-entries
   * Create a new journal entry in DRAFT status
   */
  fastify.post(
    '/journal-entries',
    {
      schema: {
        description: 'Create a new journal entry',
        tags: ['accounting'],
        response: {
          201: {
            type: 'object',
            properties: {
              journalEntry: { type: 'object' },
              message: { type: 'string' },
            },
          },
        },
      },
      preHandler: [
        authenticateUser,
        requireFinance,
        validateBody(CreateJournalEntrySchema),
      ],
    },
    async (request: AuthenticatedRequest, reply) => {
      const body = request.body as z.infer<typeof CreateJournalEntrySchema>
      
      const journalEntry = await journalEntryService.createJournalEntry({
        ...body,
        createdBy: request.user!.id,
      })

      return reply.code(201).send({
        journalEntry,
        message: 'Journal entry created successfully',
      })
    }
  )

  /**
   * GET /api/accounting/journal-entries/:id
   * Get a single journal entry with all details
   */
  fastify.get(
    '/journal-entries/:id',
    {
      schema: {
        description: 'Get journal entry by ID',
        tags: ['accounting'],
        response: {
          200: {
            type: 'object',
            properties: {
              journalEntry: { type: 'object' },
            },
          },
        },
      },
      preHandler: [
        authenticateUser,
        requireFinance,
        validateParams(EntryIdParamSchema),
      ],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as z.infer<typeof EntryIdParamSchema>
      
      const journalEntry = await journalEntryService.getJournalEntry(id)

      return reply.send({ journalEntry })
    }
  )

  /**
   * GET /api/accounting/journal-entries
   * List journal entries with filtering and pagination
   */
  fastify.get(
    '/journal-entries',
    {
      schema: {
        description: 'List journal entries with filters',
        tags: ['accounting'],
        response: {
          200: {
            type: 'object',
            properties: {
              data: { type: 'array' },
              total: { type: 'number' },
              page: { type: 'number' },
              pageSize: { type: 'number' },
              totalPages: { type: 'number' },
            },
          },
        },
      },
      preHandler: [
        authenticateUser,
        requireFinance,
        validateQuery(GetJournalEntriesSchema),
      ],
    },
    async (request: AuthenticatedRequest, reply) => {
      const query = request.query as z.infer<typeof GetJournalEntriesSchema>
      
      const result = await journalEntryService.listJournalEntries(query)

      return reply.send(result)
    }
  )

  /**
   * POST /api/accounting/journal-entries/:id/post
   * Post a journal entry (make it permanent and update account balances)
   */
  fastify.post(
    '/journal-entries/:id/post',
    {
      schema: {
        description: 'Post journal entry to make it permanent',
        tags: ['accounting'],
        response: {
          200: {
            type: 'object',
            properties: {
              journalEntry: { type: 'object' },
              message: { type: 'string' },
            },
          },
        },
      },
      preHandler: [
        authenticateUser,
        requireFinance,
        validateParams(EntryIdParamSchema),
      ],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as z.infer<typeof EntryIdParamSchema>
      
      const journalEntry = await journalEntryService.postJournalEntry({
        entryId: id,
        postedBy: request.user!.id,
      })

      return reply.send({
        journalEntry,
        message: 'Journal entry posted successfully',
      })
    }
  )

  /**
   * POST /api/accounting/journal-entries/:id/approve
   * Approve a journal entry requiring dual approval (entries > $10,000)
   */
  fastify.post(
    '/journal-entries/:id/approve',
    {
      schema: {
        description: 'Approve journal entry requiring approval',
        tags: ['accounting'],
        response: {
          200: {
            type: 'object',
            properties: {
              journalEntry: { type: 'object' },
              message: { type: 'string' },
            },
          },
        },
      },
      preHandler: [
        authenticateUser,
        requireFinanceApprover,
        validateParams(EntryIdParamSchema),
        validateBody(ApproveJournalEntryBodySchema),
      ],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as z.infer<typeof EntryIdParamSchema>
      
      const journalEntry = await journalEntryService.approveJournalEntry(
        id,
        request.user!.id
      )

      return reply.send({
        journalEntry,
        message: 'Journal entry approved successfully',
      })
    }
  )

  /**
   * POST /api/accounting/journal-entries/:id/void
   * Void a posted journal entry by creating a reversing entry
   */
  fastify.post(
    '/journal-entries/:id/void',
    {
      schema: {
        description: 'Void journal entry with reversing entry',
        tags: ['accounting'],
        response: {
          200: {
            type: 'object',
            properties: {
              originalEntry: { type: 'object' },
              reversingEntry: { type: 'object' },
              message: { type: 'string' },
            },
          },
        },
      },
      preHandler: [
        authenticateUser,
        requireFinance,
        validateParams(EntryIdParamSchema),
        validateBody(VoidJournalEntrySchema.omit({ entryId: true, voidedBy: true })),
      ],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as z.infer<typeof EntryIdParamSchema>
      const { voidReason } = request.body as { voidReason: string }
      
      const result = await journalEntryService.voidJournalEntry({
        entryId: id,
        voidedBy: request.user!.id,
        voidReason,
      })

      return reply.send({
        originalEntry: result.originalEntry,
        reversingEntry: result.reversingEntry,
        message: 'Journal entry voided successfully',
      })
    }
  )

  /**
   * DELETE /api/accounting/journal-entries/:id
   * Delete a DRAFT journal entry (only drafts can be deleted)
   */
  fastify.delete(
    '/journal-entries/:id',
    {
      schema: {
        description: 'Delete a draft journal entry',
        tags: ['accounting'],
        response: {
          200: {
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
      preHandler: [
        authenticateUser,
        requireFinance,
        validateParams(EntryIdParamSchema),
      ],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as z.infer<typeof EntryIdParamSchema>
      
      await journalEntryService.deleteDraftEntry(id)

      return reply.send({
        message: 'Draft journal entry deleted successfully',
      })
    }
  )

  // ==========================================================================
  // ACCOUNT ROUTES
  // ==========================================================================

  /**
   * GET /api/accounting/accounts
   * Get chart of accounts (hierarchical structure)
   */
  fastify.get(
    '/accounts',
    {
      schema: {
        description: 'Get chart of accounts',
        tags: ['accounting'],
        response: {
          200: {
            type: 'object',
            properties: {
              accounts: { type: 'array' },
            },
          },
        },
      },
      preHandler: [
        authenticateUser,
        requireFinance,
      ],
    },
    async (request: AuthenticatedRequest, reply) => {
      const accounts = await accountService.getChartOfAccounts()

      return reply.send({ accounts })
    }
  )

  /**
   * GET /api/accounting/accounts/:id
   * Get a single account with details
   */
  fastify.get(
    '/accounts/:id',
    {
      schema: {
        description: 'Get account by ID',
        tags: ['accounting'],
        response: {
          200: {
            type: 'object',
            properties: {
              account: { type: 'object' },
            },
          },
        },
      },
      preHandler: [
        authenticateUser,
        requireFinance,
        validateParams(AccountIdParamSchema),
      ],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as z.infer<typeof AccountIdParamSchema>
      
      const account = await accountService.getAccount(id)

      return reply.send({ account })
    }
  )

  /**
   * GET /api/accounting/accounts/:id/balance
   * Get account balance (current or as of specific date)
   */
  fastify.get(
    '/accounts/:id/balance',
    {
      schema: {
        description: 'Get account balance',
        tags: ['accounting'],
        response: {
          200: {
            type: 'object',
            properties: {
              balance: { type: 'object' },
            },
          },
        },
      },
      preHandler: [
        authenticateUser,
        requireFinance,
        validateParams(AccountIdParamSchema),
        validateQuery(GetAccountBalanceSchema.omit({ accountId: true })),
      ],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as z.infer<typeof AccountIdParamSchema>
      const query = request.query as { asOfDate?: Date; useCache?: boolean }
      
      const balance = await accountService.getAccountBalance(id, {
        asOfDate: query.asOfDate,
        useCache: query.useCache ?? true,
      })

      return reply.send({ balance })
    }
  )

  /**
   * POST /api/accounting/accounts
   * Create a new account
   */
  fastify.post(
    '/accounts',
    {
      schema: {
        description: 'Create a new account',
        tags: ['accounting'],
        response: {
          201: {
            type: 'object',
            properties: {
              account: { type: 'object' },
              message: { type: 'string' },
            },
          },
        },
      },
      preHandler: [
        authenticateUser,
        requireFinance,
        validateBody(CreateAccountSchema),
      ],
    },
    async (request: AuthenticatedRequest, reply) => {
      const body = request.body as z.infer<typeof CreateAccountSchema>
      
      const account = await accountService.createAccount({
        ...body,
        createdBy: request.user!.id,
      })

      return reply.code(201).send({
        account,
        message: 'Account created successfully',
      })
    }
  )

  /**
   * POST /api/accounting/accounts/:id/reconcile
   * Reconcile an account for a specific period
   */
  fastify.post(
    '/accounts/:id/reconcile',
    {
      schema: {
        description: 'Reconcile account for a period',
        tags: ['accounting'],
        response: {
          200: {
            type: 'object',
            properties: {
              reconciliation: { type: 'object' },
              message: { type: 'string' },
            },
          },
        },
      },
      preHandler: [
        authenticateUser,
        requireFinance,
        validateParams(AccountIdParamSchema),
        validateBody(ReconcileAccountSchema.omit({ accountId: true, reconciledBy: true })),
      ],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as z.infer<typeof AccountIdParamSchema>
      const body = request.body as { fiscalYear: number; fiscalPeriod: number; reconciliationNotes?: string }
      
      const reconciliation = await accountService.reconcileAccount({
        accountId: id,
        fiscalYear: body.fiscalYear,
        fiscalPeriod: body.fiscalPeriod,
        reconciledBy: request.user!.id,
        reconciliationNotes: body.reconciliationNotes,
      })

      return reply.send({
        reconciliation,
        message: reconciliation.isReconciled
          ? 'Account reconciled successfully'
          : `Account reconciliation completed with discrepancies (difference: $${reconciliation.closingBalanceDiscrepancy.toFixed(2)})`,
      })
    }
  )

  /**
   * PATCH /api/accounting/accounts/:id/deactivate
   * Deactivate an account (soft delete)
   */
  fastify.patch(
    '/accounts/:id/deactivate',
    {
      schema: {
        description: 'Deactivate an account',
        tags: ['accounting'],
        response: {
          200: {
            type: 'object',
            properties: {
              account: { type: 'object' },
              message: { type: 'string' },
            },
          },
        },
      },
      preHandler: [
        authenticateUser,
        requireFinance,
        validateParams(AccountIdParamSchema),
      ],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as z.infer<typeof AccountIdParamSchema>
      
      const account = await accountService.deactivateAccount(id)

      return reply.send({
        account,
        message: 'Account deactivated successfully',
      })
    }
  )

  /**
   * PATCH /api/accounting/accounts/:id/reactivate
   * Reactivate a deactivated account
   */
  fastify.patch(
    '/accounts/:id/reactivate',
    {
      schema: {
        description: 'Reactivate an account',
        tags: ['accounting'],
        response: {
          200: {
            type: 'object',
            properties: {
              account: { type: 'object' },
              message: { type: 'string' },
            },
          },
        },
      },
      preHandler: [
        authenticateUser,
        requireFinance,
        validateParams(AccountIdParamSchema),
      ],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as z.infer<typeof AccountIdParamSchema>
      
      const account = await accountService.reactivateAccount(id)

      return reply.send({
        account,
        message: 'Account reactivated successfully',
      })
    }
  )
}

