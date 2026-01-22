/**
 * Financial Reporting Service
 * Generates comprehensive financial reports including cash flow, P&L, escrow summaries, and metrics
 */

import { prisma } from '@kealee/database'
import { Decimal } from '@prisma/client/runtime/library'

export interface ReportFilters {
  startDate?: Date
  endDate?: Date
  projectType?: string
  contractorId?: string
  status?: string
  minAmount?: number
  maxAmount?: number
}

export interface CashFlowStatement {
  period: string
  startDate: Date
  endDate: Date
  operatingActivities: {
    deposits: number
    releases: number
    fees: number
    netOperating: number
  }
  financingActivities: {
    refunds: number
    chargebacks: number
    netFinancing: number
  }
  netCashFlow: number
  openingBalance: number
  closingBalance: number
  forecast?: {
    next30Days: number
    next60Days: number
    next90Days: number
  }
}

export interface ProfitLossReport {
  period: string
  startDate: Date
  endDate: Date
  revenue: {
    platformFees: number
    processingFees: number
    interestIncome: number
    total: number
  }
  expenses: {
    stripeFees: number
    refunds: number
    chargebacks: number
    disputeFees: number
    total: number
  }
  netProfit: number
  profitMargin: number
  breakdownByCategory?: Record<string, { revenue: number; profit: number }>
}

export interface EscrowBalanceSummary {
  asOfDate: Date
  totalBalance: number
  breakdown: {
    active: number
    frozen: number
    disputed: number
    pendingDeposit: number
  }
  agingAnalysis: {
    under30Days: number
    days30to60: number
    days60to90: number
    over90Days: number
  }
  projectedReleases: {
    next30Days: number
    next60Days: number
    next90Days: number
  }
  escrowCount: {
    active: number
    frozen: number
    disputed: number
    total: number
  }
}

export interface TransactionMetrics {
  period: string
  startDate: Date
  endDate: Date
  volume: {
    daily: number[]
    weekly: number[]
    monthly: number[]
  }
  counts: {
    total: number
    deposits: number
    releases: number
    refunds: number
  }
  amounts: {
    total: number
    average: number
    median: number
    min: number
    max: number
  }
  successRate: number
  failureRate: number
  byPaymentMethod?: Record<string, { count: number; amount: number; successRate: number }>
  peakTimes?: Array<{ hour: number; day: string; count: number }>
}

export interface FeeRevenueTracking {
  period: string
  startDate: Date
  endDate: Date
  platformFees: {
    collected: number
    count: number
    average: number
  }
  processingFees: {
    collected: number
    count: number
    average: number
  }
  instantPayoutFees: {
    collected: number
    count: number
  }
  totalRevenue: number
  byProjectType?: Record<string, number>
  byContractSize?: {
    small: number // < $10k
    medium: number // $10k - $100k
    large: number // > $100k
  }
  trend: {
    growthRate: number
    forecast: number
  }
}

export interface ContractorPayoutReport {
  period: string
  startDate: Date
  endDate: Date
  contractorId?: string
  totalPaid: number
  payoutCount: number
  avgPayoutAmount: number
  avgPayoutTime: number // in hours
  pendingAmount: number
  failedPayouts: {
    count: number
    amount: number
  }
  topContractors?: Array<{
    contractorId: string
    contractorName: string
    totalPaid: number
    payoutCount: number
  }>
}

export interface DashboardMetrics {
  timestamp: Date
  realTime: {
    totalEscrowBalance: number
    todayDeposits: number
    todayReleases: number
    activeDisputes: number
    pendingVerifications: number
    activeContracts: number
  }
  today: {
    transactionVolume: number
    transactionCount: number
    feeRevenue: number
    newEscrows: number
    completedPayouts: number
  }
  trends: {
    dailyVolumeLast30Days: number[]
    revenueByCategory: Record<string, number>
    escrowStatusDistribution: Record<string, number>
  }
  alerts: Array<{
    type: 'warning' | 'error' | 'info'
    message: string
    count: number
  }>
}

