/**
 * Finance API Client
 * Type-safe API client for escrow, deposits, payments, statements, payouts, and accounts
 */

import { api } from '../api'

// ============================================================================
// Types
// ============================================================================

export interface EscrowAgreement {
  id: string
  contractId: string
  projectId?: string
  status: string
  totalContractAmount: number
  initialDepositPercentage: number
  holdbackPercentage: number
  balance: number
  totalDeposited: number
  totalReleased: number
  totalHeld: number
  totalRefunded: number
  totalFees: number
  createdAt: string
  updatedAt: string
  deposits?: EscrowDeposit[]
  releases?: EscrowRelease[]
  holds?: EscrowHold[]
  transactions?: EscrowTransaction[]
}

export interface EscrowDeposit {
  id: string
  escrowAgreementId: string
  amount: number
  currency: string
  status: string
  paymentMethodId?: string
  scheduledDate?: string
  processedDate?: string
  createdAt: string
}

export interface EscrowRelease {
  id: string
  milestoneId: string
  amount: number
  recipientAccountId: string
  status: string
  createdAt: string
}

export interface EscrowHold {
  id: string
  amount: number
  reason: string
  status: string
  createdAt: string
  releasedAt?: string
}

export interface EscrowTransaction {
  id: string
  type: string
  amount: number
  status: string
  description?: string
  createdAt: string
  journalEntries?: unknown[]
}

export interface Deposit {
  id: string
  escrowId: string
  amount: number
  currency: string
  status: string
  paymentMethodId?: string
  processedAt?: string
  failedAt?: string
  failureReason?: string
  createdAt: string
}

export interface PaymentMethod {
  id: string
  type: string
  last4?: string
  brand?: string
  bankName?: string
  isDefault: boolean
  createdAt: string
}

export interface MilestoneRelease {
  canRelease: boolean
  milestoneId: string
  amount?: number
  reason?: string
}

export interface ProjectPayment {
  id: string
  type: string
  amount: number
  status: string
  createdAt: string
  milestone?: string
  method?: string
  fee?: number
}

export interface Statement {
  id: string
  statementType: string
  recipientId: string
  recipientRole: string
  periodStart: string
  periodEnd: string
  status: string
  balances?: unknown
  generatedAt?: string
  viewedAt?: string
  createdAt: string
}

export interface StatementSchedule {
  id: string
  recipientId: string
  statementType: string
  frequency: string
  dayOfMonth?: number
  deliveryMethod: string
  isActive: boolean
  createdAt: string
}

export interface Payout {
  id: string
  userId: string
  amount: number
  currency: string
  status: string
  method: string
  connectedAccountId?: string
  milestoneId?: string
  processedAt?: string
  createdAt: string
}

export interface FinanceAccount {
  id: string
  code: string
  name: string
  type: string
  subType?: string
  description?: string
  parentId?: string
  isActive: boolean
  balance: number
  currency: string
  children?: FinanceAccount[]
  createdAt: string
}

export interface AccountBalance {
  accountId: string
  balance: number
  currency: string
  type: string
}

export interface TrialBalance {
  accounts: Array<{
    id: string
    code: string
    name: string
    type: string
    debit: number
    credit: number
  }>
  totalDebits: number
  totalCredits: number
  isBalanced: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}

// ============================================================================
// Escrow API
// ============================================================================

