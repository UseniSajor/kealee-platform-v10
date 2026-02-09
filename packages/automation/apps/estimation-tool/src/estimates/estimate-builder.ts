/**
 * Estimate Builder
 * Create and manage construction estimates
 */

import { PrismaClient, EstimateType, EstimateStatus, LineItemType } from '@prisma/client';
import { v4 as uuid } from 'uuid';
import Decimal from 'decimal.js';
import {
  notifyEstimateCreated,
  notifyEstimateUpdated,
  notifyEstimateStatusChanged,
  notifyEstimateLocked,
  notifyEstimateUnlocked,
} from '@kealee/realtime';

const prisma = new PrismaClient();

// Re-export enums for external use
export { EstimateType, EstimateStatus };

export interface CreateEstimateInput {
  organizationId: string;
  projectId: string;
  name: string;
  description?: string;
  type: EstimateType;
  costDatabaseId: string;
  bidRequestId?: string;
  dueDate?: Date;
  settings?: EstimateSettings;
}

export interface EstimateSettings {
  defaultMarkup: number;
  defaultContingency: number;
  includeTax: boolean;
  taxRate: number;
  roundTo: number;
  showUnitCosts: boolean;
  groupByDivision: boolean;
  defaultWastePercent: number;
  laborBurdenRate: number;
  overheadPercent: number;
  profitPercent: number;
}

export interface Estimate {
  id: string;
  organizationId: string;
  projectId: string;
  name: string;
  description?: string;
  type: EstimateType;
  status: EstimateStatus;
  version: number;
  costDatabaseId: string;
  bidRequestId?: string;
  dueDate?: Date;
  settings: EstimateSettings;
  totals: EstimateTotals;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  isLocked?: boolean;
  lockedBy?: string;
}

export interface EstimateTotals {
  directCost: number;
  materialCost: number;
  laborCost: number;
  equipmentCost: number;
  subcontractorCost: number;
  otherCost: number;
  subtotal: number;
  markup: number;
  markupAmount: number;
  contingency: number;
  contingencyAmount: number;
  overhead: number;
  overheadAmount: number;
  profit: number;
  profitAmount: number;
  bondCost: number;
  insuranceCost: number;
  permitCost: number;
  tax: number;
  taxAmount: number;
  grandTotal: number;
}

export class EstimateBuilder {
  private defaultSettings: EstimateSettings = {
    defaultMarkup: 0,
    defaultContingency: 5,
    includeTax: false,
    taxRate: 0,
    roundTo: 2,
    showUnitCosts: true,
    groupByDivision: true,
    defaultWastePercent: 10,
    laborBurdenRate: 35,
    overheadPercent: 10,
    profitPercent: 10,
  };

  /**
   * Create a new estimate
   */
  async createEstimate(input: CreateEstimateInput): Promise<Estimate> {
    const id = uuid();
    const settings = { ...this.defaultSettings, ...input.settings };

    const emptyTotals = this.getEmptyTotals();
    const estimate = await prisma.estimate.create({
      data: {
        id,
        organizationId: input.organizationId,
        projectId: input.projectId,
        name: input.name,
        description: input.description,
        type: input.type,
        status: EstimateStatus.DRAFT_ESTIMATE,
        version: 1,
        costDatabaseId: input.costDatabaseId,
        bidRequestId: input.bidRequestId,
        // Flat cost fields from schema
        subtotalMaterial: emptyTotals.materialCost,
        subtotalLabor: emptyTotals.laborCost,
        subtotalEquipment: emptyTotals.equipmentCost,
        subtotalSubcontractor: emptyTotals.subcontractorCost,
        subtotalOther: emptyTotals.otherCost,
        subtotalDirect: emptyTotals.directCost,
        overhead: emptyTotals.overheadAmount,
        overheadPercent: settings.overheadPercent,
        profit: emptyTotals.profitAmount,
        profitPercent: settings.profitPercent,
        contingency: emptyTotals.contingencyAmount,
        contingencyPercent: settings.defaultContingency,
        bondCost: emptyTotals.bondCost,
        bondPercent: 0,
        permitFees: emptyTotals.permitCost,
        insuranceCost: emptyTotals.insuranceCost,
        taxRate: settings.taxRate,
        salesTax: emptyTotals.taxAmount,
        totalCost: emptyTotals.grandTotal,
        metadata: {
          settings: settings,
          dueDate: input.dueDate?.toISOString(),
        } as any,
      },
    });

    const mapped = this.mapToEstimate(estimate);

    // Broadcast real-time event (fire-and-forget)
    notifyEstimateCreated({
      estimateId: mapped.id,
      projectId: mapped.projectId,
      organizationId: mapped.organizationId,
      name: mapped.name,
      status: mapped.status,
      totalCost: mapped.totals.grandTotal,
    }).catch((err: unknown) => console.error('[Realtime] estimate.created broadcast failed:', err));

    return mapped;
  }

