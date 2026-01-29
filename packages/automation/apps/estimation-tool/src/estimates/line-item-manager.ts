/**
 * Line Item Manager
 * Manage estimate line items
 */

import { PrismaClient, LineItemType } from '@prisma/client';
import { v4 as uuid } from 'uuid';
import Decimal from 'decimal.js';

const prisma = new PrismaClient();

export interface EstimateLineItem {
  id: string;
  estimateId: string;
  sectionId: string;
  csiCode: string;
  description: string;
  itemType: string;
  quantity: number;
  unit: string;
  unitCost: number;
  laborCost: number;
  materialCostAmt: number;
  equipmentCostAmt: number;
  subcontractorCost: number;
  totalCost: number;
  sortOrder: number;
  assemblyId?: string;
  materialId?: string;
  laborRateId?: string;
  equipmentId?: string;
  markup: number;
  wasteFactor: number;
  notes?: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLineItemInput {
  estimateId: string;
  sectionId: string;
  csiCode: string;
  description: string;
  itemType: LineItemType;
  quantity: number;
  unit: string;
  unitCost?: number;
  laborCost?: number;
  materialCostAmt?: number;
  equipmentCostAmt?: number;
  subcontractorCost?: number;
  assemblyId?: string;
  materialId?: string;
  laborRateId?: string;
  equipmentId?: string;
  markup?: number;
  wasteFactor?: number;
  notes?: string;
  sortOrder?: number;
}

export interface BulkLineItemInput {
  items: CreateLineItemInput[];
  options?: {
    skipDuplicates?: boolean;
    updateExisting?: boolean;
  };
}

export class LineItemManager {
  /**
   * Create a new line item
   */
  async createLineItem(input: CreateLineItemInput): Promise<EstimateLineItem> {
    // Get sort order if not provided
    let sortOrder = input.sortOrder;
    if (sortOrder === undefined) {
      const maxItem = await prisma.estimateLineItem.findFirst({
        where: { sectionId: input.sectionId },
        orderBy: { sortOrder: 'desc' },
      });
      sortOrder = (maxItem?.sortOrder || 0) + 10;
    }

    // Calculate costs if assembly or material/labor/equipment provided
    let costs = {
      unitCost: input.unitCost || 0,
      materialCostAmt: input.materialCostAmt || 0,
      laborCost: input.laborCost || 0,
      equipmentCostAmt: input.equipmentCostAmt || 0,
      subcontractorCost: input.subcontractorCost || 0,
    };

    if (input.assemblyId) {
      costs = await this.getAssemblyCosts(input.assemblyId, input.quantity);
    } else if (input.materialId) {
      costs = await this.getMaterialCosts(input.materialId, input.quantity);
    } else if (input.laborRateId) {
      costs = await this.getLaborRateCosts(input.laborRateId, input.quantity);
    } else if (input.equipmentId) {
      costs = await this.getEquipmentRateCosts(input.equipmentId, input.quantity);
    }

    // Apply waste
    const wasteFactor = input.wasteFactor || 0;
    const grossQuantity = input.quantity * (1 + wasteFactor / 100);

    // Calculate total
    const totalCost = new Decimal(costs.materialCostAmt)
      .plus(costs.laborCost)
      .plus(costs.equipmentCostAmt)
      .plus(costs.subcontractorCost);

    // Apply markup
    const markup = input.markup || 0;
    const finalCost = totalCost.times(1 + markup / 100);

    const item = await prisma.estimateLineItem.create({
      data: {
        id: uuid(),
        estimateId: input.estimateId,
        sectionId: input.sectionId,
        csiCode: input.csiCode,
        description: input.description,
        itemType: input.itemType,
        quantity: grossQuantity,
        unit: input.unit,
        unitCost: costs.unitCost,
        laborCost: costs.laborCost,
        materialCostAmt: costs.materialCostAmt,
        equipmentCostAmt: costs.equipmentCostAmt,
        subcontractorCost: costs.subcontractorCost,
        totalCost: finalCost.toNumber(),
        sortOrder,
        assemblyId: input.assemblyId,
        materialId: input.materialId,
        laborRateId: input.laborRateId,
        equipmentId: input.equipmentId,
        markup,
        wasteFactor,
        notes: input.notes,
        metadata: {},
      },
    });

    return this.mapToLineItem(item);
  }

