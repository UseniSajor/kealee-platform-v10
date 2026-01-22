/**
 * Accounting-specific type definitions
 */

import { Account, AccountType, AccountSubType, JournalEntry, JournalEntryStatus, Decimal } from '@kealee/database'

// ============================================================================
// Account DTOs
// ============================================================================

export interface CreateAccountDTO {
  code?: string // Optional: auto-generated if not provided
  name: string
  type: AccountType
  subType?: AccountSubType
  description?: string
  parentId?: string
  currency?: string
  createdBy?: string
}

export interface UpdateAccountDTO {
  name?: string
  description?: string
  isActive?: boolean
}

export interface AccountBalanceDTO {
  accountId: string
  accountCode: string
  accountName: string
  openingBalance: Decimal
  totalDebits: Decimal
  totalCredits: Decimal
  closingBalance: Decimal
  currency: string
  asOfDate: Date
}

export interface ChartOfAccountsNode extends Account {
  children?: ChartOfAccountsNode[]
}

// ============================================================================
// Journal Entry DTOs
// ============================================================================

export interface CreateJournalEntryDTO {
  description: string
  entryDate?: Date
  reference?: string
  referenceId?: string
  lines: CreateJournalLineDTO[]
  createdBy: string
}

export interface CreateJournalLineDTO {
  accountId: string
  debit: number
  credit: number
  description?: string
  lineOrder?: number
}

export interface UpdateJournalEntryDTO {
  description?: string
  entryDate?: Date
  reference?: string
  referenceId?: string
}

export interface PostJournalEntryDTO {
  entryId: string
  postedBy: string
}

export interface VoidJournalEntryDTO {
  entryId: string
  voidedBy: string
  voidReason: string
}

export interface JournalEntryWithLines {
  id: string
  entryNumber: string
  description: string
  reference: string | null
  referenceId: string | null
  entryDate: Date
  status: JournalEntryStatus
  requiresApproval: boolean
  approvedBy: string | null
  approvedAt: Date | null
  postedAt: Date | null
  postedBy: string | null
  voidedAt: Date | null
  voidedBy: string | null
  voidReason: string | null
  createdAt: Date
  createdBy: string
  updatedAt: Date
  lines: JournalLineWithAccount[]
}

export interface JournalLineWithAccount {
  id: string
  journalEntryId: string
  accountId: string
  lineOrder: number
  debit: Decimal
  credit: Decimal
  description: string | null | undefined
  createdAt: Date
  account: {
    id: string
    code: string
    name: string
    type: AccountType
  }
}

// ============================================================================
// Reconciliation DTOs
// ============================================================================

export interface ReconcileAccountDTO {
  accountId: string
  fiscalYear: number
  fiscalPeriod: number
  reconciledBy: string
  reconciliationNotes?: string
}

export interface ReconciliationResult {
  accountId: string
  accountCode: string
  accountName: string
  fiscalYear: number
  fiscalPeriod: number
  
  // Expected (from journal entries)
  expectedOpeningBalance: Decimal
  expectedDebitTotal: Decimal
  expectedCreditTotal: Decimal
  expectedClosingBalance: Decimal
  
  // Actual (from AccountBalance record)
  actualOpeningBalance: Decimal | null
  actualDebitTotal: Decimal | null
  actualCreditTotal: Decimal | null
  actualClosingBalance: Decimal | null
  
  // Discrepancies
  hasDiscrepancy: boolean
  openingBalanceDiscrepancy: Decimal
  debitDiscrepancy: Decimal
  creditDiscrepancy: Decimal
  closingBalanceDiscrepancy: Decimal
  
  // Result
  isReconciled: boolean
  reconciledAt: Date | null
  reconciledBy: string | null
  reconciliationNotes: string | null
}

// ============================================================================
// Account Code Generation
// ============================================================================

export interface AccountCodeRange {
  type: AccountType
  min: number
  max: number
  prefix?: string
}

export const ACCOUNT_CODE_RANGES: Record<AccountType, AccountCodeRange> = {
  ASSET: { type: 'ASSET', min: 1000, max: 1999 },
  LIABILITY: { type: 'LIABILITY', min: 2000, max: 2999 },
  EQUITY: { type: 'EQUITY', min: 3000, max: 3999 },
  REVENUE: { type: 'REVENUE', min: 4000, max: 4999 },
  EXPENSE: { type: 'EXPENSE', min: 5000, max: 5999 },
}

// ============================================================================
// Query Options
// ============================================================================

export interface GetChartOfAccountsOptions {
  includeInactive?: boolean
  asOfDate?: Date
  currency?: string
}

export interface GetAccountBalanceOptions {
  asOfDate?: Date
  useCache?: boolean
}

export interface GetJournalEntriesOptions {
  startDate?: Date
  endDate?: Date
  status?: JournalEntryStatus | JournalEntryStatus[]
  accountId?: string
  reference?: string
  limit?: number
  offset?: number
}

