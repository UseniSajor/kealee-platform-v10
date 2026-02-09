/**
 * Escrow Service
 * Orchestrates escrow operations with automatic journal entry creation
 * 
 * KEY PRINCIPLE: Every escrow transaction creates a journal entry in the double-entry system
 */

import { prisma, Decimal } from '@kealee/database'
import { journalEntryService } from '../finance/journal-entry.service'
import { PayoutService } from '../stripe-connect/payout.service'
import { auditService } from '../audit/audit.service'
import type { EscrowAgreement, EscrowTransaction, EscrowHold } from '@kealee/database'
import {
  InsufficientEscrowBalanceError,
  EscrowFrozenError,
  InvalidEscrowStatusError,
  HoldAlreadyReleasedError,
  EscrowNotFoundError,
  HoldNotFoundError,
  EscrowBalanceDiscrepancyError,
  EscrowTransactionNotFoundError,
  InvalidTransactionStatusError,
} from '../../errors/escrow.errors'

export interface CreateEscrowAgreementDTO {
  contractId: string
  totalContractAmount: Decimal
  initialDepositPercentage?: number // Default: 10%
  holdbackPercentage?: number // Default: 10%
  interestRate?: number // Optional: for interest-bearing escrows
  createdBy: string
}

export interface RecordDepositDTO {
  escrowId: string
  depositId: string // Reference to payment/deposit
  amount: Decimal
  currency?: string
  scheduledDate?: Date
  processedDate: Date
  initiatedBy: string
  metadata?: Record<string, any>
}

export interface ReleasePaymentDTO {
  escrowId: string
  milestoneId: string
  amount: Decimal
  recipientAccountId: string // Contractor's connected account
  initiatedBy: string
  approvedBy?: string
  metadata?: Record<string, any>
}

export interface PlaceHoldDTO {
  escrowId: string
  amount: Decimal
  reason: 'DISPUTE' | 'COMPLIANCE' | 'MANUAL' | 'LIEN'
  notes?: string
  expiresAt?: Date
  placedBy: string
}

export interface ReleaseHoldDTO {
  holdId: string
  releasedBy: string
  notes?: string
}

export interface ProcessRefundDTO {
  escrowId: string
  amount: Decimal
  reason: string
  recipientAccountId: string // Who gets the refund (usually owner)
  initiatedBy: string
  approvedBy?: string
}

export class EscrowService {
  /**
   * Create an escrow agreement when contract is signed
   * No journal entry created yet (no money moved)
   */
  async createEscrowAgreement(data: CreateEscrowAgreementDTO): Promise<EscrowAgreement> {
    const {
      contractId,
      totalContractAmount,
      initialDepositPercentage = 10,
      holdbackPercentage = 10,
      interestRate,
      createdBy,
    } = data

    // Get contract to validate
    const contract = await prisma.contractAgreement.findUnique({
      where: { id: contractId },
      include: {
        project: true,
      },
    })

    if (!contract) {
      throw new Error('Contract not found')
    }

    if (contract.status !== 'SIGNED') {
      throw new Error('Contract must be signed before creating escrow')
    }

    // Check if escrow already exists
    const existingEscrow = await prisma.escrowAgreement.findUnique({
      where: { contractId },
    })

    if (existingEscrow) {
      throw new Error('Escrow agreement already exists for this contract')
    }

    // Generate escrow account number
    const escrowAccountNumber = await this.generateEscrowAccountNumber()

    // Calculate initial deposit amount
    const initialDepositAmount = totalContractAmount
      .mul(initialDepositPercentage)
      .div(100)

    // Create escrow agreement
    const escrow = await prisma.escrowAgreement.create({
      data: {
        contractId,
        projectId: contract.projectId,
        escrowAccountNumber,
        totalContractAmount,
        initialDepositAmount,
        holdbackPercentage,
        currentBalance: new Decimal(0),
        availableBalance: new Decimal(0),
        heldBalance: new Decimal(0),
        status: 'PENDING_DEPOSIT',
        currency: 'USD',
        interestRate,
        interestAccrued: new Decimal(0),
      },
      include: {
        contract: true,
        transactions: true,
        holds: true,
      },
    })

    auditService.log({ userId: createdBy, action: 'CREATE', entityType: 'ESCROW', entityId: escrow.id, newValue: { amount: totalContractAmount.toNumber() }, description: 'Created escrow agreement', category: 'FINANCIAL', severity: 'CRITICAL' });

    return escrow
  }

