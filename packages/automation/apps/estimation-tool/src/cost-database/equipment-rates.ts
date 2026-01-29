/**
 * Equipment Rates Manager
 * Handles equipment cost management using the EquipmentRate Prisma model
 */

import { PrismaClient, EquipmentCategory } from '@prisma/client';
import { v4 as uuid } from 'uuid';
import Decimal from 'decimal.js';

const prisma = new PrismaClient();

export interface EquipmentRateData {
  id: string;
  costDatabaseId: string;
  category: EquipmentCategory;
  name: string;
  description?: string | null;
  dailyRate: Decimal;
  weeklyRate?: Decimal | null;
  monthlyRate?: Decimal | null;
  operatorRequired: boolean;
  operatorRate?: Decimal | null;
  fuelCostPerHour?: Decimal | null;
  mobilizationCost?: Decimal | null;
  demobilizationCost?: Decimal | null;
  minRentalDays: number;
  isActive: boolean;
  metadata?: Record<string, unknown> | null;
}

export interface EquipmentCalculation {
  equipment: EquipmentRateData;
  duration: number;
  durationUnit: string;
  baseCost: Decimal;
  operatorCost: Decimal;
  fuelCost: Decimal;
  mobilizationCost: Decimal;
  demobilizationCost: Decimal;
  totalCost: Decimal;
  effectiveDailyRate: Decimal;
}

export interface CreateEquipmentRateInput {
  costDatabaseId: string;
  category: EquipmentCategory;
  name: string;
  description?: string;
  dailyRate: number;
  weeklyRate?: number;
  monthlyRate?: number;
  operatorRequired?: boolean;
  operatorRate?: number;
  fuelCostPerHour?: number;
  mobilizationCost?: number;
  demobilizationCost?: number;
  minRentalDays?: number;
  metadata?: Record<string, unknown>;
}

export interface UpdateEquipmentRateInput {
  category?: EquipmentCategory;
  name?: string;
  description?: string;
  dailyRate?: number;
  weeklyRate?: number;
  monthlyRate?: number;
  operatorRequired?: boolean;
  operatorRate?: number;
  fuelCostPerHour?: number;
  mobilizationCost?: number;
  demobilizationCost?: number;
  minRentalDays?: number;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
}

export class EquipmentRateManager {
  // Days per rate type
  private ratePeriodDays: Record<string, number> = {
    DAILY: 1,
    WEEKLY: 7,
    MONTHLY: 30,
  };

  /**
   * Create equipment rate entry
   */
  async createEquipmentRate(input: CreateEquipmentRateInput): Promise<EquipmentRateData> {
    const rate = await prisma.equipmentRate.create({
      data: {
        id: uuid(),
        costDatabaseId: input.costDatabaseId,
        category: input.category,
        name: input.name,
        description: input.description,
        dailyRate: input.dailyRate,
        weeklyRate: input.weeklyRate,
        monthlyRate: input.monthlyRate,
        operatorRequired: input.operatorRequired ?? false,
        operatorRate: input.operatorRate,
        fuelCostPerHour: input.fuelCostPerHour,
        mobilizationCost: input.mobilizationCost,
        demobilizationCost: input.demobilizationCost,
        minRentalDays: input.minRentalDays ?? 1,
        isActive: true,
        metadata: input.metadata as any,
      },
    });

    return this.mapToEquipmentRateData(rate);
  }

  /**
   * Get equipment rate by ID
   */
  async getEquipmentRate(id: string): Promise<EquipmentRateData | null> {
    const rate = await prisma.equipmentRate.findUnique({
      where: { id },
    });

    if (!rate) return null;
    return this.mapToEquipmentRateData(rate);
  }

  /**
   * List equipment rates
   */
  async listEquipmentRates(
    costDatabaseId: string,
    options?: {
      category?: EquipmentCategory;
      operatorRequired?: boolean;
      isActive?: boolean;
      limit?: number;
    }
  ): Promise<EquipmentRateData[]> {
    const rates = await prisma.equipmentRate.findMany({
      where: {
        costDatabaseId,
        ...(options?.category && { category: options.category }),
        ...(options?.operatorRequired !== undefined && { operatorRequired: options.operatorRequired }),
        ...(options?.isActive !== undefined && { isActive: options.isActive }),
      },
      take: options?.limit || 100,
      orderBy: { name: 'asc' },
    });

    return rates.map((r) => this.mapToEquipmentRateData(r));
  }

