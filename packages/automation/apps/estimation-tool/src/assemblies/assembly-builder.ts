/**
 * Assembly Builder
 * Create and edit cost assemblies
 */

import { PrismaClient, AssemblyComplexity, AssemblyItemType, AssemblyCategory } from '@prisma/client';
import { randomUUID as uuid } from 'crypto';
import Decimal from 'decimal.js';

const prisma = new PrismaClient();

export interface Assembly {
  id: string;
  costDatabaseId: string;
  csiCode: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  unit: string;
  items: AssemblyComponent[];
  laborHours: Decimal;
  materialCost: Decimal;
  laborCost: Decimal;
  equipmentCost: Decimal;
  unitCost: Decimal;
  productionRate?: number; // units per day
  crewSize?: number;
  complexity?: AssemblyComplexity;
  notes?: string;
  tags: string[];
  isTemplate: boolean;
  isActive: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssemblyComponent {
  id: string;
  type: 'MATERIAL' | 'LABOR' | 'EQUIPMENT' | 'SUBASSEMBLY';
  itemType: AssemblyItemType;
  costItemId?: string;
  assemblyId?: string; // For nested assemblies
  name: string;
  description?: string;
  quantity: Decimal;
  unit: string;
  unitCost: Decimal;
  totalCost: Decimal;
  wastePercent?: number;
  sortOrder: number;
  metadata?: Record<string, unknown>;
}

export interface CreateAssemblyInput {
  costDatabaseId: string;
  csiCode: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  unit: string;
  items?: CreateComponentInput[];
  productionRate?: number;
  crewSize?: number;
  complexity?: AssemblyComplexity;
  notes?: string;
  tags?: string[];
  isTemplate?: boolean;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
}

export interface CreateComponentInput {
  type: AssemblyComponent['type'];
  costItemId?: string;
  assemblyId?: string;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  unitCost: number;
  wastePercent?: number;
  sortOrder?: number;
  metadata?: Record<string, unknown>;
}

export interface UpdateAssemblyInput {
  name?: string;
  description?: string;
  category?: string;
  subcategory?: string;
  unit?: string;
  productionRate?: number;
  crewSize?: number;
  complexity?: AssemblyComplexity;
  notes?: string;
  tags?: string[];
  isActive?: boolean;
  metadata?: Record<string, unknown>;
}

export class AssemblyBuilder {
  /**
   * Create a new assembly
   */
  async createAssembly(input: CreateAssemblyInput): Promise<Assembly> {
    const items = input.items?.map((c, i) => this.createComponent(c, i)) || [];
    const costs = this.calculateCosts(items);

    const assembly = await prisma.assembly.create({
      data: {
        id: uuid(),
        costDatabaseId: input.costDatabaseId,
        csiCode: input.csiCode,
        name: input.name,
        description: input.description,
        category: input.category as any,
        subcategory: input.subcategory,
        unit: input.unit,
        laborHours: costs.laborHours.toNumber(),
        materialCost: costs.materialCost.toNumber(),
        laborCost: costs.laborCost.toNumber(),
        equipmentCost: costs.equipmentCost.toNumber(),
        unitCost: costs.unitCost.toNumber(),
        productionRate: input.productionRate,
        crewSize: input.crewSize,
        complexity: input.complexity,
        notes: input.notes,
        tags: input.tags || [],
        isTemplate: input.isTemplate || false,
        isActive: input.isActive ?? true,
        metadata: input.metadata as any,
      },
      include: {
        items: true,
      },
    });

    // Create assembly items separately if provided
    if (items.length > 0) {
      await prisma.assemblyItem.createMany({
        data: items.map((item) => ({
          id: item.id,
          assemblyId: assembly.id,
          itemType: item.itemType,
          description: item.description,
          quantity: item.quantity.toNumber(),
          unit: item.unit,
          unitCost: item.unitCost.toNumber(),
          totalCost: item.totalCost.toNumber(),
          sortOrder: item.sortOrder,
        })),
      });
    }

    return this.mapToAssembly(assembly, items);
  }

  /**
   * Get assembly by ID
   */
  async getAssembly(id: string): Promise<Assembly | null> {
    const assembly = await prisma.assembly.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!assembly) return null;
    return this.mapToAssembly(assembly);
  }

