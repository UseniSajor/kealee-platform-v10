/**
 * Escrow-specific error classes
 */

import { AppError } from './app.error'

export class InsufficientEscrowBalanceError extends AppError {
  constructor(
    available: number,
    requested: number,
    escrowId?: string
  ) {
    super(
      `Insufficient escrow balance. Available: $${available.toFixed(2)}, Requested: $${requested.toFixed(2)}`,
      400,
      'INSUFFICIENT_ESCROW_BALANCE',
      { available, requested, escrowId }
    )
  }
}

export class EscrowFrozenError extends AppError {
  constructor(escrowId: string, reason?: string) {
    super(
      `Escrow ${escrowId} is frozen${reason ? `: ${reason}` : ''}. No transactions allowed.`,
      403,
      'ESCROW_FROZEN',
      { escrowId, reason }
    )
  }
}

export class InvalidEscrowStatusError extends AppError {
  constructor(
    currentStatus: string,
    requiredStatus: string | string[],
    escrowId?: string
  ) {
    const required = Array.isArray(requiredStatus)
      ? requiredStatus.join(' or ')
      : requiredStatus
    super(
      `Invalid escrow status. Current: ${currentStatus}, Required: ${required}`,
      400,
      'INVALID_ESCROW_STATUS',
      { currentStatus, requiredStatus, escrowId }
    )
  }
}

export class HoldAlreadyReleasedError extends AppError {
  constructor(holdId: string) {
    super(
      `Hold ${holdId} has already been released`,
      400,
      'HOLD_ALREADY_RELEASED',
      { holdId }
    )
  }
}

export class EscrowNotFoundError extends AppError {
  constructor(escrowId: string) {
    super(
      `Escrow agreement ${escrowId} not found`,
      404,
      'ESCROW_NOT_FOUND',
      { escrowId }
    )
  }
}

export class HoldNotFoundError extends AppError {
  constructor(holdId: string) {
    super(
      `Escrow hold ${holdId} not found`,
      404,
      'HOLD_NOT_FOUND',
      { holdId }
    )
  }
}

export class EscrowBalanceDiscrepancyError extends AppError {
  constructor(
    escrowId: string,
    expected: number,
    actual: number,
    discrepancy: number
  ) {
    super(
      `Escrow balance discrepancy detected. Expected: $${expected.toFixed(2)}, Actual: $${actual.toFixed(2)}, Difference: $${Math.abs(discrepancy).toFixed(2)}`,
      500,
      'ESCROW_BALANCE_DISCREPANCY',
      { escrowId, expected, actual, discrepancy }
    )
  }
}

export class EscrowTransactionNotFoundError extends AppError {
  constructor(transactionId: string) {
    super(
      `Escrow transaction ${transactionId} not found`,
      404,
      'ESCROW_TRANSACTION_NOT_FOUND',
      { transactionId }
    )
  }
}

export class InvalidTransactionStatusError extends AppError {
  constructor(
    transactionId: string,
    currentStatus: string,
    expectedStatus: string | string[]
  ) {
    const expected = Array.isArray(expectedStatus)
      ? expectedStatus.join(' or ')
      : expectedStatus
    super(
      `Invalid transaction status. Current: ${currentStatus}, Expected: ${expected}`,
      400,
      'INVALID_TRANSACTION_STATUS',
      { transactionId, currentStatus, expectedStatus }
    )
  }
}

