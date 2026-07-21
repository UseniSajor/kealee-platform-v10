/**
 * Capacity Planning Service
 * Capacity planning for inspector workload
 */

import {createClient} from '@/lib/supabase/client';
import {startOfWeek, endOfWeek, eachDayOfInterval, format} from 'date-fns';

export interface InspectorWorkload {
  inspectorId: string;
  inspectorName: string;
  period: {
    start: Date;
    end: Date;
  };
  scheduledInspections: number;
  completedInspections: number;
  averagePerDay: number;
  capacity: number; // Max inspections per day
  utilization: number; // Percentage (0-100)
  overloaded: boolean;
}

export interface WorkloadAnalysis {
  period: {
    start: Date;
    end: Date;
  };
  inspectors: InspectorWorkload[];
  overallUtilization: number;
  bottlenecks: Array<{
    inspectorId: string;
    inspectorName: string;
    overloadedDays: Date[];
  }>;
  recommendations: string[];
}

export class CapacityPlannerService {
  /**
   * Analyze inspector workload
   */
  async analyzeWorkload(
    jurisdictionId: string,
    startDate: Date,
    endDate: Date
  ): Promise<WorkloadAnalysis> {
    const supabase = createClient();

    // Get all inspectors
    const {data: inspectors} = await supabase
      .from('JurisdictionStaff')
      .select('*, user:User(name)')
      .eq('jurisdictionId', jurisdictionId)
      .eq('role', 'INSPECTOR')
      .eq('active', true);

    if (!inspectors || inspectors.length === 0) {
      return {
        period: {start: startDate, end: endDate},
        inspectors: [],
        overallUtilization: 0,
        bottlenecks: [],
        recommendations: [],
      };
    }

    const inspectorWorkloads: InspectorWorkload[] = [];
    let totalCapacity = 0;
    let totalScheduled = 0;

    for (const inspector of inspectors) {
      // Get scheduled inspections
      const {data: scheduled} = await supabase
        .from('Inspection')
        .select('id, scheduledDate')
        .eq('inspectorId', inspector.id)
        .eq('status', 'SCHEDULED')
        .gte('scheduledDate', startDate.toISOString())
        .lte('scheduledDate', endDate.toISOString());

      // Get completed inspections
      const {data: completed} = await supabase
        .from('Inspection')
        .select('id')
        .eq('inspectorId', inspector.id)
        .eq('status', 'COMPLETED')
        .gte('completedAt', startDate.toISOString())
        .lte('completedAt', endDate.toISOString());

      const daysInPeriod =
        Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      // Get capacity (default 6 per day, or from inspector settings)
      const capacity = inspector.dailyCapacity || 6;
      const totalCapacityForPeriod = capacity * daysInPeriod;

      const scheduledCount = scheduled?.length || 0;
      const completedCount = completed?.length || 0;
      const averagePerDay = scheduledCount / daysInPeriod;
      const utilization = (scheduledCount / totalCapacityForPeriod) * 100;
      const overloaded = utilization > 90;

      inspectorWorkloads.push({
        inspectorId: inspector.id,
        inspectorName: (inspector.user as any)?.name || 'Unknown',
        period: {start: startDate, end: endDate},
        scheduledInspections: scheduledCount,
        completedInspections: completedCount,
        averagePerDay,
        capacity,
        utilization,
        overloaded,
      });

      totalCapacity += totalCapacityForPeriod;
      totalScheduled += scheduledCount;
    }

    // Calculate overall utilization
    const overallUtilization = totalCapacity > 0 ? (totalScheduled / totalCapacity) * 100 : 0;

    // Find bottlenecks (overloaded inspectors)
    const bottlenecks = inspectorWorkloads
      .filter(iw => iw.overloaded)
      .map(iw => ({
        inspectorId: iw.inspectorId,
        inspectorName: iw.inspectorName,
        overloadedDays: this.findOverloadedDays(iw.inspectorId, startDate, endDate),
      }));

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      inspectorWorkloads,
      overallUtilization,
      bottlenecks
    );