  /**
   * Search equipment by name
   */
  async searchEquipment(
    costDatabaseId: string,
    searchTerm: string,
    options?: { category?: EquipmentCategory; limit?: number }
  ): Promise<EquipmentRateData[]> {
    const rates = await prisma.equipmentRate.findMany({
      where: {
        costDatabaseId,
        isActive: true,
        ...(options?.category && { category: options.category }),
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      take: options?.limit || 50,
      orderBy: { name: 'asc' },
    });

    return rates.map((r) => this.mapToEquipmentRateData(r));
  }

  /**
   * Update equipment rate
   */
  async updateEquipmentRate(
    id: string,
    input: UpdateEquipmentRateInput
  ): Promise<EquipmentRateData> {
    const existing = await this.getEquipmentRate(id);
    if (!existing) {
      throw new Error('Equipment rate not found');
    }

    const rate = await prisma.equipmentRate.update({
      where: { id },
      data: {
        ...(input.category && { category: input.category }),
        ...(input.name && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.dailyRate !== undefined && { dailyRate: input.dailyRate }),
        ...(input.weeklyRate !== undefined && { weeklyRate: input.weeklyRate }),
        ...(input.monthlyRate !== undefined && { monthlyRate: input.monthlyRate }),
        ...(input.operatorRequired !== undefined && { operatorRequired: input.operatorRequired }),
        ...(input.operatorRate !== undefined && { operatorRate: input.operatorRate }),
        ...(input.fuelCostPerHour !== undefined && { fuelCostPerHour: input.fuelCostPerHour }),
        ...(input.mobilizationCost !== undefined && { mobilizationCost: input.mobilizationCost }),
        ...(input.demobilizationCost !== undefined && { demobilizationCost: input.demobilizationCost }),
        ...(input.minRentalDays !== undefined && { minRentalDays: input.minRentalDays }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
        ...(input.metadata && { metadata: input.metadata as any }),
      },
    });

    return this.mapToEquipmentRateData(rate);
  }

  /**
   * Calculate equipment cost
   */
  calculateEquipmentCost(
    equipment: EquipmentRateData,
    days: number,
    options?: {
      includeMobilization?: boolean;
      includeDemobilization?: boolean;
      includeOperator?: boolean;
      hoursPerDay?: number;
      customFuelPrice?: number;
    }
  ): EquipmentCalculation {
    // Ensure minimum rental days
    const rentalDays = Math.max(days, equipment.minRentalDays);

    // Determine best rate to use (daily, weekly, or monthly)
    let baseCost: Decimal;
    if (rentalDays >= 30 && equipment.monthlyRate) {
      const months = Math.ceil(rentalDays / 30);
      baseCost = equipment.monthlyRate.times(months);
    } else if (rentalDays >= 7 && equipment.weeklyRate) {
      const weeks = Math.ceil(rentalDays / 7);
      baseCost = equipment.weeklyRate.times(weeks);
    } else {
      baseCost = equipment.dailyRate.times(rentalDays);
    }

    // Calculate operator cost
    let operatorCost = new Decimal(0);
    const hoursPerDay = options?.hoursPerDay || 8;
    if (options?.includeOperator && equipment.operatorRequired && equipment.operatorRate) {
      operatorCost = equipment.operatorRate.times(hoursPerDay).times(rentalDays);
    }

    // Calculate fuel cost
    let fuelCost = new Decimal(0);
    if (equipment.fuelCostPerHour) {
      fuelCost = equipment.fuelCostPerHour.times(hoursPerDay).times(rentalDays);
    }

    // Mobilization cost (one-time)
    let mobilizationCost = new Decimal(0);
    if (options?.includeMobilization && equipment.mobilizationCost) {
      mobilizationCost = equipment.mobilizationCost;
    }

    // Demobilization cost (one-time)
    let demobilizationCost = new Decimal(0);
    if (options?.includeDemobilization && equipment.demobilizationCost) {
      demobilizationCost = equipment.demobilizationCost;
    }

    // Calculate total
    const totalCost = baseCost
      .plus(operatorCost)
      .plus(fuelCost)
      .plus(mobilizationCost)
      .plus(demobilizationCost);

    const effectiveDailyRate = rentalDays > 0
      ? totalCost.dividedBy(rentalDays)
      : new Decimal(0);

    return {
      equipment,
      duration: rentalDays,
      durationUnit: 'DAYS',
      baseCost,
      operatorCost,
      fuelCost,
      mobilizationCost,
      demobilizationCost,
      totalCost,
      effectiveDailyRate,
    };
  }

  /**
   * Compare equipment options
   */
  async compareEquipment(
    costDatabaseId: string,
    category: EquipmentCategory,
    days: number
  ): Promise<EquipmentCalculation[]> {
    const equipment = await this.listEquipmentRates(costDatabaseId, { category, isActive: true });

    return equipment
      .map((eq) => this.calculateEquipmentCost(eq, days, {
        includeMobilization: true,
        includeDemobilization: true,
        includeOperator: true,
      }))
      .sort((a, b) => a.totalCost.minus(b.totalCost).toNumber());
  }

  /**
   * Get equipment categories
   */
  async getCategories(costDatabaseId: string): Promise<EquipmentCategory[]> {
    const rates = await prisma.equipmentRate.findMany({
      where: { costDatabaseId, isActive: true },
      select: { category: true },
      distinct: ['category'],
    });

    return rates.map((r) => r.category);
  }

  /**
   * Deactivate equipment rate
   */
  async deactivateEquipmentRate(id: string): Promise<void> {
    await prisma.equipmentRate.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Import equipment rates
   */
  async importEquipmentRates(
    costDatabaseId: string,
    rates: CreateEquipmentRateInput[]
  ): Promise<{ imported: number; errors: string[] }> {
    const errors: string[] = [];
    let imported = 0;

    for (const rate of rates) {
      try {
        await this.createEquipmentRate({ ...rate, costDatabaseId });
        imported++;
      } catch (error) {
        errors.push(`Failed to import ${rate.name}: ${error}`);
      }
    }

    return { imported, errors };
  }

  /**
   * Get equipment with operator required
   */
  async getEquipmentRequiringOperator(costDatabaseId: string): Promise<EquipmentRateData[]> {
    return this.listEquipmentRates(costDatabaseId, {
      operatorRequired: true,
      isActive: true,
    });
  }

  /**
   * Calculate fleet cost
   */
  calculateFleetCost(
    equipment: { rate: EquipmentRateData; quantity: number }[],
    days: number
  ): {
    totalCost: Decimal;
    byEquipment: { name: string; cost: Decimal; quantity: number }[];
    effectiveDailyRate: Decimal;
  } {
    const byEquipment = equipment.map((e) => {
      const calc = this.calculateEquipmentCost(e.rate, days, {
        includeMobilization: true,
        includeDemobilization: true,
        includeOperator: true,
      });
      return {
        name: e.rate.name,
        cost: calc.totalCost.times(e.quantity),
        quantity: e.quantity,
      };
    });

    const totalCost = byEquipment.reduce(
      (sum, e) => sum.plus(e.cost),
      new Decimal(0)
    );

    const effectiveDailyRate = days > 0
      ? totalCost.dividedBy(days)
      : new Decimal(0);

    return { totalCost, byEquipment, effectiveDailyRate };
  }

  /**
   * Map database record to EquipmentRateData
   */
  private mapToEquipmentRateData(record: any): EquipmentRateData {
    return {
      id: record.id,
      costDatabaseId: record.costDatabaseId,
      category: record.category,
      name: record.name,
      description: record.description,
      dailyRate: new Decimal(record.dailyRate.toString()),
      weeklyRate: record.weeklyRate ? new Decimal(record.weeklyRate.toString()) : null,
      monthlyRate: record.monthlyRate ? new Decimal(record.monthlyRate.toString()) : null,
      operatorRequired: record.operatorRequired,
      operatorRate: record.operatorRate ? new Decimal(record.operatorRate.toString()) : null,
      fuelCostPerHour: record.fuelCostPerHour ? new Decimal(record.fuelCostPerHour.toString()) : null,
      mobilizationCost: record.mobilizationCost ? new Decimal(record.mobilizationCost.toString()) : null,
      demobilizationCost: record.demobilizationCost ? new Decimal(record.demobilizationCost.toString()) : null,
      minRentalDays: record.minRentalDays,
      isActive: record.isActive,
      metadata: record.metadata,
    };
  }
}

export const equipmentRateManager = new EquipmentRateManager();
