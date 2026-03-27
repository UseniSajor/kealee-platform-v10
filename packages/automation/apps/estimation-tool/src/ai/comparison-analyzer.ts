/**
 * Comparison Analyzer
 * AI-powered estimate comparison and benchmarking
 */

import { PrismaClient } from '@prisma/client';
import { randomUUID as uuid } from 'crypto';
import Decimal from 'decimal.js';

const prisma = new PrismaClient();

export interface ComparisonResult {
  id: string;
  estimates: EstimateComparison[];
  analysis: ComparisonAnalysis;
  insights: ComparisonInsight[];
  recommendations: string[];
  createdAt: Date;
}

export interface EstimateComparison {
  id: string;
  name: string;
  total: number;
  breakdown: {
    material: number;
    labor: number;
    equipment: number;
    subcontractor: number;
    overhead: number;
    profit: number;
  };
  metrics: EstimateMetrics;
}

export interface EstimateMetrics {
  costPerSF?: number;
  laborIntensity: number;
  materialRatio: number;
  markupPercent: number;
  contingencyPercent: number;
}

export interface ComparisonAnalysis {
  totalRange: { min: number; max: number; spread: number; spreadPercent: number };
  averageTotal: number;
  medianTotal: number;
  categoryVariance: { category: string; variance: number; variancePercent: number }[];
  outliers: { estimateId: string; name: string; reason: string }[];
}

export interface ComparisonInsight {
  type: InsightType;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  description: string;
  affectedEstimates: string[];
  data?: Record<string, number>;
}

export type InsightType =
  | 'PRICE_VARIANCE'
  | 'SCOPE_DIFFERENCE'
  | 'MARKUP_VARIANCE'
  | 'LABOR_VARIANCE'
  | 'MATERIAL_VARIANCE'
  | 'MISSING_ITEMS'
  | 'QUALITY_DIFFERENCE'
  | 'RISK_ASSESSMENT';

export interface BenchmarkData {
  projectType: string;
  region: string;
  metrics: {
    costPerSF: { low: number; median: number; high: number };
    laborPercent: { low: number; median: number; high: number };
    materialPercent: { low: number; median: number; high: number };
    markupPercent: { low: number; median: number; high: number };
  };
  sampleSize: number;
  lastUpdated: Date;
}

export class ComparisonAnalyzer {
  /**
   * Compare multiple estimates
   */
  async compareEstimates(
    estimateIds: string[]
  ): Promise<ComparisonResult> {
    if (estimateIds.length < 2) {
      throw new Error('At least 2 estimates required for comparison');
    }

    const estimates = await Promise.all(
      estimateIds.map(id => this.getEstimateComparison(id))
    );

    const validEstimates = estimates.filter(e => e !== null) as EstimateComparison[];

    if (validEstimates.length < 2) {
      throw new Error('Could not load enough estimates for comparison');
    }

    const analysis = this.analyzeComparisons(validEstimates);
    const insights = this.generateInsights(validEstimates, analysis);
    const recommendations = this.generateRecommendations(validEstimates, analysis, insights);

    const result: ComparisonResult = {
      id: uuid(),
      estimates: validEstimates,
      analysis,
      insights,
      recommendations,
      createdAt: new Date(),
    };

    // Save comparison
    await this.saveComparison(result);

    return result;
  }

  /**
   * Get estimate comparison data
   */
  private async getEstimateComparison(
    estimateId: string
  ): Promise<EstimateComparison | null> {
    const estimate = await prisma.estimate.findUnique({
      where: { id: estimateId },
    });

    if (!estimate) return null;

    // Use flat fields from Estimate model instead of nested 'totals' and 'settings'
    const total = Number(estimate.totalCost) || 0;
    const directCost = Number(estimate.subtotalDirect) || 1;
    const materialCost = Number(estimate.subtotalMaterial) || 0;
    const laborCost = Number(estimate.subtotalLabor) || 0;
    const equipmentCost = Number(estimate.subtotalEquipment) || 0;
    const subcontractorCost = Number(estimate.subtotalSubcontractor) || 0;
    const overheadAmount = Number(estimate.overhead) || 0;
    const profitAmount = Number(estimate.profit) || 0;
    const overheadPercent = Number(estimate.overheadPercent) || 0;
    const profitPercent = Number(estimate.profitPercent) || 0;
    const contingencyPercent = Number(estimate.contingencyPercent) || 0;

    return {
      id: estimate.id,
      name: estimate.name,
      total,
      breakdown: {
        material: materialCost,
        labor: laborCost,
        equipment: equipmentCost,
        subcontractor: subcontractorCost,
        overhead: overheadAmount,
        profit: profitAmount,
      },
      metrics: {
        laborIntensity: laborCost ? laborCost / directCost : 0,
        materialRatio: materialCost ? materialCost / directCost : 0,
        markupPercent: overheadPercent + profitPercent,
        contingencyPercent: contingencyPercent,
      },
    };
  }

