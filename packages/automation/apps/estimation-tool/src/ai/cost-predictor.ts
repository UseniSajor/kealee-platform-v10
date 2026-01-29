/**
 * Cost Predictor
 * AI-powered cost prediction and forecasting
 */

import { PrismaClient } from '@prisma/client';
import { v4 as uuid } from 'uuid';
import Decimal from 'decimal.js';

const prisma = new PrismaClient();

export interface CostPrediction {
  id: string;
  estimateId: string;
  predictedTotal: number;
  confidenceInterval: {
    low: number;
    high: number;
    confidence: number;
  };
  factors: PredictionFactor[];
  historicalComparison: HistoricalComparison;
  marketTrends: MarketTrend[];
  inflationAdjustment: InflationAdjustment;
  createdAt: Date;
}

export interface PredictionFactor {
  name: string;
  impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  magnitude: number;
  description: string;
}

export interface HistoricalComparison {
  averageCost: number;
  medianCost: number;
  minCost: number;
  maxCost: number;
  sampleSize: number;
  percentile: number;
}

export interface MarketTrend {
  category: string;
  trend: 'UP' | 'DOWN' | 'STABLE';
  changePercent: number;
  period: string;
  source: string;
}

export interface InflationAdjustment {
  currentCost: number;
  adjustedCost: number;
  inflationRate: number;
  adjustmentPeriodMonths: number;
}

export interface PredictionOptions {
  projectType?: string;
  region?: string;
  constructionStartDate?: Date;
  includeHistorical?: boolean;
  includeMarketTrends?: boolean;
  includeInflation?: boolean;
  confidenceLevel?: number;
}

export class CostPredictor {
  // Default market trends (would be updated from external sources in production)
  private marketTrends: MarketTrend[] = [
    { category: 'CONCRETE', trend: 'UP', changePercent: 5.2, period: '12mo', source: 'BLS' },
    { category: 'STEEL', trend: 'UP', changePercent: 8.5, period: '12mo', source: 'BLS' },
    { category: 'LUMBER', trend: 'DOWN', changePercent: -3.2, period: '12mo', source: 'BLS' },
    { category: 'LABOR', trend: 'UP', changePercent: 4.5, period: '12mo', source: 'BLS' },
    { category: 'EQUIPMENT', trend: 'UP', changePercent: 3.8, period: '12mo', source: 'BLS' },
    { category: 'ELECTRICAL', trend: 'UP', changePercent: 6.1, period: '12mo', source: 'BLS' },
    { category: 'PLUMBING', trend: 'UP', changePercent: 4.3, period: '12mo', source: 'BLS' },
    { category: 'HVAC', trend: 'UP', changePercent: 5.7, period: '12mo', source: 'BLS' },
  ];

