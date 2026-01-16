/**
 * Metrics Service
 * Usage metrics dashboard for jurisdictions
 */

import {createClient} from '@/lib/supabase/client';

export interface UsageMetrics {
  jurisdictionId: string;
  period: {
    start: Date;
    end: Date;
  };
  permits: {
    total: number;
    submitted: number;
    approved: number;
    issued: number;
    byType: Record<string, number>;
  };
  revenue: {
    total: number;
    fees: number;
    expedited: number;
    thisMonth: number;
  };
  reviews: {
    total: number;
    averageDays: number;
    byDiscipline: Record<string, number>;
    onTime: number;
    late: number;
  };
  inspections: {
    total: number;
    passed: number;
    failed: number;
    averageDays: number;
  };
  staff: {
    total: number;
    byRole: Record<string, number>;
    averageWorkload: number;
  };
}

export class MetricsService {
  /**
   * Get usage metrics for jurisdiction
   */
  async getUsageMetrics(
    jurisdictionId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<UsageMetrics> {
    const supabase = createClient();

    const endDate = options?.endDate || new Date();
    const startDate = options?.startDate || new Date(endDate.getFullYear(), endDate.getMonth(), 1);

    // Get permits
    const {data: permits} = await supabase
      .from('Permit')
      .select('*')
      .eq('jurisdictionId', jurisdictionId)
      .gte('createdAt', startDate.toISOString())
      .lte('createdAt', endDate.toISOString());

    // Get reviews
    const {data: reviews} = await supabase
      .from('PermitReview')
      .select('*, permit:permitId(jurisdictionId)')
      .eq('permit.jurisdictionId', jurisdictionId)
      .gte('startedAt', startDate.toISOString())
      .lte('startedAt', endDate.toISOString());

    // Get inspections
    const {data: inspections} = await supabase
      .from('Inspection')
      .select('*')
      .eq('jurisdictionId', jurisdictionId)
      .gte('requestedAt', startDate.toISOString())
      .lte('requestedAt', endDate.toISOString());

    // Get staff
    const {data: staff} = await supabase
      .from('JurisdictionStaff')
      .select('*')
      .eq('jurisdictionId', jurisdictionId)
      .eq('active', true);

    // Calculate metrics
    return this.calculateMetrics(permits || [], reviews || [], inspections || [], staff || [], {
      start: startDate,
      end: endDate,
    });
  }

  /**
   * Calculate metrics from data
   */
  private calculateMetrics(
    permits: any[],
    reviews: any[],
    inspections: any[],
    staff: any[],
    period: {start: Date; end: Date}
  ): UsageMetrics {
    const jurisdictionId = permits[0]?.jurisdictionId || '';

    // Permit metrics
    const permitsByType: Record<string, number> = {};
    permits.forEach(p => {
      permitsByType[p.type] = (permitsByType[p.type] || 0) + 1;
    });

    // Revenue metrics
    const paidPermits = permits.filter(p => p.feePaid && p.feeAmount);
    const revenueTotal = paidPermits.reduce((sum, p) => sum + Number(p.feeAmount || 0), 0);
    const expeditedRevenue = paidPermits
      .filter(p => p.expedited)
      .reduce((sum, p) => sum + Number(p.expeditedFee || 0), 0);

    // This month revenue
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const thisMonthRevenue = paidPermits
      .filter(p => p.feePaidAt && new Date(p.feePaidAt) >= startOfMonth)
      .reduce((sum, p) => sum + Number(p.feeAmount || 0), 0);

    // Review metrics
    const reviewsByDiscipline: Record<string, number> = {};
    let totalReviewDays = 0;
    let completedReviews = 0;
    let onTimeReviews = 0;
    let lateReviews = 0;

    reviews.forEach(r => {
      reviewsByDiscipline[r.discipline] = (reviewsByDiscipline[r.discipline] || 0) + 1;

      if (r.completedAt) {
        completedReviews++;
        const days = Math.ceil(
          (new Date(r.completedAt).getTime() - new Date(r.startedAt).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        totalReviewDays += days;

        // Check if on time (would compare to due date)
        if (days <= 10) {
          onTimeReviews++;
        } else {
          lateReviews++;
        }
      }
    });

    // Inspection metrics
    const passedInspections = inspections.filter(i => i.result === 'PASS').length;
    const failedInspections = inspections.filter(i => i.result === 'FAIL').length;
    const completedInspections = inspections.filter(i => i.completedAt);
    const totalInspectionDays = completedInspections.reduce((sum, i) => {
      const days = Math.ceil(
        (new Date(i.completedAt).getTime() - new Date(i.requestedAt).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      return sum + days;
    }, 0);

    // Staff metrics
    const staffByRole: Record<string, number> = {};
    staff.forEach(s => {
      staffByRole[s.role] = (staffByRole[s.role] || 0) + 1;
    });

    return {
      jurisdictionId,
      period,
      permits: {
        total: permits.length,
        submitted: permits.filter(p => p.status === 'SUBMITTED').length,
        approved: permits.filter(p => p.status === 'APPROVED').length,
        issued: permits.filter(p => p.status === 'ISSUED').length,
        byType: permitsByType,
      },
      revenue: {
        total: revenueTotal,
        fees: revenueTotal,
        expedited: expeditedRevenue,
        thisMonth: thisMonthRevenue,
      },
      reviews: {
        total: reviews.length,
        averageDays: completedReviews > 0 ? totalReviewDays / completedReviews : 0,
        byDiscipline: reviewsByDiscipline,
        onTime: onTimeReviews,
        late: lateReviews,
      },
      inspections: {
        total: inspections.length,
        passed: passedInspections,
        failed: failedInspections,
        averageDays:
          completedInspections.length > 0 ? totalInspectionDays / completedInspections.length : 0,
      },
      staff: {
        total: staff.length,
        byRole: staffByRole,
        averageWorkload: 0, // Would calculate from actual workload data
      },
    };
  }

  /**
   * Get dashboard summary
   */
  async getDashboardSummary(jurisdictionId: string): Promise<{
    thisMonth: UsageMetrics;
    lastMonth: UsageMetrics;
    yearToDate: UsageMetrics;
    trends: {
      permits: number; // % change
      revenue: number; // % change
      reviews: number; // % change
    };
  }> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const thisMonth = await this.getUsageMetrics(jurisdictionId, {
      startDate: startOfMonth,
      endDate: now,
    });

    const lastMonth = await this.getUsageMetrics(jurisdictionId, {
      startDate: startOfLastMonth,
      endDate: endOfLastMonth,
    });

    const yearToDate = await this.getUsageMetrics(jurisdictionId, {
      startDate: startOfYear,
      endDate: now,
    });

    // Calculate trends
    const permitsTrend =
      lastMonth.permits.total > 0
        ? ((thisMonth.permits.total - lastMonth.permits.total) / lastMonth.permits.total) * 100
        : 0;

    const revenueTrend =
      lastMonth.revenue.total > 0
        ? ((thisMonth.revenue.total - lastMonth.revenue.total) / lastMonth.revenue.total) * 100
        : 0;

    const reviewsTrend =
      lastMonth.reviews.total > 0
        ? ((thisMonth.reviews.total - lastMonth.reviews.total) / lastMonth.reviews.total) * 100
        : 0;

    return {
      thisMonth,
      lastMonth,
      yearToDate,
      trends: {
        permits: Math.round(permitsTrend * 100) / 100,
        revenue: Math.round(revenueTrend * 100) / 100,
        reviews: Math.round(reviewsTrend * 100) / 100,
      },
    };
  }
}

// Singleton instance
export const metricsService = new MetricsService();