  /**
   * Analyze comparisons
   */
  private analyzeComparisons(estimates: EstimateComparison[]): ComparisonAnalysis {
    const totals = estimates.map(e => e.total).sort((a, b) => a - b);
    const min = totals[0];
    const max = totals[totals.length - 1];
    const spread = max - min;
    const spreadPercent = min > 0 ? (spread / min) * 100 : 0;

    const averageTotal = totals.reduce((sum, t) => sum + t, 0) / totals.length;
    const medianTotal = totals[Math.floor(totals.length / 2)];

    // Calculate category variance
    const categories = ['material', 'labor', 'equipment', 'subcontractor'] as const;
    const categoryVariance = categories.map(category => {
      const values = estimates.map(e => e.breakdown[category]);
      const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
      const variance = values.reduce(
        (sum, v) => sum + Math.pow(v - avg, 2),
        0
      ) / values.length;

      return {
        category,
        variance: Math.sqrt(variance),
        variancePercent: avg > 0 ? (Math.sqrt(variance) / avg) * 100 : 0,
      };
    });

    // Identify outliers
    const outliers: ComparisonAnalysis['outliers'] = [];
    const stdDev = Math.sqrt(
      totals.reduce((sum, t) => sum + Math.pow(t - averageTotal, 2), 0) / totals.length
    );

    for (const estimate of estimates) {
      const zScore = Math.abs(estimate.total - averageTotal) / (stdDev || 1);
      if (zScore > 2) {
        outliers.push({
          estimateId: estimate.id,
          name: estimate.name,
          reason: estimate.total > averageTotal
            ? `${((estimate.total - averageTotal) / averageTotal * 100).toFixed(1)}% above average`
            : `${((averageTotal - estimate.total) / averageTotal * 100).toFixed(1)}% below average`,
        });
      }
    }

    return {
      totalRange: { min, max, spread, spreadPercent },
      averageTotal,
      medianTotal,
      categoryVariance,
      outliers,
    };
  }

