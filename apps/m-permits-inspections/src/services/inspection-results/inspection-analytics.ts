/**
 * Inspection Analytics Service
 * Historical inspection database for analytics
 */

import {createClient} from '@/lib/supabase/client';

export interface InspectionAnalytics {
  period: {
    start: Date;
    end: Date;
  };
  totalInspections: number;
  byType: Record<string, number>;
  byResult: {
    PASS: number;
    PASS_WITH_COMMENTS: number;
    FAIL: number;
    PARTIAL_PASS: number;
  };
  byInspector: Array<{
    inspectorId: string;
    inspectorName: string;
    totalInspections: number;
    passRate: number;
    averageCompletionTime: number; // hours
  }>;
  averageCompletionTime: number; // hours
  passRate: number; // percentage
  reinspectionRate: number; // percentage
  correctionsBySeverity: {
    MINOR: number;
    MAJOR: number;
    CRITICAL: number;
  };
  trends: Array<{
    date: Date;
    inspections: number;
    passed: number;
    failed: number;
    corrections: number;
  }>;
}

export interface InspectorPerformance {
  inspectorId: string;
  inspectorName: string;
  period: {
    start: Date;
    end: Date;
  };
  totalInspections: number;
  completedInspections: number;
  passedInspections: number;
  failedInspections: number;
  partialPassInspections: number;
  passRate: number;
  averageCompletionTime: number;
  averageCorrectionsPerInspection: number;
  onTimeRate: number; // Percentage of inspections completed on scheduled date
}

export class InspectionAnalyticsService {
  /**
   * Get inspection analytics
   */
  async getInspectionAnalytics(
    jurisdictionId: string,
    startDate: Date,
    endDate: Date
  ): Promise<InspectionAnalytics> {
    const supabase = createClient();

    // Get all inspections in period
    const {data: inspections} = await supabase
      .from('Inspection')
      .select('*, inspector:User(name)')
      .eq('jurisdictionId', jurisdictionId)
      .gte('requestedAt', startDate.toISOString())
      .lte('requestedAt', endDate.toISOString());

    if (!inspections || inspections.length === 0) {
      return this.getEmptyAnalytics(startDate, endDate);
    }

    // Count by type
    const byType: Record<string, number> = {};
    inspections.forEach(i => {
      byType[i.type] = (byType[i.type] || 0) + 1;
    });

    // Count by result
    const byResult = {
      PASS: 0,
      PASS_WITH_COMMENTS: 0,
      FAIL: 0,
      PARTIAL_PASS: 0,
    };
    inspections.forEach(i => {
      if (i.result && i.result in byResult) {
        byResult[i.result as keyof typeof byResult]++;
      }
    });

    // Get inspector performance
    const inspectorMap = new Map<string, any>();
    inspections.forEach(i => {
      if (i.inspectorId) {
        if (!inspectorMap.has(i.inspectorId)) {
          inspectorMap.set(i.inspectorId, {
            inspectorId: i.inspectorId,
            inspectorName: (i.inspector as any)?.name || 'Unknown',
            inspections: [],
          });
        }
        inspectorMap.get(i.inspectorId).inspections.push(i);
      }
    });

    const byInspector = Array.from(inspectorMap.values()).map(data => {
      const completed = data.inspections.filter((i: any) => i.status === 'COMPLETED');
      const passed = completed.filter(
        (i: any) => i.result === 'PASS' || i.result === 'PASS_WITH_COMMENTS'
      );
      const passRate =
        completed.length > 0 ? (passed.length / completed.length) * 100 : 0;

      // Calculate average completion time
      let totalTime = 0;
      let count = 0;
      completed.forEach((i: any) => {
        if (i.requestedAt && i.completedAt) {
          const hours =
            (new Date(i.completedAt).getTime() - new Date(i.requestedAt).getTime()) /
            (1000 * 60 * 60);
          totalTime += hours;
          count++;
        }
      });
      const averageCompletionTime = count > 0 ? totalTime / count : 0;

      return {
        inspectorId: data.inspectorId,
        inspectorName: data.inspectorName,
        totalInspections: data.inspections.length,
        passRate: Math.round(passRate * 10) / 10,
        averageCompletionTime: Math.round(averageCompletionTime * 10) / 10,
      };
    });

    // Calculate overall pass rate
    const completed = inspections.filter(i => i.status === 'COMPLETED');
    const passed = completed.filter(
      i => i.result === 'PASS' || i.result === 'PASS_WITH_COMMENTS'
    );
    const passRate = completed.length > 0 ? (passed.length / completed.length) * 100 : 0;

    // Calculate reinspection rate
    const reinspections = inspections.filter(i => i.parentInspectionId);
    const reinspectionRate =
      inspections.length > 0 ? (reinspections.length / inspections.length) * 100 : 0;

    // Calculate average completion time
    let totalTime = 0;
    let timeCount = 0;
    completed.forEach(i => {
      if (i.requestedAt && i.completedAt) {
        const hours =
          (new Date(i.completedAt).getTime() - new Date(i.requestedAt).getTime()) /
          (1000 * 60 * 60);
        totalTime += hours;
        timeCount++;
      }
    });
    const averageCompletionTime = timeCount > 0 ? totalTime / timeCount : 0;

    // Get corrections
    const inspectionIds = inspections.map(i => i.id);
    const {data: corrections} = await supabase
      .from('InspectionCorrection')
      .select('severity')
      .in('inspectionId', inspectionIds);

    const correctionsBySeverity = {
      MINOR: corrections?.filter(c => c.severity === 'MINOR').length || 0,
      MAJOR: corrections?.filter(c => c.severity === 'MAJOR').length || 0,
      CRITICAL: corrections?.filter(c => c.severity === 'CRITICAL').length || 0,
    };

    // Generate trends (daily)
    const trends = this.generateTrends(inspections, startDate, endDate);

    return {
      period: {start: startDate, end: endDate},
      totalInspections: inspections.length,
      byType,
      byResult,
      byInspector,
      averageCompletionTime: Math.round(averageCompletionTime * 10) / 10,
      passRate: Math.round(passRate * 10) / 10,
      reinspectionRate: Math.round(reinspectionRate * 10) / 10,
      correctionsBySeverity,
      trends,
    };
  }