  /**
   * Get line item by ID
   */
  async getLineItem(itemId: string): Promise<EstimateLineItem | null> {
    const item = await prisma.estimateLineItem.findUnique({
      where: { id: itemId },
    });

    if (!item) return null;
    return this.mapToLineItem(item);
  }

  /**
   * Get line items for section
   */
  async getSectionLineItems(sectionId: string): Promise<EstimateLineItem[]> {
    const items = await prisma.estimateLineItem.findMany({
      where: { sectionId },
      orderBy: { sortOrder: 'asc' },
    });

    return items.map(i => this.mapToLineItem(i));
  }

  /**
   * Get line items for estimate
   */
  async getEstimateLineItems(
    estimateId: string,
    options?: {
      sectionId?: string;
      search?: string;
      minCost?: number;
      maxCost?: number;
    }
  ): Promise<EstimateLineItem[]> {
    const items = await prisma.estimateLineItem.findMany({
      where: {
        estimateId,
        ...(options?.sectionId && { sectionId: options.sectionId }),
        ...(options?.search && {
          OR: [
            { csiCode: { contains: options.search, mode: 'insensitive' } },
            { description: { contains: options.search, mode: 'insensitive' } },
          ],
        }),
        ...(options?.minCost !== undefined && { totalCost: { gte: options.minCost } }),
        ...(options?.maxCost !== undefined && { totalCost: { lte: options.maxCost } }),
      },
      orderBy: [{ sectionId: 'asc' }, { sortOrder: 'asc' }],
    });

    return items.map(i => this.mapToLineItem(i));
  }

