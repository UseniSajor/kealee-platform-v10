/**
 * AccountService - Manages chart of accounts and account operations
 */

import { Account, AccountType, Prisma } from '@kealee/database'
import { Decimal } from '@prisma/client/runtime/library'
import { prismaAny } from '../../utils/prisma-helper'
import {
  AccountNotFoundError,
  InvalidAccountTypeError,
  AccountCodeDuplicateError,
} from '../../errors/accounting.errors'
import {
  CreateAccountDTO,
  UpdateAccountDTO,
  AccountBalanceDTO,
  ChartOfAccountsNode,
  GetChartOfAccountsOptions,
  GetAccountBalanceOptions,
  ReconcileAccountDTO,
  ReconciliationResult,
  ACCOUNT_CODE_RANGES,
} from '../../types/accounting.types'

export class AccountService {
  /**
   * Create a new account
   */
  async createAccount(data: CreateAccountDTO): Promise<Account> {
    // Auto-generate account code if not provided
    let accountCode = data.code
    if (!accountCode) {
      accountCode = await this.generateAccountCode(data.type)
    }

    // Validate code is unique
    const existingAccount = await prismaAny.account.findUnique({
      where: { code: accountCode },
    })

    if (existingAccount) {
      throw new AccountCodeDuplicateError(accountCode)
    }

    // Validate parent account exists and type matches
    if (data.parentId) {
      const parentAccount = await prismaAny.account.findUnique({
        where: { id: data.parentId },
      })

      if (!parentAccount) {
        throw new AccountNotFoundError(data.parentId)
      }

      if (parentAccount.type !== data.type) {
        throw new InvalidAccountTypeError(
          `Parent account type (${parentAccount.type}) must match child account type (${data.type})`,
          {
            parentType: parentAccount.type,
            childType: data.type,
          }
        )
      }
    }

    // Create account
    const account = await prismaAny.account.create({
      data: {
        code: accountCode,
        name: data.name,
        type: data.type,
        subType: data.subType,
        description: data.description,
        parentId: data.parentId,
        currency: data.currency || 'USD',
        balance: new Decimal(0),
        isActive: true,
        createdBy: data.createdBy,
      },
    })

    return account
  }

  /**
   * Update an existing account
   */
  async updateAccount(accountId: string, data: UpdateAccountDTO): Promise<Account> {
    const account = await prismaAny.account.findUnique({
      where: { id: accountId },
    })

    if (!account) {
      throw new AccountNotFoundError(accountId)
    }

    const updatedAccount = await prismaAny.account.update({
      where: { id: accountId },
      data,
    })

    return updatedAccount
  }

  /**
   * Get chart of accounts in hierarchical structure
   */
  async getChartOfAccounts(
    options: GetChartOfAccountsOptions = {}
  ): Promise<ChartOfAccountsNode[]> {
    const { includeInactive = false, currency } = options

    // Build where clause
    const where: Prisma.AccountWhereInput = {}
    
    if (!includeInactive) {
      where.isActive = true
    }
    
    if (currency) {
      where.currency = currency
    }

    // Fetch all accounts
    const accounts = await prismaAny.account.findMany({
      where,
      orderBy: { code: 'asc' },
      include: {
        parent: true,
      },
    })

    // Build hierarchical structure
    const accountMap = new Map<string, ChartOfAccountsNode>()
    const rootAccounts: ChartOfAccountsNode[] = []

    // First pass: create map of all accounts
    accounts.forEach((account: Account) => {
      accountMap.set(account.id, { ...account, children: [] })
    })

    // Second pass: build hierarchy
    accounts.forEach((account: Account) => {
      const node = accountMap.get(account.id)!
      
      if (account.parentId) {
        const parent = accountMap.get(account.parentId)
        if (parent) {
          parent.children = parent.children || []
          parent.children.push(node)
        } else {
          // Parent not found or filtered out, add to root
          rootAccounts.push(node)
        }
      } else {
        rootAccounts.push(node)
      }
    })

    return rootAccounts
  }

  /**
   * Get account by ID
   */
  async getAccount(accountId: string): Promise<Account> {
    const account = await prismaAny.account.findUnique({
      where: { id: accountId },
      include: {
        parent: true,
        children: true,
      },
    })

    if (!account) {
      throw new AccountNotFoundError(accountId)
    }

    return account
  }