  /**
   * Generate insights
   */
  private generateInsights(
    estimates: EstimateComparison[],
    analysis: ComparisonAnalysis
  ): ComparisonInsight[] {
    const insights: ComparisonInsight[] = [];

    // Price variance insight
    if (analysis.totalRange.spreadPercent > 20) {
      insights.push({
        type: 'PRICE_VARIANCE',
        severity: analysis.totalRange.spreadPercent > 40 ? 'CRITICAL' : 'WARNING',
        title: 'Significant Price Variance',
        description: `Estimates vary by ${analysis.totalRange.spreadPercent.toFixed(1)}% (${formatCurrency(analysis.totalRange.spread)})`,
        affectedEstimates: estimates.map(e => e.id),
        data: {
          minTotal: analysis.totalRange.min,
          maxTotal: analysis.totalRange.max,
          spread: analysis.totalRange.spread,
        },
      });
    }

    // Labor variance insight
    const laborVariance = analysis.categoryVariance.find(v => v.category === 'labor');
    if (laborVariance && laborVariance.variancePercent > 25) {
      insights.push({
        type: 'LABOR_VARIANCE',
        severity: 'WARNING',
        title: 'Labor Cost Variance',
        description: `Labor costs vary significantly between estimates (${laborVariance.variancePercent.toFixed(1)}% variance)`,
        affectedEstimates: estimates.map(e => e.id),
      });
    }

    // Material variance insight
    const materialVariance = analysis.categoryVariance.find(v => v.category === 'material');
    if (materialVariance && materialVariance.variancePercent > 25) {
      insights.push({
        type: 'MATERIAL_VARIANCE',
        severity: 'WARNING',
        title: 'Material Cost Variance',
        description: `Material costs vary significantly between estimates (${materialVariance.variancePercent.toFixed(1)}% variance)`,
        affectedEstimates: estimates.map(e => e.id),
      });
    }

    // Markup variance
    const markups = estimates.map(e => e.metrics.markupPercent);
    const markupSpread = Math.max(...markups) - Math.min(...markups);
    if (markupSpread > 5) {
      insights.push({
        type: 'MARKUP_VARIANCE',
        severity: 'INFO',
        title: 'Markup Difference',
        description: `Markup percentages range from ${Math.min(...markups)}% to ${Math.max(...markups)}%`,
        affectedEstimates: estimates.map(e => e.id),
        data: {
          minMarkup: Math.min(...markups),
          maxMarkup: Math.max(...markups),
        },
      });
    }

    // Outlier insights
    for (const outlier of analysis.outliers) {
      insights.push({
        type: 'PRICE_VARIANCE',
        severity: 'WARNING',
        title: `Outlier Detected: ${outlier.name}`,
        description: outlier.reason,
        affectedEstimates: [outlier.estimateId],
      });
    }

    return insights;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    estimates: EstimateComparison[],
    analysis: ComparisonAnalysis,
    insights: ComparisonInsight[]
  ): string[] {
    const recommendations: string[] = [];

    // Significant price variance
    if (analysis.totalRange.spreadPercent > 20) {
      recommendations.push(
        'Review scope alignment between estimates to identify missing or extra items'
      );
      recommendations.push(
        'Verify all estimates are using the same specifications and quality levels'
      );
    }

    // Labor variance
    if (insights.some(i => i.type === 'LABOR_VARIANCE')) {
      recommendations.push(
        'Compare labor rates and productivity assumptions between estimates'
      );
      recommendations.push(
        'Review crew compositions and labor hours for major tasks'
      );
    }

    // Material variance
    if (insights.some(i => i.type === 'MATERIAL_VARIANCE')) {
      recommendations.push(
        'Compare material specifications and suppliers between estimates'
      );
      recommendations.push(
        'Verify quantity takeoffs are consistent'
      );
    }

    // Markup differences
    if (insights.some(i => i.type === 'MARKUP_VARIANCE')) {
      recommendations.push(
        'Align markup strategies based on project risk and market conditions'
      );
    }

    // Outliers
    if (analysis.outliers.length > 0) {
      recommendations.push(
        'Investigate outlier estimates for potential errors or scope differences'
      );
    }

    // General recommendations
    if (recommendations.length === 0) {
      recommendations.push(
        'Estimates are reasonably aligned - proceed with detailed scope review'
      );
    }

    return recommendations;
  }

  /**
   * Benchmark estimate against historical data
   */
  async benchmarkEstimate(
    estimateId: string,
    options?: {
      projectType?: string;
      region?: string;
      squareFootage?: number;
    }
  ): Promise<{
    estimate: EstimateComparison;
    benchmark: BenchmarkData;
    comparison: {
      metric: string;
      value: number;
      benchmarkMedian: number;
      percentile: number;
      status: 'LOW' | 'NORMAL' | 'HIGH';
    }[];
    overallAssessment: string;
  }> {
    const estimate = await this.getEstimateComparison(estimateId);
    if (!estimate) {
      throw new Error('Estimate not found');
    }

    // Get or create benchmark data
    const benchmark = await this.getBenchmarkData(
      options?.projectType || 'COMMERCIAL',
      options?.region || 'NATIONAL'
    );

    // Calculate cost per SF if square footage provided
    const costPerSF = options?.squareFootage
      ? estimate.total / options.squareFootage
      : undefined;

    const comparison: {
      metric: string;
      value: number;
      benchmarkMedian: number;
      percentile: number;
      status: 'LOW' | 'NORMAL' | 'HIGH';
    }[] = [];

    // Compare cost per SF
    if (costPerSF) {
      const percentile = this.calculatePercentile(
        costPerSF,
        benchmark.metrics.costPerSF
      );
      comparison.push({
        metric: 'Cost per SF',
        value: costPerSF,
        benchmarkMedian: benchmark.metrics.costPerSF.median,
        percentile,
        status: this.getStatus(percentile),
      });
    }

    // Compare labor percent
    const laborPercent = estimate.metrics.laborIntensity * 100;
    comparison.push({
      metric: 'Labor %',
      value: laborPercent,
      benchmarkMedian: benchmark.metrics.laborPercent.median,
      percentile: this.calculatePercentile(laborPercent, benchmark.metrics.laborPercent),
      status: this.getStatus(
        this.calculatePercentile(laborPercent, benchmark.metrics.laborPercent)
      ),
    });

    // Compare material percent
    const materialPercent = estimate.metrics.materialRatio * 100;
    comparison.push({
      metric: 'Material %',
      value: materialPercent,
      benchmarkMedian: benchmark.metrics.materialPercent.median,
      percentile: this.calculatePercentile(materialPercent, benchmark.metrics.materialPercent),
      status: this.getStatus(
        this.calculatePercentile(materialPercent, benchmark.metrics.materialPercent)
      ),
    });

    // Compare markup
    comparison.push({
      metric: 'Markup %',
      value: estimate.metrics.markupPercent,
      benchmarkMedian: benchmark.metrics.markupPercent.median,
      percentile: this.calculatePercentile(
        estimate.metrics.markupPercent,
        benchmark.metrics.markupPercent
      ),
      status: this.getStatus(
        this.calculatePercentile(estimate.metrics.markupPercent, benchmark.metrics.markupPercent)
      ),
    });

    // Generate overall assessment
    const overallAssessment = this.generateAssessment(comparison);

    return {
      estimate,
      benchmark,
      comparison,
      overallAssessment,
    };
  }

