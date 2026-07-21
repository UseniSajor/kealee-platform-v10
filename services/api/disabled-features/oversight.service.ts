/**
 * Admin Oversight Service
 * Real-time monitoring and manual intervention for financial operations
 */

import { PrismaClient } from '@kealee/database';
import { toNumber } from '../../utils/decimal-helpers';

const prisma = new PrismaClient();

export interface DashboardMetrics {
  financial: {
    totalEscrowBalance: number;
    pendingDeposits: number;
    pendingReleases: number;
    dailyVolume: number;
    failedTransactions: number;
  };
  compliance: {
    pendingScreenings: number;
    flaggedTransactions: number;
    expiringLicenses: number;
    activeAlerts: number;
  };
  operations: {
    activeUsers: number;
    activeContracts: number;
    activeDisputes: number;
    systemHealth: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  };
  alerts: AlertItem[];
}

export interface AlertItem {
  id: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: 'FINANCIAL' | 'COMPLIANCE' | 'SECURITY' | 'OPERATIONAL';
  message: string;
  entityType?: string;
  entityId?: string;
  createdAt: Date;
  requiresAction: boolean;
}

export interface RiskScore {
  userId: string;
  overallScore: number;
  factors: RiskFactor[];
  recommendation: 'APPROVE' | 'REVIEW' | 'BLOCK';
  lastCalculated: Date;
}

export interface RiskFactor {
  category: string;
  score: number;
  weight: number;
  description: string;
}

export interface AnomalyDetection {
  id: string;
  type: 'TRANSACTION' | 'USER_BEHAVIOR' | 'SYSTEM';
  description: string;
  severity: number;
  affectedEntities: string[];
  detectedAt: Date;
  resolved: boolean;
}

export class OversightService {
  /**
   * Get real-time dashboard metrics
   */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    // Fetch metrics in parallel for speed
    const [
      escrowBalances,
      pendingDeposits,
      pendingReleases,
      dailyVolume,
      failedTransactions,
      pendingScreenings,
      flaggedTransactions,
      expiringLicenses,
      activeAlerts,
      activeUsers,
      activeContracts,
      activeDisputes,
    ] = await Promise.all([
      this.getTotalEscrowBalance(),
      this.getPendingDeposits(),
      this.getPendingReleases(),
      this.getDailyVolume(),
      this.getFailedTransactions(),
      this.getPendingScreenings(),
      this.getFlaggedTransactions(),
      this.getExpiringLicenses(),
      this.getActiveAlerts(),
      this.getActiveUsers(),
      this.getActiveContracts(),
      this.getActiveDisputes(),
    ]);

    // Get system health
    const systemHealth = await this.checkSystemHealth();

    // Get recent alerts
    const alerts = await this.getRecentAlerts(10);