  /**
   * Predict cost for estimate
   */
  async predictCost(
    estimateId: string,
    options?: PredictionOptions
  ): Promise<CostPrediction> {
    const estimate = await prisma.estimate.findUnique({
      where: { id: estimateId },
      include: {
        sections: {
          include: { lineItems: true },
        },
      },
    });

    if (!estimate) {
      throw new Error('Estimate not found');
    }

    // Use flat fields from Estimate model instead of nested 'totals'
    const currentTotal = Number(estimate.totalCost) || 0;

    // Calculate base prediction
    let predictedTotal = currentTotal;
    const factors: PredictionFactor[] = [];

    // Apply market trend adjustments
    let trendAdjustment = 0;
    if (options?.includeMarketTrends !== false) {
      trendAdjustment = await this.calculateMarketTrendAdjustment(estimate);
      predictedTotal += trendAdjustment;

      if (trendAdjustment !== 0) {
        factors.push({
          name: 'Market Trends',
          impact: trendAdjustment > 0 ? 'NEGATIVE' : 'POSITIVE',
          magnitude: Math.abs(trendAdjustment),
          description: `Market conditions ${trendAdjustment > 0 ? 'increasing' : 'decreasing'} costs`,
        });
      }
    }

    // Apply inflation adjustment
    let inflationAdjustment: InflationAdjustment = {
      currentCost: currentTotal,
      adjustedCost: currentTotal,
      inflationRate: 0,
      adjustmentPeriodMonths: 0,
    };

    if (options?.includeInflation !== false && options?.constructionStartDate) {
      inflationAdjustment = this.calculateInflationAdjustment(
        currentTotal,
        options.constructionStartDate
      );
      predictedTotal = inflationAdjustment.adjustedCost + trendAdjustment;

      if (inflationAdjustment.adjustedCost !== currentTotal) {
        factors.push({
          name: 'Inflation',
          impact: 'NEGATIVE',
          magnitude: inflationAdjustment.adjustedCost - currentTotal,
          description: `${inflationAdjustment.adjustmentPeriodMonths} months at ${inflationAdjustment.inflationRate}% annual rate`,
        });
      }
    }

    // Get historical comparison
    let historicalComparison: HistoricalComparison = {
      averageCost: 0,
      medianCost: 0,
      minCost: 0,
      maxCost: 0,
      sampleSize: 0,
      percentile: 50,
    };

    if (options?.includeHistorical !== false) {
      historicalComparison = await this.getHistoricalComparison(
        estimate.organizationId,
        estimate.type,
        options?.projectType
      );

      // Adjust prediction based on historical data
      if (historicalComparison.sampleSize >= 5) {
        const historicalFactor = this.calculateHistoricalFactor(
          currentTotal,
          historicalComparison
        );

        if (Math.abs(historicalFactor) > 0.05) {
          const adjustment = currentTotal * historicalFactor;
          predictedTotal += adjustment;
          factors.push({
            name: 'Historical Pattern',
            impact: historicalFactor > 0 ? 'NEGATIVE' : 'POSITIVE',
            magnitude: Math.abs(adjustment),
            description: `Based on ${historicalComparison.sampleSize} similar projects`,
          });
        }
      }
    }

    // Calculate confidence interval
    const confidenceLevel = options?.confidenceLevel || 0.9;
    const confidenceInterval = this.calculateConfidenceInterval(
      predictedTotal,
      factors,
      historicalComparison,
      confidenceLevel
    );

    // Get relevant market trends
    const relevantTrends = this.getRelevantMarketTrends(estimate);

    const prediction: CostPrediction = {
      id: uuid(),
      estimateId,
      predictedTotal,
      confidenceInterval,
      factors,
      historicalComparison,
      marketTrends: relevantTrends,
      inflationAdjustment,
      createdAt: new Date(),
    };

    // Save prediction
    await this.savePrediction(prediction);

    return prediction;
  }

  /**
   * Calculate market trend adjustment
   */
  private async calculateMarketTrendAdjustment(estimate: any): Promise<number> {
    let totalAdjustment = 0;
    // Use flat fields from Estimate model instead of nested 'totals'
    const materialCost = Number(estimate.subtotalMaterial) || 0;
    const laborCost = Number(estimate.subtotalLabor) || 0;
    const equipmentCost = Number(estimate.subtotalEquipment) || 0;

    // Apply material trends
    if (materialCost > 0) {
      // Weighted average of material trends
      const avgMaterialTrend = this.marketTrends
        .filter(t => ['CONCRETE', 'STEEL', 'LUMBER'].includes(t.category))
        .reduce((sum, t) => sum + t.changePercent, 0) / 3;

      totalAdjustment += materialCost * (avgMaterialTrend / 100);
    }

    // Apply labor trends
    if (laborCost > 0) {
      const laborTrend = this.marketTrends.find(t => t.category === 'LABOR');
      if (laborTrend) {
        totalAdjustment += laborCost * (laborTrend.changePercent / 100);
      }
    }

    // Apply equipment trends
    if (equipmentCost > 0) {
      const equipmentTrend = this.marketTrends.find(t => t.category === 'EQUIPMENT');
      if (equipmentTrend) {
        totalAdjustment += equipmentCost * (equipmentTrend.changePercent / 100);
      }
    }

    return totalAdjustment;
  }

  /**
   * Calculate inflation adjustment
   */
  private calculateInflationAdjustment(
    currentCost: number,
    startDate: Date
  ): InflationAdjustment {
    const now = new Date();
    const monthsUntilStart = Math.max(
      0,
      (startDate.getFullYear() - now.getFullYear()) * 12 +
        (startDate.getMonth() - now.getMonth())
    );

    // Default annual inflation rate (would be updated from economic data in production)
    const annualInflationRate = 3.5;
    const monthlyRate = annualInflationRate / 12 / 100;

    const adjustedCost = currentCost * Math.pow(1 + monthlyRate, monthsUntilStart);

    return {
      currentCost,
      adjustedCost,
      inflationRate: annualInflationRate,
      adjustmentPeriodMonths: monthsUntilStart,
    };
  }

