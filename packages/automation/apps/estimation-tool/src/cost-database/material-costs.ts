/**
 * Material Costs Manager
 * Handles material pricing operations using the MaterialCost Prisma model
 */

import { PrismaClient, MaterialCategory } from '@prisma/client';
import { randomUUID as uuid } from 'crypto';
import Decimal from 'decimal.js';

const prisma = new PrismaClient();

export interface MaterialCostData {
  id: string;
  costDatabaseId: string;
  csiCode?: string | null;
  csiDivision?: number | null;
  category: MaterialCategory;
  subcategory?: string | null;
  name: string;
  description?: string | null;
  unit: string;
  unitCost: Decimal;
  minCost?: Decimal | null;
  maxCost?: Decimal | null;
  wasteFactor: Decimal;
  supplier?: string | null;
  sku?: string | null;
  leadTimeDays?: number | null;
  isActive: boolean;
  lastUpdated: Date;
  priceHistory?: PriceHistoryEntry[] | null;
  metadata?: Record<string, unknown> | null;
}

export interface BulkPriceBreak {
  minQuantity: number;
  maxQuantity?: number;
  unitCost: Decimal;
  discountPercent: number;
}

export interface PriceHistoryEntry {
  date: Date;
  unitCost: Decimal;
  source: string;
  notes?: string;
}

export interface CreateMaterialInput {
  costDatabaseId: string;
  csiCode?: string;
  csiDivision?: number;
  category: MaterialCategory;
  subcategory?: string;
  name: string;
  description?: string;
  unit: string;
  unitCost: number;
  minCost?: number;
  maxCost?: number;
  wasteFactor?: number;
  supplier?: string;
  sku?: string;
  leadTimeDays?: number;
  metadata?: Record<string, unknown>;
}

export interface UpdateMaterialInput {
  csiCode?: string;
  csiDivision?: number;
  category?: MaterialCategory;
  subcategory?: string;
  name?: string;
  description?: string;
  unit?: string;
  unitCost?: number;
  minCost?: number;
  maxCost?: number;
  wasteFactor?: number;
  supplier?: string;
  sku?: string;
  leadTimeDays?: number;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
}

export class MaterialCostManager {
  /**
   * Create a material cost entry
   */
  async createMaterial(input: CreateMaterialInput): Promise<MaterialCostData> {
    const material = await prisma.materialCost.create({
      data: {
        id: uuid(),
        costDatabaseId: input.costDatabaseId,
        csiCode: input.csiCode,
        csiDivision: input.csiDivision,
        category: input.category,
        subcategory: input.subcategory,
        name: input.name,
        description: input.description,
        unit: input.unit,
        unitCost: input.unitCost,
        minCost: input.minCost,
        maxCost: input.maxCost,
        wasteFactor: input.wasteFactor || 1.05,
        supplier: input.supplier,
        sku: input.sku,
        leadTimeDays: input.leadTimeDays,
        isActive: true,
        lastUpdated: new Date(),
        priceHistory: [],
        metadata: input.metadata as any,
      },
    });

    return this.mapToMaterialCostData(material);
  }

  /**
   * Get material by ID
   */
  async getMaterial(id: string): Promise<MaterialCostData | null> {
    const material = await prisma.materialCost.findUnique({
      where: { id },
    });

    if (!material) return null;
    return this.mapToMaterialCostData(material);
  }

  /**
   * List materials in database
   */
  async listMaterials(
    costDatabaseId: string,
    options?: {
      category?: MaterialCategory;
      supplier?: string;
      isActive?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<MaterialCostData[]> {
    const materials = await prisma.materialCost.findMany({
      where: {
        costDatabaseId,
        ...(options?.category && { category: options.category }),
        ...(options?.supplier && { supplier: options.supplier }),
        ...(options?.isActive !== undefined && { isActive: options.isActive }),
      },
      take: options?.limit || 100,
      skip: options?.offset || 0,
      orderBy: { name: 'asc' },
    });

    return materials.map((m) => this.mapToMaterialCostData(m));
  }

  /**
   * Update material cost
   */
  async updateMaterial(id: string, input: UpdateMaterialInput): Promise<MaterialCostData> {
    const existing = await this.getMaterial(id);
    if (!existing) {
      throw new Error('Material not found');
    }

    const material = await prisma.materialCost.update({
      where: { id },
      data: {
        ...(input.csiCode !== undefined && { csiCode: input.csiCode }),
        ...(input.csiDivision !== undefined && { csiDivision: input.csiDivision }),
        ...(input.category && { category: input.category }),
        ...(input.subcategory !== undefined && { subcategory: input.subcategory }),
        ...(input.name && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.unit && { unit: input.unit }),
        ...(input.unitCost !== undefined && { unitCost: input.unitCost }),
        ...(input.minCost !== undefined && { minCost: input.minCost }),
        ...(input.maxCost !== undefined && { maxCost: input.maxCost }),
        ...(input.wasteFactor !== undefined && { wasteFactor: input.wasteFactor }),
        ...(input.supplier !== undefined && { supplier: input.supplier }),
        ...(input.sku !== undefined && { sku: input.sku }),
        ...(input.leadTimeDays !== undefined && { leadTimeDays: input.leadTimeDays }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
        ...(input.metadata && { metadata: input.metadata as any }),
        lastUpdated: new Date(),
      },
    });

    return this.mapToMaterialCostData(material);
  }

  /**
   * Update material price with history tracking
   */
  async updatePrice(
    id: string,
    newPrice: number,
    source: string,
    notes?: string
  ): Promise<MaterialCostData> {
    const existing = await this.getMaterial(id);
    if (!existing) {
      throw new Error('Material not found');
    }

    // Add to price history
    const priceHistory = existing.priceHistory || [];
    priceHistory.push({
      date: new Date(),
      unitCost: new Decimal(existing.unitCost),
      source,
      notes,
    });

    const material = await prisma.materialCost.update({
      where: { id },
      data: {
        unitCost: newPrice,
        priceHistory: priceHistory as any,
        lastUpdated: new Date(),
      },
    });

    return this.mapToMaterialCostData(material);
  }

  /**
   * Calculate cost with waste factor
   */
  calculateCostWithWaste(
    material: MaterialCostData,
    quantity: number
  ): { unitCost: Decimal; totalCost: Decimal; wasteAmount: Decimal } {
    const unitCost = new Decimal(material.unitCost);
    const wasteFactor = new Decimal(material.wasteFactor);
    const adjustedQuantity = new Decimal(quantity).times(wasteFactor);
    const totalCost = unitCost.times(adjustedQuantity);
    const wasteAmount = totalCost.minus(unitCost.times(quantity));

    return {
      unitCost,
      totalCost,
      wasteAmount,
    };
  }

  /**
   * Get materials by category with stats
   */
  async getCategoryStats(costDatabaseId: string): Promise<
    {
      category: MaterialCategory;
      count: number;
      averageCost: Decimal;
      minCost: Decimal;
      maxCost: Decimal;
    }[]
  > {
    const materials = await prisma.materialCost.findMany({
      where: { costDatabaseId, isActive: true },
    });

    const categoryMap = new Map<
      MaterialCategory,
      { costs: Decimal[]; count: number }
    >();

    for (const material of materials) {
      const category = material.category;
      const cost = new Decimal(material.unitCost.toString());

      if (!categoryMap.has(category)) {
        categoryMap.set(category, { costs: [], count: 0 });
      }

      const entry = categoryMap.get(category)!;
      entry.costs.push(cost);
      entry.count++;
    }

    return Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      count: data.count,
      averageCost: data.costs
        .reduce((sum, c) => sum.plus(c), new Decimal(0))
        .dividedBy(data.count),
      minCost: Decimal.min(...data.costs),
      maxCost: Decimal.max(...data.costs),
    }));
  }

