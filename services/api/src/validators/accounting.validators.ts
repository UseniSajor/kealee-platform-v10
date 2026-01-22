/**
 * Zod validation schemas for accounting operations
 */

import { z } from 'zod'
import { AccountType, AccountSubType, JournalEntryStatus } from '@kealee/database'

// ============================================================================
// Account Schemas
// ============================================================================

export const CreateAccountSchema = z.object({
  code: z.string()
    .regex(/^\d{4,}$/, 'Account code must be numeric with at least 4 digits')
    .optional(),
  name: z.string()
    .min(1, 'Account name is required')
    .max(255, 'Account name must be less than 255 characters'),
  type: z.nativeEnum(AccountType, {
    errorMap: () => ({ message: 'Invalid account type' })
  }),
  subType: z.nativeEnum(AccountSubType).optional(),
  description: z.string().max(1000).optional(),
  parentId: z.string().uuid().optional(),
  currency: z.string().length(3).toUpperCase().default('USD'),
  createdBy: z.string().uuid().optional(),
})

export const UpdateAccountSchema = z.object({
  name: z.string()
    .min(1)
    .max(255)
    .optional(),
  description: z.string().max(1000).optional(),
  isActive: z.boolean().optional(),
})

export const GetAccountBalanceSchema = z.object({
  accountId: z.string().uuid(),
  asOfDate: z.coerce.date().optional(),
  useCache: z.boolean().default(true),
})

export const GetChartOfAccountsSchema = z.object({
  includeInactive: z.boolean().default(false),
  asOfDate: z.coerce.date().optional(),
  currency: z.string().length(3).toUpperCase().optional(),
})

// ============================================================================
// Journal Entry Schemas
// ============================================================================

export const CreateJournalLineSchema = z.object({
  accountId: z.string().uuid(),
  debit: z.number()
    .nonnegative('Debit must be non-negative')
    .multipleOf(0.0001, 'Debit must have at most 4 decimal places'),
  credit: z.number()
    .nonnegative('Credit must be non-negative')
    .multipleOf(0.0001, 'Credit must have at most 4 decimal places'),
  description: z.string().max(500).optional(),
  lineOrder: z.number().int().nonnegative().optional(),
}).refine(
  (data) => {
    // A line must have either debit or credit, but not both
    const hasDebit = data.debit > 0
    const hasCredit = data.credit > 0
    return (hasDebit && !hasCredit) || (!hasDebit && hasCredit)
  },
  {
    message: 'Each line must have either a debit or credit amount, but not both',
  }
)

export const CreateJournalEntrySchema = z.object({
  description: z.string()
    .min(1, 'Description is required')
    .max(1000),
  entryDate: z.coerce.date().optional(),
  reference: z.string().max(100).optional(),
  referenceId: z.string().uuid().optional(),
  lines: z.array(CreateJournalLineSchema)
    .min(2, 'Journal entry must have at least 2 lines')
    .max(100, 'Journal entry cannot have more than 100 lines'),
  createdBy: z.string().uuid(),
}).refine(
  (data) => {
    // Validate debits equal credits
    const totalDebits = data.lines.reduce((sum, line) => sum + line.debit, 0)
    const totalCredits = data.lines.reduce((sum, line) => sum + line.credit, 0)
    
    // Allow for floating point precision issues (difference < $0.01)
    const difference = Math.abs(totalDebits - totalCredits)
    return difference < 0.01
  },
  {
    message: 'Total debits must equal total credits',
    path: ['lines'],
  }
)

export const UpdateJournalEntrySchema = z.object({
  description: z.string()
    .min(1)
    .max(1000)
    .optional(),
  entryDate: z.coerce.date().optional(),
  reference: z.string().max(100).optional(),
  referenceId: z.string().uuid().optional(),
})

export const PostJournalEntrySchema = z.object({
  entryId: z.string().uuid(),
  postedBy: z.string().uuid(),
})

export const VoidJournalEntrySchema = z.object({
  entryId: z.string().uuid(),
  voidedBy: z.string().uuid(),
  voidReason: z.string()
    .min(10, 'Void reason must be at least 10 characters')
    .max(500, 'Void reason must be less than 500 characters'),
})

export const GetJournalEntriesSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  status: z.union([
    z.nativeEnum(JournalEntryStatus),
    z.array(z.nativeEnum(JournalEntryStatus)),
  ]).optional(),
  accountId: z.string().uuid().optional(),
  reference: z.string().optional(),
  limit: z.coerce.number().int().positive().max(1000).default(100),
  offset: z.coerce.number().int().nonnegative().default(0),
})

// ============================================================================
// Reconciliation Schemas
// ============================================================================

export const ReconcileAccountSchema = z.object({
  accountId: z.string().uuid(),
  fiscalYear: z.number()
    .int()
    .min(2000, 'Fiscal year must be 2000 or later')
    .max(2100, 'Fiscal year must be 2100 or earlier'),
  fiscalPeriod: z.number()
    .int()
    .min(1, 'Fiscal period must be between 1 and 12')
    .max(12, 'Fiscal period must be between 1 and 12'),
  reconciledBy: z.string().uuid(),
  reconciliationNotes: z.string().max(1000).optional(),
})

// ============================================================================
// Helper Types (inferred from schemas)
// ============================================================================

export type CreateAccountInput = z.infer<typeof CreateAccountSchema>
export type UpdateAccountInput = z.infer<typeof UpdateAccountSchema>
export type GetAccountBalanceInput = z.infer<typeof GetAccountBalanceSchema>
export type GetChartOfAccountsInput = z.infer<typeof GetChartOfAccountsSchema>
export type CreateJournalLineInput = z.infer<typeof CreateJournalLineSchema>
export type CreateJournalEntryInput = z.infer<typeof CreateJournalEntrySchema>
export type UpdateJournalEntryInput = z.infer<typeof UpdateJournalEntrySchema>
export type PostJournalEntryInput = z.infer<typeof PostJournalEntrySchema>
export type VoidJournalEntryInput = z.infer<typeof VoidJournalEntrySchema>
export type GetJournalEntriesInput = z.infer<typeof GetJournalEntriesSchema>
export type ReconcileAccountInput = z.infer<typeof ReconcileAccountSchema>

