/**
 * GROWTH TRACKER - Enterprise Growth Metrics
 * Tracks user acquisition, conversions, and growth KPIs
 */

import { prisma } from '@kealee/database';
import type {
  AcquisitionSource,
  ConversionEventType,
  UserAcquisition,
  ConversionEvent,
  FunnelMetrics,
  GrowthMetric,
} from '@kealee/database';

interface TrackAcquisitionOptions {
  gclid?: string;
  fbclid?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  medium?: string;
  campaign?: string;
  metadata?: Record<string, any>;
}

export class GrowthTracker {
  /**
   * Track user acquisition from a specific source
   */
  static async trackUserAcquisition(
    userId: string,
    source: AcquisitionSource,
    options: TrackAcquisitionOptions = {}
  ): Promise<UserAcquisition> {
    try {
      const acquisition = await prisma.userAcquisition.create({
        data: {
          userId,
          source,
          medium: options.medium,
          campaign: options.campaign,
          gclid: options.gclid,
          fbclid: options.fbclid,
          utmSource: options.utmSource,
          utmMedium: options.utmMedium,
          utmCampaign: options.utmCampaign,
          utmContent: options.utmContent,
          metadata: options.metadata || {},
        },
      });

      // Update daily growth metrics
      await this.updateDailyMetrics(new Date());

      return acquisition;
    } catch (error) {
      console.error('Failed to track user acquisition:', error);
      throw error;
    }
  }

  /**
   * Track conversion events (signup, payment, etc.)
   */
  static async trackConversionEvent(
    userId: string,
    eventType: ConversionEventType,
    projectId?: string,
    projectValue?: number,
    metadata?: Record<string, any>
  ): Promise<ConversionEvent> {
    try {
      const event = await prisma.conversionEvent.create({
        data: {
          userId,
          eventType,
          projectId,
          projectValue: projectValue ? String(projectValue) : undefined,
          metadata: metadata || {},
        },
      });

      // Update daily growth metrics
      await this.updateDailyMetrics(new Date());

      // Update funnel metrics
      await this.updateFunnelMetrics(new Date());

      return event;
    } catch (error) {
      console.error('Failed to track conversion event:', error);
      throw error;
    }
  }

