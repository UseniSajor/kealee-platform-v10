/**
 * Advanced Analytics Service
 * Provides predictive analytics, forecasting, and machine learning capabilities
 */

import { prisma, Decimal } from '@kealee/database'
import {
  SnapshotType,
  KPIType,
  TrendDirection,
  RiskLevel,
  AlertSeverity,
} from '@kealee/database'

// ============================================================================
// Type Definitions
// ============================================================================

export interface RevenueForecast {
  period: string
  forecast: number
  confidence: {
    low: number
    medium: number
    high: number
  }
  trend: 'increasing' | 'decreasing' | 'stable'
  seasonalFactor: number
}

export interface ChurnRiskScore {
  userId: string
  userName: string
  churnScore: number
  riskLevel: RiskLevel
  riskFactors: string[]
  retentionActions: string[]
  lastActivity: Date | null
  daysSinceActivity: number
}

export interface FraudDetectionResult {
  entityId: string
  entityType: string
  score: number
  riskLevel: RiskLevel
  confidence: number
  flaggedReasons: string[]
  manualReviewRequired: boolean
  features: Record<string, any>
}

export interface CashFlowProjection {
  date: Date
  projected: number
  scheduledIn: number
  scheduledOut: number
  confidence: number
}

export interface ROIByChannel {
  channel: string
  acquisitionCost: number
  lifetimeValue: number
  roi: number
  paybackPeriod: number
  customerCount: number
}

export interface KPIStatus {
  name: string
  displayName: string
  currentValue: number
  targetValue: number | null
  unit: string | null
  trendDirection: TrendDirection
  changePercent: number | null
  isHealthy: boolean
}

// ============================================================================
// Advanced Analytics Service
// ============================================================================

export class AdvancedAnalyticsService {
  // ============================================================================
  // REVENUE FORECASTING
  // ============================================================================

  /**
   * Generate revenue forecast for next 90 days using linear regression
   */
  static async forecastRevenue(days: number = 90): Promise<RevenueForecast[]> {
    // Get historical revenue data (last 180 days for better prediction)
    const historicalDays = 180
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - historicalDays)

    const transactions = await prisma.escrowTransaction.findMany({
      where: {
        type: 'FEE',
        status: 'COMPLETED',
        processedDate: {
          gte: startDate,
        },
      },
      select: {
        processedDate: true,
        amount: true,
      },
      orderBy: {
        processedDate: 'asc',
      },
    })

    // Group by day
    const dailyRevenue = this.groupRevenueByDay(transactions)

    // Calculate linear regression
    const { slope, intercept } = this.calculateLinearRegression(
      Object.values(dailyRevenue)
    )

    // Get current pipeline (signed contracts not yet completed)
    const pipeline = await this.getPipelineValue()

    // Calculate seasonal factors
    const seasonalFactors = this.calculateSeasonalFactors(dailyRevenue)

    // Generate forecasts
    const forecasts: RevenueForecast[] = []
    const today = new Date()

    for (let i = 1; i <= days; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() + i)

      // Base forecast from linear regression
      const baseForecast = slope * (historicalDays + i) + intercept

      // Apply seasonal factor
      const month = date.getMonth()
      const seasonalFactor = seasonalFactors[month] || 1.0

      const forecast = baseForecast * seasonalFactor

      // Calculate confidence intervals
      const confidence = {
        low: forecast * 0.8, // 80% of forecast
        medium: forecast,
        high: forecast * 1.2, // 120% of forecast
      }

      // Determine trend
      const trend =
        slope > 0.1 ? 'increasing' : slope < -0.1 ? 'decreasing' : 'stable'