    return {
      financial: {
        totalEscrowBalance: escrowBalances,
        pendingDeposits,
        pendingReleases,
        dailyVolume,
        failedTransactions,
      },
      compliance: {
        pendingScreenings,
        flaggedTransactions,
        expiringLicenses,
        activeAlerts,
      },
      operations: {
        activeUsers,
        activeContracts,
        activeDisputes,
        systemHealth,
      },
      alerts,
    };
  }

  /**
   * Calculate risk score for user
   */
  async calculateRiskScore(userId: string): Promise<RiskScore> {
    const factors: RiskFactor[] = [];
    let totalScore = 0;
    let totalWeight = 0;

    // Factor 1: Transaction velocity (25% weight)
    const transactionVelocity = await this.getTransactionVelocity(userId);
    const velocityScore = Math.min(transactionVelocity / 10, 1.0); // Normalize
    factors.push({
      category: 'Transaction Velocity',
      score: velocityScore,
      weight: 0.25,
      description: `${transactionVelocity} transactions in last 24 hours`,
    });
    totalScore += velocityScore * 0.25;
    totalWeight += 0.25;

    // Factor 2: Failed transaction rate (30% weight)
    const failureRate = await this.getFailureRate(userId);
    const failureScore = failureRate; // Already 0-1
    factors.push({
      category: 'Failed Transactions',
      score: failureScore,
      weight: 0.3,
      description: `${(failureRate * 100).toFixed(1)}% failure rate`,
    });
    totalScore += failureScore * 0.3;
    totalWeight += 0.3;

    // Factor 3: Dispute history (20% weight)
    const disputeScore = await this.getDisputeScore(userId);
    factors.push({
      category: 'Dispute History',
      score: disputeScore,
      weight: 0.2,
      description: `Dispute involvement score`,
    });
    totalScore += disputeScore * 0.2;
    totalWeight += 0.2;

    // Factor 4: Account age (10% weight)
    const accountAge = await this.getAccountAge(userId);
    const ageScore = accountAge < 30 ? 0.5 : 0.0; // New accounts higher risk
    factors.push({
      category: 'Account Age',
      score: ageScore,
      weight: 0.1,
      description: `${accountAge} days old`,
    });
    totalScore += ageScore * 0.1;
    totalWeight += 0.1;

    // Factor 5: Compliance status (15% weight)
    const complianceScore = await this.getComplianceScore(userId);
    factors.push({
      category: 'Compliance Status',
      score: complianceScore,
      weight: 0.15,
      description: 'License and insurance status',
    });
    totalScore += complianceScore * 0.15;
    totalWeight += 0.15;

    // Calculate overall score (0-100)
    const overallScore = Math.round((totalScore / totalWeight) * 100);

    // Determine recommendation
    let recommendation: 'APPROVE' | 'REVIEW' | 'BLOCK';
    if (overallScore < 30) {
      recommendation = 'APPROVE';
    } else if (overallScore < 70) {
      recommendation = 'REVIEW';
    } else {
      recommendation = 'BLOCK';
    }

    return {
      userId,
      overallScore,
      factors,
      recommendation,
      lastCalculated: new Date(),
    };
  }

  /**
   * Detect anomalies in system behavior
   */
  async detectAnomalies(): Promise<AnomalyDetection[]> {
    const anomalies: AnomalyDetection[] = [];

    // Check for unusual transaction patterns
    const unusualTransactions = await this.detectUnusualTransactions();
    anomalies.push(...unusualTransactions);

    // Check for suspicious user behavior
    const suspiciousBehavior = await this.detectSuspiciousBehavior();
    anomalies.push(...suspiciousBehavior);

    // Check for system performance issues
    const systemAnomalies = await this.detectSystemAnomalies();
    anomalies.push(...systemAnomalies);

    return anomalies.sort((a, b) => b.severity - a.severity);
  }

  /**
   * Manual intervention: Freeze escrow
   */
  async freezeEscrow(escrowId: string, reason: string, adminUserId: string): Promise<void> {
    await prisma.escrowAgreement.update({
      where: { id: escrowId },
      data: { status: 'FROZEN' },
    });

    // Log intervention
    await this.logIntervention({
      adminUserId,
      action: 'FREEZE_ESCROW',
      entityType: 'ESCROW',
      entityId: escrowId,
      reason,
    });

    // Create alert
    await this.createAlert({
      severity: 'HIGH',
      category: 'OPERATIONAL',
      message: `Escrow ${escrowId} frozen by admin: ${reason}`,
      entityType: 'ESCROW',
      entityId: escrowId,
      requiresAction: false,
    });
  }

  /**
   * Manual intervention: Unfreeze escrow
   */
  async unfreezeEscrow(escrowId: string, reason: string, adminUserId: string): Promise<void> {
    await prisma.escrowAgreement.update({
      where: { id: escrowId },
      data: { status: 'ACTIVE' },
    });

    await this.logIntervention({
      adminUserId,
      action: 'UNFREEZE_ESCROW',
      entityType: 'ESCROW',
      entityId: escrowId,
      reason,
    });
  }

  /**
   * Manual intervention: Block user
   */
  async blockUser(userId: string, reason: string, adminUserId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { status: 'BLOCKED' },
    });

    await this.logIntervention({
      adminUserId,
      action: 'BLOCK_USER',
      entityType: 'USER',
      entityId: userId,
      reason,
    });

    await this.createAlert({
      severity: 'CRITICAL',
      category: 'SECURITY',
      message: `User ${userId} blocked by admin: ${reason}`,
      entityType: 'USER',
      entityId: userId,
      requiresAction: false,
    });
  }

  /**
   * Bulk operation: Approve multiple transactions
   */
  async bulkApproveTransactions(transactionIds: string[], adminUserId: string): Promise<{
    approved: number;
    failed: number;
    errors: Array<{ transactionId: string; error: string }>;
  }> {
    let approved = 0;
    let failed = 0;
    const errors: Array<{ transactionId: string; error: string }> = [];

    for (const transactionId of transactionIds) {
      try {
        // Approve transaction logic here
        approved++;
      } catch (error: any) {
        failed++;
        errors.push({
          transactionId,
          error: error.message,
        });
      }
    }

    await this.logIntervention({
      adminUserId,
      action: 'BULK_APPROVE',
      entityType: 'TRANSACTION',
      entityId: transactionIds.join(','),
      reason: `Bulk approved ${approved} transactions`,
    });

    return { approved, failed, errors };
  }

  // Helper methods

  private async getTotalEscrowBalance(): Promise<number> {
    const result = await prisma.escrowAgreement.aggregate({
      _sum: { currentBalance: true },
      where: { status: { in: ['ACTIVE', 'FROZEN'] } },
    });
    return toNumber(result._sum.currentBalance);
  }

  private async getPendingDeposits(): Promise<number> {
    return await prisma.depositRequest.count({
      where: { status: { in: ['PENDING', 'PROCESSING'] } },
    });
  }

  private async getPendingReleases(): Promise<number> {
    return await prisma.escrowTransaction.count({
      where: {
        type: 'RELEASE',
        status: 'PENDING',
      },
    });
  }

  private async getDailyVolume(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await prisma.escrowTransaction.aggregate({
      _sum: { amount: true },
      where: {
        status: 'COMPLETED',
        createdAt: { gte: today },
      },
    });

    return toNumber(result._sum.amount);
  }

  private async getFailedTransactions(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await prisma.escrowTransaction.count({
      where: {
        status: 'FAILED',
        createdAt: { gte: today },
      },
    });
  }

  private async getPendingScreenings(): Promise<number> {
    // Mock - would query actual screening records
    return 0;
  }

  private async getFlaggedTransactions(): Promise<number> {
    // Mock - would query flagged transactions
    return 0;
  }

  private async getExpiringLicenses(): Promise<number> {
    // Mock - would query licenses expiring in next 30 days
    return 0;
  }

  private async getActiveAlerts(): Promise<number> {
    // Mock - would query active alerts
    return 0;
  }

  private async getActiveUsers(): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return await prisma.user.count({
      where: {
        // lastLoginAt: { gte: thirtyDaysAgo },
        status: 'ACTIVE',
      },
    });
  }

  private async getActiveContracts(): Promise<number> {
    return await prisma.contract.count({
      where: { status: 'ACTIVE' },
    });
  }

  private async getActiveDisputes(): Promise<number> {
    // Mock - would query disputes
    return 0;
  }

  private async checkSystemHealth(): Promise<'HEALTHY' | 'DEGRADED' | 'DOWN'> {
    try {
      // Check database connectivity
      await prisma.$queryRaw`SELECT 1`;
      return 'HEALTHY';
    } catch (error) {
      return 'DOWN';
    }
  }

  private async getRecentAlerts(limit: number): Promise<AlertItem[]> {
    // Mock alerts - would query from alerts table
    return [];
  }

  private async getTransactionVelocity(userId: string): Promise<number> {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    return await prisma.escrowTransaction.count({
      where: {
        initiatedBy: userId,
        createdAt: { gte: twentyFourHoursAgo },
      },
    });
  }

  private async getFailureRate(userId: string): Promise<number> {
    const total = await prisma.escrowTransaction.count({
      where: { initiatedBy: userId },
    });

    if (total === 0) return 0;

    const failed = await prisma.escrowTransaction.count({
      where: {
        initiatedBy: userId,
        status: 'FAILED',
      },
    });

    return failed / total;
  }

  private async getDisputeScore(userId: string): Promise<number> {
    // Mock - would calculate based on dispute history
    return 0.0;
  }

  private async getAccountAge(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { createdAt: true },
    });

    if (!user) return 0;

    const ageMs = Date.now() - user.createdAt.getTime();
    return Math.floor(ageMs / (1000 * 60 * 60 * 24));
  }

  private async getComplianceScore(userId: string): Promise<number> {
    // Mock - would check license, insurance, etc.
    return 0.0;
  }

  private async detectUnusualTransactions(): Promise<AnomalyDetection[]> {
    // Mock - would use ML/statistical analysis
    return [];
  }

  private async detectSuspiciousBehavior(): Promise<AnomalyDetection[]> {
    // Mock - would analyze user patterns
    return [];
  }

  private async detectSystemAnomalies(): Promise<AnomalyDetection[]> {
    // Mock - would check system metrics
    return [];
  }

  private async logIntervention(data: {
    adminUserId: string;
    action: string;
    entityType: string;
    entityId: string;
    reason: string;
  }): Promise<void> {
    console.log('Admin intervention:', data);
    // Would log to audit trail
  }

  private async createAlert(alert: Omit<AlertItem, 'id' | 'createdAt'>): Promise<void> {
    console.log('Alert created:', alert);
    // Would create alert record
  }
}

export const oversightService = new OversightService();