  /**
   * Get estimate by ID
   */
  async getEstimate(estimateId: string): Promise<Estimate | null> {
    const estimate = await prisma.estimate.findUnique({
      where: { id: estimateId },
    });

    if (!estimate) return null;
    return this.mapToEstimate(estimate);
  }

  /**
   * Get estimates for project
   */
  async getProjectEstimates(
    projectId: string,
    options?: {
      status?: EstimateStatus;
      type?: EstimateType;
      limit?: number;
    }
  ): Promise<Estimate[]> {
    const estimates = await prisma.estimate.findMany({
      where: {
        projectId,
        ...(options?.status && { status: options.status }),
        ...(options?.type && { type: options.type }),
      },
      take: options?.limit,
      orderBy: { updatedAt: 'desc' },
    });

    return estimates.map(e => this.mapToEstimate(e));
  }

  /**
   * Update estimate
   */
  async updateEstimate(
    estimateId: string,
    updates: Partial<{
      name: string;
      description: string;
      status: EstimateStatus;
      dueDate: Date;
      settings: Partial<EstimateSettings>;
      metadata: Record<string, unknown>;
    }>
  ): Promise<Estimate> {
    const existing = await prisma.estimate.findUnique({
      where: { id: estimateId },
    });

    if (!existing) {
      throw new Error('Estimate not found');
    }

    const metadata = existing.metadata as Record<string, unknown> | null;
    if (metadata?.isLocked) {
      throw new Error('Estimate is locked');
    }

    const existingMetadata = (existing.metadata as Record<string, unknown>) || {};
    const existingSettings = (existingMetadata.settings as EstimateSettings) || this.defaultSettings;
    const newSettings: EstimateSettings = updates.settings
      ? { ...existingSettings, ...updates.settings }
      : existingSettings;

    const estimate = await prisma.estimate.update({
      where: { id: estimateId },
      data: {
        ...(updates.name && { name: updates.name }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.status && { status: updates.status }),
        ...(updates.settings && {
          overheadPercent: newSettings.overheadPercent,
          profitPercent: newSettings.profitPercent,
          contingencyPercent: newSettings.defaultContingency,
          taxRate: newSettings.taxRate,
        }),
        metadata: {
          ...existingMetadata,
          ...updates.metadata,
          settings: newSettings,
          ...(updates.dueDate && { dueDate: updates.dueDate.toISOString() }),
        } as any,
        updatedAt: new Date(),
      },
    });

    const mapped = this.mapToEstimate(estimate);

    // Broadcast real-time event (fire-and-forget)
    if (updates.status && updates.status !== existing.status) {
      notifyEstimateStatusChanged({
        estimateId: mapped.id,
        projectId: mapped.projectId,
        organizationId: mapped.organizationId,
        name: mapped.name,
        status: mapped.status,
        previousStatus: existing.status,
        totalCost: mapped.totals.grandTotal,
      }).catch((err: unknown) => console.error('[Realtime] estimate.status_changed broadcast failed:', err));
    } else {
      notifyEstimateUpdated({
        estimateId: mapped.id,
        projectId: mapped.projectId,
        organizationId: mapped.organizationId,
        name: mapped.name,
        status: mapped.status,
        totalCost: mapped.totals.grandTotal,
      }).catch((err: unknown) => console.error('[Realtime] estimate.updated broadcast failed:', err));
    }

    return mapped;
  }