export const escrowApi = {
  /** List escrow agreements with optional filters */
  async list(params?: {
    status?: string
    contractId?: string
    projectId?: string
    page?: number
    limit?: number
  }): Promise<PaginatedResponse<EscrowAgreement>> {
    const query = new URLSearchParams()
    if (params?.status) query.set('status', params.status)
    if (params?.contractId) query.set('contractId', params.contractId)
    if (params?.projectId) query.set('projectId', params.projectId)
    if (params?.page) query.set('page', String(params.page))
    if (params?.limit) query.set('limit', String(params.limit))
    const qs = query.toString()
    return api.get(`/api/escrow/agreements${qs ? `?${qs}` : ''}`)
  },

  /** Get a single escrow agreement */
  async get(id: string): Promise<{ data: EscrowAgreement }> {
    return api.get(`/api/escrow/agreements/${id}`)
  },

  /** Get escrow by contract ID */
  async getByContract(contractId: string): Promise<{ data: EscrowAgreement }> {
    return api.get(`/api/escrow/contract/${contractId}`)
  },

  /** Create a new escrow agreement */
  async create(data: {
    contractId: string
    totalContractAmount: number
    initialDepositPercentage?: number
    holdbackPercentage?: number
  }): Promise<{ data: EscrowAgreement }> {
    return api.post('/api/escrow/agreements', data)
  },

  /** Record a deposit */
  async recordDeposit(
    id: string,
    data: {
      depositId: string
      amount: number
      currency?: string
      scheduledDate?: string
      processedDate?: string
    }
  ): Promise<{ data: EscrowAgreement }> {
    return api.post(`/api/escrow/agreements/${id}/deposit`, data)
  },

  /** Release payment from escrow */
  async releasePayment(
    id: string,
    data: {
      milestoneId: string
      amount: number
      recipientAccountId: string
    }
  ): Promise<{ data: EscrowAgreement }> {
    return api.post(`/api/escrow/agreements/${id}/release`, data)
  },

  /** Place a hold on escrow funds */
  async placeHold(
    id: string,
    data: {
      amount: number
      reason: 'DISPUTE' | 'COMPLIANCE' | 'MANUAL' | 'LIEN'
    }
  ): Promise<{ data: EscrowAgreement }> {
    return api.post(`/api/escrow/agreements/${id}/hold`, data)
  },

  /** Release a hold */
  async releaseHold(holdId: string): Promise<{ data: unknown }> {
    return api.post(`/api/escrow/holds/${holdId}/release`, {})
  },

  /** Process a refund */
  async refund(
    id: string,
    data: { amount: number; reason?: string }
  ): Promise<{ data: EscrowAgreement }> {
    return api.post(`/api/escrow/agreements/${id}/refund`, data)
  },

  /** Record a fee */
  async recordFee(
    id: string,
    data: { amount: number; feeType?: string }
  ): Promise<{ data: EscrowAgreement }> {
    return api.post(`/api/escrow/agreements/${id}/fee`, data)
  },

  /** Close an escrow agreement */
  async close(id: string): Promise<{ data: EscrowAgreement }> {
    return api.post(`/api/escrow/agreements/${id}/close`, {})
  },

  /** Get transactions for an escrow agreement */
  async getTransactions(id: string): Promise<{ data: EscrowTransaction[] }> {
    return api.get(`/api/escrow/agreements/${id}/transactions`)
  },
}

// ============================================================================
// Deposits API
// ============================================================================

export const depositsApi = {
  /** Create a new deposit */
  async create(data: {
    escrowId: string
    amount: number
    paymentMethodId?: string
    currency?: string
  }): Promise<{ data: Deposit }> {
    return api.post('/api/deposits', data)
  },

  /** Process a pending deposit */
  async process(depositId: string): Promise<{ data: Deposit }> {
    return api.post(`/api/deposits/${depositId}/process`, {})
  },

  /** Get deposit details */
  async get(depositId: string): Promise<{ data: Deposit }> {
    return api.get(`/api/deposits/${depositId}`)
  },

  /** Get deposit history for an escrow */
  async listByEscrow(escrowId: string): Promise<{ data: Deposit[] }> {
    return api.get(`/api/deposits/escrow/${escrowId}`)
  },

  /** Retry a failed deposit */
  async retry(depositId: string): Promise<{ data: Deposit }> {
    return api.post(`/api/deposits/${depositId}/retry`, {})
  },

  /** Cancel a pending deposit */
  async cancel(depositId: string): Promise<{ data: Deposit }> {
    return api.post(`/api/deposits/${depositId}/cancel`, {})
  },
}

// ============================================================================
// Payments API
// ============================================================================