  /**
   * Get historical comparison data
   */
  private async getHistoricalComparison(
    organizationId: string,
    estimateType: string,
    projectType?: string
  ): Promise<HistoricalComparison> {
    // Get historical estimates with correct EstimateStatus enum values
    const historicalEstimates = await prisma.estimate.findMany({
      where: {
        organizationId,
        type: estimateType as any,
        status: { in: ['APPROVED_ESTIMATE', 'ACCEPTED_ESTIMATE', 'ARCHIVED_ESTIMATE'] },
      },
      select: {
        totalCost: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    if (historicalEstimates.length === 0) {
      return {
        averageCost: 0,
        medianCost: 0,
        minCost: 0,
        maxCost: 0,
        sampleSize: 0,
        percentile: 50,
      };
    }

    // Use flat totalCost field instead of nested totals.grandTotal
    const totals = historicalEstimates
      .map(e => Number(e.totalCost) || 0)
      .filter(t => t > 0)
      .sort((a, b) => a - b);

    const sampleSize = totals.length;
    const averageCost = totals.reduce((sum, t) => sum + t, 0) / sampleSize;
    const medianCost = totals[Math.floor(sampleSize / 2)];
    const minCost = totals[0];
    const maxCost = totals[sampleSize - 1];

    return {
      averageCost,
      medianCost,
      minCost,
      maxCost,
      sampleSize,
      percentile: 50,
    };
  }

  /**
   * Calculate historical adjustment factor
   */
  private calculateHistoricalFactor(
    currentCost: number,
    historical: HistoricalComparison
  ): number {
    if (historical.sampleSize < 5 || historical.averageCost === 0) {
      return 0;
    }

    // Calculate standard deviation proxy using range
    const range = historical.maxCost - historical.minCost;
    const stdDevProxy = range / 4;

    // If current estimate is significantly different from historical average
    const zScore = (currentCost - historical.averageCost) / (stdDevProxy || 1);

    // Return adjustment factor (negative if below average, positive if above)
    if (Math.abs(zScore) > 1) {
      // Estimate seems unusual, suggest regression toward mean
      return zScore * -0.1; // 10% regression factor
    }

    return 0;
  }

  /**
   * Calculate confidence interval
   */
  private calculateConfidenceInterval(
    predictedTotal: number,
    factors: PredictionFactor[],
    historical: HistoricalComparison,
    confidenceLevel: number
  ): { low: number; high: number; confidence: number } {
    // Calculate uncertainty based on factors
    let uncertainty = 0.05; // Base 5% uncertainty

    // Increase uncertainty if fewer historical data points
    if (historical.sampleSize < 10) {
      uncertainty += 0.03;
    }
    if (historical.sampleSize < 5) {
      uncertainty += 0.05;
    }

    // Increase uncertainty based on market volatility
    const volatileTrends = factors.filter(f => f.magnitude > predictedTotal * 0.05);
    uncertainty += volatileTrends.length * 0.02;

    // Calculate z-score for confidence level
    const zScores: Record<number, number> = {
      0.9: 1.645,
      0.95: 1.96,
      0.99: 2.576,
    };
    const zScore = zScores[confidenceLevel] || 1.96;

    const margin = predictedTotal * uncertainty * zScore;

    return {
      low: Math.max(0, predictedTotal - margin),
      high: predictedTotal + margin,
      confidence: confidenceLevel * 100,
    };
  }

  /**
   * Get relevant market trends for estimate
   */
  private getRelevantMarketTrends(estimate: any): MarketTrend[] {
    const relevantCategories = new Set<string>();
    // Use flat fields from Estimate model instead of nested 'totals'
    const materialCost = Number(estimate.subtotalMaterial) || 0;
    const laborCost = Number(estimate.subtotalLabor) || 0;
    const equipmentCost = Number(estimate.subtotalEquipment) || 0;

    // Add material trends if material costs present
    if (materialCost > 0) {
      relevantCategories.add('CONCRETE');
      relevantCategories.add('STEEL');
      relevantCategories.add('LUMBER');
    }

    // Add labor trend
    if (laborCost > 0) {
      relevantCategories.add('LABOR');
    }

    // Add equipment trend
    if (equipmentCost > 0) {
      relevantCategories.add('EQUIPMENT');
    }

    // Check sections for MEP - use csiCode not code
    for (const section of estimate.sections) {
      if (section.csiCode?.startsWith('22')) relevantCategories.add('PLUMBING');
      if (section.csiCode?.startsWith('23')) relevantCategories.add('HVAC');
      if (section.csiCode?.startsWith('26')) relevantCategories.add('ELECTRICAL');
    }

    return this.marketTrends.filter(t => relevantCategories.has(t.category));
  }

  /**
   * Predict cost for line item
   */
  async predictLineItemCost(
    code: string,
    quantity: number,
    region?: string
  ): Promise<{
    predictedUnitCost: number;
    predictedTotal: number;
    confidenceInterval: { low: number; high: number };
    source: string;
  }> {
    // Get historical costs for this item code - use csiCode not code
    const historicalItems = await prisma.estimateLineItem.findMany({
      where: {
        csiCode: { startsWith: code.substring(0, 6) },
        totalCost: { gt: 0 },
        quantity: { gt: 0 },
      },
      select: {
        quantity: true,
        unitCost: true,
        totalCost: true,
      },
      take: 100,
      orderBy: { createdAt: 'desc' },
    });

    if (historicalItems.length === 0) {
      return {
        predictedUnitCost: 0,
        predictedTotal: 0,
        confidenceInterval: { low: 0, high: 0 },
        source: 'No historical data',
      };
    }

    // Calculate average unit cost
    const unitCosts = historicalItems
      .map(i => Number(i.unitCost) || (Number(i.totalCost) / Number(i.quantity)))
      .filter(c => c > 0 && isFinite(c));

    const avgUnitCost = unitCosts.reduce((sum, c) => sum + c, 0) / unitCosts.length;
    const predictedTotal = avgUnitCost * quantity;

    // Calculate standard deviation for confidence interval
    const variance = unitCosts.reduce(
      (sum, c) => sum + Math.pow(c - avgUnitCost, 2),
      0
    ) / unitCosts.length;
    const stdDev = Math.sqrt(variance);

    return {
      predictedUnitCost: avgUnitCost,
      predictedTotal,
      confidenceInterval: {
        low: Math.max(0, (avgUnitCost - 1.96 * stdDev) * quantity),
        high: (avgUnitCost + 1.96 * stdDev) * quantity,
      },
      source: `Based on ${historicalItems.length} historical records`,
    };
  }

  /**
   * Forecast future costs
   */
  async forecastCosts(
    estimateId: string,
    months: number = 12
  ): Promise<{
    currentCost: number;
    forecasts: { month: number; predictedCost: number; uncertainty: number }[];
    annualizedGrowthRate: number;
  }> {
    const estimate = await prisma.estimate.findUnique({
      where: { id: estimateId },
    });

    if (!estimate) {
      throw new Error('Estimate not found');
    }

    // Use flat totalCost field instead of nested totals.grandTotal
    const currentCost = Number(estimate.totalCost) || 0;

    // Calculate weighted average growth rate from market trends
    const avgGrowthRate = this.marketTrends.reduce(
      (sum, t) => sum + t.changePercent,
      0
    ) / this.marketTrends.length / 100;

    const forecasts: { month: number; predictedCost: number; uncertainty: number }[] = [];
    const monthlyGrowthRate = avgGrowthRate / 12;

    for (let month = 1; month <= months; month++) {
      const predictedCost = currentCost * Math.pow(1 + monthlyGrowthRate, month);
      // Uncertainty grows with time
      const uncertainty = 0.02 * Math.sqrt(month);

      forecasts.push({
        month,
        predictedCost,
        uncertainty,
      });
    }

    return {
      currentCost,
      forecasts,
      annualizedGrowthRate: avgGrowthRate * 100,
    };
  }

  /**
   * Save prediction
   * Store in estimate.metadata since costPrediction table may not exist
   */
  private async savePrediction(prediction: CostPrediction): Promise<void> {
    // Get current estimate to preserve existing metadata
    const estimate = await prisma.estimate.findUnique({
      where: { id: prediction.estimateId },
      select: { metadata: true },
    });

    const currentMetadata = (estimate?.metadata as Record<string, any>) || {};

    // Store cost prediction in metadata.costPrediction
    await prisma.estimate.update({
      where: { id: prediction.estimateId },
      data: {
        metadata: {
          ...currentMetadata,
          costPrediction: {
            id: prediction.id,
            predictedTotal: prediction.predictedTotal,
            confidenceInterval: prediction.confidenceInterval,
            factors: prediction.factors,
            historicalComparison: prediction.historicalComparison,
            marketTrends: prediction.marketTrends,
            inflationAdjustment: prediction.inflationAdjustment,
            createdAt: prediction.createdAt.toISOString(),
          },
        } as any,
      },
    });
  }
}

export const costPredictor = new CostPredictor();