  /**
   * Duplicate estimate
   */
  async duplicateEstimate(
    estimateId: string,
    newName?: string
  ): Promise<Estimate> {
    const original = await prisma.estimate.findUnique({
      where: { id: estimateId },
      include: {
        sections: {
          include: {
            lineItems: true,
          },
        },
      },
    });

    if (!original) {
      throw new Error('Estimate not found');
    }

    // Create new estimate
    const newId = uuid();
    const estimate = await prisma.estimate.create({
      data: {
        id: newId,
        organizationId: original.organizationId,
        projectId: original.projectId,
        name: newName || `${original.name} (Copy)`,
        description: original.description,
        type: original.type,
        status: EstimateStatus.DRAFT_ESTIMATE,
        version: 1,
        costDatabaseId: original.costDatabaseId,
        // Copy flat cost fields
        subtotalMaterial: original.subtotalMaterial,
        subtotalLabor: original.subtotalLabor,
        subtotalEquipment: original.subtotalEquipment,
        subtotalSubcontractor: original.subtotalSubcontractor,
        subtotalOther: original.subtotalOther,
        subtotalDirect: original.subtotalDirect,
        overhead: original.overhead,
        overheadPercent: original.overheadPercent,
        profit: original.profit,
        profitPercent: original.profitPercent,
        contingency: original.contingency,
        contingencyPercent: original.contingencyPercent,
        bondCost: original.bondCost,
        bondPercent: original.bondPercent,
        permitFees: original.permitFees,
        insuranceCost: original.insuranceCost,
        taxRate: original.taxRate,
        salesTax: original.salesTax,
        totalCost: original.totalCost,
        metadata: {
          ...(original.metadata as any),
          duplicatedFrom: estimateId,
          duplicatedAt: new Date().toISOString(),
        },
      },
    });

    // Duplicate sections and line items
    for (const section of original.sections) {
      const newSectionId = uuid();
      await prisma.estimateSection.create({
        data: {
          id: newSectionId,
          estimateId: newId,
          name: section.name,
          csiCode: section.csiCode,
          csiDivision: section.csiDivision,
          description: section.description,
          sortOrder: section.sortOrder,
          subtotalMaterial: section.subtotalMaterial,
          subtotalLabor: section.subtotalLabor,
          subtotalEquipment: section.subtotalEquipment,
          subtotalSubcontractor: section.subtotalSubcontractor,
          subtotalOther: section.subtotalOther,
          total: section.total,
        },
      });

      for (const item of section.lineItems) {
        await prisma.estimateLineItem.create({
          data: {
            id: uuid(),
            estimateId: newId,
            sectionId: newSectionId,
            itemType: item.itemType,
            csiCode: item.csiCode,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unitCost: item.unitCost,
            laborCost: item.laborCost,
            materialCostAmt: item.materialCostAmt,
            equipmentCostAmt: item.equipmentCostAmt,
            subcontractorCost: item.subcontractorCost,
            totalCost: item.totalCost,
            sortOrder: item.sortOrder,
            assemblyId: item.assemblyId,
            materialId: item.materialId,
            laborRateId: item.laborRateId,
            equipmentId: item.equipmentId,
            markup: item.markup,
            wasteFactor: item.wasteFactor,
            notes: item.notes,
            metadata: item.metadata as any,
          },
        });
      }
    }

    return this.mapToEstimate(estimate);
  }

