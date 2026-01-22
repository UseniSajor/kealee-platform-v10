/**
 * Accounting-specific error classes
 */

import { AppError, NotFoundError, ConflictError, ValidationError } from './app.error'

export class AccountNotFoundError extends NotFoundError {
  constructor(accountId: string) {
    super('Account', accountId)
  }
}

export class InvalidAccountTypeError extends ValidationError {
  constructor(message: string, details?: any) {
    super(message, details)
    this.code = 'INVALID_ACCOUNT_TYPE'
  }
}

export class AccountCodeDuplicateError extends ConflictError {
  constructor(accountCode: string) {
    super(`Account code ${accountCode} already exists`)
    this.code = 'ACCOUNT_CODE_DUPLICATE'
  }
}

export class JournalEntryNotFoundError extends NotFoundError {
  constructor(entryId: string) {
    super('Journal Entry', entryId)
  }
}

export class InvalidJournalEntryError extends ValidationError {
  constructor(message: string, details?: any) {
    super(message, details)
    this.code = 'INVALID_JOURNAL_ENTRY'
  }
}

export class JournalEntryAlreadyPostedError extends ConflictError {
  constructor(entryNumber: string) {
    super(`Journal entry ${entryNumber} is already posted and cannot be modified`)
    this.code = 'JOURNAL_ENTRY_ALREADY_POSTED'
  }
}

export class DebitCreditImbalanceError extends ValidationError {
  constructor(totalDebits: number, totalCredits: number) {
    super('Debits must equal credits in a journal entry', {
      totalDebits,
      totalCredits,
      difference: Math.abs(totalDebits - totalCredits),
    })
    this.code = 'DEBIT_CREDIT_IMBALANCE'
  }
}

export class ReconciliationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'RECONCILIATION_ERROR', details)
  }
}