  /**
   * Get account balance as of a specific date
   */
  async getAccountBalance(
    accountId: string,
    options: GetAccountBalanceOptions = {}
  ): Promise<AccountBalanceDTO> {
    const { asOfDate, useCache = true } = options

    // Get account
    const account = await prismaAny.account.findUnique({
      where: { id: accountId },
    })

    if (!account) {
      throw new AccountNotFoundError(accountId)
    }

    // If no date specified, return current balance from account record
    if (!asOfDate) {
      return {
        accountId: account.id,
        accountCode: account.code,
        accountName: account.name,
        openingBalance: new Decimal(0),
        totalDebits: new Decimal(0),
        totalCredits: new Decimal(0),
        closingBalance: account.balance,
        currency: account.currency,
        asOfDate: new Date(),
      }
    }

    // Calculate balance from journal entries
    const journalLines = await prismaAny.journalEntryLine.findMany({
      where: {
        accountId,
        journalEntry: {
          status: 'POSTED',
          postedAt: {
            lte: asOfDate,
          },
        },
      },
      include: {
        journalEntry: true,
      },
    })

    let totalDebits = new Decimal(0)
    let totalCredits = new Decimal(0)

    journalLines.forEach((line: any) => {
      totalDebits = totalDebits.add(line.debit)
      totalCredits = totalCredits.add(line.credit)
    })

    // Calculate closing balance based on account type
    // Assets and Expenses: Debit increases, Credit decreases
    // Liabilities, Equity, Revenue: Credit increases, Debit decreases
    let closingBalance: Decimal
    
    if (account.type === 'ASSET' || account.type === 'EXPENSE') {
      closingBalance = totalDebits.minus(totalCredits)
    } else {
      // LIABILITY, EQUITY, REVENUE
      closingBalance = totalCredits.minus(totalDebits)
    }

    return {
      accountId: account.id,
      accountCode: account.code,
      accountName: account.name,
      openingBalance: new Decimal(0), // Would need previous period data
      totalDebits,
      totalCredits,
      closingBalance,
      currency: account.currency,
      asOfDate,
    }
  }