  /**
   * Update line item
   */
  async updateLineItem(
    itemId: string,
    updates: Partial<{
      csiCode: string;
      description: string;
      itemType: LineItemType;
      quantity: number;
      unit: string;
      unitCost: number;
      laborCost: number;
      materialCostAmt: number;
      equipmentCostAmt: number;
      subcontractorCost: number;
      markup: number;
      wasteFactor: number;
      notes: string;
      sectionId: string;
      sortOrder: number;
    }>
  ): Promise<EstimateLineItem> {
    const existing = await prisma.estimateLineItem.findUnique({
      where: { id: itemId },
    });

    if (!existing) {
      throw new Error('Line item not found');
    }

    // Recalculate if costs changed
    let totalCost: number | undefined;
    if (
      updates.materialCostAmt !== undefined ||
      updates.laborCost !== undefined ||
      updates.equipmentCostAmt !== undefined ||
      updates.subcontractorCost !== undefined ||
      updates.markup !== undefined
    ) {
      const material = updates.materialCostAmt ?? Number(existing.materialCostAmt) ?? 0;
      const labor = updates.laborCost ?? Number(existing.laborCost) ?? 0;
      const equipment = updates.equipmentCostAmt ?? Number(existing.equipmentCostAmt) ?? 0;
      const subcontractor = updates.subcontractorCost ?? Number(existing.subcontractorCost) ?? 0;
      const existingMarkup = existing.markup ? new Decimal(existing.markup).toNumber() : 0;
      const markup = updates.markup ?? existingMarkup;

      const subtotal = new Decimal(material)
        .plus(labor)
        .plus(equipment)
        .plus(subcontractor);

      totalCost = subtotal.times(1 + markup / 100).toNumber();
    }

    // Recalculate if quantity or waste changed
    if (updates.quantity !== undefined || updates.wasteFactor !== undefined) {
      const baseQuantity = updates.quantity ?? Number(existing.quantity) ?? 0;
      const existingWasteFactor = existing.wasteFactor ? new Decimal(existing.wasteFactor).toNumber() : 0;
      const wasteFactor = updates.wasteFactor ?? existingWasteFactor;
      const grossQuantity = baseQuantity * (1 + wasteFactor / 100);

      // Update quantity with waste applied
      updates.quantity = grossQuantity;

      // Recalculate total if unit cost exists
      if (existing.unitCost || updates.unitCost) {
        const unitCost = updates.unitCost ?? Number(existing.unitCost) ?? 0;
        totalCost = grossQuantity * unitCost;
      }
    }

    const item = await prisma.estimateLineItem.update({
      where: { id: itemId },
      data: {
        ...(updates.csiCode && { csiCode: updates.csiCode }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.itemType && { itemType: updates.itemType }),
        ...(updates.quantity !== undefined && { quantity: updates.quantity }),
        ...(updates.unit && { unit: updates.unit }),
        ...(updates.unitCost !== undefined && { unitCost: updates.unitCost }),
        ...(updates.laborCost !== undefined && { laborCost: updates.laborCost }),
        ...(updates.materialCostAmt !== undefined && { materialCostAmt: updates.materialCostAmt }),
        ...(updates.equipmentCostAmt !== undefined && { equipmentCostAmt: updates.equipmentCostAmt }),
        ...(updates.subcontractorCost !== undefined && { subcontractorCost: updates.subcontractorCost }),
        ...(totalCost !== undefined && { totalCost }),
        ...(updates.markup !== undefined && { markup: updates.markup }),
        ...(updates.wasteFactor !== undefined && { wasteFactor: updates.wasteFactor }),
        ...(updates.notes !== undefined && { notes: updates.notes }),
        ...(updates.sectionId && { sectionId: updates.sectionId }),
        ...(updates.sortOrder !== undefined && { sortOrder: updates.sortOrder }),
        updatedAt: new Date(),
      },
    });

    return this.mapToLineItem(item);
  }

  /**
   * Delete line item
   */
  async deleteLineItem(itemId: string): Promise<void> {
    await prisma.estimateLineItem.delete({
      where: { id: itemId },
    });
  }

  /**
   * Bulk create line items
   */
  async bulkCreateLineItems(input: BulkLineItemInput): Promise<{
    created: number;
    skipped: number;
    updated: number;
    errors: string[];
  }> {
    const result = { created: 0, skipped: 0, updated: 0, errors: [] as string[] };

    for (const itemInput of input.items) {
      try {
        // Check for duplicate
        const existing = await prisma.estimateLineItem.findFirst({
          where: {
            estimateId: itemInput.estimateId,
            sectionId: itemInput.sectionId,
            csiCode: itemInput.csiCode,
          },
        });

        if (existing) {
          if (input.options?.skipDuplicates) {
            result.skipped++;
            continue;
          }

          if (input.options?.updateExisting) {
            await this.updateLineItem(existing.id, itemInput);
            result.updated++;
            continue;
          }
        }

        await this.createLineItem(itemInput);
        result.created++;
      } catch (error) {
        result.errors.push(`${itemInput.csiCode}: ${error}`);
      }
    }

    return result;
  }

  /**
   * Bulk delete line items
   */
  async bulkDeleteLineItems(itemIds: string[]): Promise<number> {
    const result = await prisma.estimateLineItem.deleteMany({
      where: { id: { in: itemIds } },
    });
    return result.count;
  }

