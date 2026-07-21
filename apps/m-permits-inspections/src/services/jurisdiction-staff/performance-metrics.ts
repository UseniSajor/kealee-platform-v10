/**
 * Performance Metrics Service
 * Tracks and analyzes staff performance
 */

import {JurisdictionStaff, PerformanceMetrics} from '@/types/jurisdiction-staff';
import {startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, subWeeks, subMonths, subYears} from 'date-fns';

export class PerformanceMetricsService {
  /**
   * Calculate performance metrics for a staff member
   */
  async calculateMetrics(
    staff: JurisdictionStaff,
    period: 'daily' | 'weekly' | 'monthly' | 'yearly',
    endDate: Date = new Date()
  ): Promise<PerformanceMetrics> {
    const {startDate, endDate: periodEndDate} = this.getPeriodDates(period, endDate);

    // Fetch assignments and completions for the period
    // In production, this would query the database
    const assignments = await this.getAssignmentsForPeriod(staff.id, startDate, periodEndDate);
    const completions = await this.getCompletionsForPeriod(staff.id, startDate, periodEndDate);

    // Calculate review metrics
    const reviewAssignments = assignments.filter(a => a.reviewId);
    const reviewCompletions = completions.filter(c => c.reviewId);
    const reviewsOnTime = reviewCompletions.filter(c => {
      if (!c.dueDate) return true;
      return c.completedAt <= c.dueDate;
    });

    const avgReviewTime = this.calculateAverageTime(reviewCompletions);

    // Calculate inspection metrics
    const inspectionAssignments = assignments.filter(a => a.inspectionId);
    const inspectionCompletions = completions.filter(c => c.inspectionId);
    const inspectionsOnTime = inspectionCompletions.filter(c => {
      if (!c.dueDate) return true;
      return c.completedAt <= c.dueDate;
    });

    const avgInspectionTime = this.calculateAverageTime(inspectionCompletions);
    const passRate = this.calculatePassRate(inspectionCompletions);

    // Calculate workload metrics
    const avgWorkload = this.calculateAverageWorkload(staff, startDate, periodEndDate);
    const utilizationRate = staff.maxWorkload > 0
      ? avgWorkload / staff.maxWorkload
      : 0;

    // Calculate quality metrics
    const correctionsRequested = await this.getCorrectionsCount(staff.id, startDate, periodEndDate);
    const appealsReceived = await this.getAppealsCount(staff.id, startDate, periodEndDate);

    return {
      staffId: staff.id,
      period,
      startDate,
      endDate: periodEndDate,
      reviewsAssigned: reviewAssignments.length,
      reviewsCompleted: reviewCompletions.length,
      reviewsOnTime: reviewsOnTime.length,
      avgReviewTime,
      avgAccuracy: staff.avgAccuracy || 0,
      inspectionsAssigned: inspectionAssignments.length,
      inspectionsCompleted: inspectionCompletions.length,
      inspectionsOnTime: inspectionsOnTime.length,
      avgInspectionTime,
      passRate,
      avgWorkload,
      maxWorkload: staff.maxWorkload,
      utilizationRate,
      correctionsRequested,
      appealsReceived,
    };
  }

  /**
   * Get performance trends
   */
  async getPerformanceTrends(
    staff: JurisdictionStaff,
    metric: 'reviewsCompleted' | 'avgReviewTime' | 'avgAccuracy' | 'utilizationRate',
    periods: number = 12
  ): Promise<Array<{period: string; value: number}>> {
    const trends: Array<{period: string; value: number}> = [];
    const periodType = this.inferPeriodType(periods);

    for (let i = periods - 1; i >= 0; i--) {
      const endDate = this.getPeriodEndDate(periodType, i);
      const metrics = await this.calculateMetrics(staff, periodType, endDate);

      trends.push({
        period: this.formatPeriod(periodType, endDate),
        value: metrics[metric],
      });
    }

    return trends;
  }

  /**
   * Compare staff performance
   */
  async compareStaff(
    staffMembers: JurisdictionStaff[],
    period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly'
  ): Promise<Array<PerformanceMetrics & {staffName: string}>> {
    const endDate = new Date();
    const comparisons = await Promise.all(
      staffMembers.map(async staff => {
        const metrics = await this.calculateMetrics(staff, period, endDate);
        return {
          ...metrics,
          staffName: `${staff.firstName} ${staff.lastName}`,
        };
      })
    );

    // Sort by performance (customizable)
    return comparisons.sort((a, b) => {
      // Sort by reviews completed + inspections completed
      const aTotal = a.reviewsCompleted + a.inspectionsCompleted;
      const bTotal = b.reviewsCompleted + b.inspectionsCompleted;
      return bTotal - aTotal;
    });
  }