  /**
   * Calculate CAC (Cost Per Acquisition) for a channel
   */
  static async calculateChannelCAC(
    channel: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    channel: string;
    totalUsers: number;
    totalSpend: number;
    cac: number;
  }> {
    try {
      const funnelMetrics = await prisma.funnelMetrics.aggregate({
        where: {
          channel,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: {
          newSignups: true,
          totalSpend: true,
        },
      });

      const totalUsers = funnelMetrics._sum.newSignups || 0;
      const totalSpend = Number(funnelMetrics._sum.totalSpend || 0);
      const cac = totalUsers > 0 ? totalSpend / totalUsers : 0;

      return {
        channel,
        totalUsers,
        totalSpend,
        cac: Math.round(cac * 100) / 100,
      };
    } catch (error) {
      console.error('Failed to calculate channel CAC:', error);
      throw error;
    }
  }

  /**
   * Update daily funnel metrics for a channel
   */
  static async updateFunnelMetrics(
    date: Date,
    channel?: string
  ): Promise<FunnelMetrics | FunnelMetrics[]> {
    try {
      const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

      if (channel) {
        // Update specific channel
        const acquisitions = await prisma.userAcquisition.count({
          where: {
            timestamp: {
              gte: dateOnly,
              lt: new Date(dateOnly.getTime() + 24 * 60 * 60 * 1000),
            },
            source: this.mapSourceToString(channel),
          },
        });

        const metric = await prisma.funnelMetrics.upsert({
          where: {
            date_channel: {
              date: dateOnly,
              channel,
            },
          },
          create: {
            date: dateOnly,
            channel,
            newSignups: acquisitions,
          },
          update: {
            newSignups: acquisitions,
          },
        });

        return metric;
      } else {
        // Update all channels
        const channels = [
          'google_ads',
          'meta',
          'tiktok',
          'organic',
          'partnership',
          'referral',
        ];
        const metrics = await Promise.all(
          channels.map((ch) => this.updateFunnelMetrics(date, ch))
        );
        return metrics as FunnelMetrics[];
      }
    } catch (error) {
      console.error('Failed to update funnel metrics:', error);
      throw error;
    }
  }

  /**
   * Generate cohort analysis for a given cohort date
   */
  static async generateCohortAnalysis(
    cohortDate: Date,
    periods: number = 90
  ): Promise<{
    cohortDate: Date;
    cohortSize: number;
    retentionCurve: Record<number, number>;
  }> {
    try {
      const dateOnly = new Date(
        cohortDate.getFullYear(),
        cohortDate.getMonth(),
        cohortDate.getDate()
      );

      // Get all users acquired on cohort date
      const cohortUsers = await prisma.userAcquisition.findMany({
        where: {
          timestamp: {
            gte: dateOnly,
            lt: new Date(dateOnly.getTime() + 24 * 60 * 60 * 1000),
          },
        },
        select: { userId: true },
      });

      const cohortSize = cohortUsers.length;
      const userIds = cohortUsers.map((u) => u.userId);

      const retentionCurve: Record<number, number> = {};

      // Calculate retention at day 0, 1, 7, 30, 60, 90
      for (const days of [0, 1, 7, 30, 60, 90]) {
        if (days > periods) break;

        const checkDate = new Date(dateOnly.getTime() + days * 24 * 60 * 60 * 1000);
        const activeUsers = await prisma.conversionEvent.findMany({
          where: {
            userId: { in: userIds },
            timestamp: {
              lte: checkDate,
            },
          },
          distinct: ['userId'],
          select: { userId: true },
        });

        retentionCurve[days] = activeUsers.length;
      }

      // Store cohort analysis
      await prisma.cohortAnalysis.upsert({
        where: {
          cohortDate_channel: {
            cohortDate: dateOnly,
            channel: null,
          },
        },
        create: {
          cohortDate: dateOnly,
          cohortSize,
          day0Retained: retentionCurve[0] || 0,
          day1Retained: retentionCurve[1] || 0,
          day7Retained: retentionCurve[7] || 0,
          day30Retained: retentionCurve[30] || 0,
          day60Retained: retentionCurve[60] || 0,
          day90Retained: retentionCurve[90] || 0,
          d0Rate: 100,
          d1Rate: retentionCurve[1] ? (retentionCurve[1] / cohortSize) * 100 : 0,
          d7Rate: retentionCurve[7] ? (retentionCurve[7] / cohortSize) * 100 : 0,
          d30Rate: retentionCurve[30] ? (retentionCurve[30] / cohortSize) * 100 : 0,
          d60Rate: retentionCurve[60] ? (retentionCurve[60] / cohortSize) * 100 : 0,
          d90Rate: retentionCurve[90] ? (retentionCurve[90] / cohortSize) * 100 : 0,
        },
        update: {
          cohortSize,
          day0Retained: retentionCurve[0] || 0,
          day1Retained: retentionCurve[1] || 0,
          day7Retained: retentionCurve[7] || 0,
          day30Retained: retentionCurve[30] || 0,
          day60Retained: retentionCurve[60] || 0,
          day90Retained: retentionCurve[90] || 0,
        },
      });

      return {
        cohortDate: dateOnly,
        cohortSize,
        retentionCurve,
      };
    } catch (error) {
      console.error('Failed to generate cohort analysis:', error);
      throw error;
    }
  }

  /**
   * Update daily KPI snapshot
   */
  private static async updateDailyMetrics(date: Date): Promise<GrowthMetric> {
    try {
      const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

      // Get today's signups
      const newOwners = await prisma.userAcquisition.count({
        where: {
          timestamp: {
            gte: dateOnly,
            lt: new Date(dateOnly.getTime() + 24 * 60 * 60 * 1000),
          },
        },
      });

      // Get total owners
      const totalOwners = await prisma.user.count({
        where: {
          role: 'OWNER',
          createdAt: { lte: new Date(dateOnly.getTime() + 24 * 60 * 60 * 1000) },
        },
      });

      // Get total contractors
      const totalContractors = await prisma.user.count({
        where: {
          role: 'CONTRACTOR',
          createdAt: { lte: new Date(dateOnly.getTime() + 24 * 60 * 60 * 1000) },
        },
      });

      // Calculate average CAC from channel metrics
      const channelMetrics = await prisma.channelMetrics.findMany({});
      const avgCAC = channelMetrics.length > 0
        ? channelMetrics.reduce((sum, m) => sum + Number(m.cac), 0) / channelMetrics.length
        : 0;

      const metric = await prisma.growthMetric.upsert({
        where: { date: dateOnly },
        create: {
          date: dateOnly,
          totalOwners,
          totalContractors,
          newOwners,
          averageCAC: String(avgCAC),
        },
        update: {
          totalOwners,
          totalContractors,
          newOwners,
          averageCAC: String(avgCAC),
        },
      });

      return metric;
    } catch (error) {
      console.error('Failed to update daily metrics:', error);
      throw error;
    }
  }

  /**
   * Map acquisition source string to enum
   */
  private static mapSourceToString(channel: string): AcquisitionSource {
    const map: Record<string, AcquisitionSource> = {
      google_ads: 'GOOGLE_ADS',
      meta: 'META_ADS',
      tiktok: 'TIKTOK',
      organic: 'ORGANIC',
      partnership: 'PARTNERSHIP',
      referral: 'REFERRAL',
      direct: 'DIRECT',
    };
    return map[channel] || 'OTHER';
  }
}

export default GrowthTracker;
