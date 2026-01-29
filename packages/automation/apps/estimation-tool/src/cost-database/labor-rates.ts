/**
 * Labor Rates Manager
 * Handles labor rate management and calculations using the LaborRate Prisma model
 */

import { PrismaClient, LaborTrade } from '@prisma/client';
import { v4 as uuid } from 'uuid';
import Decimal from 'decimal.js';

const prisma = new PrismaClient();

export interface LaborRateData {
  id: string;
  costDatabaseId: string;
  trade: LaborTrade;
  classification?: string | null;
  description?: string | null;
  baseRate: Decimal;
  burdenRate?: Decimal | null;
  totalRate: Decimal;
  overtimeMultiplier: Decimal;
  prevailingWage: boolean;
  unionRate: boolean;
  productivityFactor: Decimal;
  region?: string | null;
  effectiveDate: Date;
  expirationDate?: Date | null;
  isActive: boolean;
  metadata?: Record<string, unknown> | null;
}

export interface LaborBurden {
  fica: number; // 7.65%
  futa: number; // 0.6%
  suta: number; // varies by state
  workersComp: number; // varies by trade
  generalLiability: number;
  benefits: number;
  overhead: number;
  total: number;
}

export interface CreateLaborRateInput {
  costDatabaseId: string;
  trade: LaborTrade;
  classification?: string;
  description?: string;
  baseRate: number;
  burdenRate?: number;
  totalRate?: number;
  overtimeMultiplier?: number;
  prevailingWage?: boolean;
  unionRate?: boolean;
  productivityFactor?: number;
  region?: string;
  effectiveDate?: Date;
  expirationDate?: Date;
  metadata?: Record<string, unknown>;
}

export interface UpdateLaborRateInput {
  trade?: LaborTrade;
  classification?: string;
  description?: string;
  baseRate?: number;
  burdenRate?: number;
  totalRate?: number;
  overtimeMultiplier?: number;
  prevailingWage?: boolean;
  unionRate?: boolean;
  productivityFactor?: number;
  region?: string;
  effectiveDate?: Date;
  expirationDate?: Date;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
}

export interface LaborCalculation {
  hours: number;
  regularHours: number;
  overtimeHours: number;
  regularCost: Decimal;
  overtimeCost: Decimal;
  totalCost: Decimal;
  effectiveRate: Decimal;
}

export class LaborRateManager {
  // Default burden rates
  private defaultBurden: LaborBurden = {
    fica: 0.0765,
    futa: 0.006,
    suta: 0.03,
    workersComp: 0.05,
    generalLiability: 0.02,
    benefits: 0.15,
    overhead: 0.10,
    total: 0,
  };

  constructor() {
    this.defaultBurden.total = Object.values(this.defaultBurden)
      .filter((v) => typeof v === 'number')
      .reduce((sum, v) => sum + v, 0);
  }

  /**
   * Create a labor rate entry
   */
  async createLaborRate(input: CreateLaborRateInput): Promise<LaborRateData> {
    // Calculate total rate if not provided
    const burdenRate = input.burdenRate ?? this.calculateBurdenRate(input.baseRate);
    const totalRate = input.totalRate ?? input.baseRate + burdenRate;

    const rate = await prisma.laborRate.create({
      data: {
        id: uuid(),
        costDatabaseId: input.costDatabaseId,
        trade: input.trade,
        classification: input.classification,
        description: input.description,
        baseRate: input.baseRate,
        burdenRate: burdenRate,
        totalRate: totalRate,
        overtimeMultiplier: input.overtimeMultiplier ?? 1.5,
        prevailingWage: input.prevailingWage ?? false,
        unionRate: input.unionRate ?? false,
        productivityFactor: input.productivityFactor ?? 1.0,
        region: input.region,
        effectiveDate: input.effectiveDate || new Date(),
        expirationDate: input.expirationDate,
        isActive: true,
        metadata: input.metadata as any,
      },
    });

    return this.mapToLaborRateData(rate);
  }

