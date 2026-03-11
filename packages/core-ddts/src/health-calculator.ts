/**
 * DDTS Health Calculator — computes twin health from KPI values
 */

import type { TwinHealthStatus } from './types';

export interface KPIValue {
  kpiKey: string;
  currentValue: number;
  warningMin?: number | null;
  warningMax?: number | null;
  criticalMin?: number | null;
  criticalMax?: number | null;
  category: string;
}

export interface HealthResult {
  healthStatus: TwinHealthStatus;
  healthScore: number; // 0-100
  breachedKPIs: string[];
  warningKPIs: string[];
}

/**
 * Category weights for overall health score
 */
const CATEGORY_WEIGHTS: Record<string, number> = {
  cost: 0.30,
  schedule: 0.25,
  quality: 0.20,
  risk: 0.15,
  safety: 0.10,
};

export class HealthCalculator {
  /**
   * Calculate overall twin health from KPI values
   */
  static calculate(kpis: KPIValue[]): HealthResult {
    if (kpis.length === 0) {
      return { healthStatus: 'UNKNOWN', healthScore: 0, breachedKPIs: [], warningKPIs: [] };
    }

    const breachedKPIs: string[] = [];
    const warningKPIs: string[] = [];
    const categoryScores: Record<string, number[]> = {};

    for (const kpi of kpis) {
      const status = this.evaluateKPI(kpi);
      let score: number;

      switch (status) {
        case 'CRITICAL':
          breachedKPIs.push(kpi.kpiKey);
          score = 20;
          break;
        case 'AT_RISK':
          warningKPIs.push(kpi.kpiKey);
          score = 60;
          break;
        case 'HEALTHY':
        default:
          score = 100;
          break;
      }

      const category = kpi.category || 'quality';
      if (!categoryScores[category]) categoryScores[category] = [];
      categoryScores[category].push(score);
    }

    // Calculate weighted score
    let totalWeight = 0;
    let weightedSum = 0;

    for (const [category, scores] of Object.entries(categoryScores)) {
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      const weight = CATEGORY_WEIGHTS[category] ?? 0.1;
      weightedSum += avgScore * weight;
      totalWeight += weight;
    }

    const healthScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;

    // Determine health status
    let healthStatus: TwinHealthStatus;
    if (breachedKPIs.length > 0) {
      healthStatus = 'CRITICAL';
    } else if (warningKPIs.length > 0) {
      healthStatus = 'AT_RISK';
    } else {
      healthStatus = 'HEALTHY';
    }

    return { healthStatus, healthScore, breachedKPIs, warningKPIs };
  }

  /**
   * Evaluate a single KPI against its thresholds
   */
  static evaluateKPI(kpi: KPIValue): 'HEALTHY' | 'AT_RISK' | 'CRITICAL' {
    const { currentValue, warningMin, warningMax, criticalMin, criticalMax } = kpi;

    // Check critical thresholds first
    if (criticalMin != null && currentValue < criticalMin) return 'CRITICAL';
    if (criticalMax != null && currentValue > criticalMax) return 'CRITICAL';

    // Check warning thresholds
    if (warningMin != null && currentValue < warningMin) return 'AT_RISK';
    if (warningMax != null && currentValue > warningMax) return 'AT_RISK';

    return 'HEALTHY';
  }
}