      forecasts.push({
        period: date.toISOString().split('T')[0],
        forecast,
        confidence,
        trend,
        seasonalFactor,
      })
    }

    // Store snapshot
    await this.createSnapshot('DAILY', 'revenue_forecast', {
      forecasts,
      pipelineValue: pipeline,
      calculatedAt: new Date(),
    })

    return forecasts
  }

  /**
   * Get revenue forecast summary (30/60/90 days)
   */
  static async getRevenueForecastSummary() {
    const forecasts = await this.forecastRevenue(90)

    return {
      next30Days: forecasts
        .slice(0, 30)
        .reduce((sum, f) => sum + f.forecast, 0),
      next60Days: forecasts
        .slice(0, 60)
        .reduce((sum, f) => sum + f.forecast, 0),
      next90Days: forecasts
        .slice(0, 90)
        .reduce((sum, f) => sum + f.forecast, 0),
      trend: forecasts[0]?.trend || 'stable',
    }
  }

  // ============================================================================
  // CHURN PREDICTION
  // ============================================================================

  /**
   * Calculate churn risk for all contractors
   */
  static async calculateChurnRisk(
    userId?: string
  ): Promise<ChurnRiskScore[]> {
    // Get all contractors or specific user
    const contractors = await prisma.user.findMany({
      where: {
        id: userId,
        contractsAsContractor: {
          some: {},
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        contractsAsContractor: {
          select: {
            id: true,
            status: true,
            createdAt: true,
          },
        },
      },
    })

    const churnScores: ChurnRiskScore[] = []

    for (const contractor of contractors) {
      // Calculate features
      const features = await this.calculateChurnFeatures(contractor.id)

      // Calculate churn score (0-100)
      const churnScore = this.calculateChurnScore(features)

      // Determine risk level
      const riskLevel = this.getRiskLevel(churnScore)

      // Identify risk factors
      const riskFactors = this.identifyChurnRiskFactors(features)

      // Recommend retention actions
      const retentionActions = this.recommendRetentionActions(
        riskFactors,
        churnScore
      )

      // Store prediction in database
      await prisma.churnPrediction.upsert({
        where: { userId: contractor.id },
        create: {
          userId: contractor.id,
          churnScore,
          riskLevel,
          confidence: new Decimal(85), // 85% confidence
          churnProbability: new Decimal(churnScore),
          riskFactors: riskFactors as any,
          features: features as any,
          retentionActions,
          priorityLevel: this.getPriorityLevel(riskLevel),
          lastEngagement: features.lastTransactionDate,
          daysSinceActivity: features.daysSinceLastActivity,
        },
        update: {
          churnScore,
          riskLevel,
          confidence: new Decimal(85),
          churnProbability: new Decimal(churnScore),
          riskFactors: riskFactors as any,
          features: features as any,
          retentionActions,
          priorityLevel: this.getPriorityLevel(riskLevel),
          lastEngagement: features.lastTransactionDate,
          daysSinceActivity: features.daysSinceLastActivity,
          calculatedAt: new Date(),
        },
      })

      churnScores.push({
        userId: contractor.id,
        userName: contractor.name || 'Unknown',
        churnScore,
        riskLevel,
        riskFactors,
        retentionActions,
        lastActivity: features.lastTransactionDate,
        daysSinceActivity: features.daysSinceLastActivity,
      })
    }

    return churnScores.sort((a, b) => b.churnScore - a.churnScore)
  }

  /**
   * Get high-risk contractors (churn score > 60)
   */
  static async getHighRiskContractors() {
    const predictions = await prisma.churnPrediction.findMany({
      where: {
        churnScore: { gte: 60 },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        churnScore: 'desc',
      },
    })

    return predictions
  }

  // ============================================================================
  // FRAUD DETECTION
  // ============================================================================

  /**
   * Score transaction for fraud risk
   */
  static async scoreFraudRisk(
    transactionId: string
  ): Promise<FraudDetectionResult> {
    // Get transaction details
    const transaction = await prisma.escrowTransaction.findUnique({
      where: { id: transactionId },
      include: {
        escrow: {
          include: {
            contract: {
              include: {
                owner: true,
                contractor: true,
              },
            },
          },
        },
      },
    })

    if (!transaction) {
      throw new Error('Transaction not found')
    }

    // Extract features for ML model
    const features = await this.extractFraudFeatures(transaction)

    // Calculate fraud score using anomaly detection
    const score = this.calculateFraudScore(features)

    // Determine risk level
    const riskLevel = this.getRiskLevel(score)

    // Calculate confidence
    const confidence = 0.82 // 82% confidence (would come from model training)

    // Identify reasons for flagging
    const flaggedReasons = this.identifyFraudReasons(features, score)

    // Determine if manual review is needed
    const manualReviewRequired = score >= 70 || flaggedReasons.length >= 3

    // Store fraud score
    const fraudScore = await prisma.fraudScore.create({
      data: {
        transactionId,
        userId: transaction.escrow.contract.ownerId,
        entityType: 'transaction',
        entityId: transactionId,
        score,
        riskLevel,
        confidence: new Decimal(confidence * 100),
        features: features as any,
        flaggedReasons,
        manualReviewRequired,
      },
    })

    // Create alert if high risk
    if (manualReviewRequired) {
      await this.createAlert({
        alertType: 'fraud_detected',
        severity: score >= 85 ? 'CRITICAL' : 'WARNING',
        title: 'High Fraud Risk Detected',
        description: `Transaction ${transactionId} has fraud score of ${score}. Reasons: ${flaggedReasons.join(', ')}`,
        relatedEntityType: 'transaction',
        relatedEntityId: transactionId,
        data: { score, riskLevel, flaggedReasons },
      })
    }

    return {
      entityId: transactionId,
      entityType: 'transaction',
      score,
      riskLevel,
      confidence,
      flaggedReasons,
      manualReviewRequired,
      features,
    }
  }

  /**
   * Get all fraud alerts requiring review
   */
  static async getFraudAlerts(limit: number = 50) {
    return await prisma.fraudScore.findMany({
      where: {
        manualReviewRequired: true,
        isFraud: null, // Not yet reviewed
      },
      orderBy: {
        score: 'desc',
      },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })
  }

  /**
   * Mark fraud score as reviewed
   */
  static async reviewFraudScore(
    fraudScoreId: string,
    reviewerId: string,
    isFraud: boolean,
    actionsTaken: string[]
  ) {
    return await prisma.fraudScore.update({
      where: { id: fraudScoreId },
      data: {
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        isFraud,
        actionsTaken,
      },
    })
  }

  // ============================================================================
  // CASH FLOW PROJECTION
  // ============================================================================

  /**
   * Project cash flow for next N days
   */
  static async projectCashFlow(
    days: number = 90
  ): Promise<CashFlowProjection[]> {
    const projections: CashFlowProjection[] = []
    const today = new Date()

    // Get current balance
    const currentBalance = await this.getCurrentTotalBalance()

    // Get scheduled releases (milestones, payouts)
    const scheduledReleases = await this.getScheduledReleases(days)

    // Get historical deposit patterns
    const historicalDeposits = await this.getHistoricalDepositPattern()

    let runningBalance = currentBalance

    for (let i = 1; i <= days; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() + i)

      // Scheduled outflows for this day
      const scheduledOut = scheduledReleases
        .filter((r) => this.isSameDay(new Date(r.scheduledDate), date))
        .reduce((sum, r) => sum + r.amount, 0)

      // Projected inflows (based on historical patterns)
      const scheduledIn = this.projectDailyDeposits(
        date,
        historicalDeposits
      )

      // Calculate projected balance
      runningBalance = runningBalance + scheduledIn - scheduledOut

      // Confidence decreases with time
      const confidence = Math.max(0.5, 1 - i / (days * 2))

      projections.push({
        date,
        projected: runningBalance,
        scheduledIn,
        scheduledOut,
        confidence,
      })
    }

    // Store snapshot
    await this.createSnapshot('DAILY', 'cash_flow_projection', {
      projections,
      currentBalance,
      calculatedAt: new Date(),
    })

    return projections
  }

  /**
   * Identify potential cash shortfalls
   */
  static async identifyCashShortfalls(
    thresholdAmount: number = 100000
  ) {
    const projections = await this.projectCashFlow(90)

    const shortfalls = projections.filter(
      (p) => p.projected < thresholdAmount
    )

    if (shortfalls.length > 0) {
      await this.createAlert({
        alertType: 'cash_shortfall',
        severity: 'WARNING',
        title: 'Potential Cash Shortfall Detected',
        description: `Projected balance may fall below $${thresholdAmount} in ${shortfalls.length} days`,
        data: { shortfalls, thresholdAmount },
      })
    }

    return shortfalls
  }

  // ============================================================================
  // ROI CALCULATION BY CHANNEL
  // ============================================================================

  /**
   * Calculate ROI by customer acquisition channel
   */
  static async calculateROIByChannel(): Promise<ROIByChannel[]> {
    // Get all users with source tracking
    const users = await prisma.user.findMany({
      where: {
        metadata: {
          not: null,
        },
      },
      select: {
        id: true,
        metadata: true,
        createdAt: true,
      },
    })

    // Group by acquisition channel
    const channels: Record<string, any> = {}

    for (const user of users) {
      const metadata = user.metadata as any
      const channel = metadata?.source || 'organic'

      if (!channels[channel]) {
        channels[channel] = {
          channel,
          users: [],
          totalAcquisitionCost: 0,
        }
      }

      channels[channel].users.push(user.id)
    }

    // Calculate metrics for each channel
    const results: ROIByChannel[] = []

    for (const [channel, data] of Object.entries(channels)) {
      const userIds = data.users

      // Calculate total revenue from these users
      const revenue = await prisma.escrowTransaction.findMany({
        where: {
          escrow: {
            contract: {
              OR: [
                { ownerId: { in: userIds } },
                { contractorId: { in: userIds } },
              ],
            },
          },
          type: 'FEE',
          status: 'COMPLETED',
        },
      })

      const totalRevenue = revenue.reduce(
        (sum, tx) => sum + tx.amount.toNumber(),
        0
      )

      // Estimate acquisition cost (would come from marketing data)
      const avgAcquisitionCost = this.estimateAcquisitionCost(channel)
      const totalAcquisitionCost = avgAcquisitionCost * userIds.length

      // Calculate LTV
      const lifetimeValue = totalRevenue / userIds.length

      // Calculate ROI
      const roi =
        totalAcquisitionCost > 0
          ? ((totalRevenue - totalAcquisitionCost) /
              totalAcquisitionCost) *
            100
          : 0

      // Calculate payback period (months)
      const monthlyRevenuePerUser = lifetimeValue / 12 // Assume 1 year average
      const paybackPeriod =
        monthlyRevenuePerUser > 0
          ? avgAcquisitionCost / monthlyRevenuePerUser
          : 0

      results.push({
        channel,
        acquisitionCost: avgAcquisitionCost,
        lifetimeValue,
        roi,
        paybackPeriod,
        customerCount: userIds.length,
      })
    }

    return results.sort((a, b) => b.roi - a.roi)
  }

  // ============================================================================
  // KPI MANAGEMENT
  // ============================================================================

  /**
   * Calculate all KPIs
   */
  static async calculateAllKPIs(): Promise<KPIStatus[]> {
    const kpis: Array<{
      name: string
      displayName: string
      type: KPIType
      calculate: () => Promise<number>
      target?: number
      unit?: string
    }> = [
      {
        name: 'monthly_revenue',
        displayName: 'Monthly Revenue',
        type: 'FINANCIAL',
        calculate: () => this.calculateMonthlyRevenue(),
        target: 100000,
        unit: 'USD',
      },
      {
        name: 'transaction_success_rate',
        displayName: 'Transaction Success Rate',
        type: 'OPERATIONAL',
        calculate: () => this.calculateTransactionSuccessRate(),
        target: 98,
        unit: 'percent',
      },
      {
        name: 'avg_processing_time',
        displayName: 'Avg Processing Time',
        type: 'OPERATIONAL',
        calculate: () => this.calculateAvgProcessingTime(),
        target: 2,
        unit: 'hours',
      },
      {
        name: 'dispute_rate',
        displayName: 'Dispute Rate',
        type: 'COMPLIANCE',
        calculate: () => this.calculateDisputeRate(),
        target: 2,
        unit: 'percent',
      },
      {
        name: 'churn_rate',
        displayName: 'Churn Rate',
        type: 'CUSTOMER',
        calculate: () => this.calculateChurnRate(),
        target: 5,
        unit: 'percent',
      },
      {
        name: 'customer_ltv',
        displayName: 'Customer LTV',
        type: 'CUSTOMER',
        calculate: () => this.calculateCustomerLTV(),
        target: 5000,
        unit: 'USD',
      },
    ]

    const results: KPIStatus[] = []

    for (const kpiDef of kpis) {
      // Calculate current value
      const currentValue = await kpiDef.calculate()

      // Get previous value
      const previousKPI = await prisma.kPI.findUnique({
        where: { name: kpiDef.name },
      })

      const previousValue = previousKPI?.currentValue.toNumber() || 0

      // Calculate change
      const changePercent =
        previousValue > 0
          ? ((currentValue - previousValue) / previousValue) * 100
          : 0

      // Determine trend direction
      let trendDirection: TrendDirection = 'FLAT'
      if (Math.abs(changePercent) > 1) {
        trendDirection = changePercent > 0 ? 'UP' : 'DOWN'
      }

      // Check if healthy
      const isHealthy = kpiDef.target
        ? Math.abs(currentValue - kpiDef.target) /
            kpiDef.target <
          0.1
        : true

      // Upsert KPI
      await prisma.kPI.upsert({
        where: { name: kpiDef.name },
        create: {
          name: kpiDef.name,
          displayName: kpiDef.displayName,
          type: kpiDef.type,
          currentValue: new Decimal(currentValue),
          targetValue: kpiDef.target
            ? new Decimal(kpiDef.target)
            : null,
          unit: kpiDef.unit,
          trendDirection,
          changePercent: new Decimal(changePercent),
          previousValue: new Decimal(previousValue),
          isHealthy,
          calculationFrequency: 'DAILY',
          lastCalculated: new Date(),
        },
        update: {
          currentValue: new Decimal(currentValue),
          previousValue: new Decimal(previousValue),
          trendDirection,
          changePercent: new Decimal(changePercent),
          isHealthy,
          lastCalculated: new Date(),
        },
      })

      results.push({
        name: kpiDef.name,
        displayName: kpiDef.displayName,
        currentValue,
        targetValue: kpiDef.target || null,
        unit: kpiDef.unit || null,
        trendDirection,
        changePercent,
        isHealthy,
      })
    }

    return results
  }

  /**
   * Get all KPIs with status
   */
  static async getAllKPIs() {
    return await prisma.kPI.findMany({
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    })
  }

  // ============================================================================
  // SNAPSHOT MANAGEMENT
  // ============================================================================

  /**
   * Create analytics snapshot
   */
  static async createSnapshot(
    type: SnapshotType,
    category: string,
    data: any
  ) {
    return await prisma.analyticsSnapshot.create({
      data: {
        snapshotType: type,
        metrics: { category, ...data },
        calculationTime: Date.now(), // Would measure actual time
      },
    })
  }

  /**
   * Get latest snapshot by type
   */
  static async getLatestSnapshot(type: SnapshotType) {
    return await prisma.analyticsSnapshot.findFirst({
      where: { snapshotType: type },
      orderBy: { snapshotDate: 'desc' },
    })
  }

  // ============================================================================
  // ALERT MANAGEMENT
  // ============================================================================

  /**
   * Create analytics alert
   */
  static async createAlert(data: {
    alertType: string
    severity: AlertSeverity
    title: string
    description: string
    relatedEntityType?: string
    relatedEntityId?: string
    data?: any
  }) {
    const alert = await prisma.analyticsAlert.create({
      data: {
        alertType: data.alertType,
        severity: data.severity,
        title: data.title,
        description: data.description,
        relatedEntityType: data.relatedEntityType,
        relatedEntityId: data.relatedEntityId,
        data: data.data,
      },
    })

    // TODO: Send notification via email/Slack
    // await this.sendAlertNotification(alert)

    return alert
  }

  /**
   * Get unresolved alerts
   */
  static async getUnresolvedAlerts(
    severity?: AlertSeverity,
    limit: number = 50
  ) {
    return await prisma.analyticsAlert.findMany({
      where: {
        isResolved: false,
        severity,
      },
      orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    })
  }

  /**
   * Resolve alert
   */
  static async resolveAlert(
    alertId: string,
    resolverId: string,
    resolution: string
  ) {
    return await prisma.analyticsAlert.update({
      where: { id: alertId },
      data: {
        isResolved: true,
        resolvedBy: resolverId,
        resolvedAt: new Date(),
        resolution,
      },
    })
  }

  // ============================================================================
  // HELPER METHODS - Revenue Forecasting
  // ============================================================================

  private static groupRevenueByDay(transactions: any[]): Record<number, number> {
    const grouped: Record<number, number> = {}

    for (const tx of transactions) {
      const dayIndex = Math.floor(
        (tx.processedDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
      grouped[dayIndex] =
        (grouped[dayIndex] || 0) + tx.amount.toNumber()
    }

    return grouped
  }

  private static calculateLinearRegression(values: number[]): {
    slope: number
    intercept: number
  } {
    const n = values.length
    if (n < 2) return { slope: 0, intercept: 0 }

    let sumX = 0,
      sumY = 0,
      sumXY = 0,
      sumX2 = 0

    for (let i = 0; i < n; i++) {
      sumX += i
      sumY += values[i]
      sumXY += i * values[i]
      sumX2 += i * i
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    return { slope, intercept }
  }

  private static calculateSeasonalFactors(
    dailyRevenue: Record<number, number>
  ): Record<number, number> {
    // Simplified seasonal factor calculation
    const monthlyAvg: Record<number, number[]> = {}

    for (const [day, revenue] of Object.entries(dailyRevenue)) {
      const date = new Date()
      date.setDate(date.getDate() + parseInt(day))
      const month = date.getMonth()

      if (!monthlyAvg[month]) monthlyAvg[month] = []
      monthlyAvg[month].push(revenue)
    }

    const factors: Record<number, number> = {}
    const overallAvg =
      Object.values(dailyRevenue).reduce((sum, v) => sum + v, 0) /
      Object.values(dailyRevenue).length

    for (const [month, revenues] of Object.entries(monthlyAvg)) {
      const monthAvg =
        revenues.reduce((sum, v) => sum + v, 0) / revenues.length
      factors[parseInt(month)] = overallAvg > 0 ? monthAvg / overallAvg : 1.0
    }

    return factors
  }

  private static async getPipelineValue(): Promise<number> {
    const activeContracts = await prisma.escrowAgreement.findMany({
      where: {
        status: { in: ['ACTIVE', 'PENDING_DEPOSIT'] },
      },
      select: {
        totalContractAmount: true,
        currentBalance: true,
      },
    })

    return activeContracts.reduce(
      (sum, e) =>
        sum +
        (e.totalContractAmount.toNumber() - e.currentBalance.toNumber()),
      0
    )
  }

  // ============================================================================
  // HELPER METHODS - Churn Prediction
  // ============================================================================

  private static async calculateChurnFeatures(userId: string) {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

    // Get transaction activity
    const recentTransactions = await prisma.escrowTransaction.findMany({
      where: {
        escrow: {
          contract: {
            contractorId: userId,
          },
        },
        processedDate: { gte: thirtyDaysAgo },
        status: 'COMPLETED',
      },
    })

    const allTransactions = await prisma.escrowTransaction.findMany({
      where: {
        escrow: {
          contract: {
            contractorId: userId,
          },
        },
        status: 'COMPLETED',
      },
      orderBy: { processedDate: 'desc' },
      take: 1,
    })

    // Get disputes
    const disputes = await prisma.dispute.findMany({
      where: {
        contract: {
          contractorId: userId,
        },
        createdAt: { gte: ninetyDaysAgo },
      },
    })

    // Get failed payouts
    const failedPayouts = await prisma.payout.findMany({
      where: {
        contractorId: userId,
        status: 'FAILED',
        createdAt: { gte: thirtyDaysAgo },
      },
    })

    const lastTransaction =
      allTransactions.length > 0 ? allTransactions[0].processedDate : null
    const daysSinceLastActivity = lastTransaction
      ? Math.floor(
          (now.getTime() - lastTransaction.getTime()) / (1000 * 60 * 60 * 24)
        )
      : 999

    return {
      transactionCount30Days: recentTransactions.length,
      totalTransactionValue: recentTransactions.reduce(
        (sum, tx) => sum + tx.amount.toNumber(),
        0
      ),
      disputeCount90Days: disputes.length,
      failedPayoutCount30Days: failedPayouts.length,
      daysSinceLastActivity,
      lastTransactionDate: lastTransaction,
    }
  }

  private static calculateChurnScore(features: any): number {
    let score = 0

    // Inactivity (40% weight)
    if (features.daysSinceLastActivity > 60) score += 40
    else if (features.daysSinceLastActivity > 30) score += 20
    else if (features.daysSinceLastActivity > 14) score += 10

    // Low transaction volume (30% weight)
    if (features.transactionCount30Days === 0) score += 30
    else if (features.transactionCount30Days < 3) score += 15

    // Disputes (20% weight)
    if (features.disputeCount90Days > 2) score += 20
    else if (features.disputeCount90Days > 0) score += 10

    // Failed payouts (10% weight)
    if (features.failedPayoutCount30Days > 2) score += 10
    else if (features.failedPayoutCount30Days > 0) score += 5

    return Math.min(score, 100)
  }

  private static getRiskLevel(score: number): RiskLevel {
    if (score >= 81) return 'VERY_HIGH'
    if (score >= 61) return 'HIGH'
    if (score >= 41) return 'MEDIUM'
    if (score >= 21) return 'LOW'
    return 'VERY_LOW'
  }

  private static identifyChurnRiskFactors(features: any): string[] {
    const factors: string[] = []

    if (features.daysSinceLastActivity > 30) {
      factors.push(`No activity for ${features.daysSinceLastActivity} days`)
    }

    if (features.transactionCount30Days === 0) {
      factors.push('No transactions in last 30 days')
    }

    if (features.disputeCount90Days > 0) {
      factors.push(`${features.disputeCount90Days} disputes in last 90 days`)
    }

    if (features.failedPayoutCount30Days > 0) {
      factors.push(`${features.failedPayoutCount30Days} failed payouts`)
    }

    return factors
  }

  private static recommendRetentionActions(
    riskFactors: string[],
    score: number
  ): string[] {
    const actions: string[] = []

    if (riskFactors.some((f) => f.includes('No activity'))) {
      actions.push('Send re-engagement email with incentive')
      actions.push('Offer personalized support call')
    }

    if (riskFactors.some((f) => f.includes('disputes'))) {
      actions.push('Review dispute resolution process')
      actions.push('Provide dedicated account manager')
    }

    if (riskFactors.some((f) => f.includes('failed payouts'))) {
      actions.push('Help resolve payout issues')
      actions.push('Offer alternative payout methods')
    }

    if (score > 70) {
      actions.push('Priority outreach from leadership')
      actions.push('Offer service credit or discount')
    }

    return actions
  }

  private static getPriorityLevel(riskLevel: RiskLevel): string {
    if (riskLevel === 'VERY_HIGH') return 'critical'
    if (riskLevel === 'HIGH') return 'high'
    if (riskLevel === 'MEDIUM') return 'medium'
    return 'low'
  }

  // ============================================================================
  // HELPER METHODS - Fraud Detection
  // ============================================================================

  private static async extractFraudFeatures(transaction: any) {
    const amount = transaction.amount.toNumber()
    const hour = transaction.processedDate.getHours()

    // Get user's transaction history
    const userHistory = await prisma.escrowTransaction.findMany({
      where: {
        escrow: {
          contract: {
            ownerId: transaction.escrow.contract.ownerId,
          },
        },
        status: 'COMPLETED',
      },
      take: 100,
    })

    const avgAmount =
      userHistory.length > 0
        ? userHistory.reduce((sum, tx) => sum + tx.amount.toNumber(), 0) /
          userHistory.length
        : 0

    return {
      amount,
      hour,
      isWeekend: [0, 6].includes(transaction.processedDate.getDay()),
      isNightTime: hour < 6 || hour > 22,
      amountDeviation: avgAmount > 0 ? amount / avgAmount : 1,
      transactionCount: userHistory.length,
      accountAge: Math.floor(
        (Date.now() - transaction.escrow.contract.owner.createdAt.getTime()) /
          (1000 * 60 * 60 * 24)
      ),
      type: transaction.type,
    }
  }

  private static calculateFraudScore(features: any): number {
    let score = 0

    // Large amount deviation (30% weight)
    if (features.amountDeviation > 10) score += 30
    else if (features.amountDeviation > 5) score += 20
    else if (features.amountDeviation > 3) score += 10

    // Unusual timing (25% weight)
    if (features.isNightTime && features.isWeekend) score += 25
    else if (features.isNightTime || features.isWeekend) score += 15

    // New account (20% weight)
    if (features.accountAge < 7) score += 20
    else if (features.accountAge < 30) score += 10

    // Large amount (15% weight)
    if (features.amount > 50000) score += 15
    else if (features.amount > 20000) score += 10

    // Low transaction history (10% weight)
    if (features.transactionCount < 3) score += 10
    else if (features.transactionCount < 10) score += 5

    return Math.min(score, 100)
  }

  private static identifyFraudReasons(features: any, score: number): string[] {
    const reasons: string[] = []

    if (features.amountDeviation > 5) {
      reasons.push(
        `Amount ${features.amountDeviation.toFixed(1)}x higher than average`
      )
    }

    if (features.isNightTime) {
      reasons.push('Transaction at unusual time (night)')
    }

    if (features.isWeekend) {
      reasons.push('Transaction on weekend')
    }

    if (features.accountAge < 30) {
      reasons.push(`New account (${features.accountAge} days old)`)
    }

    if (features.amount > 20000) {
      reasons.push('Large transaction amount')
    }

    if (features.transactionCount < 10) {
      reasons.push('Limited transaction history')
    }

    return reasons
  }

  // ============================================================================
  // HELPER METHODS - Cash Flow
  // ============================================================================

  private static async getCurrentTotalBalance(): Promise<number> {
    const escrows = await prisma.escrowAgreement.findMany({
      where: {
        status: { in: ['ACTIVE', 'FROZEN'] },
      },
      select: {
        currentBalance: true,
      },
    })

    return escrows.reduce((sum, e) => sum + e.currentBalance.toNumber(), 0)
  }

  private static async getScheduledReleases(days: number) {
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + days)

    const scheduledTransactions = await prisma.escrowTransaction.findMany({
      where: {
        scheduledDate: {
          gte: new Date(),
          lte: endDate,
        },
        status: 'PENDING',
      },
      select: {
        scheduledDate: true,
        amount: true,
      },
    })

    return scheduledTransactions.map((tx) => ({
      scheduledDate: tx.scheduledDate!,
      amount: tx.amount.toNumber(),
    }))
  }

  private static async getHistoricalDepositPattern() {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const deposits = await prisma.escrowTransaction.findMany({
      where: {
        type: 'DEPOSIT',
        status: 'COMPLETED',
        processedDate: { gte: thirtyDaysAgo },
      },
    })

    const dailyTotal = deposits.reduce(
      (sum, tx) => sum + tx.amount.toNumber(),
      0
    )

    return dailyTotal / 30 // Average daily deposits
  }

  private static projectDailyDeposits(
    date: Date,
    historicalAvg: number
  ): number {
    // Simple projection: use historical average with slight randomness
    const isWeekend = [0, 6].includes(date.getDay())
    const weekendFactor = isWeekend ? 0.5 : 1.0 // 50% less on weekends

    return historicalAvg * weekendFactor
  }

  private static isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    )
  }

  // ============================================================================
  // HELPER METHODS - ROI
  // ============================================================================

  private static estimateAcquisitionCost(channel: string): number {
    // Estimated costs per channel (would come from marketing data)
    const costs: Record<string, number> = {
      organic: 0,
      referral: 50,
      google_ads: 150,
      facebook_ads: 100,
      linkedin_ads: 200,
      content_marketing: 75,
      direct: 0,
    }

    return costs[channel] || 100
  }

  // ============================================================================
  // HELPER METHODS - KPI Calculations
  // ============================================================================

  private static async calculateMonthlyRevenue(): Promise<number> {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const transactions = await prisma.escrowTransaction.findMany({
      where: {
        type: 'FEE',
        status: 'COMPLETED',
        processedDate: { gte: startOfMonth },
      },
    })

    return transactions.reduce((sum, tx) => sum + tx.amount.toNumber(), 0)
  }

  private static async calculateTransactionSuccessRate(): Promise<number> {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)

    const [total, completed] = await Promise.all([
      prisma.escrowTransaction.count({
        where: { processedDate: { gte: startOfMonth } },
      }),
      prisma.escrowTransaction.count({
        where: {
          processedDate: { gte: startOfMonth },
          status: 'COMPLETED',
        },
      }),
    ])

    return total > 0 ? (completed / total) * 100 : 100
  }

  private static async calculateAvgProcessingTime(): Promise<number> {
    // Simplified: would calculate actual time from created to processed
    return 2.5 // hours
  }

  private static async calculateDisputeRate(): Promise<number> {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)

    const [disputes, contracts] = await Promise.all([
      prisma.dispute.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
      prisma.contractAgreement.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
    ])

    return contracts > 0 ? (disputes / contracts) * 100 : 0
  }

  private static async calculateChurnRate(): Promise<number> {
    // Simplified: calculate contractors who haven't transacted in 90 days
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const churnedContractors = await prisma.user.count({
      where: {
        contractsAsContractor: {
          some: {
            createdAt: { lt: ninetyDaysAgo },
          },
          none: {
            escrowAgreement: {
              transactions: {
                some: {
                  processedDate: { gte: ninetyDaysAgo },
                },
              },
            },
          },
        },
      },
    })

    const totalContractors = await prisma.user.count({
      where: {
        contractsAsContractor: {
          some: {},
        },
      },
    })

    return totalContractors > 0
      ? (churnedContractors / totalContractors) * 100
      : 0
  }

  private static async calculateCustomerLTV(): Promise<number> {
    // Simplified LTV calculation
    const totalRevenue = await prisma.escrowTransaction.aggregate({
      where: {
        type: 'FEE',
        status: 'COMPLETED',
      },
      _sum: {
        amount: true,
      },
    })

    const totalCustomers = await prisma.user.count({
      where: {
        OR: [
          { contractsAsOwner: { some: {} } },
          { contractsAsContractor: { some: {} } },
        ],
      },
    })

    return totalCustomers > 0
      ? (totalRevenue._sum.amount?.toNumber() || 0) / totalCustomers
      : 0
  }
}