  /**
   * Import materials from CSV data
   */
  async importMaterials(
    costDatabaseId: string,
    materials: CreateMaterialInput[]
  ): Promise<{ imported: number; errors: string[] }> {
    const errors: string[] = [];
    let imported = 0;

    for (const material of materials) {
      try {
        await this.createMaterial({ ...material, costDatabaseId });
        imported++;
      } catch (error) {
        errors.push(`Failed to import ${material.name}: ${error}`);
      }
    }

    return { imported, errors };
  }

  /**
   * Search materials by name or CSI code
   */
  async searchMaterials(
    costDatabaseId: string,
    searchTerm: string,
    options?: { category?: MaterialCategory; limit?: number }
  ): Promise<MaterialCostData[]> {
    const materials = await prisma.materialCost.findMany({
      where: {
        costDatabaseId,
        isActive: true,
        ...(options?.category && { category: options.category }),
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { csiCode: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
          { sku: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      take: options?.limit || 50,
      orderBy: { name: 'asc' },
    });

    return materials.map((m) => this.mapToMaterialCostData(m));
  }

  /**
   * Find alternative materials in same category
   */
  async findAlternatives(
    id: string,
    options?: { maxPriceDiff?: number; sameSubcategory?: boolean }
  ): Promise<MaterialCostData[]> {
    const material = await this.getMaterial(id);
    if (!material) {
      throw new Error('Material not found');
    }

    const alternatives = await prisma.materialCost.findMany({
      where: {
        costDatabaseId: material.costDatabaseId,
        id: { not: id },
        category: material.category,
        isActive: true,
        ...(options?.sameSubcategory && material.subcategory && { subcategory: material.subcategory }),
      },
    });

    // Filter by price difference if specified
    if (options?.maxPriceDiff) {
      const maxDiff = new Decimal(options.maxPriceDiff);
      const materialUnitCost = new Decimal(material.unitCost);
      return alternatives
        .filter((alt) => {
          const diff = new Decimal(alt.unitCost.toString())
            .minus(materialUnitCost)
            .abs();
          return diff.lte(maxDiff);
        })
        .map((m) => this.mapToMaterialCostData(m));
    }

    return alternatives.map((m) => this.mapToMaterialCostData(m));
  }

  /**
   * Deactivate material
   */
  async deactivateMaterial(id: string): Promise<void> {
    await prisma.materialCost.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Map database record to MaterialCostData interface
   */
  private mapToMaterialCostData(record: any): MaterialCostData {
    return {
      id: record.id,
      costDatabaseId: record.costDatabaseId,
      csiCode: record.csiCode,
      csiDivision: record.csiDivision,
      category: record.category,
      subcategory: record.subcategory,
      name: record.name,
      description: record.description,
      unit: record.unit,
      unitCost: new Decimal(record.unitCost.toString()),
      minCost: record.minCost ? new Decimal(record.minCost.toString()) : null,
      maxCost: record.maxCost ? new Decimal(record.maxCost.toString()) : null,
      wasteFactor: new Decimal(record.wasteFactor.toString()),
      supplier: record.supplier,
      sku: record.sku,
      leadTimeDays: record.leadTimeDays,
      isActive: record.isActive,
      lastUpdated: record.lastUpdated,
      priceHistory: record.priceHistory,
      metadata: record.metadata,
    };
  }
}

export const materialCostManager = new MaterialCostManager();
