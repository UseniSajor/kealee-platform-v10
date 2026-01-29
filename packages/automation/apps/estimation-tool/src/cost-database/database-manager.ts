/**
 * Cost Database Manager
 * CRUD operations for cost databases
 */

import { PrismaClient, CostDatabaseType } from '@prisma/client';
import { v4 as uuid } from 'uuid';
import Decimal from 'decimal.js';

const prisma = new PrismaClient();

export interface CostDatabase {
  id: string;
  organizationId: string | null;
  name: string;
  description?: string | null;
  type: CostDatabaseType;
  region: string;
  version: string;
  effectiveDate: Date;
  expirationDate?: Date | null;
  source?: string | null;
  isActive: boolean;
  isDefault: boolean;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDatabaseInput {
  organizationId?: string;
  name: string;
  description?: string;
  type?: CostDatabaseType;
  region: string;
  version?: string;
  effectiveDate?: Date;
  expirationDate?: Date;
  source?: string;
  isDefault?: boolean;
  metadata?: Record<string, unknown>;
}

export interface UpdateDatabaseInput {
  name?: string;
  description?: string;
  region?: string;
  version?: string;
  effectiveDate?: Date;
  expirationDate?: Date;
  isActive?: boolean;
  isDefault?: boolean;
  metadata?: Record<string, unknown>;
}

export class CostDatabaseManager {
  /**
   * Create a new cost database
   */
  async createDatabase(input: CreateDatabaseInput): Promise<CostDatabase> {
    const database = await prisma.costDatabase.create({
      data: {
        id: uuid(),
        organizationId: input.organizationId,
        name: input.name,
        description: input.description,
        type: input.type || CostDatabaseType.CUSTOM,
        region: input.region,
        version: input.version || '1.0',
        effectiveDate: input.effectiveDate || new Date(),
        expirationDate: input.expirationDate,
        source: input.source,
        isActive: true,
        isDefault: input.isDefault || false,
        metadata: input.metadata as any,
      },
    });

    return database as CostDatabase;
  }

  /**
   * Get database by ID
   */
  async getDatabase(id: string): Promise<CostDatabase | null> {
    const database = await prisma.costDatabase.findUnique({
      where: { id },
    });

    return database as CostDatabase | null;
  }

  /**
   * List databases for organization
   */
  async listDatabases(
    organizationId: string,
    options?: {
      type?: CostDatabaseType;
      isActive?: boolean;
      region?: string;
    }
  ): Promise<CostDatabase[]> {
    const databases = await prisma.costDatabase.findMany({
      where: {
        organizationId,
        ...(options?.type && { type: options.type }),
        ...(options?.isActive !== undefined && { isActive: options.isActive }),
        ...(options?.region && { region: options.region }),
      },
      orderBy: { updatedAt: 'desc' },
    });

    return databases as CostDatabase[];
  }

  /**
   * Update database
   */
  async updateDatabase(id: string, input: UpdateDatabaseInput): Promise<CostDatabase> {
    const database = await prisma.costDatabase.update({
      where: { id },
      data: {
        ...input,
        metadata: input.metadata as any,
        updatedAt: new Date(),
      },
    });

    return database as CostDatabase;
  }

  /**
   * Create new version of database
   */
  async createVersion(id: string): Promise<CostDatabase> {
    const existing = await this.getDatabase(id);
    if (!existing) {
      throw new Error('Database not found');
    }

    // Parse current version and increment
    const versionParts = existing.version.split('.');
    const major = parseInt(versionParts[0] || '1', 10);
    const minor = parseInt(versionParts[1] || '0', 10);
    const newVersion = `${major}.${minor + 1}`;

    // Deactivate current version
    await prisma.costDatabase.update({
      where: { id },
      data: { isActive: false },
    });

    // Create new version
    const newDatabase = await prisma.costDatabase.create({
      data: {
        id: uuid(),
        organizationId: existing.organizationId,
        name: existing.name,
        description: existing.description,
        type: existing.type,
        region: existing.region,
        version: newVersion,
        effectiveDate: new Date(),
        source: existing.source,
        isActive: true,
        isDefault: existing.isDefault,
        metadata: existing.metadata as any,
      },
    });

    // Copy all materials, labor rates, and equipment rates to new version
    await this.copyDatabaseContents(id, newDatabase.id);

    return newDatabase as CostDatabase;
  }