  /**
   * Get inspector performance
   */
  async getInspectorPerformance(
    inspectorId: string,
    startDate: Date,
    endDate: Date
  ): Promise<InspectorPerformance> {
    const supabase = createClient();

    const {data: inspections} = await supabase
      .from('Inspection')
      .select('*, inspector:User(name)')
      .eq('inspectorId', inspectorId)
      .gte('requestedAt', startDate.toISOString())
      .lte('requestedAt', endDate.toISOString());

    if (!inspections || inspections.length === 0) {
      throw new Error('No inspections found for inspector');
    }

    const inspectorName = (inspections[0].inspector as any)?.name || 'Unknown';

    const completed = inspections.filter(i => i.status === 'COMPLETED');
    const passed = completed.filter(
      i => i.result === 'PASS' || i.result === 'PASS_WITH_COMMENTS'
    );
    const failed = completed.filter(i => i.result === 'FAIL');
    const partialPass = completed.filter(i => i.result === 'PARTIAL_PASS');

    const passRate = completed.length > 0 ? (passed.length / completed.length) * 100 : 0;

    // Calculate average completion time
    let totalTime = 0;
    let timeCount = 0;
    completed.forEach(i => {
      if (i.requestedAt && i.completedAt) {
        const hours =
          (new Date(i.completedAt).getTime() - new Date(i.requestedAt).getTime()) /
          (1000 * 60 * 60);
        totalTime += hours;
        timeCount++;
      }
    });
    const averageCompletionTime = timeCount > 0 ? totalTime / timeCount : 0;

    // Calculate average corrections per inspection
    const inspectionIds = inspections.map(i => i.id);
    const {data: corrections} = await supabase
      .from('InspectionCorrection')
      .select('inspectionId')
      .in('inspectionId', inspectionIds);

    const averageCorrectionsPerInspection =
      inspections.length > 0 ? (corrections?.length || 0) / inspections.length : 0;

    // Calculate on-time rate (completed on scheduled date)
    const onTime = completed.filter(i => {
      if (!i.scheduledDate || !i.completedAt) {
        return false;
      }
      const scheduledDay = new Date(i.scheduledDate).toDateString();
      const completedDay = new Date(i.completedAt).toDateString();
      return scheduledDay === completedDay;
    });
    const onTimeRate =
      completed.length > 0 ? (onTime.length / completed.length) * 100 : 0;

    return {
      inspectorId,
      inspectorName,
      period: {start: startDate, end: endDate},
      totalInspections: inspections.length,
      completedInspections: completed.length,
      passedInspections: passed.length,
      failedInspections: failed.length,
      partialPassInspections: partialPass.length,
      passRate: Math.round(passRate * 10) / 10,
      averageCompletionTime: Math.round(averageCompletionTime * 10) / 10,
      averageCorrectionsPerInspection: Math.round(averageCorrectionsPerInspection * 10) / 10,
      onTimeRate: Math.round(onTimeRate * 10) / 10,
    };
  }

  /**
   * Generate trends
   */
  private generateTrends(
    inspections: any[],
    startDate: Date,
    endDate: Date
  ): Array<{
    date: Date;
    inspections: number;
    passed: number;
    failed: number;
    corrections: number;
  }> {
    const trends: Map<string, any> = new Map();

    // Initialize all dates in range
    const current = new Date(startDate);
    while (current <= endDate) {
      const dateKey = current.toISOString().split('T')[0];
      trends.set(dateKey, {
        date: new Date(current),
        inspections: 0,
        passed: 0,
        failed: 0,
        corrections: 0,
      });
      current.setDate(current.getDate() + 1);
    }

    // Count inspections by date
    inspections.forEach(inspection => {
      const dateKey = new Date(inspection.requestedAt).toISOString().split('T')[0];
      const trend = trends.get(dateKey);
      if (trend) {
        trend.inspections++;
        if (inspection.result === 'PASS' || inspection.result === 'PASS_WITH_COMMENTS') {
          trend.passed++;
        } else if (inspection.result === 'FAIL') {
          trend.failed++;
        }
      }
    });

    return Array.from(trends.values());
  }

  /**
   * Get empty analytics
   */
  private getEmptyAnalytics(startDate: Date, endDate: Date): InspectionAnalytics {
    return {
      period: {start: startDate, end: endDate},
      totalInspections: 0,
      byType: {},
      byResult: {
        PASS: 0,
        PASS_WITH_COMMENTS: 0,
        FAIL: 0,
        PARTIAL_PASS: 0,
      },
      byInspector: [],
      averageCompletionTime: 0,
      passRate: 0,
      reinspectionRate: 0,
      correctionsBySeverity: {
        MINOR: 0,
        MAJOR: 0,
        CRITICAL: 0,
      },
      trends: [],
    };
  }
}

// Singleton instance
export const inspectionAnalyticsService = new InspectionAnalyticsService();