    return {
      period: {start: startDate, end: endDate},
      inspectors: inspectorWorkloads,
      overallUtilization,
      bottlenecks,
      recommendations,
    };
  }

  /**
   * Find overloaded days for inspector
   */
  private async findOverloadedDays(
    inspectorId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Date[]> {
    const supabase = createClient();

    // Get scheduled inspections grouped by date
    const {data: inspections} = await supabase
      .from('Inspection')
      .select('scheduledDate')
      .eq('inspectorId', inspectorId)
      .eq('status', 'SCHEDULED')
      .gte('scheduledDate', startDate.toISOString())
      .lte('scheduledDate', endDate.toISOString());

    if (!inspections) {
      return [];
    }

    // Count inspections per day
    const inspectionsByDate: Record<string, number> = {};

    inspections.forEach(inspection => {
      if (inspection.scheduledDate) {
        const dateKey = format(new Date(inspection.scheduledDate), 'yyyy-MM-dd');
        inspectionsByDate[dateKey] = (inspectionsByDate[dateKey] || 0) + 1;
      }
    });

    // Find days with more than 6 inspections (or custom capacity)
    const overloadedDays: Date[] = [];

    for (const [dateKey, count] of Object.entries(inspectionsByDate)) {
      if (count > 6) {
        // Default capacity
        overloadedDays.push(new Date(dateKey));
      }
    }

    return overloadedDays;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    workloads: InspectorWorkload[],
    overallUtilization: number,
    bottlenecks: Array<{inspectorId: string; inspectorName: string; overloadedDays: Date[]}>
  ): string[] {
    const recommendations: string[] = [];

    if (overallUtilization > 90) {
      recommendations.push(
        'Overall capacity utilization is high (>90%). Consider hiring additional inspectors or adjusting schedules.'
      );
    }

    if (bottlenecks.length > 0) {
      recommendations.push(
        `${bottlenecks.length} inspector(s) are overloaded. Redistribute workload or extend deadlines.`
      );

      bottlenecks.forEach(bottleneck => {
        if (bottleneck.overloadedDays.length > 0) {
          recommendations.push(
            `${bottleneck.inspectorName}: ${bottleneck.overloadedDays.length} overloaded day(s). Consider reassigning inspections.`
          );
        }
      });
    }

    // Find underutilized inspectors
    const underutilized = workloads.filter(iw => iw.utilization < 50);

    if (underutilized.length > 0 && bottlenecks.length > 0) {
      recommendations.push(
        `${underutilized.length} inspector(s) are underutilized (<50%). Consider redistributing work from overloaded inspectors.`
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('Workload is well-balanced. No immediate action needed.');
    }

    return recommendations;
  }

  /**
   * Get capacity forecast
   */
  async getCapacityForecast(
    jurisdictionId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    date: Date;
    availableCapacity: number;
    scheduledCount: number;
    utilization: number;
  }[]> {
    const supabase = createClient();

    // Get all inspectors
    const {data: inspectors} = await supabase
      .from('JurisdictionStaff')
      .select('id, dailyCapacity')
      .eq('jurisdictionId', jurisdictionId)
      .eq('role', 'INSPECTOR')
      .eq('active', true);

    if (!inspectors || inspectors.length === 0) {
      return [];
    }

    const totalCapacity = inspectors.reduce(
      (sum, inspector) => sum + (inspector.dailyCapacity || 6),
      0
    );

    // Get days in period
    const days = eachDayOfInterval({start: startDate, end: endDate});
    const forecast: Array<{
      date: Date;
      availableCapacity: number;
      scheduledCount: number;
      utilization: number;
    }> = [];

    for (const day of days) {
      // Get scheduled inspections for this day
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);

      const inspectorIds = inspectors.map(i => i.id);

      const {data: scheduled} = await supabase
        .from('Inspection')
        .select('id')
        .in('inspectorId', inspectorIds)
        .eq('status', 'SCHEDULED')
        .gte('scheduledDate', dayStart.toISOString())
        .lte('scheduledDate', dayEnd.toISOString());

      const scheduledCount = scheduled?.length || 0;
      const utilization = totalCapacity > 0 ? (scheduledCount / totalCapacity) * 100 : 0;

      forecast.push({
        date: day,
        availableCapacity: totalCapacity - scheduledCount,
        scheduledCount,
        utilization,
      });
    }

    return forecast;
  }
}

// Singleton instance
export const capacityPlannerService = new CapacityPlannerService();