  /**
   * Get benchmark data
   */
  private async getBenchmarkData(
    projectType: string,
    region: string
  ): Promise<BenchmarkData> {
    // In production, this would pull from a database of industry benchmarks
    // For now, return default benchmark data
    return {
      projectType,
      region,
      metrics: {
        costPerSF: { low: 150, median: 225, high: 350 },
        laborPercent: { low: 25, median: 35, high: 45 },
        materialPercent: { low: 35, median: 45, high: 55 },
        markupPercent: { low: 5, median: 12, high: 20 },
      },
      sampleSize: 500,
      lastUpdated: new Date(),
    };
  }

  /**
   * Calculate percentile
   */
  private calculatePercentile(
    value: number,
    range: { low: number; median: number; high: number }
  ): number {
    if (value <= range.low) return 0;
    if (value >= range.high) return 100;
    if (value <= range.median) {
      return ((value - range.low) / (range.median - range.low)) * 50;
    }
    return 50 + ((value - range.median) / (range.high - range.median)) * 50;
  }

  /**
   * Get status based on percentile
   */
  private getStatus(percentile: number): 'LOW' | 'NORMAL' | 'HIGH' {
    if (percentile < 25) return 'LOW';
    if (percentile > 75) return 'HIGH';
    return 'NORMAL';
  }

  /**
   * Generate overall assessment
   */
  private generateAssessment(
    comparison: { metric: string; status: string }[]
  ): string {
    const lowCount = comparison.filter(c => c.status === 'LOW').length;
    const highCount = comparison.filter(c => c.status === 'HIGH').length;

    if (lowCount >= 2) {
      return 'Estimate appears below market - verify scope completeness and pricing accuracy';
    }
    if (highCount >= 2) {
      return 'Estimate appears above market - review for potential cost optimization';
    }
    return 'Estimate is within normal market range';
  }

  /**
   * Save comparison
   * Store in metadata of the first estimate since estimateComparison table may not exist
   */
  private async saveComparison(result: ComparisonResult): Promise<void> {
    if (result.estimates.length === 0) return;

    // Store comparison in the first estimate's metadata
    const firstEstimateId = result.estimates[0].id;

    // Get current estimate to preserve existing metadata
    const estimate = await prisma.estimate.findUnique({
      where: { id: firstEstimateId },
      select: { metadata: true },
    });

    const currentMetadata = (estimate?.metadata as Record<string, any>) || {};

    // Store comparison in metadata.estimateComparison
    await prisma.estimate.update({
      where: { id: firstEstimateId },
      data: {
        metadata: {
          ...currentMetadata,
          estimateComparison: {
            id: result.id,
            estimateIds: result.estimates.map(e => e.id),
            analysis: result.analysis,
            insights: result.insights,
            recommendations: result.recommendations,
            createdAt: result.createdAt.toISOString(),
          },
        } as any,
      },
    });
  }
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export const comparisonAnalyzer = new ComparisonAnalyzer();
