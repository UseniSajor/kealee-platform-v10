/**
 * Frontend TypeScript types for Accounting System
 * Mirrors backend types with frontend conventions
 */

// ============================================================================
// Account Types
// ============================================================================

export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE'

export type AccountSubType =
  // Assets (1000-1999)
  | 'CASH'
  | 'ESCROW_HOLDINGS'
  | 'ACCOUNTS_RECEIVABLE'
  | 'PREPAID_EXPENSES'
  // Liabilities (2000-2999)
  | 'ACCOUNTS_PAYABLE'
  | 'ESCROW_LIABILITIES'
  | 'PLATFORM_FEES_PAYABLE'
  | 'DEFERRED_REVENUE'
  // Equity (3000-3999)
  | 'RETAINED_EARNINGS'
  | 'OWNER_EQUITY'
  // Revenue (4000-4999)
  | 'PLATFORM_FEES'
  | 'TRANSACTION_FEES'
  | 'SUBSCRIPTION_REVENUE'
  // Expenses (5000-5999)
  | 'PROCESSING_FEES'
  | 'OPERATING_EXPENSES'
  | 'CONTRACTOR_PAYOUTS'

export interface Account {
  id: string
  code: string
  name: string
  type: AccountType
  subType?: AccountSubType
  description?: string
  parentId?: string
  isActive: boolean
  balance: number
  currency: string
  createdAt: Date | string
  updatedAt: Date | string
  createdBy?: string
  parent?: Account
  children?: Account[]
}

export interface ChartOfAccountsNode extends Account {
  children: ChartOfAccountsNode[]
}

export interface CreateAccountDTO {
  code?: string // Optional - auto-generated if not provided
  name: string
  type: AccountType
  subType?: AccountSubType
  description?: string
  parentId?: string
  currency?: string
}

export interface UpdateAccountDTO {
  name?: string
  description?: string
  parentId?: string | null
  isActive?: boolean
  currency?: string
}

export interface AccountBalanceDTO {
  accountId: string
  accountCode: string
  accountName: string
  openingBalance: number
  totalDebits: number
  totalCredits: number
  closingBalance: number
  currency: string
  asOfDate: Date | string
}

// ============================================================================
// Journal Entry Types
// ============================================================================

export type JournalEntryStatus = 'DRAFT' | 'POSTED' | 'VOID'

export interface JournalEntryLine {
  id: string
  journalEntryId: string
  accountId: string
  lineOrder: number
  debit: number
  credit: number
  description?: string
  createdAt: Date | string
  account: {
    id: string
    code: string
    name: string
    type: AccountType
  }
}

export interface JournalEntry {
  id: string
  entryNumber: string
  description: string
  reference?: string
  referenceId?: string
  entryDate: Date | string
  status: JournalEntryStatus
  requiresApproval: boolean
  approvedBy?: string
  approvedAt?: Date | string
  postedAt?: Date | string
  postedBy?: string
  voidedAt?: Date | string
  voidedBy?: string
  voidReason?: string
  createdAt: Date | string
  createdBy: string
  updatedAt: Date | string
  lines: JournalEntryLine[]
}

export interface JournalEntryLineInput {
  accountId: string
  debit: number
  credit: number
  description?: string
  lineOrder?: number
}

export interface CreateJournalEntryDTO {
  description: string
  entryDate?: Date | string
  reference?: string
  referenceId?: string
  lines: JournalEntryLineInput[]
}

export interface JournalEntryFilters {
  startDate?: Date | string
  endDate?: Date | string
  status?: JournalEntryStatus | JournalEntryStatus[]
  accountId?: string
  reference?: string
  page?: number
  limit?: number
  offset?: number
}

// ============================================================================
// Reconciliation Types
// ============================================================================

export interface ReconcileAccountDTO {
  fiscalYear: number
  fiscalPeriod: number // 1-12 for months
  reconciliationNotes?: string
}

export interface ReconciliationResult {
  accountId: string
  accountCode: string
  accountName: string
  fiscalYear: number
  fiscalPeriod: number
  expectedOpeningBalance: number
  expectedDebitTotal: number
  expectedCreditTotal: number
  expectedClosingBalance: number
  actualOpeningBalance: number
  actualDebitTotal: number
  actualCreditTotal: number
  actualClosingBalance: number
  hasDiscrepancy: boolean
  openingBalanceDiscrepancy: number
  debitDiscrepancy: number
  creditDiscrepancy: number
  closingBalanceDiscrepancy: number
  isReconciled: boolean
  reconciledAt?: Date | string
  reconciledBy?: string
  reconciliationNotes?: string
  report?: string[]
}

// ============================================================================
// API Response Types
// ============================================================================

export interface AccountResponse {
  account: Account
  message: string
}

export interface AccountListResponse {
  accounts: ChartOfAccountsNode[]
}