export class FinancialReportingService {
  /**
   * Generate Cash Flow Statement
   */
  static async generateCashFlowStatement(
    filters: ReportFilters
  ): Promise<CashFlowStatement> {
    const { startDate, endDate } = filters

    if (!startDate || !endDate) {
      throw new Error('Start date and end date are required')
    }

    // Get all escrow transactions in period
    const transactions = await prisma.escrowTransaction.findMany({
      where: {
        processedDate: {
          gte: startDate,
          lte: endDate,
        },
        status: 'COMPLETED',
      },
      include: {
        escrow: {
          include: {
            contract: true,
          },
        },
      },
    })

    // Operating Activities
    const deposits = transactions
      .filter((t) => t.type === 'DEPOSIT')
      .reduce((sum, t) => sum + t.amount.toNumber(), 0)

    const releases = transactions
      .filter((t) => t.type === 'RELEASE')
      .reduce((sum, t) => sum + t.amount.toNumber(), 0)

    const fees = transactions
      .filter((t) => t.type === 'FEE')
      .reduce((sum, t) => sum + t.amount.toNumber(), 0)

    const netOperating = deposits - releases + fees

    // Financing Activities
    const refunds = transactions
      .filter((t) => t.type === 'REFUND')
      .reduce((sum, t) => sum + t.amount.toNumber(), 0)

    // Get chargebacks from metadata (or separate tracking)
    const chargebacks = 0 // TODO: Implement chargeback tracking

    const netFinancing = -(refunds + chargebacks)

    const netCashFlow = netOperating + netFinancing

    // Get opening and closing balances
    const openingBalance = await this.getTotalEscrowBalance(startDate)
    const closingBalance = await this.getTotalEscrowBalance(endDate)

    // Forecast based on scheduled milestones
    const forecast = await this.forecastCashFlow(endDate)

    return {
      period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
      startDate,
      endDate,
      operatingActivities: {
        deposits,
        releases,
        fees,
        netOperating,
      },
      financingActivities: {
        refunds,
        chargebacks,
        netFinancing,
      },
      netCashFlow,
      openingBalance,
      closingBalance,
      forecast,
    }
  }

  /**
   * Generate Profit & Loss Report
   */
  static async generateProfitLossReport(
    filters: ReportFilters
  ): Promise<ProfitLossReport> {
    const { startDate, endDate } = filters

    if (!startDate || !endDate) {
      throw new Error('Start date and end date are required')
    }

    // Revenue
    const platformFees = await this.getPlatformFees(startDate, endDate)
    const processingFees = await this.getProcessingFees(startDate, endDate)
    const interestIncome = await this.getInterestIncome(startDate, endDate)

    const totalRevenue = platformFees + processingFees + interestIncome

    // Expenses
    const stripeFees = await this.getStripeFees(startDate, endDate)
    const refunds = await this.getRefundTotal(startDate, endDate)
    const chargebacks = 0 // TODO: Implement chargeback tracking
    const disputeFees = 0 // TODO: Track dispute-related costs

    const totalExpenses = stripeFees + refunds + chargebacks + disputeFees

    const netProfit = totalRevenue - totalExpenses
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

    // Breakdown by category (if applicable)
    const breakdownByCategory = await this.getRevenueBreakdownByCategory(
      startDate,
      endDate
    )

    return {
      period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
      startDate,
      endDate,
      revenue: {
        platformFees,
        processingFees,
        interestIncome,
        total: totalRevenue,
      },
      expenses: {
        stripeFees,
        refunds,
        chargebacks,
        disputeFees,
        total: totalExpenses,
      },
      netProfit,
      profitMargin,
      breakdownByCategory,
    }
  }