  /**
   * Get performance dashboard data
   */
  async getDashboardData(
    staff: JurisdictionStaff
  ): Promise<{
    currentPeriod: PerformanceMetrics;
    previousPeriod: PerformanceMetrics;
    trends: Array<{metric: string; change: number; trend: 'up' | 'down' | 'stable'}>;
    topMetrics: Array<{label: string; value: number; unit?: string}>;
  }> {
    const now = new Date();
    const currentPeriod = await this.calculateMetrics(staff, 'monthly', now);
    
    const previousMonth = subMonths(now, 1);
    const previousPeriod = await this.calculateMetrics(staff, 'monthly', previousMonth);

    // Calculate trends
    const trends = [
      {
        metric: 'Reviews Completed',
        change: currentPeriod.reviewsCompleted - previousPeriod.reviewsCompleted,
        trend: this.getTrend(currentPeriod.reviewsCompleted, previousPeriod.reviewsCompleted),
      },
      {
        metric: 'Avg Review Time',
        change: currentPeriod.avgReviewTime - previousPeriod.avgReviewTime,
        trend: this.getTrend(previousPeriod.avgReviewTime, currentPeriod.avgReviewTime), // Lower is better
      },
      {
        metric: 'Accuracy',
        change: (currentPeriod.avgAccuracy - previousPeriod.avgAccuracy) * 100,
        trend: this.getTrend(currentPeriod.avgAccuracy, previousPeriod.avgAccuracy),
      },
      {
        metric: 'Utilization',
        change: (currentPeriod.utilizationRate - previousPeriod.utilizationRate) * 100,
        trend: this.getTrend(currentPeriod.utilizationRate, previousPeriod.utilizationRate),
      },
    ];

    // Top metrics
    const topMetrics = [
      {label: 'Reviews Completed', value: currentPeriod.reviewsCompleted, unit: 'this month'},
      {label: 'Inspections Completed', value: currentPeriod.inspectionsCompleted, unit: 'this month'},
      {label: 'On-Time Rate', value: this.calculateOnTimeRate(currentPeriod), unit: '%'},
      {label: 'Avg Accuracy', value: Math.round(currentPeriod.avgAccuracy * 100), unit: '%'},
    ];

    return {
      currentPeriod,
      previousPeriod,
      trends,
      topMetrics,
    };
  }

  // Helper methods

  private getPeriodDates(
    period: 'daily' | 'weekly' | 'monthly' | 'yearly',
    endDate: Date
  ): {startDate: Date; endDate: Date} {
    switch (period) {
      case 'daily':
        return {
          startDate: startOfDay(endDate),
          endDate: endOfDay(endDate),
        };
      case 'weekly':
        return {
          startDate: startOfWeek(endDate, {weekStartsOn: 1}),
          endDate: endOfWeek(endDate, {weekStartsOn: 1}),
        };
      case 'monthly':
        return {
          startDate: startOfMonth(endDate),
          endDate: endOfMonth(endDate),
        };
      case 'yearly':
        return {
          startDate: startOfYear(endDate),
          endDate: endOfYear(endDate),
        };
    }
  }

  private getPeriodEndDate(
    period: 'daily' | 'weekly' | 'monthly' | 'yearly',
    periodsAgo: number
  ): Date {
    switch (period) {
      case 'daily':
        return subDays(new Date(), periodsAgo);
      case 'weekly':
        return subWeeks(new Date(), periodsAgo);
      case 'monthly':
        return subMonths(new Date(), periodsAgo);
      case 'yearly':
        return subYears(new Date(), periodsAgo);
    }
  }

  private inferPeriodType(periods: number): 'daily' | 'weekly' | 'monthly' | 'yearly' {
    if (periods <= 30) return 'daily';
    if (periods <= 52) return 'weekly';
    if (periods <= 24) return 'monthly';
    return 'yearly';
  }

  private formatPeriod(
    period: 'daily' | 'weekly' | 'monthly' | 'yearly',
    date: Date
  ): string {
    switch (period) {
      case 'daily':
        return format(date, 'MMM d, yyyy');
      case 'weekly':
        return `Week of ${format(date, 'MMM d, yyyy')}`;
      case 'monthly':
        return format(date, 'MMM yyyy');
      case 'yearly':
        return format(date, 'yyyy');
    }
  }

  private getTrend(current: number, previous: number): 'up' | 'down' | 'stable' {
    const threshold = 0.05; // 5% change threshold
    const change = Math.abs(current - previous) / (previous || 1);
    
    if (change < threshold) return 'stable';
    return current > previous ? 'up' : 'down';
  }

  private calculateOnTimeRate(metrics: PerformanceMetrics): number {
    const total = metrics.reviewsCompleted + metrics.inspectionsCompleted;
    const onTime = metrics.reviewsOnTime + metrics.inspectionsOnTime;
    return total > 0 ? Math.round((onTime / total) * 100) : 0;
  }

  // Placeholder methods - would query database in production
  private async getAssignmentsForPeriod(
    staffId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{reviewId?: string; inspectionId?: string; assignedAt: Date; dueDate?: Date}>> {
    // In production, query database
    return [];
  }

  private async getCompletionsForPeriod(
    staffId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{reviewId?: string; inspectionId?: string; completedAt: Date; dueDate?: Date}>> {
    // In production, query database
    return [];
  }

  private calculateAverageTime(
    completions: Array<{assignedAt?: Date; completedAt: Date}>
  ): number {
    if (completions.length === 0) return 0;

    const times = completions
      .filter(c => c.assignedAt)
      .map(c => {
        const diff = c.completedAt.getTime() - c.assignedAt!.getTime();
        return diff / (1000 * 60); // Convert to minutes
      });

    return times.length > 0
      ? Math.round(times.reduce((sum, t) => sum + t, 0) / times.length)
      : 0;
  }

  private calculatePassRate(completions: Array<{result?: string}>): number {
    if (completions.length === 0) return 0;

    const passed = completions.filter(
      c => c.result === 'PASS' || c.result === 'PASS_WITH_COMMENTS'
    ).length;

    return completions.length > 0 ? passed / completions.length : 0;
  }

  private calculateAverageWorkload(
    staff: JurisdictionStaff,
    startDate: Date,
    endDate: Date
  ): number {
    // In production, calculate from historical workload data
    return staff.currentWorkload;
  }

  private async getCorrectionsCount(
    staffId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    // In production, query database
    return 0;
  }

  private async getAppealsCount(
    staffId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    // In production, query database
    return 0;
  }
}

// Singleton instance
export const performanceMetricsService = new PerformanceMetricsService();
