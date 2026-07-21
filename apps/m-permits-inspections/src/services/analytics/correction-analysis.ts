/**
 * Common Correction Analysis Service
 * Analyze common corrections for contractor education
 */

import {createClient} from '@/lib/supabase/client';

export interface CommonCorrection {
  category: string;
  description: string;
  frequency: number;
  percentage: number; // percentage of all corrections
  averageResolutionTime: number; // days
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface CorrectionByPermitType {
  permitType: string;
  totalCorrections: number;
  commonCorrections: CommonCorrection[];
  averageCorrectionsPerPermit: number;
}

export interface CorrectionTrend {
  period: string; // "2024-01", "2024-02", etc.
  totalCorrections: number;
  averageResolutionTime: number;
}

export interface CorrectionAnalysis {
  overall: {
    totalCorrections: number;
    averageCorrectionsPerPermit: number;
    averageResolutionTime: number;
    mostCommonCategory: string;
  };
  commonCorrections: CommonCorrection[];
  byPermitType: CorrectionByPermitType[];
  byCategory: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  trends: CorrectionTrend[];
  topIssues: CommonCorrection[]; // Top 10 issues
}

export class CorrectionAnalysisService {
  /**
   * Get correction analysis
   */
  async getCorrectionAnalysis(
    jurisdictionId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<CorrectionAnalysis> {
    const supabase = createClient();

    // Get permit corrections
    let permitQuery = supabase
      .from('PermitCorrection')
      .select('id, permitId, category, description, priority, issuedAt, resolvedAt, resolved, permit:Permit(type)')
      .not('permitId', 'is', null);

    if (jurisdictionId) {
      permitQuery = permitQuery.eq('permit:Permit.jurisdictionId', jurisdictionId);
    }

    if (startDate) {
      permitQuery = permitQuery.gte('issuedAt', startDate.toISOString());
    }

    if (endDate) {
      permitQuery = permitQuery.lte('issuedAt', endDate.toISOString());
    }

    const {data: permitCorrections} = await permitQuery;

    // Get inspection corrections
    let inspectionQuery = supabase
      .from('InspectionCorrection')
      .select('id, inspectionId, description, category, priority, issuedAt, resolvedAt, resolved, inspection:Inspection(permit:Permit(type))')
      .not('inspectionId', 'is', null);

    if (jurisdictionId) {
      inspectionQuery = inspectionQuery.eq('inspection:Inspection.jurisdictionId', jurisdictionId);
    }

    if (startDate) {
      inspectionQuery = inspectionQuery.gte('issuedAt', startDate.toISOString());
    }

    if (endDate) {
      inspectionQuery = inspectionQuery.lte('issuedAt', endDate.toISOString());
    }

    const {data: inspectionCorrections} = await inspectionQuery;

    // Combine corrections
    const allCorrections = [
      ...(permitCorrections || []).map(c => ({
        ...c,
        source: 'permit' as const,
        permitType: (c.permit as any)?.type || 'UNKNOWN',
      })),
      ...(inspectionCorrections || []).map(c => ({
        ...c,
        source: 'inspection' as const,
        permitType: (c.inspection as any)?.permit?.type || 'UNKNOWN',
      })),
    ];

    if (allCorrections.length === 0) {
      return this.getEmptyAnalysis();
    }

    // Calculate overall metrics
    const overall = this.calculateOverallMetrics(allCorrections);

    // Common corrections
    const commonCorrections = this.calculateCommonCorrections(allCorrections);

    // By permit type
    const byPermitType = this.calculateByPermitType(allCorrections);

    // By category
    const byCategory = this.calculateByCategory(allCorrections);

    // Trends
    const trends = this.calculateTrends(allCorrections);

    // Top issues
    const topIssues = commonCorrections.slice(0, 10);

    return {
      overall,
      commonCorrections,
      byPermitType,
      byCategory,
      trends,
      topIssues,
    };
  }

  /**
   * Calculate overall metrics
   */
  private calculateOverallMetrics(corrections: any[]): CorrectionAnalysis['overall'] {
    const totalCorrections = corrections.length;

    // Get unique permits
    const permitIds = new Set(corrections.map(c => c.permitId || (c.inspectionId ? 'inspection-' + c.inspectionId : null)).filter(Boolean));
    const averageCorrectionsPerPermit = permitIds.size > 0 ? totalCorrections / permitIds.size : 0;

    // Calculate average resolution time
    const resolvedCorrections = corrections.filter(c => c.resolved && c.resolvedAt && c.issuedAt);
    const resolutionTimes = resolvedCorrections.map(c => {
      const issued = new Date(c.issuedAt);
      const resolved = new Date(c.resolvedAt);
      return Math.ceil((resolved.getTime() - issued.getTime()) / (1000 * 60 * 60 * 24));
    });

    const averageResolutionTime = resolutionTimes.length > 0
      ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
      : 0;

    // Most common category
    const categoryCounts: Record<string, number> = {};
    for (const correction of corrections) {
      const category = correction.category || 'UNKNOWN';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    }

    const mostCommonCategory = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    return {
      totalCorrections,
      averageCorrectionsPerPermit: Math.round(averageCorrectionsPerPermit * 10) / 10,
      averageResolutionTime: Math.round(averageResolutionTime * 10) / 10,
      mostCommonCategory,
    };
  }

  /**
   * Calculate common corrections
   */
  private calculateCommonCorrections(corrections: any[]): CommonCorrection[] {
    const byDescription: Record<string, any[]> = {};

    for (const correction of corrections) {
      const key = `${correction.category || 'UNKNOWN'}:${correction.description || 'UNKNOWN'}`;
      if (!byDescription[key]) {
        byDescription[key] = [];
      }
      byDescription[key].push(correction);
    }

    const totalCorrections = corrections.length;

    return Object.entries(byDescription)
      .map(([key, instances]) => {
        const [category, description] = key.split(':');
        const frequency = instances.length;
        const percentage = (frequency / totalCorrections) * 100;

        // Calculate average resolution time
        const resolved = instances.filter(i => i.resolved && i.resolvedAt && i.issuedAt);
        const resolutionTimes = resolved.map(i => {
          const issued = new Date(i.issuedAt);
          const resolved = new Date(i.resolvedAt);
          return Math.ceil((resolved.getTime() - issued.getTime()) / (1000 * 60 * 60 * 24));
        });

        const averageResolutionTime = resolutionTimes.length > 0
          ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
          : 0;

        // Determine severity from priority
        const priorities = instances.map(i => i.priority || 'MEDIUM');
        const mostCommonPriority = this.getMostCommon(priorities);
        const severity = mostCommonPriority as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

        return {
          category,
          description,
          frequency,
          percentage: Math.round(percentage * 10) / 10,
          averageResolutionTime: Math.round(averageResolutionTime * 10) / 10,
          severity,
        };
      })
      .sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Calculate by permit type
   */
  private calculateByPermitType(corrections: any[]): CorrectionByPermitType[] {
    const byType: Record<string, any[]> = {};

    for (const correction of corrections) {
      const type = correction.permitType || 'UNKNOWN';
      if (!byType[type]) {
        byType[type] = [];
      }
      byType[type].push(correction);
    }

    return Object.entries(byType).map(([permitType, typeCorrections]) => {
      const totalCorrections = typeCorrections.length;

      // Get unique permits for this type
      const permitIds = new Set(typeCorrections.map(c => c.permitId || (c.inspectionId ? 'inspection-' + c.inspectionId : null)).filter(Boolean));
      const averageCorrectionsPerPermit = permitIds.size > 0 ? totalCorrections / permitIds.size : 0;

      const commonCorrections = this.calculateCommonCorrections(typeCorrections).slice(0, 5);

      return {
        permitType,
        totalCorrections,
        commonCorrections,
        averageCorrectionsPerPermit: Math.round(averageCorrectionsPerPermit * 10) / 10,
      };
    });
  }

  /**
   * Calculate by category
   */
  private calculateByCategory(corrections: any[]): Array<{
    category: string;
    count: number;
    percentage: number;
  }> {
    const byCategory: Record<string, number> = {};

    for (const correction of corrections) {
      const category = correction.category || 'UNKNOWN';
      byCategory[category] = (byCategory[category] || 0) + 1;
    }

    const total = corrections.length;

    return Object.entries(byCategory)
      .map(([category, count]) => ({
        category,
        count,
        percentage: Math.round((count / total) * 100 * 10) / 10,
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Calculate trends
   */
  private calculateTrends(corrections: any[]): CorrectionTrend[] {
    const byPeriod: Record<string, any[]> = {};

    for (const correction of corrections) {
      if (!correction.issuedAt) continue;

      const date = new Date(correction.issuedAt);
      const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!byPeriod[period]) {
        byPeriod[period] = [];
      }
      byPeriod[period].push(correction);
    }

    return Object.entries(byPeriod)
      .map(([period, periodCorrections]) => {
        const totalCorrections = periodCorrections.length;

        const resolved = periodCorrections.filter(c => c.resolved && c.resolvedAt && c.issuedAt);
        const resolutionTimes = resolved.map(c => {
          const issued = new Date(c.issuedAt);
          const resolved = new Date(c.resolvedAt);
          return Math.ceil((resolved.getTime() - issued.getTime()) / (1000 * 60 * 60 * 24));
        });

        const averageResolutionTime = resolutionTimes.length > 0
          ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
          : 0;

        return {
          period,
          totalCorrections,
          averageResolutionTime: Math.round(averageResolutionTime * 10) / 10,
        };
      })
      .sort((a, b) => a.period.localeCompare(b.period));
  }

  /**
   * Get most common value
   */
  private getMostCommon<T>(arr: T[]): T {
    const counts: Record<string, number> = {};
    for (const item of arr) {
      const key = String(item);
      counts[key] = (counts[key] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] as T;
  }

  /**
   * Get empty analysis
   */
  private getEmptyAnalysis(): CorrectionAnalysis {
    return {
      overall: {
        totalCorrections: 0,
        averageCorrectionsPerPermit: 0,
        averageResolutionTime: 0,
        mostCommonCategory: 'N/A',
      },
      commonCorrections: [],
      byPermitType: [],
      byCategory: [],
      trends: [],
      topIssues: [],
    };
  }
}

// Singleton instance
export const correctionAnalysisService = new CorrectionAnalysisService();