  /**
   * Get labor rate by ID
   */
  async getLaborRate(id: string): Promise<LaborRateData | null> {
    const rate = await prisma.laborRate.findUnique({
      where: { id },
    });

    if (!rate) return null;
    return this.mapToLaborRateData(rate);
  }

  /**
   * Find labor rate by trade
   */
  async findLaborRate(
    costDatabaseId: string,
    trade: LaborTrade,
    options?: { classification?: string; region?: string }
  ): Promise<LaborRateData | null> {
    const rate = await prisma.laborRate.findFirst({
      where: {
        costDatabaseId,
        trade,
        isActive: true,
        ...(options?.classification && { classification: options.classification }),
        ...(options?.region && { region: options.region }),
      },
      orderBy: { effectiveDate: 'desc' },
    });

    if (!rate) return null;
    return this.mapToLaborRateData(rate);
  }

  /**
   * List labor rates for database
   */
  async listLaborRates(
    costDatabaseId: string,
    options?: {
      trade?: LaborTrade;
      region?: string;
      prevailingWage?: boolean;
      unionRate?: boolean;
      isActive?: boolean;
    }
  ): Promise<LaborRateData[]> {
    const rates = await prisma.laborRate.findMany({
      where: {
        costDatabaseId,
        ...(options?.trade && { trade: options.trade }),
        ...(options?.region && { region: options.region }),
        ...(options?.prevailingWage !== undefined && { prevailingWage: options.prevailingWage }),
        ...(options?.unionRate !== undefined && { unionRate: options.unionRate }),
        ...(options?.isActive !== undefined && { isActive: options.isActive }),
      },
      orderBy: [{ trade: 'asc' }, { classification: 'asc' }],
    });

    return rates.map((r) => this.mapToLaborRateData(r));
  }