export interface AccountBalanceResponse {
  balance: AccountBalanceDTO
}

export interface JournalEntryResponse {
  journalEntry: JournalEntry
  message: string
}

export interface VoidEntryResponse {
  originalEntry: JournalEntry
  reversingEntry: JournalEntry
  message: string
}

export interface ReconciliationResponse {
  reconciliation: ReconciliationResult
  message: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ============================================================================
// Error Types
// ============================================================================

export interface ApiError {
  message: string
  code?: string
  details?: any
  status?: number
}

// ============================================================================
// Utility Types
// ============================================================================

export interface GetAccountBalanceOptions {
  asOfDate?: Date | string
  useCache?: boolean
}

// ============================================================================
// Constants
// ============================================================================

export const ACCOUNT_CODE_RANGES: Record<AccountType, { start: number; end: number }> = {
  ASSET: { start: 1000, end: 1999 },
  LIABILITY: { start: 2000, end: 2999 },
  EQUITY: { start: 3000, end: 3999 },
  REVENUE: { start: 4000, end: 4999 },
  EXPENSE: { start: 5000, end: 5999 },
}

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  ASSET: 'Assets',
  LIABILITY: 'Liabilities',
  EQUITY: 'Equity',
  REVENUE: 'Revenue',
  EXPENSE: 'Expenses',
}

export const JOURNAL_ENTRY_STATUS_LABELS: Record<JournalEntryStatus, string> = {
  DRAFT: 'Draft',
  POSTED: 'Posted',
  VOID: 'Voided',
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Parse API date strings to Date objects
 */
export function parseDates<T extends Record<string, any>>(
  obj: T,
  dateFields: (keyof T)[]
): T {
  const result = { ...obj }
  for (const field of dateFields) {
    if (result[field] && typeof result[field] === 'string') {
      result[field] = new Date(result[field] as string) as any
    }
  }
  return result
}

/**
 * Format date to ISO string for API
 */
export function formatDateForApi(date: Date | string | undefined): string | undefined {
  if (!date) return undefined
  return typeof date === 'string' ? date : date.toISOString()
}

/**
 * Calculate balance based on account type
 */
export function calculateBalance(
  accountType: AccountType,
  totalDebits: number,
  totalCredits: number
): number {
  if (accountType === 'ASSET' || accountType === 'EXPENSE') {
    return totalDebits - totalCredits
  } else {
    // LIABILITY, EQUITY, REVENUE
    return totalCredits - totalDebits
  }
}

/**
 * Validate journal entry lines
 */
export function validateJournalLines(lines: JournalEntryLineInput[]): {
  isValid: boolean
  errors: string[]
  totalDebits: number
  totalCredits: number
} {
  const errors: string[] = []
  
  if (lines.length < 2) {
    errors.push('Journal entry must have at least 2 lines')
  }
  
  let totalDebits = 0
  let totalCredits = 0
  
  lines.forEach((line, index) => {
    if (line.debit > 0 && line.credit > 0) {
      errors.push(`Line ${index + 1}: Cannot have both debit and credit`)
    }
    if (line.debit === 0 && line.credit === 0) {
      errors.push(`Line ${index + 1}: Must have either debit or credit amount`)
    }
    if (line.debit < 0 || line.credit < 0) {
      errors.push(`Line ${index + 1}: Amounts cannot be negative`)
    }
    
    totalDebits += line.debit
    totalCredits += line.credit
  })
  
  const difference = Math.abs(totalDebits - totalCredits)
  if (difference > 0.01) {
    errors.push(
      `Debits must equal credits. Difference: $${difference.toFixed(2)} (Debits: $${totalDebits.toFixed(2)}, Credits: $${totalCredits.toFixed(2)})`
    )
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    totalDebits,
    totalCredits,
  }
}

/**
 * Format currency amount
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  showSign: boolean = false
): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  
  const formatted = formatter.format(Math.abs(amount))
  
  if (showSign && amount !== 0) {
    return amount > 0 ? `+${formatted}` : `-${formatted}`
  }
  
  return formatted
}

/**
 * Get account type badge color
 */
export function getAccountTypeBadgeColor(type: AccountType): string {
  switch (type) {
    case 'ASSET':
      return 'bg-green-100 text-green-800'
    case 'LIABILITY':
      return 'bg-red-100 text-red-800'
    case 'EQUITY':
      return 'bg-blue-100 text-blue-800'
    case 'REVENUE':
      return 'bg-purple-100 text-purple-800'
    case 'EXPENSE':
      return 'bg-orange-100 text-orange-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

/**
 * Get journal entry status badge color
 */
export function getJournalStatusBadgeColor(status: JournalEntryStatus): string {
  switch (status) {
    case 'DRAFT':
      return 'bg-yellow-100 text-yellow-800'
    case 'POSTED':
      return 'bg-green-100 text-green-800'
    case 'VOID':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

