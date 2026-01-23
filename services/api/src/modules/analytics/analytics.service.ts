/**
 * Analytics Service
 * Business intelligence and predictive analytics for financial data
 */

import { PrismaClient, Prisma } from '@kealee/database';

const prisma = new PrismaClient();

export interface RevenueMetrics {
  period: string;
  totalRevenue: number;
  platformFees: number;
  processingFees: number;
  growthRate: number;
  forecast: {
    next30Days: number;
    next60Days: number;
    next90Days: number;
    confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  };
}

export interface ChurnAnalysis {
  period: string;
  totalContractors: number;
  activeContractors: number;
  churnedContractors: number;
  churnRate: number;
  atRiskContractors: Array<{
    contractorId: string;
    riskScore: number;
    riskFactors: string[];
    lastActivity: Date;
  }>;
}

export interface FraudDetection {
  transactionId: string;
  userId: string;
  amount: number;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  anomalies: string[];
  recommendation: 'APPROVE' | 'REVIEW' | 'BLOCK';
  detectedAt: Date;
}

export interface CashFlowProjection {
  date: Date;
  projectedInflow: number;
  projectedOutflow: number;
  netCashFlow: number;
  runningBalance: number;
  confidence: number;
}

export interface ROIByChannel {
  channel: string;
  customerCount: number;
  acquisitionCost: number;
  lifetimeValue: number;
  roi: number;
  paybackPeriod: number;
}

