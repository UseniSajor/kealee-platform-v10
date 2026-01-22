/**
 * JournalEntryService - Core double-entry accounting service
 */

import { JournalEntry, JournalEntryStatus, Prisma } from '@kealee/database'
import { Decimal } from '@prisma/client/runtime/library'
import { prismaAny } from '../../utils/prisma-helper'
import {
  JournalEntryNotFoundError,
  InvalidJournalEntryError,
  JournalEntryAlreadyPostedError,
  DoubleEntryMismatchError,
  EntryAlreadyPostedException,
  InvalidEntryStatusError,
  AccountNotFoundError,
} from '../../errors/accounting.errors'
import {
  CreateJournalEntryDTO,
  JournalEntryWithLines,
  PostJournalEntryDTO,
  VoidJournalEntryDTO,
  GetJournalEntriesOptions,
} from '../../types/accounting.types'
import { DoubleEntryValidator } from './double-entry-validator'
import { AccountService, accountService } from './account.service'

interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export class JournalEntryService {
  private accountService: AccountService

  constructor(accountService: AccountService) {
    this.accountService = accountService
  }

  /**
   * Create a new journal entry in DRAFT status
   */
  async createJournalEntry(data: CreateJournalEntryDTO): Promise<JournalEntryWithLines> {
    const { description, entryDate, reference, referenceId, lines, createdBy } = data

    // Validate entry date
    const dateValidation = DoubleEntryValidator.validateEntryDate(
      entryDate || new Date()
    )
    if (!dateValidation.isValid) {
      throw new InvalidJournalEntryError(
        'Invalid entry date',
        dateValidation.errors
      )
    }

    // Validate double-entry balance
    const validation = DoubleEntryValidator.validate(lines)
    if (!validation.isValid) {
      throw new DoubleEntryMismatchError(
        validation.totalDebits?.toNumber() || 0,
        validation.totalCredits?.toNumber() || 0,
        validation.difference?.toNumber() || 0
      )
    }

    // Fetch all referenced accounts
    const accountIds = [...new Set(lines.map((line) => line.accountId))]
    const accounts = await Promise.all(
      accountIds.map((id) => this.accountService.getAccount(id))
    )

    // Validate account types and status
    const accountValidation = DoubleEntryValidator.validateAccountTypes(
      lines,
      accounts
    )
    if (!accountValidation.isValid) {
      throw new InvalidJournalEntryError(
        'Invalid accounts',
        accountValidation.errors
      )
    }

    // Generate entry number
    const entryNumber = await this.generateEntryNumber(entryDate || new Date())

    // Calculate total amount for approval threshold check
    const totalAmount = validation.totalDebits || new Decimal(0)
    const requiresApproval = totalAmount.greaterThan(10000)

    // Create journal entry with lines in a transaction
    const journalEntry = await prismaAny.$transaction(async (tx: any) => {
      const entry = await tx.journalEntry.create({
        data: {
          entryNumber,
          description,
          entryDate: entryDate || new Date(),
          reference,
          referenceId,
          status: 'DRAFT',
          requiresApproval,
          createdBy,
          lines: {
            create: lines.map((line, index) => ({
              accountId: line.accountId,
              debit: new Decimal(line.debit),
              credit: new Decimal(line.credit),
              description: line.description,
              lineOrder: line.lineOrder ?? index,
            })),
          },
        },
        include: {
          lines: {
            include: {
              account: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                  type: true,
                },
              },
            },
            orderBy: {
              lineOrder: 'asc',
            },
          },
        },
      })

      return entry
    })

    return journalEntry as JournalEntryWithLines
  }

  /**
   * Post a journal entry - makes it permanent and updates account balances
   */
  async postJournalEntry(data: PostJournalEntryDTO): Promise<JournalEntryWithLines> {
    const { entryId, postedBy } = data

    // Get the entry with lines
    const entry = await this.getJournalEntry(entryId)

    // Verify entry is in DRAFT status
    if (entry.status !== 'DRAFT') {
      throw new InvalidEntryStatusError(entry.status, 'DRAFT')
    }

    // Re-validate double-entry balance (safety check)
    const validation = DoubleEntryValidator.validate(entry.lines)
    if (!validation.isValid) {
      throw new DoubleEntryMismatchError(
        validation.totalDebits?.toNumber() || 0,
        validation.totalCredits?.toNumber() || 0,
        validation.difference?.toNumber() || 0
      )
    }

    // Check if entry requires approval
    if (entry.requiresApproval && !entry.approvedBy) {
      // Set status to pending approval - do not post yet
      const updatedEntry = await prismaAny.journalEntry.update({
        where: { id: entryId },
        data: {
          status: 'DRAFT', // Keep as DRAFT until approved
        },
        include: {
          lines: {
            include: {
              account: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                  type: true,
                },
              },
            },
            orderBy: {
              lineOrder: 'asc',
            },
          },
        },
      })

      // Note: In a full implementation, this would trigger an approval workflow
      // For now, we just require manual approval before posting

      return updatedEntry as JournalEntryWithLines
    }

    // Post the entry and update account balances in a transaction
    const postedEntry = await prismaAny.$transaction(async (tx: any) => {
      // Update entry status to POSTED
      const updated = await tx.journalEntry.update({
        where: { id: entryId },
        data: {
          status: 'POSTED',
          postedAt: new Date(),
          postedBy,
        },
        include: {
          lines: {
            include: {
              account: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                  type: true,
                },
              },
            },
            orderBy: {
              lineOrder: 'asc',
            },
          },
        },
      })

      // Update account balances
      const accountUpdates = new Map<string, { debit: Decimal; credit: Decimal }>()

      // Aggregate changes by account
      updated.lines.forEach((line: any) => {
        const existing = accountUpdates.get(line.accountId) || {
          debit: new Decimal(0),
          credit: new Decimal(0),
        }
        accountUpdates.set(line.accountId, {
          debit: existing.debit.add(line.debit),
          credit: existing.credit.add(line.credit),
        })
      })

      // Update each account's balance
      for (const [accountId, changes] of accountUpdates) {
        const account = await tx.account.findUnique({
          where: { id: accountId },
        })

        if (!account) {
          throw new AccountNotFoundError(accountId)
        }

        // Calculate new balance based on account type
        let newBalance: Decimal
        const currentBalance = new Decimal(account.balance)

        if (account.type === 'ASSET' || account.type === 'EXPENSE') {
          // Debit increases, Credit decreases
          newBalance = currentBalance.add(changes.debit).minus(changes.credit)
        } else {
          // LIABILITY, EQUITY, REVENUE: Credit increases, Debit decreases
          newBalance = currentBalance.add(changes.credit).minus(changes.debit)
        }

        await tx.account.update({
          where: { id: accountId },
          data: { balance: newBalance },
        })
      }

      return updated
    })

    return postedEntry as JournalEntryWithLines
  }

  /**
   * Void a posted journal entry by creating a reversing entry
   */
  async voidJournalEntry(data: VoidJournalEntryDTO): Promise<{
    originalEntry: JournalEntryWithLines
    reversingEntry: JournalEntryWithLines
  }> {
    const { entryId, voidedBy, voidReason } = data

    // Get the original entry
    const originalEntry = await this.getJournalEntry(entryId)

    // Verify entry is POSTED
    if (originalEntry.status !== 'POSTED') {
      throw new InvalidEntryStatusError(originalEntry.status, 'POSTED')
    }

    // Create and post reversing entry in a transaction
    const result = await prismaAny.$transaction(async (tx: any) => {
      // Create reversing lines (swap debits and credits)
      const reversingLines = originalEntry.lines.map((line) => ({
        accountId: line.accountId,
        debit: line.credit.toNumber(), // Swap
        credit: line.debit.toNumber(), // Swap
        description: line.description
          ? `REVERSAL: ${line.description}`
          : undefined,
        lineOrder: line.lineOrder,
      }))

      // Generate new entry number for reversing entry
      const reversingEntryNumber = await this.generateEntryNumber(new Date())

      // Create reversing entry
      const reversingEntry = await tx.journalEntry.create({
        data: {
          entryNumber: reversingEntryNumber,
          description: `VOID of ${originalEntry.entryNumber} - ${voidReason}`,
          entryDate: new Date(),
          reference: originalEntry.reference,
          referenceId: originalEntry.id, // Link to original
          status: 'POSTED', // Post immediately
          postedAt: new Date(),
          postedBy: voidedBy,
          createdBy: voidedBy,
          requiresApproval: false,
          lines: {
            create: reversingLines.map((line, index) => ({
              accountId: line.accountId,
              debit: new Decimal(line.debit),
              credit: new Decimal(line.credit),
              description: line.description,
              lineOrder: line.lineOrder ?? index,
            })),
          },
        },
        include: {
          lines: {
            include: {
              account: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                  type: true,
                },
              },
            },
            orderBy: {
              lineOrder: 'asc',
            },
          },
        },
      })

      // Update account balances for reversing entry
      const accountUpdates = new Map<string, { debit: Decimal; credit: Decimal }>()

      reversingEntry.lines.forEach((line: any) => {
        const existing = accountUpdates.get(line.accountId) || {
          debit: new Decimal(0),
          credit: new Decimal(0),
        }
        accountUpdates.set(line.accountId, {
          debit: existing.debit.add(line.debit),
          credit: existing.credit.add(line.credit),
        })
      })

      for (const [accountId, changes] of accountUpdates) {
        const account = await tx.account.findUnique({
          where: { id: accountId },
        })

        if (!account) {
          throw new AccountNotFoundError(accountId)
        }

        let newBalance: Decimal
        const currentBalance = new Decimal(account.balance)

        if (account.type === 'ASSET' || account.type === 'EXPENSE') {
          newBalance = currentBalance.add(changes.debit).minus(changes.credit)
        } else {
          newBalance = currentBalance.add(changes.credit).minus(changes.debit)
        }

        await tx.account.update({
          where: { id: accountId },
          data: { balance: newBalance },
        })
      }

      // Mark original entry as VOID
      const voidedOriginal = await tx.journalEntry.update({
        where: { id: entryId },
        data: {
          status: 'VOID',
          voidedAt: new Date(),
          voidedBy,
          voidReason,
        },
        include: {
          lines: {
            include: {
              account: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                  type: true,
                },
              },
            },
            orderBy: {
              lineOrder: 'asc',
            },
          },
        },
      })

      return {
        originalEntry: voidedOriginal,
        reversingEntry,
      }
    })

    return result as {
      originalEntry: JournalEntryWithLines
      reversingEntry: JournalEntryWithLines
    }
  }

  /**
   * Get a single journal entry with all lines and account details
   */
  async getJournalEntry(entryId: string): Promise<JournalEntryWithLines> {
    const entry = await prismaAny.journalEntry.findUnique({
      where: { id: entryId },
      include: {
        lines: {
          include: {
            account: {
              select: {
                id: true,
                code: true,
                name: true,
                type: true,
              },
            },
          },
          orderBy: {
            lineOrder: 'asc',
          },
        },
      },
    })

    if (!entry) {
      throw new JournalEntryNotFoundError(entryId)
    }

    // Calculate totals
    const totalDebits = entry.lines.reduce(
      (sum: Decimal, line: any) => sum.add(line.debit),
      new Decimal(0)
    )
    const totalCredits = entry.lines.reduce(
      (sum: Decimal, line: any) => sum.add(line.credit),
      new Decimal(0)
    )

    return {
      ...entry,
      lines: entry.lines.map((line: any) => ({
        ...line,
        totalDebits,
        totalCredits,
      })),
    } as JournalEntryWithLines
  }

  /**
   * List journal entries with filtering and pagination
   */
  async listJournalEntries(
    options: GetJournalEntriesOptions = {}
  ): Promise<PaginatedResult<JournalEntryWithLines>> {
    const {
      startDate,
      endDate,
      status,
      accountId,
      reference,
      limit = 50,
      offset = 0,
    } = options

    // Build where clause
    const where: Prisma.JournalEntryWhereInput = {}

    if (startDate || endDate) {
      where.entryDate = {}
      if (startDate) where.entryDate.gte = startDate
      if (endDate) where.entryDate.lte = endDate
    }

    if (status) {
      if (Array.isArray(status)) {
        where.status = { in: status }
      } else {
        where.status = status
      }
    }

    if (accountId) {
      where.lines = {
        some: {
          accountId,
        },
      }
    }

    if (reference) {
      where.reference = { contains: reference }
    }

    // Get total count
    const total = await prismaAny.journalEntry.count({ where })

    // Get entries
    const entries = await prismaAny.journalEntry.findMany({
      where,
      include: {
        lines: {
          include: {
            account: {
              select: {
                id: true,
                code: true,
                name: true,
                type: true,
              },
            },
          },
          orderBy: {
            lineOrder: 'asc',
          },
        },
      },
      orderBy: {
        entryDate: 'desc',
      },
      skip: offset,
      take: limit,
    })

    return {
      data: entries as JournalEntryWithLines[],
      total,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  /**
   * Approve a journal entry (for entries > $10,000)
   */
  async approveJournalEntry(
    entryId: string,
    approvedBy: string
  ): Promise<JournalEntryWithLines> {
    const entry = await this.getJournalEntry(entryId)

    if (entry.status !== 'DRAFT') {
      throw new InvalidEntryStatusError(entry.status, 'DRAFT')
    }

    if (!entry.requiresApproval) {
      throw new InvalidJournalEntryError('Entry does not require approval')
    }

    const updatedEntry = await prismaAny.journalEntry.update({
      where: { id: entryId },
      data: {
        approvedBy,
        approvedAt: new Date(),
      },
      include: {
        lines: {
          include: {
            account: {
              select: {
                id: true,
                code: true,
                name: true,
                type: true,
              },
            },
          },
          orderBy: {
            lineOrder: 'asc',
          },
        },
      },
    })

    return updatedEntry as JournalEntryWithLines
  }

  /**
   * Generate entry number in format: JE-YYYYMMDD-XXXX
   */
  private async generateEntryNumber(date: Date): Promise<string> {
    // Format: JE-YYYYMMDD-XXXX
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const datePrefix = `JE-${year}${month}${day}`

    // Find highest sequence number for this date
    const lastEntry = await prismaAny.journalEntry.findFirst({
      where: {
        entryNumber: {
          startsWith: datePrefix,
        },
      },
      orderBy: {
        entryNumber: 'desc',
      },
    })

    let sequence = 1
    if (lastEntry) {
      // Extract sequence from last entry (e.g., "JE-20250121-0042" -> 42)
      const lastSequence = lastEntry.entryNumber.split('-')[2]
      sequence = parseInt(lastSequence, 10) + 1
    }

    const sequenceStr = String(sequence).padStart(4, '0')
    return `${datePrefix}-${sequenceStr}`
  }

  /**
   * Delete a DRAFT entry (only drafts can be deleted)
   */
  async deleteDraftEntry(entryId: string): Promise<void> {
    const entry = await this.getJournalEntry(entryId)

    if (entry.status !== 'DRAFT') {
      throw new EntryAlreadyPostedException(entry.entryNumber)
    }

    await prismaAny.journalEntry.delete({
      where: { id: entryId },
    })
  }
}

// Export singleton instance
export const journalEntryService = new JournalEntryService(accountService)

