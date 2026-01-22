/**
 * Accounting API Client
 * Type-safe API client for accounting system operations using Supabase Auth
 */

import { createClient } from '@supabase/supabase-js'
import type {
  Account,
  AccountBalanceDTO,
  AccountBalanceResponse,
  AccountListResponse,
  AccountResponse,
  ChartOfAccountsNode,
  CreateAccountDTO,
  CreateJournalEntryDTO,
  GetAccountBalanceOptions,
  JournalEntry,
  JournalEntryFilters,
  JournalEntryResponse,
  PaginatedResponse,
  ReconcileAccountDTO,
  ReconciliationResponse,
  ReconciliationResult,
  UpdateAccountDTO,
  VoidEntryResponse,
} from '../types/accounting.types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// Create Supabase client for auth
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export class AccountingApiService {
  /**
   * Get authentication token from Supabase session
   */
  private static async getAuthToken(): Promise<string | null> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      return session?.access_token || null
    } catch (error) {
      console.error('Error getting auth token:', error)
      return null
    }
  }

  /**
   * Make authenticated API request
   */
  private static async fetchWithAuth(
    endpoint: string,
    options: RequestInit = {}
  ) {
    const token = await this.getAuthToken()

    if (!token) {
      throw new Error('Not authenticated')
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    })

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: 'Unknown error' }))
      throw new Error(
        error.error?.message || error.message || `HTTP ${response.status}`
      )
    }

    return response.json()
  }

  /**
   * Format date for API (convert Date to ISO string)
   */
  private static formatDate(date: Date | string | undefined): string | undefined {
    if (!date) return undefined
    return typeof date === 'string' ? date : date.toISOString()
  }

  /**
   * Build query string from filters
   */
  private static buildQueryString(params: Record<string, any>): string {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (value instanceof Date) {
          query.set(key, value.toISOString())
        } else if (Array.isArray(value)) {
          value.forEach((v) => query.append(key, String(v)))
        } else {
          query.set(key, String(value))
        }
      }
    })
    return query.toString()
  }

  // ==========================================================================
  // JOURNAL ENTRY ENDPOINTS
  // ==========================================================================

  /**
   * Create a new journal entry in DRAFT status
   */
  static async createJournalEntry(
    data: CreateJournalEntryDTO
  ): Promise<JournalEntryResponse> {
    const body = {
      ...data,
      entryDate: this.formatDate(data.entryDate),
    }

    return this.fetchWithAuth('/accounting/journal-entries', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  /**
   * Get a single journal entry by ID
   */
  static async getJournalEntry(id: string): Promise<JournalEntryResponse> {
    return this.fetchWithAuth(`/accounting/journal-entries/${id}`)
  }

  /**
   * List journal entries with filtering and pagination
   */
  static async listJournalEntries(
    filters?: JournalEntryFilters
  ): Promise<PaginatedResponse<JournalEntry>> {
    const query = filters ? this.buildQueryString({
      startDate: this.formatDate(filters.startDate),
      endDate: this.formatDate(filters.endDate),
      status: filters.status,
      accountId: filters.accountId,
      reference: filters.reference,
      page: filters.page,
      limit: filters.limit,
      offset: filters.offset,
    }) : ''

    return this.fetchWithAuth(
      `/accounting/journal-entries${query ? `?${query}` : ''}`
    )
  }

  /**
   * Post a journal entry (make it permanent and update account balances)
   */
  static async postJournalEntry(id: string): Promise<JournalEntryResponse> {
    return this.fetchWithAuth(`/accounting/journal-entries/${id}/post`, {
      method: 'POST',
    })
  }

  /**
   * Approve a journal entry requiring approval (entries > $10,000)
   */
  static async approveJournalEntry(id: string): Promise<JournalEntryResponse> {
    return this.fetchWithAuth(`/accounting/journal-entries/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({}),
    })
  }

  /**
   * Void a posted journal entry by creating a reversing entry
   */
  static async voidJournalEntry(
    id: string,
    voidReason: string
  ): Promise<VoidEntryResponse> {
    return this.fetchWithAuth(`/accounting/journal-entries/${id}/void`, {
      method: 'POST',
      body: JSON.stringify({ voidReason }),
    })
  }

  /**
   * Delete a DRAFT journal entry
   */
  static async deleteDraftEntry(id: string): Promise<{ message: string }> {
    return this.fetchWithAuth(`/accounting/journal-entries/${id}`, {
      method: 'DELETE',
    })
  }

  // ==========================================================================
  // ACCOUNT ENDPOINTS
  // ==========================================================================

  /**
   * Get chart of accounts (hierarchical structure)
   */
  static async getChartOfAccounts(): Promise<AccountListResponse> {
    return this.fetchWithAuth('/accounting/accounts')
  }

  /**
   * Get a single account by ID
   */
  static async getAccount(id: string): Promise<AccountResponse> {
    return this.fetchWithAuth(`/accounting/accounts/${id}`)
  }

  /**
   * Get account balance (current or as of specific date)
   */
  static async getAccountBalance(
    id: string,
    options?: GetAccountBalanceOptions
  ): Promise<AccountBalanceResponse> {
    const query = options ? this.buildQueryString({
      asOfDate: this.formatDate(options.asOfDate),
      useCache: options.useCache,
    }) : ''

    return this.fetchWithAuth(
      `/accounting/accounts/${id}/balance${query ? `?${query}` : ''}`
    )
  }

  /**
   * Create a new account
   */
  static async createAccount(
    data: CreateAccountDTO
  ): Promise<AccountResponse> {
    return this.fetchWithAuth('/accounting/accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  /**
   * Update an existing account
   */
  static async updateAccount(
    id: string,
    data: UpdateAccountDTO
  ): Promise<AccountResponse> {
    return this.fetchWithAuth(`/accounting/accounts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  /**
   * Reconcile an account for a specific period
   */
  static async reconcileAccount(
    id: string,
    data: ReconcileAccountDTO
  ): Promise<ReconciliationResponse> {
    return this.fetchWithAuth(`/accounting/accounts/${id}/reconcile`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  /**
   * Deactivate an account (soft delete)
   */
  static async deactivateAccount(id: string): Promise<AccountResponse> {
    return this.fetchWithAuth(`/accounting/accounts/${id}/deactivate`, {
      method: 'PATCH',
    })
  }

  /**
   * Reactivate a deactivated account
   */
  static async reactivateAccount(id: string): Promise<AccountResponse> {
    return this.fetchWithAuth(`/accounting/accounts/${id}/reactivate`, {
      method: 'PATCH',
    })
  }

  // ==========================================================================
  // BULK OPERATIONS
  // ==========================================================================

  /**
   * Get multiple accounts by IDs
   */
  static async getAccountsByIds(ids: string[]): Promise<Account[]> {
    const promises = ids.map((id) => this.getAccount(id))
    const results = await Promise.all(promises)
    return results.map((r) => r.account)
  }

  /**
   * Get multiple journal entries by IDs
   */
  static async getJournalEntriesByIds(ids: string[]): Promise<JournalEntry[]> {
    const promises = ids.map((id) => this.getJournalEntry(id))
    const results = await Promise.all(promises)
    return results.map((r) => r.journalEntry)
  }

  // ==========================================================================
  // REPORTING & ANALYTICS
  // ==========================================================================

  /**
   * Get account balances for multiple accounts
   */
  static async getMultipleAccountBalances(
    accountIds: string[],
    asOfDate?: Date | string
  ): Promise<AccountBalanceDTO[]> {
    const promises = accountIds.map((id) =>
      this.getAccountBalance(id, { asOfDate })
    )
    const results = await Promise.all(promises)
    return results.map((r) => r.balance)
  }

  /**
   * Get journal entries for a specific account
   */
  static async getAccountJournalEntries(
    accountId: string,
    filters?: Omit<JournalEntryFilters, 'accountId'>
  ): Promise<PaginatedResponse<JournalEntry>> {
    return this.listJournalEntries({
      ...filters,
      accountId,
    })
  }

  /**
   * Get unposted journal entries (drafts)
   */
  static async getUnpostedEntries(
    filters?: Omit<JournalEntryFilters, 'status'>
  ): Promise<PaginatedResponse<JournalEntry>> {
    return this.listJournalEntries({
      ...filters,
      status: 'DRAFT',
    })
  }

  /**
   * Get entries requiring approval
   */
  static async getEntriesRequiringApproval(
    filters?: JournalEntryFilters
  ): Promise<JournalEntry[]> {
    const result = await this.listJournalEntries({
      ...filters,
      status: 'DRAFT',
      limit: 1000, // Get all pending
    })
    
    // Filter for entries requiring approval
    return result.data.filter(
      (entry) => entry.requiresApproval && !entry.approvedBy
    )
  }

  /**
   * Get account balance history (multiple periods)
   */
  static async getAccountBalanceHistory(
    accountId: string,
    periods: Array<{ fiscalYear: number; fiscalPeriod: number }>
  ): Promise<AccountBalanceDTO[]> {
    const promises = periods.map((period) => {
      const date = new Date(period.fiscalYear, period.fiscalPeriod, 0) // Last day of period
      return this.getAccountBalance(accountId, { asOfDate: date })
    })
    
    const results = await Promise.all(promises)
    return results.map((r) => r.balance)
  }

  // ==========================================================================
  // VALIDATION HELPERS
  // ==========================================================================

  /**
   * Validate journal entry before creating
   */
  static validateJournalEntry(data: CreateJournalEntryDTO): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (!data.description || data.description.trim().length === 0) {
      errors.push('Description is required')
    }

    if (!data.lines || data.lines.length < 2) {
      errors.push('Journal entry must have at least 2 lines')
    }

    if (data.lines) {
      let totalDebits = 0
      let totalCredits = 0

      data.lines.forEach((line, index) => {
        if (!line.accountId) {
          errors.push(`Line ${index + 1}: Account is required`)
        }

        if (line.debit < 0 || line.credit < 0) {
          errors.push(`Line ${index + 1}: Amounts cannot be negative`)
        }

        if (line.debit > 0 && line.credit > 0) {
          errors.push(`Line ${index + 1}: Cannot have both debit and credit`)
        }

        if (line.debit === 0 && line.credit === 0) {
          errors.push(
            `Line ${index + 1}: Must have either debit or credit amount`
          )
        }

        totalDebits += line.debit
        totalCredits += line.credit
      })

      const difference = Math.abs(totalDebits - totalCredits)
      if (difference > 0.01) {
        errors.push(
          `Debits must equal credits. Difference: $${difference.toFixed(2)}`
        )
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  /**
   * Validate account before creating
   */
  static validateAccount(data: CreateAccountDTO): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (!data.name || data.name.trim().length === 0) {
      errors.push('Account name is required')
    }

    if (!data.type) {
      errors.push('Account type is required')
    }

    if (data.code && !/^\d{4,6}$/.test(data.code)) {
      errors.push('Account code must be 4-6 digits')
    }

    if (data.currency && data.currency.length !== 3) {
      errors.push('Currency must be a 3-letter ISO code')
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }
}

// Export as singleton for convenience
export const accountingApi = AccountingApiService