  /**
   * Generate Escrow Balance Summary
   */
  static async generateEscrowBalanceSummary(
    asOfDate?: Date
  ): Promise<EscrowBalanceSummary> {
    const date = asOfDate || new Date()

    // Get all escrow agreements
    const escrows = await prisma.escrowAgreement.findMany({
      where: {
        createdAt: {
          lte: date,
        },
      },
    })

    const totalBalance = escrows.reduce(
      (sum, e) => sum + e.currentBalance.toNumber(),
      0
    )

    // Breakdown by status
    const breakdown = {
      active: escrows
        .filter((e) => e.status === 'ACTIVE')
        .reduce((sum, e) => sum + e.currentBalance.toNumber(), 0),
      frozen: escrows
        .filter((e) => e.status === 'FROZEN')
        .reduce((sum, e) => sum + e.currentBalance.toNumber(), 0),
      disputed: escrows
        .filter((e) => e.status === 'FROZEN') // Disputes freeze escrows
        .reduce((sum, e) => sum + e.heldBalance.toNumber(), 0),
      pendingDeposit: escrows
        .filter((e) => e.status === 'PENDING_DEPOSIT')
        .reduce((sum, e) => sum + e.currentBalance.toNumber(), 0),
    }

    // Aging analysis
    const now = date
    const agingAnalysis = {
      under30Days: 0,
      days30to60: 0,
      days60to90: 0,
      over90Days: 0,
    }

    for (const escrow of escrows.filter((e) => e.status === 'ACTIVE')) {
      const ageInDays = Math.floor(
        (now.getTime() - escrow.activatedAt!.getTime()) / (1000 * 60 * 60 * 24)
      )
      const balance = escrow.currentBalance.toNumber()

      if (ageInDays < 30) agingAnalysis.under30Days += balance
      else if (ageInDays < 60) agingAnalysis.days30to60 += balance
      else if (ageInDays < 90) agingAnalysis.days60to90 += balance
      else agingAnalysis.over90Days += balance
    }

    // Projected releases based on scheduled milestones
    const projectedReleases = await this.getProjectedReleases(date)

    // Escrow counts
    const escrowCount = {
      active: escrows.filter((e) => e.status === 'ACTIVE').length,
      frozen: escrows.filter((e) => e.status === 'FROZEN').length,
      disputed: await prisma.dispute.count({
        where: { status: { in: ['OPEN', 'UNDER_REVIEW', 'MEDIATION'] } },
      }),
      total: escrows.length,
    }

    return {
      asOfDate: date,
      totalBalance,
      breakdown,
      agingAnalysis,
      projectedReleases,
      escrowCount,
    }
  }

  /**
   * Generate Transaction Metrics
   */
  static async generateTransactionMetrics(
    filters: ReportFilters
  ): Promise<TransactionMetrics> {
    const { startDate, endDate } = filters

    if (!startDate || !endDate) {
      throw new Error('Start date and end date are required')
    }

    // Get all transactions
    const transactions = await prisma.escrowTransaction.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    // Volume by period
    const dailyVolume = this.aggregateByDay(transactions, startDate, endDate)
    const weeklyVolume = this.aggregateByWeek(transactions, startDate, endDate)
    const monthlyVolume = this.aggregateByMonth(transactions, startDate, endDate)

    // Counts by type
    const counts = {
      total: transactions.length,
      deposits: transactions.filter((t) => t.type === 'DEPOSIT').length,
      releases: transactions.filter((t) => t.type === 'RELEASE').length,
      refunds: transactions.filter((t) => t.type === 'REFUND').length,
    }

    // Amount statistics
    const amounts = transactions.map((t) => t.amount.toNumber())
    const totalAmount = amounts.reduce((sum, a) => sum + a, 0)
    const sortedAmounts = amounts.sort((a, b) => a - b)

    const amountStats = {
      total: totalAmount,
      average: amounts.length > 0 ? totalAmount / amounts.length : 0,
      median:
        amounts.length > 0
          ? sortedAmounts[Math.floor(sortedAmounts.length / 2)]
          : 0,
      min: amounts.length > 0 ? Math.min(...amounts) : 0,
      max: amounts.length > 0 ? Math.max(...amounts) : 0,
    }

    // Success/failure rates
    const completed = transactions.filter((t) => t.status === 'COMPLETED').length
    const failed = transactions.filter((t) => t.status === 'FAILED').length
    const successRate =
      transactions.length > 0 ? (completed / transactions.length) * 100 : 0
    const failureRate =
      transactions.length > 0 ? (failed / transactions.length) * 100 : 0

    // Peak times analysis
    const peakTimes = this.analyzePeakTimes(transactions)

    return {
      period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
      startDate,
      endDate,
      volume: {
        daily: dailyVolume,
        weekly: weeklyVolume,
        monthly: monthlyVolume,
      },
      counts,
      amounts: amountStats,
      successRate,
      failureRate,
      peakTimes,
    }
  }

