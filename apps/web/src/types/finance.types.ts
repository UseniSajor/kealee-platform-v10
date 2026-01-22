/**
 * Finance Module Types
 * Frontend types mirroring backend finance/escrow system
 */

// Enums
export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE'
export type EscrowStatus = 'PENDING_DEPOSIT' | 'ACTIVE' | 'FROZEN' | 'CLOSED'
export type TransactionType = 'DEPOSIT' | 'RELEASE' | 'REFUND' | 'FEE' | 'INTEREST'
export type TransactionStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REVERSED'
export type HoldReason = 'DISPUTE' | 'COMPLIANCE' | 'MANUAL' | 'LIEN'
export type PaymentMethodType = 'CARD' | 'ACH' | 'WIRE'
export type DepositStatus = 
  | 'PENDING' 
  | 'PROCESSING' 
  | 'CLEARING' 
  | 'COMPLETED' 
  | 'FAILED' 
  | 'CANCELLED' 
  | 'REFUNDED'

// Contract reference (simplified)
export interface Contract {
  id: string
  contractNumber: string
  totalAmount: number
  status: string
  ownerId: string
  contractorId: string
}

// Escrow Agreement
export interface EscrowAgreement {
  id: string
  contractId: string
  escrowAccountNumber: string
  totalContractAmount: number
  initialDepositAmount: number
  holdbackPercentage: number
  currentBalance: number
  availableBalance: number
  heldBalance: number
  status: EscrowStatus
  currency: string
  interestRate?: number
  interestAccrued: number
  createdAt: Date
  activatedAt?: Date
  closedAt?: Date
  contract?: Contract
}

// Escrow Transaction
export interface EscrowTransaction {
  id: string
  escrowAgreementId: string
  journalEntryId?: string
  type: TransactionType
  amount: number
  currency: string
  status: TransactionStatus
  description?: string
  reference?: string
  initiatedBy: string
  approvedBy?: string
  scheduledDate?: Date
  processedDate?: Date
  createdAt: Date
  metadata?: Record<string, any>
}

// Escrow Hold
export interface EscrowHold {
  id: string
  escrowAgreementId: string
  amount: number
  reason: HoldReason
  status: 'ACTIVE' | 'RELEASED'
  placedBy: string
  releasedBy?: string
  placedAt: Date
  releasedAt?: Date
  expiresAt?: Date
  notes?: string
}

// Payment Method
export interface PaymentMethod {
  id: string
  userId: string
  type: PaymentMethodType
  stripePaymentMethodId: string
  last4: string
  brand?: string
  bankName?: string
  isDefault: boolean
  isVerified: boolean
  status: 'ACTIVE' | 'VERIFICATION_PENDING' | 'FAILED' | 'REMOVED'
  expiryMonth?: number
  expiryYear?: number
  createdAt: Date
  updatedAt: Date
}

// Deposit Request
export interface DepositRequest {
  id: string
  escrowAgreementId: string
  paymentMethodId: string
  userId: string
  amount: number
  currency: string
  status: DepositStatus
  requiresVerification: boolean
  expectedClearanceDate?: Date
  stripePaymentIntentId?: string
  stripeChargeId?: string
  failureReason?: string
  failureCode?: string
  retryCount: number
  maxRetries: number
  createdAt: Date
  processedAt?: Date
  clearedAt?: Date
  cancelledAt?: Date
  paymentMethod?: PaymentMethod
  escrowAgreement?: EscrowAgreement
}

// Balance Breakdown
export interface BalanceBreakdown {
  currentBalance: number
  availableBalance: number
  heldBalance: number
  totalDeposits: number
  totalReleases: number
  totalFees: number
  totalRefunds: number
  pendingDeposits: number
  discrepancy: number
  hasDiscrepancy: boolean
}

// Journal Entry (for accounting view)
export interface JournalEntry {
  id: string
  entryNumber: string
  description: string
  entryDate: Date
  reference?: string
  status: 'DRAFT' | 'POSTED' | 'VOID'
  totalAmount: number
  createdBy: string
  postedBy?: string
  postedAt?: Date
  lines: JournalLine[]
}

export interface JournalLine {
  id: string
  journalEntryId: string
  accountId: string
  debit: number
  credit: number
  description?: string
  lineOrder: number
  account: {
    code: string
    name: string
    type: AccountType
  }
}

// API Response Types
export interface EscrowResponse {
  success: boolean
  escrow: EscrowAgreement
  message?: string
}

export interface TransactionsResponse {
  success: boolean
  transactions: EscrowTransaction[]
}

export interface BalanceResponse {
  success: boolean
  balance: BalanceBreakdown
}

export interface DepositResponse {
  success: boolean
  deposit: DepositRequest
  message?: string
}

export interface PaymentMethodsResponse {
  success: boolean
  paymentMethods: PaymentMethod[]
}

// Form DTOs
export interface CreateDepositDTO {
  escrowId: string
  amount: number
  paymentMethodId: string
}

export interface AddPaymentMethodDTO {
  type: PaymentMethodType
  stripePaymentMethodId: string
  isDefault?: boolean
}

export interface PlaceHoldDTO {
  amount: number
  reason: HoldReason
  notes?: string
  expiresAt?: Date
}

export interface ReleaseHoldDTO {
  notes?: string
}

export interface ProcessRefundDTO {
  amount: number
  reason: string
  recipientAccountId: string
}

// Chart/Dashboard Types
export interface EscrowSummary {
  totalEscrows: number
  activeEscrows: number
  frozenEscrows: number
  totalBalance: number
  totalAvailable: number
  totalHeld: number
  pendingDeposits: number
  pendingReleases: number
}

export interface TransactionMetrics {
  period: string
  totalDeposits: number
  depositAmount: number
  totalReleases: number
  releaseAmount: number
  totalFees: number
  feeAmount: number
}

// Filter Types
export interface EscrowFilters {
  status?: EscrowStatus
  contractId?: string
  minBalance?: number
  maxBalance?: number
  dateFrom?: Date
  dateTo?: Date
}

export interface TransactionFilters {
  type?: TransactionType
  status?: TransactionStatus
  dateFrom?: Date
  dateTo?: Date
  minAmount?: number
  maxAmount?: number
}

export interface DepositFilters {
  status?: DepositStatus
  escrowId?: string
  dateFrom?: Date
  dateTo?: Date
}