  /**
   * Lock estimate (stores lock status in metadata since no lockedAt field)
   */
  async lockEstimate(estimateId: string, userId: string): Promise<Estimate> {
    const existing = await prisma.estimate.findUnique({
      where: { id: estimateId },
    });

    if (!existing) {
      throw new Error('Estimate not found');
    }

    const existingMetadata = (existing.metadata as Record<string, unknown>) || {};

    const estimate = await prisma.estimate.update({
      where: { id: estimateId },
      data: {
        metadata: {
          ...existingMetadata,
          isLocked: true,
          lockedAt: new Date().toISOString(),
          lockedBy: userId,
        },
        updatedAt: new Date(),
      },
    });

    const lockedMapped = this.mapToEstimate(estimate);

    notifyEstimateLocked({
      estimateId: lockedMapped.id,
      projectId: lockedMapped.projectId,
      organizationId: lockedMapped.organizationId,
      name: lockedMapped.name,
      status: lockedMapped.status,
      updatedBy: userId,
    }, userId).catch((err: unknown) => console.error('[Realtime] estimate.locked broadcast failed:', err));

    return lockedMapped;
  }

  /**
   * Unlock estimate
   */
  async unlockEstimate(estimateId: string): Promise<Estimate> {
    const existing = await prisma.estimate.findUnique({
      where: { id: estimateId },
    });

    if (!existing) {
      throw new Error('Estimate not found');
    }

    const existingMetadata = (existing.metadata as Record<string, unknown>) || {};

    const estimate = await prisma.estimate.update({
      where: { id: estimateId },
      data: {
        metadata: {
          ...existingMetadata,
          isLocked: false,
          lockedAt: null,
          lockedBy: null,
        },
        updatedAt: new Date(),
      },
    });

    const unlockedMapped = this.mapToEstimate(estimate);

    notifyEstimateUnlocked({
      estimateId: unlockedMapped.id,
      projectId: unlockedMapped.projectId,
      organizationId: unlockedMapped.organizationId,
      name: unlockedMapped.name,
      status: unlockedMapped.status,
    }).catch((err: unknown) => console.error('[Realtime] estimate.unlocked broadcast failed:', err));

    return unlockedMapped;
  }

  /**
   * Delete estimate
   */
  async deleteEstimate(estimateId: string): Promise<void> {
    const estimate = await prisma.estimate.findUnique({
      where: { id: estimateId },
    });

    if (!estimate) {
      throw new Error('Estimate not found');
    }

    const metadata = estimate.metadata as Record<string, unknown> | null;
    if (metadata?.isLocked) {
      throw new Error('Cannot delete locked estimate');
    }

    // Delete in order: line items, sections, estimate
    await prisma.estimateLineItem.deleteMany({
      where: { estimateId },
    });

    await prisma.estimateSection.deleteMany({
      where: { estimateId },
    });

    await prisma.estimate.delete({
      where: { id: estimateId },
    });
  }

  /**
   * Get estimate summary
   */
  async getEstimateSummary(estimateId: string): Promise<{
    estimate: Estimate;
    sectionCount: number;
    lineItemCount: number;
    completionPercent: number;
    lastModified: Date;
    breakdown: {
      byCategory: { category: string; cost: number; percent: number }[];
      byCostType: { type: string; cost: number; percent: number }[];
    };
  }> {
    const estimate = await this.getEstimate(estimateId);
    if (!estimate) {
      throw new Error('Estimate not found');
    }

    const sections = await prisma.estimateSection.findMany({
      where: { estimateId },
    });

    const lineItems = await prisma.estimateLineItem.findMany({
      where: { estimateId },
    });

    // Calculate category breakdown
    const categoryMap = new Map<string, number>();
    for (const section of sections) {
      const cost = Number(section.total) || 0;
      const category = section.csiCode?.substring(0, 2) || 'OTHER';
      categoryMap.set(category, (categoryMap.get(category) || 0) + cost);
    }

    const grandTotal = estimate.totals.grandTotal || 1;
    const byCategory = Array.from(categoryMap.entries()).map(([category, cost]) => ({
      category,
      cost,
      percent: (cost / grandTotal) * 100,
    }));

    // Calculate cost type breakdown
    const byCostType = [
      { type: 'Material', cost: estimate.totals.materialCost, percent: (estimate.totals.materialCost / grandTotal) * 100 },
      { type: 'Labor', cost: estimate.totals.laborCost, percent: (estimate.totals.laborCost / grandTotal) * 100 },
      { type: 'Equipment', cost: estimate.totals.equipmentCost, percent: (estimate.totals.equipmentCost / grandTotal) * 100 },
      { type: 'Subcontractor', cost: estimate.totals.subcontractorCost, percent: (estimate.totals.subcontractorCost / grandTotal) * 100 },
      { type: 'Other', cost: estimate.totals.otherCost, percent: (estimate.totals.otherCost / grandTotal) * 100 },
    ].filter(t => t.cost > 0);

    // Calculate completion
    const itemsWithCosts = lineItems.filter(i => i.totalCost && new Decimal(i.totalCost).greaterThan(0)).length;
    const completionPercent = lineItems.length > 0 ? (itemsWithCosts / lineItems.length) * 100 : 0;

    return {
      estimate,
      sectionCount: sections.length,
      lineItemCount: lineItems.length,
      completionPercent,
      lastModified: estimate.updatedAt,
      breakdown: {
        byCategory,
        byCostType,
      },
    };
  }