  /**
   * Update labor rate
   */
  async updateLaborRate(id: string, input: UpdateLaborRateInput): Promise<LaborRateData> {
    const existing = await this.getLaborRate(id);
    if (!existing) {
      throw new Error('Labor rate not found');
    }

    // Recalculate total rate if base or burden rate changed
    let totalRate = input.totalRate;
    if (input.baseRate !== undefined || input.burdenRate !== undefined) {
      const baseRate = input.baseRate ?? existing.baseRate.toNumber();
      const burdenRate = input.burdenRate ?? existing.burdenRate?.toNumber() ?? 0;
      totalRate = totalRate ?? baseRate + burdenRate;
    }

    const rate = await prisma.laborRate.update({
      where: { id },
      data: {
        ...(input.trade && { trade: input.trade }),
        ...(input.classification !== undefined && { classification: input.classification }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.baseRate !== undefined && { baseRate: input.baseRate }),
        ...(input.burdenRate !== undefined && { burdenRate: input.burdenRate }),
        ...(totalRate !== undefined && { totalRate }),
        ...(input.overtimeMultiplier !== undefined && { overtimeMultiplier: input.overtimeMultiplier }),
        ...(input.prevailingWage !== undefined && { prevailingWage: input.prevailingWage }),
        ...(input.unionRate !== undefined && { unionRate: input.unionRate }),
        ...(input.productivityFactor !== undefined && { productivityFactor: input.productivityFactor }),
        ...(input.region !== undefined && { region: input.region }),
        ...(input.effectiveDate && { effectiveDate: input.effectiveDate }),
        ...(input.expirationDate !== undefined && { expirationDate: input.expirationDate }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
        ...(input.metadata && { metadata: input.metadata as any }),
      },
    });

    return this.mapToLaborRateData(rate);
  }

  /**
   * Calculate labor cost for hours
   */
  calculateLaborCost(
    rate: LaborRateData,
    hours: number,
    options?: {
      overtimeHours?: number;
      includeProductivity?: boolean;
    }
  ): LaborCalculation {
    const overtimeHours = options?.overtimeHours || 0;
    const regularHours = Math.max(0, hours - overtimeHours);

    // Apply productivity factor if requested
    const productivityFactor = options?.includeProductivity
      ? rate.productivityFactor
      : new Decimal(1);

    const adjustedRegularHours = productivityFactor.times(regularHours);
    const adjustedOvertimeHours = productivityFactor.times(overtimeHours);

    const regularCost = rate.totalRate.times(adjustedRegularHours);
    const overtimeCost = rate.totalRate
      .times(rate.overtimeMultiplier)
      .times(adjustedOvertimeHours);
    const totalCost = regularCost.plus(overtimeCost);
    const effectiveRate = hours > 0 ? totalCost.dividedBy(hours) : new Decimal(0);

    return {
      hours,
      regularHours,
      overtimeHours,
      regularCost,
      overtimeCost,
      totalCost,
      effectiveRate,
    };
  }

  /**
   * Calculate crew cost
   */
  calculateCrewCost(
    crew: { rate: LaborRateData; count: number }[],
    hours: number
  ): {
    totalCost: Decimal;
    byTrade: { trade: LaborTrade; cost: Decimal; workers: number }[];
    effectiveRate: Decimal;
  } {
    const byTrade = crew.map((c) => ({
      trade: c.rate.trade,
      cost: c.rate.totalRate.times(hours).times(c.count),
      workers: c.count,
    }));

    const totalCost = byTrade.reduce(
      (sum, t) => sum.plus(t.cost),
      new Decimal(0)
    );
    const totalWorkers = crew.reduce((sum, c) => sum + c.count, 0);
    const effectiveRate = hours > 0 && totalWorkers > 0
      ? totalCost.dividedBy(hours).dividedBy(totalWorkers)
      : new Decimal(0);

    return { totalCost, byTrade, effectiveRate };
  }

  /**
   * Get available trades
   */
  async getAvailableTrades(costDatabaseId: string): Promise<LaborTrade[]> {
    const rates = await prisma.laborRate.findMany({
      where: { costDatabaseId, isActive: true },
      select: { trade: true },
      distinct: ['trade'],
    });

    return rates.map((r) => r.trade);
  }

  /**
   * Get rates by region
   */
  async getRatesByRegion(costDatabaseId: string): Promise<Map<string, LaborRateData[]>> {
    const rates = await this.listLaborRates(costDatabaseId, { isActive: true });
    const regionMap = new Map<string, LaborRateData[]>();

    for (const rate of rates) {
      const region = rate.region || 'DEFAULT';
      if (!regionMap.has(region)) {
        regionMap.set(region, []);
      }
      regionMap.get(region)!.push(rate);
    }

    return regionMap;
  }

  /**
   * Calculate burden rate from base rate
   */
  private calculateBurdenRate(baseRate: number): number {
    return baseRate * this.defaultBurden.total;
  }

  /**
   * Deactivate labor rate
   */
  async deactivateLaborRate(id: string): Promise<void> {
    await prisma.laborRate.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Import labor rates
   */
  async importLaborRates(
    costDatabaseId: string,
    rates: CreateLaborRateInput[]
  ): Promise<{ imported: number; errors: string[] }> {
    const errors: string[] = [];
    let imported = 0;

    for (const rate of rates) {
      try {
        await this.createLaborRate({ ...rate, costDatabaseId });
        imported++;
      } catch (error) {
        errors.push(`Failed to import ${rate.trade}: ${error}`);
      }
    }

    return { imported, errors };
  }

  /**
   * Map database record to LaborRateData interface
   */
  private mapToLaborRateData(record: any): LaborRateData {
    return {
      id: record.id,
      costDatabaseId: record.costDatabaseId,
      trade: record.trade,
      classification: record.classification,
      description: record.description,
      baseRate: new Decimal(record.baseRate.toString()),
      burdenRate: record.burdenRate ? new Decimal(record.burdenRate.toString()) : null,
      totalRate: new Decimal(record.totalRate.toString()),
      overtimeMultiplier: new Decimal(record.overtimeMultiplier.toString()),
      prevailingWage: record.prevailingWage,
      unionRate: record.unionRate,
      productivityFactor: new Decimal(record.productivityFactor.toString()),
      region: record.region,
      effectiveDate: record.effectiveDate,
      expirationDate: record.expirationDate,
      isActive: record.isActive,
      metadata: record.metadata,
    };
  }
}

export const laborRateManager = new LaborRateManager();