  /**
   * Reconcile account for a specific period
   */
  async reconcileAccount(
    data: ReconcileAccountDTO
  ): Promise<ReconciliationResult> {
    const { accountId, fiscalYear, fiscalPeriod, reconciledBy, reconciliationNotes } = data

    // Get account
    const account = await prismaAny.account.findUnique({
      where: { id: accountId },
    })

    if (!account) {
      throw new AccountNotFoundError(accountId)
    }

    // Calculate period dates
    const periodStart = new Date(fiscalYear, fiscalPeriod - 1, 1)
    const periodEnd = new Date(fiscalYear, fiscalPeriod, 0, 23, 59, 59, 999)

    // Get journal lines for this period
    const journalLines = await prismaAny.journalEntryLine.findMany({
      where: {
        accountId,
        journalEntry: {
          status: 'POSTED',
          postedAt: {
            gte: periodStart,
            lte: periodEnd,
          },
        },
      },
    })

    // Calculate expected totals
    let expectedDebitTotal = new Decimal(0)
    let expectedCreditTotal = new Decimal(0)

    journalLines.forEach((line: any) => {
      expectedDebitTotal = expectedDebitTotal.add(line.debit)
      expectedCreditTotal = expectedCreditTotal.add(line.credit)
    })

    // Get or create AccountBalance record
    let accountBalance = await prismaAny.accountBalance.findUnique({
      where: {
        accountId_fiscalYear_fiscalPeriod: {
          accountId,
          fiscalYear,
          fiscalPeriod,
        },
      },
    })

    // Calculate opening balance (closing balance of previous period)
    let expectedOpeningBalance = new Decimal(0)
    if (fiscalPeriod > 1) {
      const previousPeriod = await prismaAny.accountBalance.findUnique({
        where: {
          accountId_fiscalYear_fiscalPeriod: {
            accountId,
            fiscalYear,
            fiscalPeriod: fiscalPeriod - 1,
          },
        },
      })
      if (previousPeriod) {
        expectedOpeningBalance = previousPeriod.closingBalance
      }
    }

    // Calculate expected closing balance
    let expectedClosingBalance: Decimal
    if (account.type === 'ASSET' || account.type === 'EXPENSE') {
      expectedClosingBalance = expectedOpeningBalance.add(expectedDebitTotal).minus(expectedCreditTotal)
    } else {
      expectedClosingBalance = expectedOpeningBalance.add(expectedCreditTotal).minus(expectedDebitTotal)
    }

    // Calculate discrepancies
    const openingBalanceDiscrepancy = accountBalance
      ? expectedOpeningBalance.minus(accountBalance.openingBalance).abs()
      : new Decimal(0)
    
    const debitDiscrepancy = accountBalance
      ? expectedDebitTotal.minus(accountBalance.debitTotal).abs()
      : new Decimal(0)
    
    const creditDiscrepancy = accountBalance
      ? expectedCreditTotal.minus(accountBalance.creditTotal).abs()
      : new Decimal(0)
    
    const closingBalanceDiscrepancy = accountBalance
      ? expectedClosingBalance.minus(accountBalance.closingBalance).abs()
      : new Decimal(0)

    const hasDiscrepancy = 
      openingBalanceDiscrepancy.greaterThan(0.01) ||
      debitDiscrepancy.greaterThan(0.01) ||
      creditDiscrepancy.greaterThan(0.01) ||
      closingBalanceDiscrepancy.greaterThan(0.01)

    // Create or update AccountBalance
    if (!accountBalance) {
      accountBalance = await prismaAny.accountBalance.create({
        data: {
          accountId,
          fiscalYear,
          fiscalPeriod,
          openingBalance: expectedOpeningBalance,
          closingBalance: expectedClosingBalance,
          debitTotal: expectedDebitTotal,
          creditTotal: expectedCreditTotal,
          isReconciled: !hasDiscrepancy,
          reconciledAt: !hasDiscrepancy ? new Date() : null,
          reconciledBy: !hasDiscrepancy ? reconciledBy : null,
          reconciliationNotes,
        },
      })
    } else {
      accountBalance = await prismaAny.accountBalance.update({
        where: {
          accountId_fiscalYear_fiscalPeriod: {
            accountId,
            fiscalYear,
            fiscalPeriod,
          },
        },
        data: {
          isReconciled: !hasDiscrepancy,
          reconciledAt: !hasDiscrepancy ? new Date() : null,
          reconciledBy: !hasDiscrepancy ? reconciledBy : null,
          reconciliationNotes,
        },
      })
    }

    // Return reconciliation result
    return {
      accountId: account.id,
      accountCode: account.code,
      accountName: account.name,
      fiscalYear,
      fiscalPeriod,
      expectedOpeningBalance,
      expectedDebitTotal,
      expectedCreditTotal,
      expectedClosingBalance,
      actualOpeningBalance: accountBalance.openingBalance,
      actualDebitTotal: accountBalance.debitTotal,
      actualCreditTotal: accountBalance.creditTotal,
      actualClosingBalance: accountBalance.closingBalance,
      hasDiscrepancy,
      openingBalanceDiscrepancy,
      debitDiscrepancy,
      creditDiscrepancy,
      closingBalanceDiscrepancy,
      isReconciled: accountBalance.isReconciled,
      reconciledAt: accountBalance.reconciledAt,
      reconciledBy: accountBalance.reconciledBy,
      reconciliationNotes: accountBalance.reconciliationNotes,
    }
  }

  /**
   * Generate next available account code for a given account type
   */
  private async generateAccountCode(type: AccountType): Promise<string> {
    const range = ACCOUNT_CODE_RANGES[type]
    
    // Find highest existing code in range
    const highestAccount = await prismaAny.account.findFirst({
      where: {
        type,
        code: {
          gte: range.min.toString(),
          lte: range.max.toString(),
        },
      },
      orderBy: {
        code: 'desc',
      },
    })

    let nextCode: number
    if (highestAccount) {
      const currentCode = parseInt(highestAccount.code, 10)
      nextCode = currentCode + 1
    } else {
      nextCode = range.min
    }

    // Ensure we haven't exceeded the range
    if (nextCode > range.max) {
      throw new Error(
        `Account code range exhausted for type ${type}. Maximum code ${range.max} reached.`
      )
    }

    return nextCode.toString()
  }

  /**
   * Deactivate an account (soft delete)
   */
  async deactivateAccount(accountId: string): Promise<Account> {
    const account = await prismaAny.account.findUnique({
      where: { id: accountId },
    })

    if (!account) {
      throw new AccountNotFoundError(accountId)
    }

    const updatedAccount = await prismaAny.account.update({
      where: { id: accountId },
      data: { isActive: false },
    })

    return updatedAccount
  }

  /**
   * Reactivate an account
   */
  async reactivateAccount(accountId: string): Promise<Account> {
    const account = await prismaAny.account.findUnique({
      where: { id: accountId },
    })

    if (!account) {
      throw new AccountNotFoundError(accountId)
    }

    const updatedAccount = await prismaAny.account.update({
      where: { id: accountId },
      data: { isActive: true },
    })

    return updatedAccount
  }
}

// Export singleton instance
export const accountService = new AccountService()