  /**
   * Create estimate from another estimate (as template)
   * Note: There is no EstimateTemplate model in Prisma schema.
   * Use duplicateEstimate() instead for copying existing estimates.
   */
  async createFromExistingEstimate(
    sourceEstimateId: string,
    input: {
      organizationId: string;
      projectId: string;
      name: string;
      costDatabaseId: string;
    }
  ): Promise<Estimate> {
    const source = await prisma.estimate.findUnique({
      where: { id: sourceEstimateId },
      include: {
        sections: {
          include: {
            lineItems: true,
          },
        },
      },
    });

    if (!source) {
      throw new Error('Source estimate not found');
    }

    // Create estimate
    const estimateId = uuid();
    const emptyTotals = this.getEmptyTotals();
    const sourceMetadata = (source.metadata as Record<string, unknown>) || {};
    const settings = (sourceMetadata.settings as EstimateSettings) || this.defaultSettings;

    const estimate = await prisma.estimate.create({
      data: {
        id: estimateId,
        organizationId: input.organizationId,
        projectId: input.projectId,
        name: input.name,
        description: source.description,
        type: source.type,
        status: EstimateStatus.DRAFT_ESTIMATE,
        version: 1,
        costDatabaseId: input.costDatabaseId,
        subtotalMaterial: emptyTotals.materialCost,
        subtotalLabor: emptyTotals.laborCost,
        subtotalEquipment: emptyTotals.equipmentCost,
        subtotalSubcontractor: emptyTotals.subcontractorCost,
        subtotalOther: emptyTotals.otherCost,
        subtotalDirect: emptyTotals.directCost,
        overhead: emptyTotals.overheadAmount,
        overheadPercent: settings.overheadPercent,
        profit: emptyTotals.profitAmount,
        profitPercent: settings.profitPercent,
        contingency: emptyTotals.contingencyAmount,
        contingencyPercent: settings.defaultContingency,
        bondCost: emptyTotals.bondCost,
        bondPercent: 0,
        permitFees: emptyTotals.permitCost,
        insuranceCost: emptyTotals.insuranceCost,
        taxRate: settings.taxRate,
        salesTax: emptyTotals.taxAmount,
        totalCost: emptyTotals.grandTotal,
        metadata: {
          settings: settings,
          sourceEstimateId,
          sourceEstimateName: source.name,
        } as any,
      },
    });

    // Create sections and items from source (with zero quantities for template use)
    for (const sourceSection of source.sections) {
      const sectionId = uuid();
      await prisma.estimateSection.create({
        data: {
          id: sectionId,
          estimateId,
          name: sourceSection.name,
          csiCode: sourceSection.csiCode,
          csiDivision: sourceSection.csiDivision,
          description: sourceSection.description,
          sortOrder: sourceSection.sortOrder,
          subtotalMaterial: 0,
          subtotalLabor: 0,
          subtotalEquipment: 0,
          subtotalSubcontractor: 0,
          subtotalOther: 0,
          total: 0,
        },
      });

      for (const sourceItem of sourceSection.lineItems) {
        await prisma.estimateLineItem.create({
          data: {
            id: uuid(),
            estimateId,
            sectionId,
            itemType: sourceItem.itemType,
            csiCode: sourceItem.csiCode,
            description: sourceItem.description,
            quantity: 0,
            unit: sourceItem.unit,
            unitCost: 0,
            laborCost: 0,
            materialCostAmt: 0,
            equipmentCostAmt: 0,
            subcontractorCost: 0,
            totalCost: 0,
            sortOrder: sourceItem.sortOrder,
            assemblyId: sourceItem.assemblyId,
            markup: sourceItem.markup,
            wasteFactor: sourceItem.wasteFactor,
            metadata: sourceItem.metadata as any,
          },
        });
      }
    }

    return this.mapToEstimate(estimate);
  }