  /**
   * Generate Fee Revenue Tracking Report
   */
  static async generateFeeRevenueReport(
    filters: ReportFilters
  ): Promise<FeeRevenueTracking> {
    const { startDate, endDate } = filters

    if (!startDate || !endDate) {
      throw new Error('Start date and end date are required')
    }

    // Platform fees
    const platformFeeTransactions = await prisma.escrowTransaction.findMany({
      where: {
        type: 'FEE',
        processedDate: { gte: startDate, lte: endDate },
        status: 'COMPLETED',
      },
    })

    const platformFeesCollected = platformFeeTransactions.reduce(
      (sum, t) => sum + t.amount.toNumber(),
      0
    )

    // Processing fees (from Stripe)
    const processingFees = await this.getProcessingFees(startDate, endDate)

    // Instant payout fees
    const instantPayoutFees = await prisma.payout.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        method: 'INSTANT',
        status: 'PAID',
      },
    })

    const instantPayoutFeesCollected = instantPayoutFees.reduce(
      (sum, p) => sum + p.instantPayoutFee.toNumber(),
      0
    )

    const totalRevenue =
      platformFeesCollected + processingFees + instantPayoutFeesCollected

    // Breakdown by project type
    // TODO: Implement when project types are available

    // Breakdown by contract size
    const byContractSize = {
      small: 0, // < $10k
      medium: 0, // $10k - $100k
      large: 0, // > $100k
    }

    // Calculate growth rate
    const previousPeriodStart = new Date(startDate)
    previousPeriodStart.setDate(
      previousPeriodStart.getDate() - (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    const previousRevenue = await this.getTotalRevenue(
      previousPeriodStart,
      startDate
    )

    const growthRate =
      previousRevenue > 0
        ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
        : 0

    // Simple forecast (linear projection)
    const forecast = totalRevenue * (1 + growthRate / 100)

    return {
      period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
      startDate,
      endDate,
      platformFees: {
        collected: platformFeesCollected,
        count: platformFeeTransactions.length,
        average:
          platformFeeTransactions.length > 0
            ? platformFeesCollected / platformFeeTransactions.length
            : 0,
      },
      processingFees: {
        collected: processingFees,
        count: 0, // TODO: Track count
        average: 0,
      },
      instantPayoutFees: {
        collected: instantPayoutFeesCollected,
        count: instantPayoutFees.length,
      },
      totalRevenue,
      byContractSize,
      trend: {
        growthRate,
        forecast,
      },
    }
  }

  /**
   * Generate Contractor Payout Report
   */
  static async generateContractorPayoutReport(
    filters: ReportFilters
  ): Promise<ContractorPayoutReport> {
    const { startDate, endDate, contractorId } = filters

    if (!startDate || !endDate) {
      throw new Error('Start date and end date are required')
    }

    const where: any = {
      createdAt: { gte: startDate, lte: endDate },
    }

    if (contractorId) {
      where.connectedAccount = { userId: contractorId }
    }

    // Get payouts
    const payouts = await prisma.payout.findMany({
      where,
      include: {
        connectedAccount: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    const paidPayouts = payouts.filter((p) => p.status === 'PAID')

    const totalPaid = paidPayouts.reduce(
      (sum, p) => sum + p.amount.toNumber(),
      0
    )

    const avgPayoutAmount =
      paidPayouts.length > 0 ? totalPaid / paidPayouts.length : 0

    // Calculate average payout time (from creation to paid)
    const payoutTimes = paidPayouts
      .filter((p) => p.paidAt)
      .map(
        (p) =>
          (p.paidAt!.getTime() - p.createdAt.getTime()) / (1000 * 60 * 60)
      ) // hours

    const avgPayoutTime =
      payoutTimes.length > 0
        ? payoutTimes.reduce((sum, t) => sum + t, 0) / payoutTimes.length
        : 0

    // Pending amount
    const pendingPayouts = payouts.filter((p) => p.status === 'PENDING')
    const pendingAmount = pendingPayouts.reduce(
      (sum, p) => sum + p.amount.toNumber(),
      0
    )

    // Failed payouts
    const failedPayouts = payouts.filter((p) => p.status === 'FAILED')
    const failedAmount = failedPayouts.reduce(
      (sum, p) => sum + p.amount.toNumber(),
      0
    )

    // Top contractors (if not filtering by specific contractor)
    let topContractors: Array<{
      contractorId: string
      contractorName: string
      totalPaid: number
      payoutCount: number
    }> = []

    if (!contractorId) {
      const contractorStats = new Map<
        string,
        { name: string; totalPaid: number; count: number }
      >()

      for (const payout of paidPayouts) {
        const cId = payout.connectedAccount.userId
        const name = payout.connectedAccount.user.name || 'Unknown'
        const amount = payout.amount.toNumber()

        if (contractorStats.has(cId)) {
          const stats = contractorStats.get(cId)!
          stats.totalPaid += amount
          stats.count += 1
        } else {
          contractorStats.set(cId, {
            name,
            totalPaid: amount,
            count: 1,
          })
        }
      }

      topContractors = Array.from(contractorStats.entries())
        .map(([id, stats]) => ({
          contractorId: id,
          contractorName: stats.name,
          totalPaid: stats.totalPaid,
          payoutCount: stats.count,
        }))
        .sort((a, b) => b.totalPaid - a.totalPaid)
        .slice(0, 10)
    }

    return {
      period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
      startDate,
      endDate,
      contractorId,
      totalPaid,
      payoutCount: paidPayouts.length,
      avgPayoutAmount,
      avgPayoutTime,
      pendingAmount,
      failedPayouts: {
        count: failedPayouts.length,
        amount: failedAmount,
      },
      topContractors: topContractors.length > 0 ? topContractors : undefined,
    }
  }

  /**
   * Get Real-Time Dashboard Metrics
   */
  static async getDashboardMetrics(): Promise<DashboardMetrics> {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // Real-time metrics
    const [
      totalEscrowBalance,
      activeDisputes,
      activeContracts,
      todayTransactions,
      last30DaysTransactions,
      escrows,
    ] = await Promise.all([
      this.getTotalEscrowBalance(now),
      prisma.dispute.count({
        where: { status: { in: ['OPEN', 'UNDER_REVIEW', 'MEDIATION'] } },
      }),
      prisma.contractAgreement.count({
        where: { status: 'ACTIVE' },
      }),
      prisma.escrowTransaction.findMany({
        where: {
          createdAt: { gte: todayStart },
          status: 'COMPLETED',
        },
      }),
      prisma.escrowTransaction.findMany({
        where: {
          createdAt: {
            gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          },
          status: 'COMPLETED',
        },
      }),
      prisma.escrowAgreement.findMany(),
    ])

    const todayDeposits = todayTransactions
      .filter((t) => t.type === 'DEPOSIT')
      .reduce((sum, t) => sum + t.amount.toNumber(), 0)

    const todayReleases = todayTransactions
      .filter((t) => t.type === 'RELEASE')
      .reduce((sum, t) => sum + t.amount.toNumber(), 0)

    const todayFees = todayTransactions
      .filter((t) => t.type === 'FEE')
      .reduce((sum, t) => sum + t.amount.toNumber(), 0)

    const newEscrowsToday = await prisma.escrowAgreement.count({
      where: {
        createdAt: { gte: todayStart },
      },
    })

    const completedPayoutsToday = await prisma.payout.count({
      where: {
        paidAt: { gte: todayStart },
        status: 'PAID',
      },
    })

    // Daily volume for last 30 days
    const dailyVolumeLast30Days: number[] = []
    for (let i = 29; i >= 0; i--) {
      const dayStart = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)

      const dayVolume = last30DaysTransactions
        .filter(
          (t) => t.createdAt >= dayStart && t.createdAt < dayEnd
        )
        .reduce((sum, t) => sum + t.amount.toNumber(), 0)

      dailyVolumeLast30Days.push(dayVolume)
    }

    // Revenue by category
    const revenueByCategory = {
      platformFees: todayFees,
      processingFees: 0, // TODO: Calculate from Stripe
      instantPayoutFees: 0, // TODO: Calculate from payouts
    }

    // Escrow status distribution
    const escrowStatusDistribution: Record<string, number> = {}
    for (const escrow of escrows) {
      const status = escrow.status
      escrowStatusDistribution[status] =
        (escrowStatusDistribution[status] || 0) +
        escrow.currentBalance.toNumber()
    }

    // Generate alerts
    const alerts: Array<{
      type: 'warning' | 'error' | 'info'
      message: string
      count: number
    }> = []

    // Check for failed payments
    const failedPayments = await prisma.escrowTransaction.count({
      where: {
        status: 'FAILED',
        createdAt: { gte: todayStart },
      },
    })

    if (failedPayments > 0) {
      alerts.push({
        type: 'error',
        message: 'Failed payments requiring attention',
        count: failedPayments,
      })
    }

    // Check for pending verifications
    const pendingVerifications = await prisma.lienWaiver.count({
      where: {
        status: 'SENT',
        sentAt: {
          lte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    })

    if (pendingVerifications > 0) {
      alerts.push({
        type: 'warning',
        message: 'Lien waivers pending signature > 7 days',
        count: pendingVerifications,
      })
    }

    return {
      timestamp: now,
      realTime: {
        totalEscrowBalance,
        todayDeposits,
        todayReleases,
        activeDisputes,
        pendingVerifications,
        activeContracts,
      },
      today: {
        transactionVolume: todayDeposits + todayReleases,
        transactionCount: todayTransactions.length,
        feeRevenue: todayFees,
        newEscrows: newEscrowsToday,
        completedPayouts: completedPayoutsToday,
      },
      trends: {
        dailyVolumeLast30Days,
        revenueByCategory,
        escrowStatusDistribution,
      },
      alerts,
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private static async getTotalEscrowBalance(asOfDate: Date): Promise<number> {
    const escrows = await prisma.escrowAgreement.findMany({
      where: {
        createdAt: { lte: asOfDate },
      },
    })

    return escrows.reduce(
      (sum, e) => sum + e.currentBalance.toNumber(),
      0
    )
  }

  private static async forecastCashFlow(
    fromDate: Date
  ): Promise<{ next30Days: number; next60Days: number; next90Days: number }> {
    // Get scheduled milestones for next 90 days
    const next90Days = new Date(fromDate.getTime() + 90 * 24 * 60 * 60 * 1000)

    const scheduledMilestones = await prisma.milestone.findMany({
      where: {
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        // TODO: Add expected completion date field
      },
    })

    // Simple projection based on average milestone amounts
    const avgMilestoneAmount = scheduledMilestones.length > 0
      ? scheduledMilestones.reduce(
          (sum, m) => sum + m.amount.toNumber(),
          0
        ) / scheduledMilestones.length
      : 0

    return {
      next30Days: avgMilestoneAmount * 10, // Rough estimate
      next60Days: avgMilestoneAmount * 20,
      next90Days: avgMilestoneAmount * 30,
    }
  }

  private static async getPlatformFees(
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const feeTransactions = await prisma.escrowTransaction.findMany({
      where: {
        type: 'FEE',
        processedDate: { gte: startDate, lte: endDate },
        status: 'COMPLETED',
      },
    })

    return feeTransactions.reduce((sum, t) => sum + t.amount.toNumber(), 0)
  }

  private static async getProcessingFees(
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    // TODO: Calculate from Stripe payment intents
    // For now, estimate at 2.9% + $0.30 per transaction
    const deposits = await prisma.escrowTransaction.findMany({
      where: {
        type: 'DEPOSIT',
        processedDate: { gte: startDate, lte: endDate },
        status: 'COMPLETED',
      },
    })

    return deposits.reduce((sum, t) => {
      const amount = t.amount.toNumber()
      return sum + (amount * 0.029 + 0.30)
    }, 0)
  }

  private static async getInterestIncome(
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const escrows = await prisma.escrowAgreement.findMany({
      where: {
        interestRate: { not: null },
      },
    })

    return escrows.reduce((sum, e) => sum + e.interestAccrued.toNumber(), 0)
  }

  private static async getStripeFees(
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    // Stripe fees are already included in processing fees calculation
    // This is the platform's cost
    const deposits = await prisma.escrowTransaction.findMany({
      where: {
        type: 'DEPOSIT',
        processedDate: { gte: startDate, lte: endDate },
        status: 'COMPLETED',
      },
    })

    return deposits.reduce((sum, t) => {
      const amount = t.amount.toNumber()
      return sum + (amount * 0.029 + 0.30)
    }, 0)
  }

  private static async getRefundTotal(
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const refunds = await prisma.escrowTransaction.findMany({
      where: {
        type: 'REFUND',
        processedDate: { gte: startDate, lte: endDate },
        status: 'COMPLETED',
      },
    })

    return refunds.reduce((sum, t) => sum + t.amount.toNumber(), 0)
  }

  private static async getRevenueBreakdownByCategory(
    startDate: Date,
    endDate: Date
  ): Promise<Record<string, { revenue: number; profit: number }>> {
    // TODO: Implement when project categories are available
    return {}
  }

  private static async getProjectedReleases(
    fromDate: Date
  ): Promise<{ next30Days: number; next60Days: number; next90Days: number }> {
    // Get scheduled transactions
    const scheduledTransactions = await prisma.escrowTransaction.findMany({
      where: {
        type: 'RELEASE',
        status: 'PENDING',
        scheduledDate: {
          gte: fromDate,
          lte: new Date(fromDate.getTime() + 90 * 24 * 60 * 60 * 1000),
        },
      },
    })

    const next30 = new Date(fromDate.getTime() + 30 * 24 * 60 * 60 * 1000)
    const next60 = new Date(fromDate.getTime() + 60 * 24 * 60 * 60 * 1000)
    const next90 = new Date(fromDate.getTime() + 90 * 24 * 60 * 60 * 1000)

    return {
      next30Days: scheduledTransactions
        .filter((t) => t.scheduledDate! <= next30)
        .reduce((sum, t) => sum + t.amount.toNumber(), 0),
      next60Days: scheduledTransactions
        .filter((t) => t.scheduledDate! <= next60)
        .reduce((sum, t) => sum + t.amount.toNumber(), 0),
      next90Days: scheduledTransactions
        .filter((t) => t.scheduledDate! <= next90)
        .reduce((sum, t) => sum + t.amount.toNumber(), 0),
    }
  }

  private static aggregateByDay(
    transactions: any[],
    startDate: Date,
    endDate: Date
  ): number[] {
    const days = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    const dailyTotals: number[] = []

    for (let i = 0; i < days; i++) {
      const dayStart = new Date(
        startDate.getTime() + i * 24 * 60 * 60 * 1000
      )
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)

      const dayTotal = transactions
        .filter((t) => t.createdAt >= dayStart && t.createdAt < dayEnd)
        .reduce((sum, t) => sum + t.amount.toNumber(), 0)

      dailyTotals.push(dayTotal)
    }

    return dailyTotals
  }

  private static aggregateByWeek(
    transactions: any[],
    startDate: Date,
    endDate: Date
  ): number[] {
    const weeks = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7)
    )

    const weeklyTotals: number[] = []

    for (let i = 0; i < weeks; i++) {
      const weekStart = new Date(
        startDate.getTime() + i * 7 * 24 * 60 * 60 * 1000
      )
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)

      const weekTotal = transactions
        .filter((t) => t.createdAt >= weekStart && t.createdAt < weekEnd)
        .reduce((sum, t) => sum + t.amount.toNumber(), 0)

      weeklyTotals.push(weekTotal)
    }

    return weeklyTotals
  }

  private static aggregateByMonth(
    transactions: any[],
    startDate: Date,
    endDate: Date
  ): number[] {
    const months: number[] = []
    const current = new Date(startDate)

    while (current <= endDate) {
      const monthStart = new Date(
        current.getFullYear(),
        current.getMonth(),
        1
      )
      const monthEnd = new Date(
        current.getFullYear(),
        current.getMonth() + 1,
        0
      )

      const monthTotal = transactions
        .filter((t) => t.createdAt >= monthStart && t.createdAt <= monthEnd)
        .reduce((sum, t) => sum + t.amount.toNumber(), 0)

      months.push(monthTotal)
      current.setMonth(current.getMonth() + 1)
    }

    return months
  }

  private static analyzePeakTimes(
    transactions: any[]
  ): Array<{ hour: number; day: string; count: number }> {
    const hourCounts = new Map<string, number>()

    for (const transaction of transactions) {
      const date = new Date(transaction.createdAt)
      const hour = date.getHours()
      const day = date.toLocaleDateString('en-US', { weekday: 'short' })
      const key = `${day}-${hour}`

      hourCounts.set(key, (hourCounts.get(key) || 0) + 1)
    }

    return Array.from(hourCounts.entries())
      .map(([key, count]) => {
        const [day, hourStr] = key.split('-')
        return { hour: parseInt(hourStr), day, count }
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }

  private static async getTotalRevenue(
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const [platformFees, processingFees, interestIncome] = await Promise.all([
      this.getPlatformFees(startDate, endDate),
      this.getProcessingFees(startDate, endDate),
      this.getInterestIncome(startDate, endDate),
    ])

    return platformFees + processingFees + interestIncome
  }
}

