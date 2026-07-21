/**
 * GROWTH ANALYTICS QUERIES
 * Real-time growth metrics, funnel analysis, and cohort tracking
 */

import { prisma } from '@kealee/database';

export interface DailyMetrics {
  date: string;
  newUsers: number;
  activeUsers: number;
  conversions: number;
  revenue: number;
  cacAvg: number;
  ltvEstimate: number;
  churnRate: number;
}

export interface ChannelPerformance {
  channel: string;
  users: number;
  spend: number;
  cac: number;
  ltv: number;
  roi: number;
  conversionRate: number;
  retentionRate: number;
}

export interface FunnelBreakdown {
  signups: number;
  intakeComplete: number;
  projectCreated: number;
  paid: number;
  completionRate: number;
}

export interface CohortRetention {
  cohortDate: string;
  d0: number;
  d1: number;
  d7: number;
  d30: number;
  d60: number;
  d90: number;
}

export class GrowthAnalytics {
  /**
   * Get daily KPI metrics for dashboard
   */
  static async getDailyMetrics(date: Date): Promise<DailyMetrics> {
    try {
      const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

      // Get growth metric snapshot
      const metric = await prisma.growthMetric.findUnique({
        where: { date: dateOnly },
      });

      if (!metric) {
        return {
          date: dateOnly.toISOString(),
          newUsers: 0,
          activeUsers: 0,
          conversions: 0,
          revenue: 0,
          cacAvg: 0,
          ltvEstimate: 0,
          churnRate: 0,
        };
      }

      // Calculate LTV estimate: $25 ARPU * 12 months average retention
      const ltvEstimate = 25 * 12 * (1 - (metric.churnRate || 0) / 100);

      return {
        date: dateOnly.toISOString(),
        newUsers: metric.newOwners,
        activeUsers: metric.activeOwners || 0,
        conversions: metric.totalProjects || 0,
        revenue: Number(metric.totalRevenue || 0),
        cacAvg: Number(metric.averageCAC || 0),
        ltvEstimate: Math.round(ltvEstimate * 100) / 100,
        churnRate: metric.churnRate || 0,
      };
    } catch (error) {
      console.error('Failed to get daily metrics:', error);
      throw error;
    }
  }

