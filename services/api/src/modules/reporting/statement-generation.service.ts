/**
 * Statement Generation Service
 * Handles automated generation of financial statements for users
 */

import { prisma, Decimal } from '@kealee/database'
import {
  StatementType,
  StatementStatus,
  RecipientRole,
} from '@kealee/database'

export interface GenerateStatementDTO {
  recipientId: string
  recipientRole: RecipientRole
  statementType: StatementType
  periodStart: Date
  periodEnd: Date
  includeTransactions?: boolean
  includeFees?: boolean
  filterTransactionType?: string[]
}

export interface StatementContent {
  header: {
    statementPeriod: string
    accountNumber?: string
    recipientInfo: {
      name: string
      email: string
      role: string
    }
  }
  summary: {
    openingBalance: number
    totalDeposits: number
    totalReleases: number
    totalFees: number
    closingBalance: number
    transactionCount: number
  }
  transactions: Array<{
    date: Date
    description: string
    debit: number
    credit: number
    balance: number
    type: string
    reference?: string
  }>
  feeBreakdown: {
    platformFees: number
    processingFees: number
    instantPayoutFees: number
    total: number
  }
  charts?: {
    balanceTrend: number[] // Daily balances
    transactionTypes: Record<string, number>
  }
}

export class StatementGenerationService {
  /**
   * Generate statement for a user
   */
  static async generateStatement(
    data: GenerateStatementDTO
  ): Promise<{ statement: any; content: StatementContent }> {
    const {
      recipientId,
      recipientRole,
      statementType,
      periodStart,
      periodEnd,
      includeTransactions = true,
      includeFees = true,
      filterTransactionType,
    } = data

    // Get recipient info
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: {
        id: true,
        name: true,
        email: true,
      },
    })

    if (!recipient) {
      throw new Error('Recipient not found')
    }

    // Get relevant escrow agreements for the user
    const escrowAgreements = await this.getRelevantEscrows(
      recipientId,
      recipientRole
    )

    if (escrowAgreements.length === 0) {
      throw new Error(
        'No escrow accounts found for this user in the period'
      )
    }

    // Get transactions for the period
    const transactions = await this.getTransactionsForPeriod(
      escrowAgreements.map((e) => e.id),
      periodStart,
      periodEnd,
      filterTransactionType
    )

    // Calculate balances
    const openingBalance = await this.calculateOpeningBalance(
      escrowAgreements.map((e) => e.id),
      periodStart
    )

    const { deposits, releases, fees } =
      this.categorizeTransactions(transactions)

    const closingBalance =
      openingBalance + deposits - releases + (includeFees ? fees : 0)

    // Create statement content
    const content: StatementContent = {
      header: {
        statementPeriod: `${periodStart.toLocaleDateString()} - ${periodEnd.toLocaleDateString()}`,
        recipientInfo: {
          name: recipient.name || 'Unknown',
          email: recipient.email || '',
          role: recipientRole,
        },
      },
      summary: {
        openingBalance,
        totalDeposits: deposits,
        totalReleases: releases,
        totalFees: fees,
        closingBalance,
        transactionCount: transactions.length,
      },
      transactions: includeTransactions
        ? this.formatTransactions(transactions, openingBalance)
        : [],
      feeBreakdown: includeFees
        ? await this.calculateFeeBreakdown(
            escrowAgreements.map((e) => e.id),
            periodStart,
            periodEnd
          )
        : { platformFees: 0, processingFees: 0, instantPayoutFees: 0, total: 0 },
      charts: {
        balanceTrend: await this.calculateBalanceTrend(
          escrowAgreements.map((e) => e.id),
          periodStart,
          periodEnd
        ),
        transactionTypes: this.calculateTransactionTypes(transactions),
      },
    }

    // Create statement record
    const statement = await prisma.statement.create({
      data: {
        recipientId,
        recipientRole,
        statementType,
        periodStart,
        periodEnd,
        openingBalance: new Decimal(openingBalance),
        closingBalance: new Decimal(closingBalance),
        totalDeposits: new Decimal(deposits),
        totalReleases: new Decimal(releases),
        totalFees: new Decimal(fees),
        transactionCount: transactions.length,
        status: 'GENERATED',
        metadata: content as any, // Store full content in metadata
      },
      include: {
        recipient: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // TODO: Generate PDF document
    // const pdfUrl = await this.generatePDF(statement, content)
    // await prisma.statement.update({
    //   where: { id: statement.id },
    //   data: { documentUrl: pdfUrl },
    // })

    return { statement, content }
  }

  /**
   * Generate monthly statements for all active users
   */
  static async generateMonthlyStatements(
    month: number,
    year: number
  ): Promise<any[]> {
    // Get period dates (previous month)
    const periodStart = new Date(year, month - 1, 1)
    const periodEnd = new Date(year, month, 0, 23, 59, 59)

    // Get all users with active escrow accounts
    const usersWithEscrow = await prisma.user.findMany({
      where: {
        OR: [
          {
            ownedContracts: {
              some: {
                escrowAgreement: {
                  status: { in: ['ACTIVE', 'FROZEN'] },
                },
              },
            },
          },
          {
            contractorContracts: {
              some: {
                escrowAgreement: {
                  status: { in: ['ACTIVE', 'FROZEN'] },
                },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        ownedContracts: {
          where: {
            escrowAgreement: {
              status: { in: ['ACTIVE', 'FROZEN'] },
            },
          },
          select: {
            id: true,
          },
        },
        contractorContracts: {
          where: {
            escrowAgreement: {
              status: { in: ['ACTIVE', 'FROZEN'] },
            },
          },
          select: {
            id: true,
          },
        },
      },
    })

    const statements: any[] = []

    // Generate statements for each user
    for (const user of usersWithEscrow) {
      try {
        // Generate for owner role if applicable
        if (user.ownedContracts.length > 0) {
          const { statement } = await this.generateStatement({
            recipientId: user.id,
            recipientRole: 'OWNER',
            statementType: 'MONTHLY',
            periodStart,
            periodEnd,
          })
          statements.push(statement)
        }

        // Generate for contractor role if applicable
        if (user.contractorContracts.length > 0) {
          const { statement } = await this.generateStatement({
            recipientId: user.id,
            recipientRole: 'CONTRACTOR',
            statementType: 'MONTHLY',
            periodStart,
            periodEnd,
          })
          statements.push(statement)
        }
      } catch (error) {
        console.error(`Failed to generate statement for user ${user.id}:`, error)
        // Continue with other users
      }
    }

    return statements
  }

  /**
   * Generate custom statement for date range
   */
  static async generateCustomStatement(
    recipientId: string,
    recipientRole: RecipientRole,
    startDate: Date,
    endDate: Date,
    options?: {
      includeTransactions?: boolean
      includeFees?: boolean
      filterTransactionType?: string[]
    }
  ) {
    return await this.generateStatement({
      recipientId,
      recipientRole,
      statementType: 'CUSTOM',
      periodStart: startDate,
      periodEnd: endDate,
      ...options,
    })
  }

  /**
   * Get statement by ID
   */
  static async getStatement(statementId: string) {
    const statement = await prisma.statement.findUnique({
      where: { id: statementId },
      include: {
        recipient: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!statement) {
      throw new Error('Statement not found')
    }

    return statement
  }

  /**
   * List statements for a user
   */
  static async listStatements(
    recipientId: string,
    filters?: {
      statementType?: StatementType
      status?: StatementStatus
      startDate?: Date
      endDate?: Date
      limit?: number
      offset?: number
    }
  ) {
    const where: any = { recipientId }

    if (filters?.statementType) {
      where.statementType = filters.statementType
    }

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.startDate || filters?.endDate) {
      where.periodStart = {}
      if (filters.startDate) where.periodStart.gte = filters.startDate
      if (filters.endDate) where.periodStart.lte = filters.endDate
    }

    const [statements, total] = await Promise.all([
      prisma.statement.findMany({
        where,
        include: {
          recipient: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
        orderBy: { generatedAt: 'desc' },
      }),
      prisma.statement.count({ where }),
    ])

    return {
      statements,
      total,
      limit: filters?.limit || 50,
      offset: filters?.offset || 0,
    }
  }

  /**
   * Mark statement as sent
   */
  static async markAsSent(statementId: string) {
    return await prisma.statement.update({
      where: { id: statementId },
      data: {
        status: 'SENT',
        sentAt: new Date(),
      },
    })
  }

  /**
   * Mark statement as viewed
   */
  static async markAsViewed(statementId: string) {
    const statement = await prisma.statement.findUnique({
      where: { id: statementId },
    })

    if (!statement) {
      throw new Error('Statement not found')
    }

    // Only mark as viewed if not already viewed
    if (!statement.viewedAt) {
      return await prisma.statement.update({
        where: { id: statementId },
        data: {
          status: 'VIEWED',
          viewedAt: new Date(),
        },
      })
    }

    return statement
  }

  /**
   * Verify statement authenticity (public endpoint)
   */
  static async verifyStatement(statementId: string) {
    const statement = await prisma.statement.findUnique({
      where: { id: statementId },
      select: {
        id: true,
        statementType: true,
        periodStart: true,
        periodEnd: true,
        openingBalance: true,
        closingBalance: true,
        totalDeposits: true,
        totalReleases: true,
        totalFees: true,
        generatedAt: true,
        recipient: {
          select: {
            name: true,
          },
        },
      },
    })

    if (!statement) {
      return {
        valid: false,
        message: 'Statement not found',
      }
    }

    return {
      valid: true,
      statement,
      message: 'Statement verified successfully',
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private static async getRelevantEscrows(
    userId: string,
    role: RecipientRole
  ) {
    if (role === 'OWNER') {
      return await prisma.escrowAgreement.findMany({
        where: {
          contract: {
            ownerId: userId,
          },
          status: { in: ['ACTIVE', 'FROZEN', 'CLOSED'] },
        },
      })
    } else if (role === 'CONTRACTOR') {
      return await prisma.escrowAgreement.findMany({
        where: {
          contract: {
            contractorId: userId,
          },
          status: { in: ['ACTIVE', 'FROZEN', 'CLOSED'] },
        },
      })
    }

    return []
  }

  private static async getTransactionsForPeriod(
    escrowIds: string[],
    startDate: Date,
    endDate: Date,
    filterTypes?: string[]
  ) {
    const where: any = {
      escrowId: { in: escrowIds },
      processedDate: {
        gte: startDate,
        lte: endDate,
      },
      status: 'COMPLETED',
    }

    if (filterTypes && filterTypes.length > 0) {
      where.type = { in: filterTypes }
    }

    return await prisma.escrowTransaction.findMany({
      where,
      orderBy: { processedDate: 'asc' },
    })
  }

  private static async calculateOpeningBalance(
    escrowIds: string[],
    asOfDate: Date
  ): Promise<number> {
    const transactions = await prisma.escrowTransaction.findMany({
      where: {
        escrowId: { in: escrowIds },
        processedDate: { lt: asOfDate },
        status: 'COMPLETED',
      },
    })

    let balance = 0
    for (const tx of transactions) {
      if (tx.type === 'DEPOSIT') {
        balance += tx.amount.toNumber()
      } else if (tx.type === 'RELEASE' || tx.type === 'REFUND') {
        balance -= tx.amount.toNumber()
      } else if (tx.type === 'FEE') {
        balance += tx.amount.toNumber() // Fees are income
      }
    }

    return balance
  }

  private static categorizeTransactions(transactions: any[]) {
    let deposits = 0
    let releases = 0
    let fees = 0

    for (const tx of transactions) {
      const amount = tx.amount.toNumber()

      if (tx.type === 'DEPOSIT') {
        deposits += amount
      } else if (tx.type === 'RELEASE' || tx.type === 'REFUND') {
        releases += amount
      } else if (tx.type === 'FEE') {
        fees += amount
      }
    }

    return { deposits, releases, fees }
  }

  private static formatTransactions(
    transactions: any[],
    startingBalance: number
  ) {
    let runningBalance = startingBalance
    const formatted: any[] = []

    for (const tx of transactions) {
      const amount = tx.amount.toNumber()
      let debit = 0
      let credit = 0

      if (tx.type === 'DEPOSIT') {
        credit = amount
        runningBalance += amount
      } else if (tx.type === 'RELEASE' || tx.type === 'REFUND') {
        debit = amount
        runningBalance -= amount
      } else if (tx.type === 'FEE') {
        credit = amount
        runningBalance += amount
      }

      formatted.push({
        date: tx.processedDate,
        description: this.getTransactionDescription(tx),
        debit,
        credit,
        balance: runningBalance,
        type: tx.type,
        reference: tx.reference,
      })
    }

    return formatted
  }

  private static getTransactionDescription(tx: any): string {
    switch (tx.type) {
      case 'DEPOSIT':
        return 'Deposit to Escrow'
      case 'RELEASE':
        return `Payment Release${tx.reference ? ` - ${tx.reference}` : ''}`
      case 'REFUND':
        return 'Refund'
      case 'FEE':
        return 'Platform Fee'
      case 'INTEREST':
        return 'Interest Income'
      default:
        return tx.type
    }
  }

  private static async calculateFeeBreakdown(
    escrowIds: string[],
    startDate: Date,
    endDate: Date
  ) {
    // Platform fees
    const platformFees = await prisma.escrowTransaction.findMany({
      where: {
        escrowId: { in: escrowIds },
        type: 'FEE',
        processedDate: { gte: startDate, lte: endDate },
        status: 'COMPLETED',
      },
    })

    const platformFeesTotal = platformFees.reduce(
      (sum, tx) => sum + tx.amount.toNumber(),
      0
    )

    // Processing fees (estimated from Stripe)
    const deposits = await prisma.escrowTransaction.findMany({
      where: {
        escrowId: { in: escrowIds },
        type: 'DEPOSIT',
        processedDate: { gte: startDate, lte: endDate },
        status: 'COMPLETED',
      },
    })

    const processingFeesTotal = deposits.reduce((sum, tx) => {
      const amount = tx.amount.toNumber()
      return sum + (amount * 0.029 + 0.3) // Stripe fees
    }, 0)

    // Instant payout fees
    const instantPayouts = await prisma.payout.findMany({
      where: {
        method: 'INSTANT',
        status: 'PAID',
        processedAt: { gte: startDate, lte: endDate },
      },
    })

    const instantPayoutFeesTotal = instantPayouts.reduce(
      (sum, p) => sum + p.instantPayoutFee.toNumber(),
      0
    )

    return {
      platformFees: platformFeesTotal,
      processingFees: processingFeesTotal,
      instantPayoutFees: instantPayoutFeesTotal,
      total: platformFeesTotal + processingFeesTotal + instantPayoutFeesTotal,
    }
  }

  private static async calculateBalanceTrend(
    escrowIds: string[],
    startDate: Date,
    endDate: Date
  ): Promise<number[]> {
    const days = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    const dailyBalances: number[] = []
    let currentDate = new Date(startDate)

    for (let i = 0; i <= days; i++) {
      const balance = await this.calculateOpeningBalance(
        escrowIds,
        new Date(currentDate.getTime() + 24 * 60 * 60 * 1000)
      )
      dailyBalances.push(balance)
      currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000)
    }

    return dailyBalances
  }

  private static calculateTransactionTypes(
    transactions: any[]
  ): Record<string, number> {
    const types: Record<string, number> = {}

    for (const tx of transactions) {
      types[tx.type] = (types[tx.type] || 0) + 1
    }

    return types
  }
}