  /**
   * Get empty totals object
   */
  private getEmptyTotals(): EstimateTotals {
    return {
      directCost: 0,
      materialCost: 0,
      laborCost: 0,
      equipmentCost: 0,
      subcontractorCost: 0,
      otherCost: 0,
      subtotal: 0,
      markup: 0,
      markupAmount: 0,
      contingency: 0,
      contingencyAmount: 0,
      overhead: 0,
      overheadAmount: 0,
      profit: 0,
      profitAmount: 0,
      bondCost: 0,
      insuranceCost: 0,
      permitCost: 0,
      tax: 0,
      taxAmount: 0,
      grandTotal: 0,
    };
  }

  /**
   * Map database record to Estimate
   */
  private mapToEstimate(record: any): Estimate {
    const metadata = (record.metadata as Record<string, unknown>) || {};
    const settings = (metadata.settings as EstimateSettings) || this.defaultSettings;

    // Build totals from flat fields
    const totals: EstimateTotals = {
      directCost: Number(record.subtotalDirect) || 0,
      materialCost: Number(record.subtotalMaterial) || 0,
      laborCost: Number(record.subtotalLabor) || 0,
      equipmentCost: Number(record.subtotalEquipment) || 0,
      subcontractorCost: Number(record.subtotalSubcontractor) || 0,
      otherCost: Number(record.subtotalOther) || 0,
      subtotal: Number(record.subtotalDirect) || 0,
      markup: settings.defaultMarkup || 0,
      markupAmount: 0, // Calculate if needed
      contingency: Number(record.contingencyPercent) || 0,
      contingencyAmount: Number(record.contingency) || 0,
      overhead: Number(record.overheadPercent) || 0,
      overheadAmount: Number(record.overhead) || 0,
      profit: Number(record.profitPercent) || 0,
      profitAmount: Number(record.profit) || 0,
      bondCost: Number(record.bondCost) || 0,
      insuranceCost: Number(record.insuranceCost) || 0,
      permitCost: Number(record.permitFees) || 0,
      tax: Number(record.taxRate) || 0,
      taxAmount: Number(record.salesTax) || 0,
      grandTotal: Number(record.totalCost) || 0,
    };

    return {
      id: record.id,
      organizationId: record.organizationId,
      projectId: record.projectId,
      name: record.name,
      description: record.description,
      type: record.type as EstimateType,
      status: record.status as EstimateStatus,
      version: record.version,
      costDatabaseId: record.costDatabaseId,
      bidRequestId: record.bidRequestId,
      dueDate: metadata.dueDate ? new Date(metadata.dueDate as string) : undefined,
      settings: settings,
      totals: totals,
      metadata: metadata,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      createdBy: record.createdBy,
      isLocked: Boolean(metadata.isLocked),
      lockedBy: metadata.lockedBy as string | undefined,
    };
  }
}

export const estimateBuilder = new EstimateBuilder();