  /**
   * List assemblies by cost database
   */
  async listAssemblies(
    costDatabaseId: string,
    options?: {
      category?: string;
      isTemplate?: boolean;
      isActive?: boolean;
      search?: string;
      tags?: string[];
      limit?: number;
      offset?: number;
    }
  ): Promise<Assembly[]> {
    const assemblies = await prisma.assembly.findMany({
      where: {
        costDatabaseId,
        ...(options?.category && { category: options.category as any }),
        ...(options?.isTemplate !== undefined && { isTemplate: options.isTemplate }),
        ...(options?.isActive !== undefined && { isActive: options.isActive }),
        ...(options?.search && {
          OR: [
            { name: { contains: options.search, mode: 'insensitive' } },
            { csiCode: { contains: options.search, mode: 'insensitive' } },
            { description: { contains: options.search, mode: 'insensitive' } },
          ],
        }),
        ...(options?.tags?.length && { tags: { hasSome: options.tags } }),
      },
      include: {
        items: true,
      },
      take: options?.limit || 50,
      skip: options?.offset || 0,
      orderBy: { name: 'asc' },
    });

    return assemblies.map((a) => this.mapToAssembly(a));
  }

  /**
   * Update assembly
   */
  async updateAssembly(id: string, input: UpdateAssemblyInput): Promise<Assembly> {
    const existing = await this.getAssembly(id);
    if (!existing) {
      throw new Error('Assembly not found');
    }

    const assembly = await prisma.assembly.update({
      where: { id },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.description && { description: input.description }),
        ...(input.category && { category: input.category as any }),
        ...(input.subcategory !== undefined && { subcategory: input.subcategory }),
        ...(input.unit && { unit: input.unit }),
        ...(input.productionRate !== undefined && { productionRate: input.productionRate }),
        ...(input.crewSize !== undefined && { crewSize: input.crewSize }),
        ...(input.complexity !== undefined && { complexity: input.complexity }),
        ...(input.notes !== undefined && { notes: input.notes }),
        ...(input.tags && { tags: input.tags }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
        metadata: {
          ...((existing.metadata as any) || {}),
          ...input.metadata,
        } as any,
        updatedAt: new Date(),
      },
      include: {
        items: true,
      },
    });

