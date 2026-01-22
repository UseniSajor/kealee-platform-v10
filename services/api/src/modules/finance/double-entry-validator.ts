/**
 * DoubleEntryValidator - Helper class for validating double-entry accounting rules
 */

import { Decimal } from '@kealee/database'
import { Account, AccountType } from '@kealee/database'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  totalDebits?: Decimal
  totalCredits?: Decimal
  difference?: Decimal
}

export interface JournalLineDTO {
  accountId: string
  debit: number | Decimal
  credit: number | Decimal
  description?: string | null
}

export class DoubleEntryValidator {
  /**
   * Validate that total debits equal total credits
   * Allows for floating point precision issues (difference < $0.01)
   */
  static validate(lines: JournalLineDTO[]): ValidationResult {
    const errors: string[] = []

    // Check minimum lines requirement
    if (lines.length < 2) {
      errors.push('Journal entry must have at least 2 lines')
      return { isValid: false, errors }
    }

    // Calculate totals
    let totalDebits = new Decimal(0)
    let totalCredits = new Decimal(0)

    lines.forEach((line, index) => {
      const debit = new Decimal(line.debit)
      const credit = new Decimal(line.credit)

      // Validate that each line has either debit or credit, not both
      if (debit.greaterThan(0) && credit.greaterThan(0)) {
        errors.push(`Line ${index + 1}: Cannot have both debit and credit`)
      }

      // Validate that each line has at least one non-zero amount
      if (debit.isZero() && credit.isZero()) {
        errors.push(`Line ${index + 1}: Must have either debit or credit amount`)
      }

      // Validate precision (2 decimal places)
      const debitPrecision = this.getDecimalPlaces(debit.toNumber())
      const creditPrecision = this.getDecimalPlaces(credit.toNumber())

      if (debitPrecision > 4) {
        errors.push(`Line ${index + 1}: Debit precision exceeds 4 decimal places`)
      }
      if (creditPrecision > 4) {
        errors.push(`Line ${index + 1}: Credit precision exceeds 4 decimal places`)
      }

      totalDebits = totalDebits.add(debit)
      totalCredits = totalCredits.add(credit)
    })

    // Check if debits equal credits (within $0.01 tolerance)
    const difference = totalDebits.minus(totalCredits).abs()
    const tolerance = new Decimal(0.01)

    if (difference.greaterThan(tolerance)) {
      errors.push(
        `Debits must equal credits. Difference: $${difference.toFixed(2)} (Debits: $${totalDebits.toFixed(2)}, Credits: $${totalCredits.toFixed(2)})`
      )
    }

    return {
      isValid: errors.length === 0,
      errors,
      totalDebits,
      totalCredits,
      difference,
    }
  }

  /**
   * Validate that debit/credit entries are appropriate for account types
   */
  static validateAccountTypes(
    lines: JournalLineDTO[],
    accounts: Account[]
  ): ValidationResult {
    const errors: string[] = []

    // Create account lookup map
    const accountMap = new Map<string, Account>()
    accounts.forEach((account) => {
      accountMap.set(account.id, account)
    })

    lines.forEach((line, index) => {
      const account = accountMap.get(line.accountId)

      if (!account) {
        errors.push(`Line ${index + 1}: Account not found`)
        return
      }

      // Check if account is active
      if (!account.isActive) {
        errors.push(
          `Line ${index + 1}: Account "${account.name}" (${account.code}) is inactive`
        )
      }

      // Validate that account type exists
      const debit = new Decimal(line.debit)
      const credit = new Decimal(line.credit)

      // Business rule validation based on account type
      // This is informational only - we don't block, just warn
      // Assets and Expenses normally have debit balances
      // Liabilities, Equity, and Revenue normally have credit balances

      const normalDebitTypes: AccountType[] = ['ASSET', 'EXPENSE']
      const normalCreditTypes: AccountType[] = ['LIABILITY', 'EQUITY', 'REVENUE']

      // Just validate that the account type is recognized
      if (
        !normalDebitTypes.includes(account.type) &&
        !normalCreditTypes.includes(account.type)
      ) {
        errors.push(
          `Line ${index + 1}: Unknown account type "${account.type}" for account "${account.name}"`
        )
      }
    })

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  /**
   * Validate that all account IDs are unique in the entry
   * (Allows same account to appear multiple times if needed)
   */
  static validateUniqueAccounts(lines: JournalLineDTO[]): ValidationResult {
    const errors: string[] = []
    const accountIds = lines.map((line) => line.accountId)
    
    // This is actually allowed in accounting - same account can appear multiple times
    // So we just return success
    // Keeping this method for future use if needed

    return {
      isValid: true,
      errors,
    }
  }

  /**
   * Get number of decimal places in a number
   */
  private static getDecimalPlaces(num: number): number {
    const str = num.toString()
    if (str.indexOf('.') === -1) return 0

    const parts = str.split('.')
    return parts[1].length
  }

  /**
   * Validate entry date is not in the future
   */
  static validateEntryDate(entryDate: Date): ValidationResult {
    const errors: string[] = []
    const now = new Date()

    // Allow entries up to 1 day in the future to account for timezone differences
    const futureLimit = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    if (entryDate > futureLimit) {
      errors.push(`Entry date cannot be more than 1 day in the future`)
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  /**
   * Calculate net effect on an account from journal lines
   */
  static calculateAccountEffect(
    accountId: string,
    lines: JournalLineDTO[]
  ): { netDebit: Decimal; netCredit: Decimal } {
    let netDebit = new Decimal(0)
    let netCredit = new Decimal(0)

    lines
      .filter((line) => line.accountId === accountId)
      .forEach((line) => {
        netDebit = netDebit.add(new Decimal(line.debit))
        netCredit = netCredit.add(new Decimal(line.credit))
      })

    return { netDebit, netCredit }
  }
}