  /**
   * Record a deposit into escrow
   * Creates journal entry: Debit Cash, Credit Escrow Liability
   */
  async recordDeposit(data: RecordDepositDTO): Promise<EscrowTransaction> {
    const {
      escrowId,
      depositId,
      amount,
      currency = 'USD',
      scheduledDate,
      processedDate,
      initiatedBy,
      metadata,
    } = data

    // Get escrow agreement
    const escrow = await prisma.escrowAgreement.findUnique({
      where: { id: escrowId },
      include: {
        contract: true,
      },
    })

    if (!escrow) {
      throw new Error('Escrow agreement not found')
    }

    // Use Prisma transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create and post journal entry for the deposit
      // Debit: Cash (Asset) - increases our cash
      // Credit: Escrow Liability (Liability) - we owe this to contractor/owner
      const postedEntry = await journalEntryService.createAndPostJournalEntry({
        description: `Escrow deposit for ${escrow.escrowAccountNumber} - Contract ${escrow.contractId}`,
        entryDate: processedDate,
        reference: depositId,
        referenceId: escrowId,
        lines: [
          {
            accountId: await this.getCashAccountId(), // 1000 - Cash
            debit: amount.toNumber(),
            credit: 0,
            description: 'Cash received for escrow deposit',
          },
          {
            accountId: await this.getEscrowLiabilityAccountId(), // 2100 - Escrow Liabilities
            debit: 0,
            credit: amount.toNumber(),
            description: `Escrow liability for ${escrow.escrowAccountNumber}`,
          },
        ],
        createdBy: initiatedBy,
      }, tx)

      // 3. Create escrow transaction
      const transaction = await tx.escrowTransaction.create({
        data: {
          escrowId: escrowId,
          journalEntryId: postedEntry.id,
          type: 'DEPOSIT',
          amount,
          balanceBefore: escrow.currentBalance,
          balanceAfter: escrow.currentBalance.add(amount),
          currency,
          status: 'COMPLETED',
          reference: depositId,
          scheduledDate,
          processedDate,
          initiatedBy,
          metadata: metadata || {},
        },
      })

      // 4. Update escrow balances
      const isFirstDeposit = escrow.currentBalance.equals(0)
      
      await tx.escrowAgreement.update({
        where: { id: escrowId },
        data: {
          currentBalance: escrow.currentBalance.add(amount),
          availableBalance: escrow.availableBalance.add(amount),
          status: isFirstDeposit ? 'ACTIVE' : escrow.status,
          activatedAt: isFirstDeposit ? processedDate : escrow.activatedAt,
        },
      })

      return transaction
    })

    auditService.log({ userId: initiatedBy, action: 'CREATE', entityType: 'PAYMENT', entityId: result.id, newValue: { amount: amount.toNumber() }, description: 'Recorded escrow deposit', category: 'FINANCIAL', severity: 'CRITICAL' });

    return result
  }

  /**
   * Release payment from escrow to contractor
   * Creates journal entry: Debit Escrow Liability, Credit Contractor Payout + Fees
   */
  async releasePayment(data: ReleasePaymentDTO): Promise<EscrowTransaction> {
    const {
      escrowId,
      milestoneId,
      amount,
      recipientAccountId,
      initiatedBy,
      approvedBy,
      metadata,
    } = data

    // Get escrow agreement
    const escrow = await prisma.escrowAgreement.findUnique({
      where: { id: escrowId },
      include: {
        contract: true,
        holds: {
          where: { status: 'ACTIVE' },
        },
      },
    })

    if (!escrow) {
      throw new EscrowNotFoundError(escrowId)
    }

    // Check escrow status
    if (escrow.status !== 'ACTIVE') {
      if (escrow.status === 'FROZEN') {
        throw new EscrowFrozenError(escrowId, 'Active dispute or compliance hold')
      }
      throw new InvalidEscrowStatusError(escrow.status, 'ACTIVE', escrowId)
    }

    // Check for active holds
    if (escrow.holds.length > 0) {
      const holdReasons = escrow.holds.map(h => h.reason).join(', ')
      throw new EscrowFrozenError(escrowId, `Active holds: ${holdReasons}`)
    }

    // Check if sufficient available balance
    if (escrow.availableBalance.lessThan(amount)) {
      throw new InsufficientEscrowBalanceError(
        escrow.availableBalance.toNumber(),
        amount.toNumber(),
        escrowId
      )
    }

    // Calculate platform fee (e.g., 2.9% + $0.30)
    const platformFeePercentage = new Decimal(0.029) // 2.9%
    const platformFeeFixed = new Decimal(0.30)
    const platformFee = amount.mul(platformFeePercentage).add(platformFeeFixed)
    const netAmountToContractor = amount.minus(platformFee)

    // Use Prisma transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create and post journal entry for payment release
      // Debit: Escrow Liability - reduces our liability
      // Credit: Contractor Payouts (Expense) - payment to contractor
      // Credit: Platform Fees (Revenue) - our revenue
      const postedEntry = await journalEntryService.createAndPostJournalEntry({
        description: `Payment release from ${escrow.escrowAccountNumber} - Milestone ${milestoneId}`,
        entryDate: new Date(),
        reference: milestoneId,
        referenceId: escrowId,
        lines: [
          {
            accountId: await this.getEscrowLiabilityAccountId(), // 2100
            debit: amount.toNumber(),
            credit: 0,
            description: 'Release from escrow liability',
          },
          {
            accountId: await this.getContractorPayoutsAccountId(), // 5300
            debit: 0,
            credit: netAmountToContractor.toNumber(),
            description: 'Payment to contractor',
          },
          {
            accountId: await this.getPlatformFeesAccountId(), // 4100
            debit: 0,
            credit: platformFee.toNumber(),
            description: 'Platform fee revenue',
          },
        ],
        createdBy: initiatedBy,
      }, tx)

      // 2. Create escrow transaction (PROCESSING - payout happens later via Stripe)
      const transaction = await tx.escrowTransaction.create({
        data: {
          escrowId: escrowId,
          journalEntryId: postedEntry.id,
          type: 'RELEASE',
          amount,
          balanceBefore: escrow.currentBalance,
          balanceAfter: escrow.currentBalance.sub(amount),
          currency: escrow.currency,
          status: 'PROCESSING', // Will be updated to COMPLETED after Stripe payout succeeds
          reference: milestoneId,
          scheduledDate: new Date(), // When release was scheduled
          processedDate: null as any, // Will be set when Stripe payout completes
          initiatedBy,
          approvedBy,
          metadata: {
            ...metadata,
            platformFee: platformFee.toNumber(),
            netAmount: netAmountToContractor.toNumber(),
            recipientAccountId,
          },
        },
      })

      // 3. Update escrow balances (reduce available balance immediately)
      await tx.escrowAgreement.update({
        where: { id: escrowId },
        data: {
          currentBalance: escrow.currentBalance.minus(amount),
          availableBalance: escrow.availableBalance.minus(amount),
        },
      })

      return transaction
    })

    // 4. Trigger Stripe payout (asynchronous - happens after transaction committed)
    try {
      await PayoutService.createPayout({
        connectedAccountId: recipientAccountId,
        amount: netAmountToContractor.toNumber(),
        currency: escrow.currency,
        escrowTransactionId: result.id,
        milestoneId,
        initiatedBy,
        description: `Payment for milestone ${milestoneId}`,
        metadata: {
          escrowId,
          escrowAccountNumber: escrow.escrowAccountNumber,
          contractId: escrow.contractId,
          platformFee: platformFee.toNumber(),
        },
      })
    } catch (error: any) {
      // Payout initiation failed - mark transaction as failed and rollback
      console.error('Failed to initiate payout:', error)
      await this.failEscrowTransaction(result.id, error.message)
      throw error
    }

    auditService.log({ userId: initiatedBy, action: 'APPROVE', entityType: 'ESCROW', entityId: escrowId, description: 'Released escrow payment', category: 'FINANCIAL', severity: 'CRITICAL' });

    return result
  }

  /**
   * Complete an escrow transaction after successful payout
   * Called by Stripe webhook after payout succeeds
   */
  async completeEscrowTransaction(
    transactionId: string,
    payoutId: string
  ): Promise<EscrowTransaction> {
    // Get the transaction
    const transaction = await prisma.escrowTransaction.findUnique({
      where: { id: transactionId },
      include: {
        escrow: true,
      },
    })

    if (!transaction) {
      throw new EscrowTransactionNotFoundError(transactionId)
    }

    if (transaction.status !== 'PROCESSING') {
      throw new InvalidTransactionStatusError(
        transactionId,
        transaction.status,
        'PROCESSING'
      )
    }

    // Update transaction status to COMPLETED
    const completedTransaction = await prisma.escrowTransaction.update({
      where: { id: transactionId },
      data: {
        status: 'COMPLETED',
        processedDate: new Date(),
        metadata: {
          ...(transaction.metadata as object),
          payoutId,
          completedAt: new Date().toISOString(),
        },
      },
    })

    return completedTransaction
  }

  /**
   * Fail an escrow transaction if payout fails
   * Called by Stripe webhook after payout fails
   */
  async failEscrowTransaction(
    transactionId: string,
    reason: string
  ): Promise<EscrowTransaction> {
    // Get the transaction
    const transaction = await prisma.escrowTransaction.findUnique({
      where: { id: transactionId },
      include: {
        escrow: true,
      },
    })

    if (!transaction) {
      throw new EscrowTransactionNotFoundError(transactionId)
    }

    if (transaction.status !== 'PROCESSING') {
      throw new InvalidTransactionStatusError(
        transactionId,
        transaction.status,
        'PROCESSING'
      )
    }

    // Use transaction to rollback escrow balance and update status
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update transaction status to FAILED
      const failedTransaction = await tx.escrowTransaction.update({
        where: { id: transactionId },
        data: {
          status: 'FAILED',
          metadata: {
            ...(transaction.metadata as object),
            failureReason: reason,
            failedAt: new Date().toISOString(),
          },
        },
      })

      // 2. Restore escrow balances (return money to available balance)
      await tx.escrowAgreement.update({
        where: { id: transaction.escrowId },
        data: {
          currentBalance: transaction.escrow.currentBalance.add(transaction.amount),
          availableBalance: transaction.escrow.availableBalance.add(transaction.amount),
        },
      })

      // 3. Create a reversing journal entry to undo the accounting
      await journalEntryService.voidJournalEntry({
        entryId: transaction.journalEntryId || '',
        voidedBy: 'SYSTEM',
        voidReason: `Payment failed: ${reason}`
      })

      return failedTransaction
    })

    return result
  }

  /**
   * Place a hold on escrow funds (for disputes, compliance, etc.)
   * No journal entry - just restricts available balance
   */
  async placeHold(data: PlaceHoldDTO): Promise<EscrowHold> {
    const { escrowId, amount, reason, notes, expiresAt, placedBy } = data

    // Get escrow
    const escrow = await prisma.escrowAgreement.findUnique({
      where: { id: escrowId },
    })

    if (!escrow) {
      throw new Error('Escrow agreement not found')
    }

    // Check if sufficient available balance
    if (escrow.availableBalance.lessThan(amount)) {
      throw new Error(
        `Insufficient available balance to place hold. Available: ${escrow.availableBalance}, Hold amount: ${amount}`
      )
    }

    // Use transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create hold
      const hold = await tx.escrowHold.create({
        data: {
          escrowId: escrowId,
          amount,
          reason,
          status: 'ACTIVE',
          placedBy,
          placedAt: new Date(),
          expiresAt,
          notes,
        },
      })

      // 2. Update escrow balances
      await tx.escrowAgreement.update({
        where: { id: escrowId },
        data: {
          availableBalance: escrow.availableBalance.minus(amount),
          heldBalance: escrow.heldBalance.add(amount),
          status: reason === 'DISPUTE' ? 'FROZEN' : escrow.status,
        },
      })

      return hold
    })

    auditService.log({ userId: placedBy, action: 'UPDATE', entityType: 'ESCROW', entityId: escrowId, description: 'Placed hold on escrow', category: 'FINANCIAL', severity: 'WARNING' });

    return result
  }

  /**
   * Release a hold and make funds available again
   * No journal entry - just updates balances
   */
  async releaseHold(data: ReleaseHoldDTO): Promise<EscrowHold> {
    const { holdId, releasedBy, notes } = data

    // Get hold with escrow
    const hold = await prisma.escrowHold.findUnique({
      where: { id: holdId },
      include: {
        escrow: true,
      },
    })

    if (!hold) {
      throw new Error('Hold not found')
    }

    if (hold.status !== 'ACTIVE') {
      throw new Error('Hold is not active')
    }

    // Use transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Release hold
      const releasedHold = await tx.escrowHold.update({
        where: { id: holdId },
        data: {
          status: 'RELEASED',
          releasedBy,
          releasedAt: new Date(),
          notes: notes || hold.notes,
        },
      })

      // 2. Update escrow balances
      const escrow = hold.escrow
      await tx.escrowAgreement.update({
        where: { id: escrow.id },
        data: {
          availableBalance: escrow.availableBalance.add(hold.amount),
          heldBalance: escrow.heldBalance.minus(hold.amount),
          // Unfreeze if this was the last hold and it was a dispute hold
          status:
            hold.reason === 'DISPUTE' &&
            escrow.heldBalance.equals(hold.amount) // This was the only hold
              ? 'ACTIVE'
              : escrow.status,
        },
      })

      return releasedHold
    })

    return result
  }

  /**
   * Process a refund from escrow
   * Creates journal entry: Debit Escrow Liability, Credit Cash
   */
  async processRefund(data: ProcessRefundDTO): Promise<EscrowTransaction> {
    const {
      escrowId,
      amount,
      reason,
      recipientAccountId,
      initiatedBy,
      approvedBy,
    } = data

    // Get escrow
    const escrow = await prisma.escrowAgreement.findUnique({
      where: { id: escrowId },
      include: {
        contract: true,
      },
    })

    if (!escrow) {
      throw new Error('Escrow agreement not found')
    }

    if (escrow.currentBalance.lessThan(amount)) {
      throw new Error(
        `Insufficient balance for refund. Current: ${escrow.currentBalance}, Requested: ${amount}`
      )
    }

    // Use transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create and post journal entry for refund
      // Debit: Escrow Liability - reduces liability
      // Credit: Cash - money leaving our system
      const postedEntry = await journalEntryService.createAndPostJournalEntry({
        description: `Refund from ${escrow.escrowAccountNumber} - ${reason}`,
        entryDate: new Date(),
        reference: 'REFUND',
        referenceId: escrowId,
        lines: [
          {
            accountId: await this.getEscrowLiabilityAccountId(), // 2100
            debit: amount.toNumber(),
            credit: 0,
            description: 'Escrow liability reduction',
          },
          {
            accountId: await this.getCashAccountId(), // 1000
            debit: 0,
            credit: amount.toNumber(),
            description: 'Cash refund processed',
          },
        ],
        createdBy: initiatedBy,
      }, tx)

      // 2. Create escrow transaction
      const transaction = await tx.escrowTransaction.create({
        data: {
          escrowId: escrowId,
          journalEntryId: postedEntry.id,
          type: 'REFUND',
          amount,
          balanceBefore: escrow.currentBalance,
          balanceAfter: escrow.currentBalance.minus(amount),
          currency: escrow.currency,
          status: 'COMPLETED',
          reference: 'REFUND',
          processedDate: new Date(),
          initiatedBy,
          approvedBy,
          metadata: {
            reason,
            recipientAccountId,
          },
        },
      })

      // 4. Update escrow balances
      await tx.escrowAgreement.update({
        where: { id: escrowId },
        data: {
          currentBalance: escrow.currentBalance.minus(amount),
          availableBalance: escrow.availableBalance.minus(amount),
        },
      })

      return transaction
    })

    return result
  }

  /**
   * Record a platform fee transaction
   * Creates journal entry: Debit Escrow Liability, Credit Platform Fee Revenue
   */
  async recordFee(
    escrowId: string,
    feeType: 'PLATFORM' | 'PROCESSING' | 'INSTANT_PAYOUT',
    amount: Decimal,
    description: string,
    userId: string
  ): Promise<EscrowTransaction> {
    const escrow = await prisma.escrowAgreement.findUnique({
      where: { id: escrowId },
    })

    if (!escrow) {
      throw new Error('Escrow agreement not found')
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create and post journal entry
      const postedEntry = await journalEntryService.createAndPostJournalEntry({
        description: `${feeType} fee for ${escrow.escrowAccountNumber} - ${description}`,
        entryDate: new Date(),
        reference: feeType,
        referenceId: escrowId,
        lines: [
          {
            accountId: await this.getEscrowLiabilityAccountId(), // 2100
            debit: amount.toNumber(),
            credit: 0,
            description: 'Fee charged to escrow',
          },
          {
            accountId: await this.getPlatformFeesAccountId(), // 4100
            debit: 0,
            credit: amount.toNumber(),
            description: `${feeType} fee revenue`,
          },
        ],
        createdBy: userId,
      }, tx)

      // Create transaction
      const transaction = await tx.escrowTransaction.create({
        data: {
          escrowId: escrowId,
          journalEntryId: postedEntry.id,
          type: 'FEE',
          amount,
          balanceBefore: escrow.currentBalance,
          balanceAfter: escrow.currentBalance.minus(amount),
          currency: escrow.currency,
          status: 'COMPLETED',
          reference: feeType,
          processedDate: new Date(),
          initiatedBy: userId,
          metadata: {
            feeType,
            description,
          },
        },
      })

      // Update escrow balances (fees reduce available balance)
      await tx.escrowAgreement.update({
        where: { id: escrowId },
        data: {
          currentBalance: escrow.currentBalance.minus(amount),
          availableBalance: escrow.availableBalance.minus(amount),
        },
      })

      return transaction
    })

    return result
  }

  /**
   * Close an escrow agreement
   * Can only close if balance is zero and no active holds
   */
  async closeEscrow(escrowId: string, closedBy: string): Promise<EscrowAgreement> {
    const escrow = await prisma.escrowAgreement.findUnique({
      where: { id: escrowId },
      include: {
        holds: {
          where: { status: 'ACTIVE' },
        },
      },
    })

    if (!escrow) {
      throw new Error('Escrow agreement not found')
    }

    if (!escrow.currentBalance.equals(0)) {
      throw new Error(
        `Cannot close escrow with remaining balance: ${escrow.currentBalance}`
      )
    }

    if (escrow.holds.length > 0) {
      throw new Error(
        `Cannot close escrow with ${escrow.holds.length} active hold(s)`
      )
    }

    const closedEscrow = await prisma.escrowAgreement.update({
      where: { id: escrowId },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
      },
    })

    return closedEscrow
  }

  /**
   * Get escrow agreement with full details
   */
  async getEscrow(escrowId: string) {
    return prisma.escrowAgreement.findUnique({
      where: { id: escrowId },
      include: {
        contract: {
          include: {
            project: true,
            owner: { select: { id: true, name: true, email: true } },
            contractor: { select: { id: true, name: true, email: true } },
          },
        },
        transactions: {
          include: {
            journalEntry: {
              include: {
                lines: {
                  include: {
                    account: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        holds: {
          where: { status: 'ACTIVE' },
        },
      },
    })
  }

  // ========================================================================
  // HELPER METHODS - Get Account IDs for Journal Entries
  // ========================================================================

  /**
   * Get Cash account ID (Asset account 1000)
   */
  private async getCashAccountId(): Promise<string> {
    const account = await prisma.account.findFirst({
      where: {
        code: '1000',
        type: 'ASSET',
        subType: 'CASH',
      },
    })

    if (!account) {
      throw new Error(
        'Cash account not found. Please run account initialization.'
      )
    }

    return account.id
  }

  /**
   * Get Escrow Liability account ID (Liability account 2100)
   */
  private async getEscrowLiabilityAccountId(): Promise<string> {
    const account = await prisma.account.findFirst({
      where: {
        code: '2100',
        type: 'LIABILITY',
        subType: 'ESCROW_LIABILITIES',
      },
    })

    if (!account) {
      throw new Error(
        'Escrow Liability account not found. Please run account initialization.'
      )
    }

    return account.id
  }

  /**
   * Get Contractor Payouts account ID (Expense account 5300)
   */
  private async getContractorPayoutsAccountId(): Promise<string> {
    const account = await prisma.account.findFirst({
      where: {
        code: '5300',
        type: 'EXPENSE',
        subType: 'CONTRACTOR_PAYOUTS',
      },
    })

    if (!account) {
      throw new Error(
        'Contractor Payouts account not found. Please run account initialization.'
      )
    }

    return account.id
  }

  /**
   * Get Platform Fees account ID (Revenue account 4100)
   */
  private async getPlatformFeesAccountId(): Promise<string> {
    const account = await prisma.account.findFirst({
      where: {
        code: '4100',
        type: 'REVENUE',
        subType: 'PLATFORM_FEES',
      },
    })

    if (!account) {
      throw new Error(
        'Platform Fees account not found. Please run account initialization.'
      )
    }

    return account.id
  }

  /**
   * Generate unique escrow account number
   */
  private async generateEscrowAccountNumber(): Promise<string> {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    const datePrefix = `${year}${month}${day}`

    // Find the highest sequence number for today
    const latestEscrow = await prisma.escrowAgreement.findFirst({
      where: {
        escrowAccountNumber: {
          startsWith: `ESC-${datePrefix}`,
        },
      },
      orderBy: {
        escrowAccountNumber: 'desc',
      },
    })

    let sequence = 1
    if (latestEscrow) {
      const match = latestEscrow.escrowAccountNumber.match(/-(\d{4})$/)
      if (match) {
        sequence = parseInt(match[1], 10) + 1
      }
    }

    const sequenceStr = String(sequence).padStart(4, '0')
    return `ESC-${datePrefix}-${sequenceStr}`
  }

  /**
   * Get escrow agreement by contract ID
   */
  async getEscrowByContract(contractId: string): Promise<EscrowAgreement> {
    const escrow = await prisma.escrowAgreement.findUnique({
      where: { contractId },
      include: {
        contract: {
          include: {
            owner: { select: { id: true, email: true, name: true } },
            contractor: { select: { id: true, email: true, name: true } },
          },
        },
      },
    })

    if (!escrow) {
      throw new EscrowNotFoundError(`Escrow for contract ${contractId}`)
    }

    return escrow as EscrowAgreement
  }

  /**
   * Get hold by reference (e.g., dispute ID)
   */
  async getHoldByReference(escrowId: string, reference: string): Promise<EscrowHold> {
    const hold = await prisma.escrowHold.findFirst({
      where: {
        escrowId: escrowId,
        notes: {
          contains: reference,
        },
        status: 'ACTIVE',
      },
    })

    if (!hold) {
      throw new HoldNotFoundError(`Hold for reference ${reference} in escrow ${escrowId}`)
    }

    return hold
  }

  /**
   * Calculate and verify escrow balances for reconciliation
   * Checks actual transaction history against recorded balances
   */
  async calculateBalances(escrowId: string): Promise<{
    currentBalance: Decimal
    availableBalance: Decimal
    heldBalance: Decimal
    totalDeposits: Decimal
    totalReleases: Decimal
    totalFees: Decimal
    totalRefunds: Decimal
    discrepancy: Decimal
    hasDiscrepancy: boolean
  }> {
    // Get escrow agreement
    const escrow = await prisma.escrowAgreement.findUnique({
      where: { id: escrowId },
      include: {
        transactions: true,
        holds: {
          where: { status: 'ACTIVE' },
        },
      },
    })

    if (!escrow) {
      throw new EscrowNotFoundError(escrowId)
    }

    // Calculate totals from transactions
    let totalDeposits = new Decimal(0)
    let totalReleases = new Decimal(0)
    let totalFees = new Decimal(0)
    let totalRefunds = new Decimal(0)

    escrow.transactions.forEach((tx) => {
      // Only count COMPLETED transactions
      if (tx.status === 'COMPLETED') {
        switch (tx.type) {
          case 'DEPOSIT':
            totalDeposits = totalDeposits.add(tx.amount)
            break
          case 'RELEASE':
            totalReleases = totalReleases.add(tx.amount)
            break
          case 'FEE':
            totalFees = totalFees.add(tx.amount)
            break
          case 'REFUND':
            totalRefunds = totalRefunds.add(tx.amount)
            break
          case 'INTEREST':
            totalDeposits = totalDeposits.add(tx.amount) // Interest increases balance
            break
        }
      }
    })

    // Calculate held balance from active holds
    const heldBalance = escrow.holds.reduce(
      (sum, hold) => sum.add(hold.amount),
      new Decimal(0)
    )

    // Calculate expected balances
    const calculatedCurrent = totalDeposits
      .minus(totalReleases)
      .minus(totalFees)
      .minus(totalRefunds)
    const calculatedAvailable = calculatedCurrent.minus(heldBalance)

    // Compare with recorded balances
    const currentDiscrepancy = calculatedCurrent.minus(escrow.currentBalance)
    const availableDiscrepancy = calculatedAvailable.minus(escrow.availableBalance)
    const heldDiscrepancy = heldBalance.minus(escrow.heldBalance)

    // Check for discrepancies (tolerance: $0.01 due to rounding)
    const tolerance = new Decimal(0.01)
    const hasDiscrepancy =
      currentDiscrepancy.abs().greaterThan(tolerance) ||
      availableDiscrepancy.abs().greaterThan(tolerance) ||
      heldDiscrepancy.abs().greaterThan(tolerance)

    if (hasDiscrepancy) {
      // Log discrepancy for investigation
      console.error('Escrow balance discrepancy detected:', {
        escrowId,
        escrowAccountNumber: escrow.escrowAccountNumber,
        recorded: {
          current: escrow.currentBalance.toNumber(),
          available: escrow.availableBalance.toNumber(),
          held: escrow.heldBalance.toNumber(),
        },
        calculated: {
          current: calculatedCurrent.toNumber(),
          available: calculatedAvailable.toNumber(),
          held: heldBalance.toNumber(),
        },
        discrepancies: {
          current: currentDiscrepancy.toNumber(),
          available: availableDiscrepancy.toNumber(),
          held: heldDiscrepancy.toNumber(),
        },
      })

      // TODO: Create alert for finance team
      // TODO: Create audit log entry
      // await auditService.logBalanceDiscrepancy(...)
    }

    return {
      currentBalance: calculatedCurrent,
      availableBalance: calculatedAvailable,
      heldBalance,
      totalDeposits,
      totalReleases,
      totalFees,
      totalRefunds,
      discrepancy: currentDiscrepancy,
      hasDiscrepancy,
    }
  }

  /**
   * Reconcile escrow balances - update recorded balances to match calculated
   * WARNING: This should only be used after investigation and approval
   */
  async reconcileBalances(escrowId: string, performedBy: string): Promise<EscrowAgreement> {
    const calculated = await this.calculateBalances(escrowId)

    if (!calculated.hasDiscrepancy) {
      // No discrepancy, nothing to reconcile
      return (await prisma.escrowAgreement.findUnique({
        where: { id: escrowId },
      }))!
    }

    // Log the reconciliation
    console.warn('Reconciling escrow balances:', {
      escrowId,
      performedBy,
      before: {
        current: (await prisma.escrowAgreement.findUnique({ where: { id: escrowId } }))!.currentBalance.toNumber(),
      },
      after: {
        current: calculated.currentBalance.toNumber(),
        available: calculated.availableBalance.toNumber(),
        held: calculated.heldBalance.toNumber(),
      },
      discrepancy: calculated.discrepancy.toNumber(),
    })

    // Update balances
    const reconciledEscrow = await prisma.escrowAgreement.update({
      where: { id: escrowId },
      data: {
        currentBalance: calculated.currentBalance,
        availableBalance: calculated.availableBalance,
        heldBalance: calculated.heldBalance,
      },
    })

    // TODO: Create audit log entry
    // await auditService.logBalanceReconciliation(...)

    return reconciledEscrow
  }
}

// Export singleton instance
export const escrowService = new EscrowService()