    return this.mapToAssembly(assembly);
  }

  /**
   * Add item to assembly
   */
  async addItem(
    assemblyId: string,
    component: CreateComponentInput
  ): Promise<Assembly> {
    const assembly = await this.getAssembly(assemblyId);
    if (!assembly) {
      throw new Error('Assembly not found');
    }

    const items = [...assembly.items];
    const sortOrder = component.sortOrder ?? items.length;
    items.push(this.createComponent(component, sortOrder));

    return this.updateItems(assemblyId, items);
  }

  /**
   * Update item
   */
  async updateItem(
    assemblyId: string,
    itemId: string,
    updates: Partial<CreateComponentInput>
  ): Promise<Assembly> {
    const assembly = await this.getAssembly(assemblyId);
    if (!assembly) {
      throw new Error('Assembly not found');
    }

    const itemIndex = assembly.items.findIndex((c) => c.id === itemId);
    if (itemIndex === -1) {
      throw new Error('Item not found');
    }

    const items = [...assembly.items];
    const existing = items[itemIndex];
    const quantity = new Decimal(updates.quantity ?? existing.quantity.toNumber());
    const unitCost = new Decimal(updates.unitCost ?? existing.unitCost.toNumber());

    items[itemIndex] = {
      ...existing,
      ...updates,
      quantity,
      unitCost,
      totalCost: quantity.times(unitCost).times(1 + (updates.wastePercent || existing.wastePercent || 0) / 100),
    };

    return this.updateItems(assemblyId, items);
  }

  /**
   * Remove item from assembly
   */
  async removeItem(assemblyId: string, itemId: string): Promise<Assembly> {
    const assembly = await this.getAssembly(assemblyId);
    if (!assembly) {
      throw new Error('Assembly not found');
    }

    const items = assembly.items.filter((c) => c.id !== itemId);
    return this.updateItems(assemblyId, items);
  }

  /**
   * Reorder items
   */
  async reorderItems(
    assemblyId: string,
    itemOrder: string[]
  ): Promise<Assembly> {
    const assembly = await this.getAssembly(assemblyId);
    if (!assembly) {
      throw new Error('Assembly not found');
    }

    const itemMap = new Map(assembly.items.map((c) => [c.id, c]));
    const reorderedItems: AssemblyComponent[] = [];

    itemOrder.forEach((id, index) => {
      const item = itemMap.get(id);
      if (item) {
        reorderedItems.push({ ...item, sortOrder: index });
      }
    });

    // Add any items not in the order list at the end
    for (const item of assembly.items) {
      if (!itemOrder.includes(item.id)) {
        reorderedItems.push({
          ...item,
          sortOrder: reorderedItems.length,
        });
      }
    }

    return this.updateItems(assemblyId, reorderedItems);
  }

  /**
   * Duplicate assembly
   */
  async duplicateAssembly(
    id: string,
    options?: {
      newCsiCode?: string;
      newName?: string;
      asTemplate?: boolean;
    }
  ): Promise<Assembly> {
    const original = await this.getAssembly(id);
    if (!original) {
      throw new Error('Assembly not found');
    }

    const newAssembly = await this.createAssembly({
      costDatabaseId: original.costDatabaseId,
      csiCode: options?.newCsiCode || `${original.csiCode}-COPY`,
      name: options?.newName || `${original.name} (Copy)`,
      description: original.description,
      category: original.category,
      subcategory: original.subcategory,
      unit: original.unit,
      items: original.items.map((c) => ({
        type: c.type,
        costItemId: c.costItemId,
        assemblyId: c.assemblyId,
        name: c.name,
        description: c.description,
        quantity: c.quantity.toNumber(),
        unit: c.unit,
        unitCost: c.unitCost.toNumber(),
        wastePercent: c.wastePercent,
        sortOrder: c.sortOrder,
        metadata: c.metadata,
      })),
      productionRate: original.productionRate,
      crewSize: original.crewSize,
      complexity: original.complexity,
      notes: original.notes,
      tags: original.tags,
      isTemplate: options?.asTemplate ?? original.isTemplate,
      isActive: original.isActive,
      metadata: original.metadata,
    });

    return newAssembly;
  }

  /**
   * Create new version (duplicates assembly with updated metadata)
   */
  async createVersion(id: string): Promise<Assembly> {
    const original = await this.getAssembly(id);
    if (!original) {
      throw new Error('Assembly not found');
    }

    // Mark original as superseded
    await prisma.assembly.update({
      where: { id },
      data: {
        metadata: {
          ...((original.metadata as any) || {}),
          supersededAt: new Date(),
        } as any,
      },
    });

    // Create new version
    const newVersion = await prisma.assembly.create({
      data: {
        id: uuid(),
        costDatabaseId: original.costDatabaseId,
        csiCode: original.csiCode,
        name: original.name,
        description: original.description,
        category: original.category as any,
        subcategory: original.subcategory,
        unit: original.unit,
        laborHours: original.laborHours.toNumber(),
        materialCost: original.materialCost.toNumber(),
        laborCost: original.laborCost.toNumber(),
        equipmentCost: original.equipmentCost.toNumber(),
        unitCost: original.unitCost.toNumber(),
        productionRate: original.productionRate,
        crewSize: original.crewSize,
        complexity: original.complexity,
        notes: original.notes,
        tags: original.tags,
        isTemplate: original.isTemplate,
        isActive: original.isActive,
        metadata: {
          ...((original.metadata as any) || {}),
          previousVersionId: id,
        } as any,
      },
      include: {
        items: true,
      },
    });

    return this.mapToAssembly(newVersion);
  }

  /**
   * Delete assembly
   */
  async deleteAssembly(id: string): Promise<void> {
    await prisma.assembly.delete({
      where: { id },
    });
  }

  /**
   * Get assembly categories for a cost database
   */
  async getCategories(costDatabaseId: string): Promise<string[]> {
    const assemblies = await prisma.assembly.findMany({
      where: { costDatabaseId },
      select: { category: true },
      distinct: ['category'],
    });

    return assemblies.map((a) => a.category);
  }

  /**
   * Update items and recalculate costs
   */
  private async updateItems(
    assemblyId: string,
    items: AssemblyComponent[]
  ): Promise<Assembly> {
    const costs = this.calculateCosts(items);

    // Delete existing items and recreate
    await prisma.assemblyItem.deleteMany({
      where: { assemblyId },
    });

    if (items.length > 0) {
      await prisma.assemblyItem.createMany({
        data: items.map((item) => ({
          id: item.id,
          assemblyId,
          itemType: item.itemType,
          description: item.description,
          quantity: item.quantity.toNumber(),
          unit: item.unit,
          unitCost: item.unitCost.toNumber(),
          totalCost: item.totalCost.toNumber(),
          sortOrder: item.sortOrder,
        })),
      });
    }

    const assembly = await prisma.assembly.update({
      where: { id: assemblyId },
      data: {
        laborHours: costs.laborHours.toNumber(),
        materialCost: costs.materialCost.toNumber(),
        laborCost: costs.laborCost.toNumber(),
        equipmentCost: costs.equipmentCost.toNumber(),
        unitCost: costs.unitCost.toNumber(),
        updatedAt: new Date(),
      },
      include: {
        items: true,
      },
    });

    return this.mapToAssembly(assembly, items);
  }

  /**
   * Create component from input
   */
  private createComponent(input: CreateComponentInput, sortOrder: number): AssemblyComponent {
    const quantity = new Decimal(input.quantity);
    const unitCost = new Decimal(input.unitCost);
    const wasteFactor = 1 + (input.wastePercent || 0) / 100;

    // Map component type to AssemblyItemType
    const itemTypeMap: Record<AssemblyComponent['type'], AssemblyItemType> = {
      'MATERIAL': AssemblyItemType.MATERIAL_ITEM,
      'LABOR': AssemblyItemType.LABOR_ITEM,
      'EQUIPMENT': AssemblyItemType.EQUIPMENT_ITEM,
      'SUBASSEMBLY': AssemblyItemType.SUBCONTRACTOR_ITEM,
    };

    return {
      id: uuid(),
      type: input.type,
      itemType: itemTypeMap[input.type],
      costItemId: input.costItemId,
      assemblyId: input.assemblyId,
      name: input.name,
      description: input.description,
      quantity,
      unit: input.unit,
      unitCost,
      totalCost: quantity.times(unitCost).times(wasteFactor),
      wastePercent: input.wastePercent,
      sortOrder: input.sortOrder ?? sortOrder,
      metadata: input.metadata,
    };
  }

  /**
   * Calculate assembly costs
   */
  private calculateCosts(items: AssemblyComponent[]): {
    laborHours: Decimal;
    materialCost: Decimal;
    laborCost: Decimal;
    equipmentCost: Decimal;
    unitCost: Decimal;
  } {
    let laborHours = new Decimal(0);
    let materialCost = new Decimal(0);
    let laborCost = new Decimal(0);
    let equipmentCost = new Decimal(0);

    for (const item of items) {
      switch (item.type) {
        case 'MATERIAL':
          materialCost = materialCost.plus(item.totalCost);
          break;
        case 'LABOR':
          laborCost = laborCost.plus(item.totalCost);
          laborHours = laborHours.plus(item.quantity);
          break;
        case 'EQUIPMENT':
          equipmentCost = equipmentCost.plus(item.totalCost);
          break;
        case 'SUBASSEMBLY':
          // Subassembly costs are already calculated
          materialCost = materialCost.plus(item.totalCost);
          break;
      }
    }

    const unitCost = materialCost.plus(laborCost).plus(equipmentCost);

    return {
      laborHours,
      materialCost,
      laborCost,
      equipmentCost,
      unitCost,
    };
  }

  /**
   * Map database record to Assembly
   */
  private mapToAssembly(record: any, providedItems?: AssemblyComponent[]): Assembly {
    // Map AssemblyItemType to component type
    const typeFromItemType = (itemType: AssemblyItemType): AssemblyComponent['type'] => {
      switch (itemType) {
        case AssemblyItemType.MATERIAL_ITEM: return 'MATERIAL';
        case AssemblyItemType.LABOR_ITEM: return 'LABOR';
        case AssemblyItemType.EQUIPMENT_ITEM: return 'EQUIPMENT';
        case AssemblyItemType.SUBCONTRACTOR_ITEM: return 'SUBASSEMBLY';
        default: return 'MATERIAL';
      }
    };

    const items = providedItems || (record.items || []).map((c: any) => ({
      id: c.id,
      type: typeFromItemType(c.itemType || AssemblyItemType.MATERIAL_ITEM),
      itemType: c.itemType || AssemblyItemType.MATERIAL_ITEM,
      costItemId: c.costItemId,
      assemblyId: c.assemblyId,
      name: c.name,
      description: c.description,
      quantity: new Decimal(c.quantity || 0),
      unit: c.unit,
      unitCost: new Decimal(c.unitCost || 0),
      totalCost: new Decimal(c.totalCost || c.quantity * c.unitCost || 0),
      wastePercent: c.wastePercent,
      sortOrder: c.sortOrder || 0,
      metadata: c.metadata,
    }));

    return {
      id: record.id,
      costDatabaseId: record.costDatabaseId,
      csiCode: record.csiCode,
      name: record.name,
      description: record.description,
      category: record.category,
      subcategory: record.subcategory,
      unit: record.unit,
      items,
      laborHours: new Decimal(record.laborHours || 0),
      materialCost: new Decimal(record.materialCost || 0),
      laborCost: new Decimal(record.laborCost || 0),
      equipmentCost: new Decimal(record.equipmentCost || 0),
      unitCost: new Decimal(record.unitCost || 0),
      productionRate: record.productionRate,
      crewSize: record.crewSize,
      complexity: record.complexity,
      notes: record.notes,
      tags: record.tags || [],
      isTemplate: record.isTemplate,
      isActive: record.isActive,
      metadata: record.metadata,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}

export const assemblyBuilder = new AssemblyBuilder();