export class AnalyticsService {
  /**
   * Revenue Forecasting
   * Uses linear regression on historical data + current pipeline
   */
  async getRevenueForecast(
    startDate: Date,
    endDate: Date
  ): Promise<RevenueMetrics[]> {
    // Get historical revenue data
    const transactions = await prisma.escrowTransaction.groupBy({
      by: ['createdAt'],
      where: {
        type: 'FEE',
        status: 'COMPLETED',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
    });

    // Group by month
    const monthlyRevenue = this.groupByMonth(transactions);

    // Calculate growth rate
    const growthRate = this.calculateGrowthRate(monthlyRevenue);

    // Forecast next 90 days using linear regression
    const forecast = this.forecastRevenue(monthlyRevenue, 90);

    return monthlyRevenue.map((month, index) => ({
      period: month.period,
      totalRevenue: month.totalRevenue,
      platformFees: month.platformFees,
      processingFees: month.processingFees,
      growthRate: growthRate[index] || 0,
      forecast: {
        next30Days: forecast.find(f => this.daysBetween(new Date(month.period), f.date) <= 30)?.value || 0,
        next60Days: forecast.find(f => this.daysBetween(new Date(month.period), f.date) <= 60)?.value || 0,
        next90Days: forecast.find(f => this.daysBetween(new Date(month.period), f.date) <= 90)?.value || 0,
        confidence: this.calculateConfidence(monthlyRevenue),
      },
    }));
  }

  /**
   * Churn Prediction
   * Identifies contractors at risk of leaving based on activity patterns
   */
  async predictChurn(period: string): Promise<ChurnAnalysis> {
    const startDate = new Date(period);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    // Get all contractors
    const contractors = await prisma.user.findMany({
      where: {
        role: 'CONTRACTOR',
      },
    });

    // Identify churned contractors (no activity in 90 days)
    const churnedContractors = contractors.filter(c => {
      // Check last activity
      return this.daysSinceLastActivity(c.id) > 90;
    });

    // Calculate risk scores for active contractors
    const atRiskContractors = await this.calculateChurnRisk(
      contractors.filter(c => !churnedContractors.includes(c))
    );

    return {
      period,
      totalContractors: contractors.length,
      activeContractors: contractors.length - churnedContractors.length,
      churnedContractors: churnedContractors.length,
      churnRate: churnedContractors.length / contractors.length,
      atRiskContractors: atRiskContractors
        .filter(c => c.riskScore > 0.6)
        .sort((a, b) => b.riskScore - a.riskScore)
        .slice(0, 20), // Top 20 at-risk
    };
  }

  /**
   * Fraud Detection
   * Real-time anomaly detection for transactions
   */
  async detectFraud(transactionId: string): Promise<FraudDetection> {
    const transaction = await prisma.escrowTransaction.findUnique({
      where: { id: transactionId },
      include: {
        escrow: {
          include: {
            contract: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Calculate fraud risk score based on multiple factors
    const riskFactors: string[] = [];
    let riskScore = 0;

    // Factor 1: Unusual amount (> 3 standard deviations from user's average)
    const userAverage = await this.getUserAverageTransaction(transaction.initiatedBy);
    const stdDev = await this.getUserTransactionStdDev(transaction.initiatedBy);
    const transactionAmount = typeof transaction.amount === 'number' ? transaction.amount : transaction.amount.toNumber();
    if (Math.abs(transactionAmount - userAverage) > 3 * stdDev) {
      riskScore += 0.3;
      riskFactors.push('Unusual transaction amount');
    }

    // Factor 2: Velocity check (too many transactions in short time)
    const recentCount = await this.getRecentTransactionCount(transaction.initiatedBy, 1); // Last 1 hour
    if (recentCount > 5) {
      riskScore += 0.25;
      riskFactors.push('High transaction velocity');
    }

    // Factor 3: Geographic anomaly
    // (Would integrate with IP geolocation in real implementation)
    
    // Factor 4: New payment method
    // (Check if payment method was added in last 24 hours)

    // Factor 5: Time of day anomaly
    const hour = new Date(transaction.createdAt).getHours();
    if (hour < 6 || hour > 22) {
      riskScore += 0.1;
      riskFactors.push('Unusual time of day');
    }

    // Determine risk level
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    let recommendation: 'APPROVE' | 'REVIEW' | 'BLOCK';

    if (riskScore < 0.3) {
      riskLevel = 'LOW';
      recommendation = 'APPROVE';
    } else if (riskScore < 0.6) {
      riskLevel = 'MEDIUM';
      recommendation = 'REVIEW';
    } else if (riskScore < 0.8) {
      riskLevel = 'HIGH';
      recommendation = 'REVIEW';
    } else {
      riskLevel = 'CRITICAL';
      recommendation = 'BLOCK';
    }

    return {
      transactionId: transaction.id,
      userId: transaction.initiatedBy,
      amount: typeof transaction.amount === 'number' ? transaction.amount : transaction.amount.toNumber(),
      riskScore: Math.round(riskScore * 100) / 100,
      riskLevel,
      anomalies: riskFactors,
      recommendation,
      detectedAt: new Date(),
    };
  }

  /**
   * Cash Flow Projection
   * Projects future cash flow based on scheduled payments and historical patterns
   */
  async projectCashFlow(days: number): Promise<CashFlowProjection[]> {
    const projections: CashFlowProjection[] = [];
    const startDate = new Date();

    // Get current balance
    const currentBalance = await this.getCurrentCashBalance();

    // Get scheduled inflows (expected deposits)
    const scheduledInflows = await prisma.escrowTransaction.findMany({
      where: {
        type: 'DEPOSIT',
        status: 'PENDING',
        scheduledDate: {
          gte: startDate,
          lte: new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000),
        },
      },
    });

    // Get scheduled outflows (milestone payments)
    const scheduledOutflows = await prisma.escrowTransaction.findMany({
      where: {
        type: 'RELEASE',
        status: 'PENDING',
        scheduledDate: {
          gte: startDate,
          lte: new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000),
        },
      },
    });

    // Calculate historical averages for unscheduled activity
    const avgDailyDeposits = await this.getAverageDailyDeposits();
    const avgDailyReleases = await this.getAverageDailyReleases();

    let runningBalance = currentBalance;

    for (let day = 0; day < days; day++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + day);

      // Scheduled inflows for this day
      const dayInflows = scheduledInflows
        .filter(t => this.isSameDay(t.scheduledDate!, date))
        .reduce((sum, t) => sum + (typeof t.amount === 'number' ? t.amount : t.amount.toNumber()), 0);

      // Scheduled outflows for this day
      const dayOutflows = scheduledOutflows
        .filter(t => this.isSameDay(t.scheduledDate!, date))
        .reduce((sum, t) => sum + (typeof t.amount === 'number' ? t.amount : t.amount.toNumber()), 0);

      // Add projected unscheduled activity (with some randomness)
      const projectedInflow = dayInflows + avgDailyDeposits * (0.8 + Math.random() * 0.4);
      const projectedOutflow = dayOutflows + avgDailyReleases * (0.8 + Math.random() * 0.4);

      const netCashFlow = projectedInflow - projectedOutflow;
      runningBalance += netCashFlow;

      // Confidence decreases over time (80% for day 1, 50% for day 90)
      const confidence = Math.max(0.5, 0.8 - (day / days) * 0.3);

      projections.push({
        date,
        projectedInflow,
        projectedOutflow,
        netCashFlow,
        runningBalance,
        confidence,
      });
    }

    return projections;
  }

  /**
   * ROI by Marketing Channel
   * Calculates return on investment for different customer acquisition channels
   */
  async getROIByChannel(): Promise<ROIByChannel[]> {
    // In a real implementation, this would track user acquisition source
    // For now, we'll use metadata or utm parameters stored in user records

    const channels = ['ORGANIC', 'PAID_SEARCH', 'SOCIAL', 'REFERRAL', 'DIRECT'];
    const results: ROIByChannel[] = [];

    for (const channel of channels) {
      // Get users from this channel
      const users = await prisma.user.findMany({
        where: {
          // metadata: { path: ['acquisitionChannel'], equals: channel }
          // This would require proper JSONB querying
        },
      });

      // Calculate acquisition cost (from marketing spend data)
      const acquisitionCost = await this.getChannelAcquisitionCost(channel);

      // Calculate lifetime value
      const lifetimeValue = await this.calculateChannelLTV(channel);

      const roi = lifetimeValue > 0 ? ((lifetimeValue - acquisitionCost) / acquisitionCost) * 100 : 0;
      const paybackPeriod = acquisitionCost > 0 ? acquisitionCost / (lifetimeValue / 12) : 0; // Months

      results.push({
        channel,
        customerCount: users.length,
        acquisitionCost: acquisitionCost / users.length, // Per customer
        lifetimeValue: lifetimeValue / users.length, // Per customer
        roi,
        paybackPeriod,
      });
    }

    return results.sort((a, b) => b.roi - a.roi);
  }

  // Helper methods

  private groupByMonth(transactions: any[]): any[] {
    const grouped: Record<string, any> = {};

    transactions.forEach(tx => {
      const date = new Date(tx.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!grouped[key]) {
        grouped[key] = {
          period: key,
          totalRevenue: 0,
          platformFees: 0,
          processingFees: 0,
        };
      }

      grouped[key].totalRevenue += tx._sum.amount || 0;
      // Would split between platform and processing fees based on metadata
      grouped[key].platformFees += (tx._sum.amount || 0) * 0.7;
      grouped[key].processingFees += (tx._sum.amount || 0) * 0.3;
    });

    return Object.values(grouped).sort((a, b) => a.period.localeCompare(b.period));
  }

  private calculateGrowthRate(monthlyData: any[]): number[] {
    const rates: number[] = [];

    for (let i = 1; i < monthlyData.length; i++) {
      const prev = monthlyData[i - 1].totalRevenue;
      const curr = monthlyData[i].totalRevenue;
      const rate = prev > 0 ? ((curr - prev) / prev) * 100 : 0;
      rates.push(rate);
    }

    return rates;
  }

  private forecastRevenue(historicalData: any[], days: number): Array<{ date: Date; value: number }> {
    // Simple linear regression forecast
    // In production, would use more sophisticated models (ARIMA, Prophet, etc.)

    if (historicalData.length < 2) {
      return [];
    }

    // Calculate trend
    const values = historicalData.map(d => d.totalRevenue);
    const n = values.length;
    const avgValue = values.reduce((a, b) => a + b, 0) / n;
    
    // Simple linear trend
    let sumXY = 0;
    let sumX2 = 0;
    for (let i = 0; i < n; i++) {
      sumXY += i * values[i];
      sumX2 += i * i;
    }
    const slope = (sumXY - n * (n - 1) / 2 * avgValue) / (sumX2 - n * (n - 1) * (n - 1) / 4);

    const forecasts: Array<{ date: Date; value: number }> = [];
    const lastDate = new Date(historicalData[historicalData.length - 1].period);

    for (let i = 1; i <= days; i++) {
      const date = new Date(lastDate);
      date.setDate(date.getDate() + i);
      const value = avgValue + slope * (n + i);
      forecasts.push({ date, value: Math.max(0, value) });
    }

    return forecasts;
  }

  private calculateConfidence(data: any[]): 'LOW' | 'MEDIUM' | 'HIGH' {
    // Confidence based on data points and variance
    if (data.length < 3) return 'LOW';
    if (data.length < 6) return 'MEDIUM';
    return 'HIGH';
  }

  private daysBetween(date1: Date, date2: Date): number {
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private daysSinceLastActivity(userId: string): number {
    // Would query last transaction/contract/login for user
    return 0; // Placeholder
  }

  private async calculateChurnRisk(contractors: any[]): Promise<any[]> {
    // Calculate churn risk score for each contractor
    // Factors: days since last activity, declining transaction volume, negative feedback, etc.
    
    return contractors.map(contractor => ({
      contractorId: contractor.id,
      riskScore: Math.random(), // Placeholder
      riskFactors: ['Declining activity', 'No recent contracts'],
      lastActivity: new Date(),
    }));
  }

  private async getUserAverageTransaction(userId: string): Promise<number> {
    const result = await prisma.escrowTransaction.aggregate({
      where: { initiatedBy: userId, status: 'COMPLETED' },
      _avg: { amount: true },
    });
    const avgAmount = result._avg.amount;
    return avgAmount ? (typeof avgAmount === 'number' ? avgAmount : avgAmount.toNumber()) : 0;
  }

  private async getUserTransactionStdDev(userId: string): Promise<number> {
    // Calculate standard deviation of user's transactions
    // Simplified placeholder
    return 1000;
  }

  private async getRecentTransactionCount(userId: string, hours: number): Promise<number> {
    const since = new Date();
    since.setHours(since.getHours() - hours);

    return prisma.escrowTransaction.count({
      where: {
        initiatedBy: userId,
        createdAt: { gte: since },
      },
    });
  }

  private async getCurrentCashBalance(): Promise<number> {
    const result = await prisma.escrowAgreement.aggregate({
      _sum: { currentBalance: true },
    });
    const sumBalance = result._sum.currentBalance;
    return sumBalance ? (typeof sumBalance === 'number' ? sumBalance : sumBalance.toNumber()) : 0;
  }

  private async getAverageDailyDeposits(): Promise<number> {
    // Calculate average daily deposits from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await prisma.escrowTransaction.aggregate({
      where: {
        type: 'DEPOSIT',
        status: 'COMPLETED',
        createdAt: { gte: thirtyDaysAgo },
      },
      _sum: { amount: true },
    });

    const sumAmount = result._sum.amount;
    const totalAmount = sumAmount ? (typeof sumAmount === 'number' ? sumAmount : sumAmount.toNumber()) : 0;
    return totalAmount / 30;
  }

  private async getAverageDailyReleases(): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await prisma.escrowTransaction.aggregate({
      where: {
        type: 'RELEASE',
        status: 'COMPLETED',
        createdAt: { gte: thirtyDaysAgo },
      },
      _sum: { amount: true },
    });

    const sumAmount = result._sum.amount;
    const totalAmount = sumAmount ? (typeof sumAmount === 'number' ? sumAmount : sumAmount.toNumber()) : 0;
    return totalAmount / 30;
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  private async getChannelAcquisitionCost(channel: string): Promise<number> {
    // Would integrate with marketing spend tracking
    // Placeholder values
    const costs: Record<string, number> = {
      ORGANIC: 0,
      PAID_SEARCH: 50000,
      SOCIAL: 30000,
      REFERRAL: 10000,
      DIRECT: 0,
    };
    return costs[channel] || 0;
  }

  private async calculateChannelLTV(channel: string): Promise<number> {
    // Calculate lifetime value of customers from this channel
    // Simplified placeholder
    return 100000;
  }
}

export const analyticsService = new AnalyticsService();