export const paymentsApi = {
  /** Get escrow for a project */
  async getProjectEscrow(projectId: string): Promise<{ data: EscrowAgreement }> {
    return api.get(`/api/payments/projects/${projectId}/escrow`)
  },

  /** Check if a milestone can be released */
  async canRelease(milestoneId: string): Promise<{ data: MilestoneRelease }> {
    return api.get(`/api/payments/milestones/${milestoneId}/can-release`)
  },

  /** Release a milestone payment */
  async releaseMilestonePayment(
    milestoneId: string,
    data?: { skipHoldback?: boolean; notes?: string }
  ): Promise<{ data: unknown }> {
    return api.post(
      `/api/payments/milestones/${milestoneId}/release-payment`,
      data || {}
    )
  },

  /** Get project payment history */
  async getProjectPayments(
    projectId: string,
    params?: {
      limit?: number
      offset?: number
      status?: string
      startDate?: string
      endDate?: string
    }
  ): Promise<{ data: ProjectPayment[] }> {
    const query = new URLSearchParams()
    if (params?.limit) query.set('limit', String(params.limit))
    if (params?.offset) query.set('offset', String(params.offset))
    if (params?.status) query.set('status', params.status)
    if (params?.startDate) query.set('startDate', params.startDate)
    if (params?.endDate) query.set('endDate', params.endDate)
    const qs = query.toString()
    return api.get(
      `/api/payments/projects/${projectId}/payments${qs ? `?${qs}` : ''}`
    )
  },

  /** Get user payment history */
  async getUserPayments(): Promise<{ data: ProjectPayment[] }> {
    return api.get('/api/payments')
  },

  /** Create a payment intent */
  async createIntent(data: {
    amount: number
    currency?: string
    metadata?: Record<string, unknown>
  }): Promise<{ data: unknown }> {
    return api.post('/api/payments/intents', data)
  },

  /** Get payment status */
  async getStatus(paymentId: string): Promise<{ data: { status: string } }> {
    return api.get(`/api/payments/${paymentId}/status`)
  },

  /** Process a payment */
  async process(data: {
    type: string
    amount: number
    currency?: string
    metadata?: Record<string, unknown>
    idempotencyKey?: string
  }): Promise<{ data: unknown }> {
    return api.post('/api/payments/process', data)
  },

  /** Refund a payment */
  async refund(
    paymentId: string,
    data?: { amount?: number; reason?: string }
  ): Promise<{ data: unknown }> {
    return api.post(`/api/payments/${paymentId}/refund`, data || {})
  },

  /** List payment methods */
  async listPaymentMethods(): Promise<{ data: PaymentMethod[] }> {
    return api.get('/api/payments/payment-methods')
  },

  /** Attach a payment method */
  async attachPaymentMethod(data: {
    paymentMethodId: string
    setDefault?: boolean
  }): Promise<{ data: PaymentMethod }> {
    return api.post('/api/payments/payment-methods', data)
  },

  /** Delete a payment method */
  async deletePaymentMethod(
    paymentMethodId: string
  ): Promise<{ data: unknown }> {
    return api.delete(`/api/payments/payment-methods/${paymentMethodId}`)
  },
}

// ============================================================================
// Statements API
// ============================================================================

export const statementsApi = {
  /** List statements */
  async list(params?: {
    recipientId?: string
    statementType?: string
    status?: string
    dateFrom?: string
    dateTo?: string
    page?: number
    limit?: number
  }): Promise<PaginatedResponse<Statement>> {
    const query = new URLSearchParams()
    if (params?.recipientId) query.set('recipientId', params.recipientId)
    if (params?.statementType) query.set('statementType', params.statementType)
    if (params?.status) query.set('status', params.status)
    if (params?.dateFrom) query.set('dateFrom', params.dateFrom)
    if (params?.dateTo) query.set('dateTo', params.dateTo)
    if (params?.page) query.set('page', String(params.page))
    if (params?.limit) query.set('limit', String(params.limit))
    const qs = query.toString()
    return api.get(
      `/api/accounting/statements${qs ? `?${qs}` : ''}`
    )
  },

  /** Get a single statement */
  async get(id: string): Promise<{ data: Statement }> {
    return api.get(`/api/accounting/statements/${id}`)
  },

  /** Create a statement */
  async create(data: {
    statementType: string
    recipientId: string
    recipientRole: string
    periodStart: string
    periodEnd: string
    balances?: unknown
  }): Promise<{ data: Statement }> {
    return api.post('/api/accounting/statements', data)
  },

  /** Create a schedule */
  async createSchedule(data: {
    recipientId: string
    statementType: string
    frequency: string
    dayOfMonth?: number
    deliveryMethod: string
  }): Promise<{ data: StatementSchedule }> {
    return api.post('/api/accounting/statements/schedules', data)
  },

  /** List schedules */
  async listSchedules(): Promise<{ data: StatementSchedule[] }> {
    return api.get('/api/accounting/statements/schedules')
  },

  /** Update a schedule */
  async updateSchedule(
    id: string,
    data: Partial<StatementSchedule>
  ): Promise<{ data: StatementSchedule }> {
    return api.patch(`/api/accounting/statements/schedules/${id}`, data)
  },
}