  /**
   * Copy database contents (materials, labor rates, equipment rates)
   */
  async copyDatabaseContents(sourceId: string, targetId: string): Promise<{
    materials: number;
    laborRates: number;
    equipmentRates: number;
  }> {
    // Copy materials
    const materials = await prisma.materialCost.findMany({
      where: { costDatabaseId: sourceId },
    });

    if (materials.length > 0) {
      await prisma.materialCost.createMany({
        data: materials.map((item) => ({
          id: uuid(),
          costDatabaseId: targetId,
          csiCode: item.csiCode,
          csiDivision: item.csiDivision,
          category: item.category,
          subcategory: item.subcategory,
          name: item.name,
          description: item.description,
          unit: item.unit,
          unitCost: item.unitCost,
          minCost: item.minCost,
          maxCost: item.maxCost,
          wasteFactor: item.wasteFactor,
          supplier: item.supplier,
          sku: item.sku,
          leadTimeDays: item.leadTimeDays,
          isActive: item.isActive,
          lastUpdated: item.lastUpdated,
          priceHistory: item.priceHistory ?? undefined,
          metadata: item.metadata ?? undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
      });
    }

    // Copy labor rates
    const laborRates = await prisma.laborRate.findMany({
      where: { costDatabaseId: sourceId },
    });

    if (laborRates.length > 0) {
      await prisma.laborRate.createMany({
        data: laborRates.map((item) => ({
          id: uuid(),
          costDatabaseId: targetId,
          trade: item.trade,
          classification: item.classification,
          description: item.description,
          baseRate: item.baseRate,
          burdenRate: item.burdenRate,
          totalRate: item.totalRate,
          overtimeMultiplier: item.overtimeMultiplier,
          prevailingWage: item.prevailingWage,
          unionRate: item.unionRate,
          productivityFactor: item.productivityFactor,
          region: item.region,
          effectiveDate: item.effectiveDate,
          expirationDate: item.expirationDate,
          isActive: item.isActive,
          metadata: item.metadata ?? undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
      });
    }

    // Copy equipment rates
    const equipmentRates = await prisma.equipmentRate.findMany({
      where: { costDatabaseId: sourceId },
    });

    if (equipmentRates.length > 0) {
      await prisma.equipmentRate.createMany({
        data: equipmentRates.map((item) => ({
          id: uuid(),
          costDatabaseId: targetId,
          category: item.category,
          name: item.name,
          description: item.description,
          dailyRate: item.dailyRate,
          weeklyRate: item.weeklyRate,
          monthlyRate: item.monthlyRate,
          operatorRequired: item.operatorRequired,
          operatorRate: item.operatorRate,
          fuelCostPerHour: item.fuelCostPerHour,
          mobilizationCost: item.mobilizationCost,
          demobilizationCost: item.demobilizationCost,
          minRentalDays: item.minRentalDays,
          isActive: item.isActive,
          metadata: item.metadata ?? undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
      });
    }

    return {
      materials: materials.length,
      laborRates: laborRates.length,
      equipmentRates: equipmentRates.length,
    };
  }

  /**
   * Delete database (soft delete by deactivating)
   */
  async deleteDatabase(id: string): Promise<void> {
    await prisma.costDatabase.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats(id: string): Promise<{
    totalMaterials: number;
    totalLaborRates: number;
    totalEquipmentRates: number;
    lastUpdated: Date;
  }> {
    const [materials, laborRates, equipmentRates] = await Promise.all([
      prisma.materialCost.count({ where: { costDatabaseId: id } }),
      prisma.laborRate.count({ where: { costDatabaseId: id } }),
      prisma.equipmentRate.count({ where: { costDatabaseId: id } }),
    ]);

    const database = await this.getDatabase(id);

    return {
      totalMaterials: materials,
      totalLaborRates: laborRates,
      totalEquipmentRates: equipmentRates,
      lastUpdated: database?.updatedAt || new Date(),
    };
  }

  /**
   * Get default database for organization
   */
  async getDefaultDatabase(organizationId: string): Promise<CostDatabase | null> {
    const database = await prisma.costDatabase.findFirst({
      where: {
        organizationId,
        isDefault: true,
        isActive: true,
      },
    });

    return database as CostDatabase | null;
  }

  /**
   * Set default database for organization
   */
  async setDefaultDatabase(id: string, organizationId: string): Promise<void> {
    // Remove default from all other databases
    await prisma.costDatabase.updateMany({
      where: { organizationId, isDefault: true },
      data: { isDefault: false },
    });

    // Set this one as default
    await prisma.costDatabase.update({
      where: { id },
      data: { isDefault: true },
    });
  }
}

export const costDatabaseManager = new CostDatabaseManager();