  /**
   * Move line items to section
   */
  async moveLineItems(itemIds: string[], targetSectionId: string): Promise<void> {
    await prisma.estimateLineItem.updateMany({
      where: { id: { in: itemIds } },
      data: {
        sectionId: targetSectionId,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Reorder line items
   */
  async reorderLineItems(
    sectionId: string,
    itemIds: string[]
  ): Promise<EstimateLineItem[]> {
    const updates = itemIds.map((id, index) =>
      prisma.estimateLineItem.update({
        where: { id },
        data: {
          sortOrder: (index + 1) * 10,
          updatedAt: new Date(),
        },
      })
    );

    await prisma.$transaction(updates);

    return this.getSectionLineItems(sectionId);
  }

  /**
   * Duplicate line item
   */
  async duplicateLineItem(
    itemId: string,
    targetSectionId?: string
  ): Promise<EstimateLineItem> {
    const original = await prisma.estimateLineItem.findUnique({
      where: { id: itemId },
    });

    if (!original) {
      throw new Error('Line item not found');
    }

    const sectionId = targetSectionId || original.sectionId;

    // Get new sort order
    const maxItem = await prisma.estimateLineItem.findFirst({
      where: { sectionId },
      orderBy: { sortOrder: 'desc' },
    });

    const item = await prisma.estimateLineItem.create({
      data: {
        id: uuid(),
        estimateId: original.estimateId,
        sectionId,
        csiCode: original.csiCode,
        description: targetSectionId ? original.description : `${original.description} (Copy)`,
        itemType: original.itemType,
        quantity: original.quantity,
        unit: original.unit,
        unitCost: original.unitCost,
        laborCost: original.laborCost,
        materialCostAmt: original.materialCostAmt,
        equipmentCostAmt: original.equipmentCostAmt,
        subcontractorCost: original.subcontractorCost,
        totalCost: original.totalCost,
        sortOrder: (maxItem?.sortOrder || 0) + 10,
        assemblyId: original.assemblyId,
        materialId: original.materialId,
        laborRateId: original.laborRateId,
        equipmentId: original.equipmentId,
        markup: original.markup,
        wasteFactor: original.wasteFactor,
        notes: original.notes,
        metadata: {
          ...(original.metadata as any),
          duplicatedFrom: itemId,
        },
      },
    });

    return this.mapToLineItem(item);
  }

  /**
   * Add items from assembly
   */
  async addFromAssembly(
    estimateId: string,
    sectionId: string,
    assemblyId: string,
    quantity: number,
    options?: {
      expandItems?: boolean;
      applyMarkup?: number;
    }
  ): Promise<EstimateLineItem[]> {
    const assembly = await prisma.assembly.findUnique({
      where: { id: assemblyId },
      include: { items: true },
    });

    if (!assembly) {
      throw new Error('Assembly not found');
    }

    const items: EstimateLineItem[] = [];

    if (options?.expandItems && assembly.items && assembly.items.length > 0) {
      // Add each item as a separate line item
      for (const assemblyItem of assembly.items) {
        const assemblyItemData = assemblyItem as any;
        const itemTypeStr = assemblyItemData.itemType || 'MATERIAL_LINE';
        const itemType = itemTypeStr as LineItemType;
        const itemQuantity = (assemblyItemData.quantity || 1) * quantity;
        const itemUnitCost = Number(assemblyItemData.unitCost) || 0;
        const item = await this.createLineItem({
          estimateId,
          sectionId,
          csiCode: assemblyItemData.csiCode || assembly.csiCode || '',
          description: assemblyItemData.description || '',
          itemType,
          quantity: itemQuantity,
          unit: assemblyItemData.unit || assembly.unit || 'EA',
          unitCost: itemUnitCost,
          materialCostAmt: itemTypeStr === 'MATERIAL_LINE' || itemTypeStr === 'MATERIAL' ? itemUnitCost * itemQuantity : 0,
          laborCost: itemTypeStr === 'LABOR_LINE' || itemTypeStr === 'LABOR' ? itemUnitCost * itemQuantity : 0,
          equipmentCostAmt: itemTypeStr === 'EQUIPMENT_LINE' || itemTypeStr === 'EQUIPMENT' ? itemUnitCost * itemQuantity : 0,
          assemblyId,
          markup: options?.applyMarkup,
        });
        items.push(item);
      }
    } else {
      // Add assembly as single line item
      const item = await this.createLineItem({
        estimateId,
        sectionId,
        csiCode: assembly.csiCode || '',
        description: assembly.name || '',
        itemType: LineItemType.ASSEMBLY_LINE,
        quantity,
        unit: assembly.unit || 'EA',
        materialCostAmt: Number(assembly.materialCost) * quantity,
        laborCost: Number(assembly.laborCost) * quantity,
        equipmentCostAmt: Number(assembly.equipmentCost) * quantity,
        assemblyId,
        markup: options?.applyMarkup,
      });
      items.push(item);
    }

    return items;
  }

  /**
   * Add items from material cost database
   */
  async addFromMaterial(
    estimateId: string,
    sectionId: string,
    materialId: string,
    quantity: number
  ): Promise<EstimateLineItem> {
    const material = await prisma.materialCost.findUnique({
      where: { id: materialId },
    });

    if (!material) {
      throw new Error('Material not found');
    }

    return this.createLineItem({
      estimateId,
      sectionId,
      csiCode: material.csiCode || '',
      description: material.description || '',
      itemType: LineItemType.MATERIAL_LINE,
      quantity,
      unit: material.unit,
      unitCost: Number(material.unitCost),
      materialCostAmt: Number(material.unitCost) * quantity,
      laborCost: 0,
      equipmentCostAmt: 0,
      materialId,
    });
  }

  /**
   * Add items from labor rate database
   */
  async addFromLaborRate(
    estimateId: string,
    sectionId: string,
    laborRateId: string,
    quantity: number
  ): Promise<EstimateLineItem> {
    const laborRate = await prisma.laborRate.findUnique({
      where: { id: laborRateId },
    });

    if (!laborRate) {
      throw new Error('Labor rate not found');
    }

    return this.createLineItem({
      estimateId,
      sectionId,
      csiCode: String(laborRate.trade),
      description: laborRate.description || '',
      itemType: LineItemType.LABOR_LINE,
      quantity,
      unit: 'HR',
      unitCost: Number(laborRate.totalRate),
      materialCostAmt: 0,
      laborCost: Number(laborRate.totalRate) * quantity,
      equipmentCostAmt: 0,
      laborRateId,
    });
  }

  /**
   * Add items from equipment rate database
   */
  async addFromEquipmentRate(
    estimateId: string,
    sectionId: string,
    equipmentId: string,
    quantity: number
  ): Promise<EstimateLineItem> {
    const equipmentRate = await prisma.equipmentRate.findUnique({
      where: { id: equipmentId },
    });

    if (!equipmentRate) {
      throw new Error('Equipment rate not found');
    }

    return this.createLineItem({
      estimateId,
      sectionId,
      csiCode: String(equipmentRate.category),
      description: equipmentRate.name || equipmentRate.description || '',
      itemType: LineItemType.EQUIPMENT_LINE,
      quantity,
      unit: 'DAY',
      unitCost: Number(equipmentRate.dailyRate),
      materialCostAmt: 0,
      laborCost: 0,
      equipmentCostAmt: Number(equipmentRate.dailyRate) * quantity,
      equipmentId,
    });
  }

  /**
   * Get assembly costs
   */
  private async getAssemblyCosts(
    assemblyId: string,
    quantity: number
  ): Promise<{
    unitCost: number;
    materialCostAmt: number;
    laborCost: number;
    equipmentCostAmt: number;
    subcontractorCost: number;
  }> {
    const assembly = await prisma.assembly.findUnique({
      where: { id: assemblyId },
    });

    if (!assembly) {
      return { unitCost: 0, materialCostAmt: 0, laborCost: 0, equipmentCostAmt: 0, subcontractorCost: 0 };
    }

    return {
      unitCost: Number(assembly.unitCost) || 0,
      materialCostAmt: (Number(assembly.materialCost) || 0) * quantity,
      laborCost: (Number(assembly.laborCost) || 0) * quantity,
      equipmentCostAmt: (Number(assembly.equipmentCost) || 0) * quantity,
      subcontractorCost: 0,
    };
  }

  /**
   * Get material costs
   */
  private async getMaterialCosts(
    materialId: string,
    quantity: number
  ): Promise<{
    unitCost: number;
    materialCostAmt: number;
    laborCost: number;
    equipmentCostAmt: number;
    subcontractorCost: number;
  }> {
    const material = await prisma.materialCost.findUnique({
      where: { id: materialId },
    });

    if (!material) {
      return { unitCost: 0, materialCostAmt: 0, laborCost: 0, equipmentCostAmt: 0, subcontractorCost: 0 };
    }

    return {
      unitCost: Number(material.unitCost) || 0,
      materialCostAmt: (Number(material.unitCost) || 0) * quantity,
      laborCost: 0,
      equipmentCostAmt: 0,
      subcontractorCost: 0,
    };
  }

  /**
   * Get labor rate costs
   */
  private async getLaborRateCosts(
    laborRateId: string,
    quantity: number
  ): Promise<{
    unitCost: number;
    materialCostAmt: number;
    laborCost: number;
    equipmentCostAmt: number;
    subcontractorCost: number;
  }> {
    const laborRate = await prisma.laborRate.findUnique({
      where: { id: laborRateId },
    });

    if (!laborRate) {
      return { unitCost: 0, materialCostAmt: 0, laborCost: 0, equipmentCostAmt: 0, subcontractorCost: 0 };
    }

    return {
      unitCost: Number(laborRate.totalRate) || 0,
      materialCostAmt: 0,
      laborCost: (Number(laborRate.totalRate) || 0) * quantity,
      equipmentCostAmt: 0,
      subcontractorCost: 0,
    };
  }

  /**
   * Get equipment rate costs
   */
  private async getEquipmentRateCosts(
    equipmentId: string,
    quantity: number
  ): Promise<{
    unitCost: number;
    materialCostAmt: number;
    laborCost: number;
    equipmentCostAmt: number;
    subcontractorCost: number;
  }> {
    const equipmentRate = await prisma.equipmentRate.findUnique({
      where: { id: equipmentId },
    });

    if (!equipmentRate) {
      return { unitCost: 0, materialCostAmt: 0, laborCost: 0, equipmentCostAmt: 0, subcontractorCost: 0 };
    }

    return {
      unitCost: Number(equipmentRate.dailyRate) || 0,
      materialCostAmt: 0,
      laborCost: 0,
      equipmentCostAmt: (Number(equipmentRate.dailyRate) || 0) * quantity,
      subcontractorCost: 0,
    };
  }

  /**
   * Map database record to LineItem
   */
  private mapToLineItem(record: any): EstimateLineItem {
    return {
      id: record.id,
      estimateId: record.estimateId,
      sectionId: record.sectionId,
      csiCode: record.csiCode,
      description: record.description,
      itemType: record.itemType,
      quantity: Number(record.quantity) || 0,
      unit: record.unit,
      unitCost: Number(record.unitCost) || 0,
      laborCost: Number(record.laborCost) || 0,
      materialCostAmt: Number(record.materialCostAmt) || 0,
      equipmentCostAmt: Number(record.equipmentCostAmt) || 0,
      subcontractorCost: Number(record.subcontractorCost) || 0,
      totalCost: Number(record.totalCost) || 0,
      sortOrder: record.sortOrder,
      assemblyId: record.assemblyId,
      materialId: record.materialId,
      laborRateId: record.laborRateId,
      equipmentId: record.equipmentId,
      markup: record.markup || 0,
      wasteFactor: record.wasteFactor || 0,
      notes: record.notes,
      metadata: (record.metadata as Record<string, unknown>) || {},
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}

export const lineItemManager = new LineItemManager();