// ============================================================================
// Payouts API
// ============================================================================

export const payoutsApi = {
  /** List payouts */
  async list(params?: {
    status?: string
    connectedAccountId?: string
    userId?: string
    milestoneId?: string
    method?: string
    dateFrom?: string
    dateTo?: string
  }): Promise<{ data: Payout[] }> {
    const query = new URLSearchParams()
    if (params?.status) query.set('status', params.status)
    if (params?.connectedAccountId)
      query.set('connectedAccountId', params.connectedAccountId)
    if (params?.userId) query.set('userId', params.userId)
    if (params?.milestoneId) query.set('milestoneId', params.milestoneId)
    if (params?.method) query.set('method', params.method)
    if (params?.dateFrom) query.set('dateFrom', params.dateFrom)
    if (params?.dateTo) query.set('dateTo', params.dateTo)
    const qs = query.toString()
    return api.get(
      `/api/accounting/payouts/payouts${qs ? `?${qs}` : ''}`
    )
  },

  /** Get a payout */
  async get(id: string): Promise<{ data: Payout }> {
    return api.get(`/api/accounting/payouts/payouts/${id}`)
  },

  /** Create a payout record */
  async create(data: {
    userId: string
    amount: number
    currency?: string
    method: string
    connectedAccountId?: string
    milestoneId?: string
  }): Promise<{ data: Payout }> {
    return api.post('/api/accounting/payouts/payouts', data)
  },

  /** Update a payout */
  async update(
    id: string,
    data: Partial<Payout>
  ): Promise<{ data: Payout }> {
    return api.patch(`/api/accounting/payouts/payouts/${id}`, data)
  },
}

// ============================================================================
// Accounts API
// ============================================================================

export const accountsApi = {
  /** List accounts */
  async list(params?: {
    type?: string
    subType?: string
    parentId?: string
    isActive?: boolean
    currency?: string
  }): Promise<{ data: FinanceAccount[] }> {
    const query = new URLSearchParams()
    if (params?.type) query.set('type', params.type)
    if (params?.subType) query.set('subType', params.subType)
    if (params?.parentId) query.set('parentId', params.parentId)
    if (params?.isActive !== undefined)
      query.set('isActive', String(params.isActive))
    if (params?.currency) query.set('currency', params.currency)
    const qs = query.toString()
    return api.get(
      `/api/accounting/accounts${qs ? `?${qs}` : ''}`
    )
  },

  /** Get a single account */
  async get(id: string): Promise<{ data: FinanceAccount }> {
    return api.get(`/api/accounting/accounts/${id}`)
  },

  /** Create an account */
  async create(data: {
    code?: string
    name: string
    type: string
    subType?: string
    description?: string
    parentId?: string
    currency?: string
  }): Promise<{ data: FinanceAccount }> {
    return api.post('/api/accounting/accounts', data)
  },

  /** Update an account */
  async update(
    id: string,
    data: Partial<FinanceAccount>
  ): Promise<{ data: FinanceAccount }> {
    return api.patch(`/api/accounting/accounts/${id}`, data)
  },

  /** Get all account balances */
  async getBalances(): Promise<{ data: AccountBalance[] }> {
    return api.get('/api/accounting/accounts/balances')
  },
}

// ============================================================================
// Account Balances / Reconciliation API
// ============================================================================

export const reconciliationApi = {
  /** Get reconciliation data for an account */
  async getData(accountId: string): Promise<{ data: unknown }> {
    return api.get(
      `/api/accounting/account-balances/reconciliation/${accountId}`
    )
  },

  /** Perform reconciliation */
  async reconcile(
    accountId: string,
    data: unknown
  ): Promise<{ data: unknown }> {
    return api.post(
      `/api/accounting/account-balances/reconciliation/${accountId}`,
      data
    )
  },

  /** Get trial balance */
  async getTrialBalance(): Promise<{ data: TrialBalance }> {
    return api.get('/api/accounting/account-balances/trial-balance')
  },
}
