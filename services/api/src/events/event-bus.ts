/**
 * Event Bus - Central event emitter for application-wide events
 * Uses Node.js EventEmitter for in-process event-driven architecture
 */

import { EventEmitter } from 'events'

// Type-safe event definitions
export interface EventPayloads {
  // Contract Events
  'contract.signed': {
    contractId: string
    contractNumber: string
    totalAmount: number
    ownerId: string
    contractorId: string
    userId: string
  }
  'contract.cancelled': {
    contractId: string
    contractNumber: string
    reason: string
    userId: string
  }
  'contract.completed': {
    contractId: string
    contractNumber: string
    completedAt: Date
  }

  // Milestone Events
  'milestone.created': {
    milestoneId: string
    contractId: string
    amount: number
    description: string
  }
  'milestone.approved': {
    milestoneId: string
    contractId: string
    amount: number
    approvedBy: string
    approvedAt: Date
  }
  'milestone.rejected': {
    milestoneId: string
    contractId: string
    reason: string
    rejectedBy: string
  }
  'milestone.paid': {
    milestoneId: string
    contractId: string
    amount: number
    paidAt: Date
  }

  // Dispute Events
  'dispute.created': {
    disputeId: string
    disputeNumber: string
    contractId: string
    escrowId?: string
    amount: number
    type: string
    initiatedBy: string
    respondentId: string
  }
  'dispute.resolved': {
    disputeId: string
    contractId: string
    escrowId?: string
    resolution: 'FULL_RELEASE' | 'PARTIAL_RELEASE' | 'NO_RELEASE' | 'REFUND'
    ownerAmount?: number
    contractorAmount?: number
    resolvedBy: string
    resolvedAt: Date
  }
  'dispute.appealed': {
    disputeId: string
    contractId: string
    appealedBy: string
  }

  // Escrow Events (emitted BY escrow service)
  'escrow.created': {
    escrowId: string
    escrowAccountNumber: string
    contractId: string
    initialDepositAmount: number
  }
  'escrow.deposit.completed': {
    escrowId: string
    transactionId: string
    amount: number
    newBalance: number
  }
  'escrow.payment.released': {
    escrowId: string
    transactionId: string
    milestoneId: string
    amount: number
    recipientId: string
  }
  'escrow.payment.completed': {
    escrowId: string
    transactionId: string
    milestoneId: string
    amount: number
    completedAt: Date
  }
  'escrow.payment.failed': {
    escrowId: string
    transactionId: string
    milestoneId: string
    amount: number
    reason: string
    error: Error
  }
  'escrow.hold.placed': {
    escrowId: string
    holdId: string
    amount: number
    reason: string
    reference?: string
  }
  'escrow.hold.released': {
    escrowId: string
    holdId: string
    amount: number
  }
  'escrow.frozen': {
    escrowId: string
    reason: string
  }
  'escrow.unfrozen': {
    escrowId: string
  }
  'escrow.closed': {
    escrowId: string
    contractId: string
    closedAt: Date
  }
  'escrow.creation.failed': {
    contractId: string
    error: Error
  }
  'escrow.hold.failed': {
    escrowId: string
    disputeId?: string
    error: Error
  }
  'escrow.balance.discrepancy': {
    escrowId: string
    escrowAccountNumber: string
    expected: number
    actual: number
    discrepancy: number
  }

  // Payout Events
  'payout.initiated': {
    payoutId: string
    escrowTransactionId: string
    amount: number
    recipientId: string
  }
  'payout.completed': {
    payoutId: string
    escrowTransactionId: string
    amount: number
  }
  'payout.failed': {
    payoutId: string
    escrowTransactionId: string
    reason: string
  }

  // Deposit Events
  'deposit.created': {
    depositId: string
    escrowId: string
    amount: number
    paymentMethodId: string
    userId: string
  }
  'deposit.failed': {
    depositId: string
    escrowId: string
    reason: string
    error?: Error
    userId?: string
  }
  'deposit.clearing': {
    depositId: string
    escrowId: string
    expectedClearanceDate: Date
    userId?: string
  }
  'deposit.completed': {
    depositId: string
    escrowId: string
    amount: number
    clearedAt: Date
    userId?: string
  }
  'deposit.cancelled': {
    depositId: string
    escrowId: string
    reason: string
    userId?: string
  }

  // Error handling event
  'error': Error
}

// Type-safe event emitter
class TypedEventEmitter extends EventEmitter {
  emit<K extends keyof EventPayloads>(
    event: K,
    payload: EventPayloads[K]
  ): boolean {
    return super.emit(event, payload)
  }

  on<K extends keyof EventPayloads>(
    event: K,
    listener: (payload: EventPayloads[K]) => void | Promise<void>
  ): this {
    return super.on(event, listener)
  }

  once<K extends keyof EventPayloads>(
    event: K,
    listener: (payload: EventPayloads[K]) => void | Promise<void>
  ): this {
    return super.once(event, listener)
  }

  off<K extends keyof EventPayloads>(
    event: K,
    listener: (payload: EventPayloads[K]) => void | Promise<void>
  ): this {
    return super.off(event, listener)
  }
}

// Singleton event bus instance
export const eventBus = new TypedEventEmitter()

// Increase max listeners for high-traffic events
eventBus.setMaxListeners(50)

// Error handling for unhandled errors in event listeners
eventBus.on('error', (error) => {
  console.error('EventBus error:', error)
})

export default eventBus