  /**
   * Get channel performance metrics
   */
  static async getChannelMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<ChannelPerformance[]> {
    try {
      const metrics = await prisma.channelMetrics.findMany({
        where: {
          lastUpdated: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      return metrics.map((m) => ({
        channel: m.channel,
        users: m.totalUsers,
        spend: Number(m.totalSpend),
        cac: Number(m.cac),
        ltv: Number(m.ltv),
        roi: m.roi,
        conversionRate: m.conversionRate,
        retentionRate: m.retentionRate,
      }));
    } catch (error) {
      console.error('Failed to get channel metrics:', error);
      throw error;
    }
  }

  /**
   * Get funnel breakdown for a specific channel
   */
  static async getFunnelBreakdown(
    channel: string,
    date: Date
  ): Promise<FunnelBreakdown> {
    try {
      const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

      const funnel = await prisma.funnelMetrics.findUnique({
        where: {
          date_channel: {
            date: dateOnly,
            channel,
          },
        },
      });

      if (!funnel) {
        return {
          signups: 0,
          intakeComplete: 0,
          projectCreated: 0,
          paid: 0,
          completionRate: 0,
        };
      }

      const completionRate =
        funnel.newSignups > 0
          ? Math.round((funnel.intakeCompleted / funnel.newSignups) * 100)
          : 0;

      return {
        signups: funnel.newSignups,
        intakeComplete: funnel.intakeCompleted,
        projectCreated: funnel.projectsCreated,
        paid: funnel.paymentsProcessed,
        completionRate,
      };
    } catch (error) {
      console.error('Failed to get funnel breakdown:', error);
      throw error;
    }
  }

  /**
   * Get cohort retention curves
   */
  static async getCohortRetention(cohortDate: Date): Promise<CohortRetention> {
    try {
      const dateOnly = new Date(
        cohortDate.getFullYear(),
        cohortDate.getMonth(),
        cohortDate.getDate()
      );

      const cohort = await prisma.cohortAnalysis.findUnique({
        where: {
          cohortDate_channel: {
            cohortDate: dateOnly,
            channel: null as unknown as string,
          },
        },
      });

      if (!cohort) {
        return {
          cohortDate: dateOnly.toISOString(),
          d0: 0,
          d1: 0,
          d7: 0,
          d30: 0,
          d60: 0,
          d90: 0,
        };
      }

      return {
        cohortDate: dateOnly.toISOString(),
        d0: Math.round(cohort.d0Rate),
        d1: Math.round(cohort.d1Rate),
        d7: Math.round(cohort.d7Rate),
        d30: Math.round(cohort.d30Rate),
        d60: Math.round(cohort.d60Rate),
        d90: Math.round(cohort.d90Rate),
      };
    } catch (error) {
      console.error('Failed to get cohort retention:', error);
      throw error;
    }
  }

  /**
   * Get geographic distribution of users
   */
  static async getGeographicMetrics() {
    try {
      const users = await prisma.user.groupBy({
        by: ['state'],
        _count: { id: true },
        where: { state: { not: null } },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      });

      return users.map((u) => ({
        state: u.state || 'Unknown',
        userCount: u._count.id,
      }));
    } catch (error) {
      console.error('Failed to get geographic metrics:', error);
      throw error;
    }
  }

  /**
   * Get growth trend (last N days)
   */
  static async getGrowthTrend(days: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const metrics = await prisma.growthMetric.findMany({
        where: {
          date: {
            gte: startDate,
          },
        },
        orderBy: { date: 'asc' },
      });

      return metrics.map((m) => ({
        date: m.date.toISOString().split('T')[0],
        owners: m.totalOwners,
        contractors: m.totalContractors,
        newOwners: m.newOwners,
        cac: Number(m.averageCAC),
      }));
    } catch (error) {
      console.error('Failed to get growth trend:', error);
      throw error;
    }
  }

  /**
   * Get partner performance
   */
  static async getPartnershipMetrics() {
    try {
      const partnerships = await prisma.partnershipMetric.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { usersFromPartner: 'desc' },
      });

      return partnerships.map((p) => ({
        partnerName: p.partnerName,
        users: p.usersFromPartner,
        revenue: Number(p.revenueFromPartner),
        cost: Number(p.costToPartner),
        roi: p.roi,
        integrationPoints: p.integrationPoints,
      }));
    } catch (error) {
      console.error('Failed to get partnership metrics:', error);
      throw error;
    }
  }

  /**
   * Generate executive summary
   */
  static async getExecutiveSummary() {
    try {
      const today = new Date();
      const yesterdayDate = new Date(today);
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);

      const todayMetrics = await this.getDailyMetrics(today);
      const yesterdayMetrics = await this.getDailyMetrics(yesterdayDate);

      const userGrowth =
        ((todayMetrics.newUsers - yesterdayMetrics.newUsers) / Math.max(yesterdayMetrics.newUsers, 1)) * 100;
      const cacTrend =
        ((todayMetrics.cacAvg - yesterdayMetrics.cacAvg) / Math.max(yesterdayMetrics.cacAvg, 1)) * 100;

      const monthlyMetrics = await this.getGrowthTrend(30);
      const monthTotal = monthlyMetrics.reduce((sum, m) => sum + m.newOwners, 0);

      return {
        currentOwners: todayMetrics.newUsers,
        dailyUserGrowth: userGrowth,
        averageCAC: todayMetrics.cacAvg,
        cacTrend,
        monthlyAcquisitions: monthTotal,
        estimatedLTV: todayMetrics.ltvEstimate,
        churnRate: todayMetrics.churnRate,
        conversionRate: ((todayMetrics.conversions / Math.max(todayMetrics.newUsers, 1)) * 100).toFixed(2),
      };
    } catch (error) {
      console.error('Failed to get executive summary:', error);
      throw error;
    }
  }
}

export default GrowthAnalytics;
