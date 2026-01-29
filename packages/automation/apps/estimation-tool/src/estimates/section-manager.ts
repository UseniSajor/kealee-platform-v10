/**
 * Section Manager
 * Manage estimate sections/divisions
 */

import { PrismaClient } from '@prisma/client';
import { v4 as uuid } from 'uuid';
import Decimal from 'decimal.js';

const prisma = new PrismaClient();

export interface EstimateSection {
  id: string;
  estimateId: string;
  name: string;
  csiCode?: string;
  csiDivision?: number;
  description?: string;
  sortOrder: number;
  subtotalMaterial: number;
  subtotalLabor: number;
  subtotalEquipment: number;
  subtotalSubcontractor: number;
  subtotalOther: number;
  total: number;
  isExpanded: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SectionTotals {
  subtotalMaterial: number;
  subtotalLabor: number;
  subtotalEquipment: number;
  subtotalSubcontractor: number;
  subtotalOther: number;
  total: number;
  itemCount: number;
}

export interface CreateSectionInput {
  estimateId: string;
  name: string;
  csiCode: string;
  description?: string;
  sortOrder?: number;
}

export interface CSIDivision {
  code: string;
  name: string;
  subcategories?: { code: string; name: string }[];
}

export class SectionManager {
  // CSI MasterFormat divisions
  private readonly csiDivisions: CSIDivision[] = [
    { code: '00', name: 'Procurement and Contracting Requirements' },
    { code: '01', name: 'General Requirements' },
    { code: '02', name: 'Existing Conditions' },
    { code: '03', name: 'Concrete' },
    { code: '04', name: 'Masonry' },
    { code: '05', name: 'Metals' },
    { code: '06', name: 'Wood, Plastics, and Composites' },
    { code: '07', name: 'Thermal and Moisture Protection' },
    { code: '08', name: 'Openings' },
    { code: '09', name: 'Finishes' },
    { code: '10', name: 'Specialties' },
    { code: '11', name: 'Equipment' },
    { code: '12', name: 'Furnishings' },
    { code: '13', name: 'Special Construction' },
    { code: '14', name: 'Conveying Equipment' },
    { code: '21', name: 'Fire Suppression' },
    { code: '22', name: 'Plumbing' },
    { code: '23', name: 'Heating, Ventilating, and Air Conditioning (HVAC)' },
    { code: '25', name: 'Integrated Automation' },
    { code: '26', name: 'Electrical' },
    { code: '27', name: 'Communications' },
    { code: '28', name: 'Electronic Safety and Security' },
    { code: '31', name: 'Earthwork' },
    { code: '32', name: 'Exterior Improvements' },
    { code: '33', name: 'Utilities' },
    { code: '34', name: 'Transportation' },
    { code: '35', name: 'Waterway and Marine Construction' },
    { code: '40', name: 'Process Interconnections' },
    { code: '41', name: 'Material Processing and Handling Equipment' },
    { code: '42', name: 'Process Heating, Cooling, and Drying Equipment' },
    { code: '43', name: 'Process Gas and Liquid Handling, Purification, and Storage Equipment' },
    { code: '44', name: 'Pollution and Waste Control Equipment' },
    { code: '45', name: 'Industry-Specific Manufacturing Equipment' },
    { code: '46', name: 'Water and Wastewater Equipment' },
    { code: '48', name: 'Electrical Power Generation' },
  ];

  /**
   * Create a new section
   */
  async createSection(input: CreateSectionInput): Promise<EstimateSection> {
    // Get max sort order if not provided
    let sortOrder = input.sortOrder;
    if (sortOrder === undefined) {
      const maxSection = await prisma.estimateSection.findFirst({
        where: { estimateId: input.estimateId },
        orderBy: { sortOrder: 'desc' },
      });
      sortOrder = (maxSection?.sortOrder || 0) + 10;
    }

    const section = await prisma.estimateSection.create({
      data: {
        id: uuid(),
        estimateId: input.estimateId,
        name: input.name,
        csiCode: input.csiCode,
        description: input.description,
        sortOrder,
        subtotalMaterial: 0,
        subtotalLabor: 0,
        subtotalEquipment: 0,
        subtotalSubcontractor: 0,
        subtotalOther: 0,
        total: 0,
      },
    });

    return this.mapToSection(section);
  }

  /**
   * Get section by ID
   */
  async getSection(sectionId: string): Promise<EstimateSection | null> {
    const section = await prisma.estimateSection.findUnique({
      where: { id: sectionId },
    });

    if (!section) return null;
    return this.mapToSection(section);
  }

  /**
   * Get sections for estimate
   */
  async getEstimateSections(
    estimateId: string,
    options?: {
      includeEmpty?: boolean;
    }
  ): Promise<EstimateSection[]> {
    const sections = await prisma.estimateSection.findMany({
      where: { estimateId },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { lineItems: true },
        },
      },
    });

    let result = sections.map(s => this.mapToSection(s));

    // Filter empty sections if requested
    if (!options?.includeEmpty) {
      result = result.filter(s => s.total > 0 || (s as any)._count?.lineItems > 0);
    }

    return result;
  }

  /**
   * Update section
   */
  async updateSection(
    sectionId: string,
    updates: Partial<{
      name: string;
      csiCode: string;
      description: string;
      sortOrder: number;
      notes: string;
      isExpanded: boolean;
    }>
  ): Promise<EstimateSection> {
    const section = await prisma.estimateSection.update({
      where: { id: sectionId },
      data: {
        ...(updates.name && { name: updates.name }),
        ...(updates.csiCode && { csiCode: updates.csiCode }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.sortOrder !== undefined && { sortOrder: updates.sortOrder }),
        ...(updates.notes !== undefined && { notes: updates.notes }),
        ...(updates.isExpanded !== undefined && { isExpanded: updates.isExpanded }),
        updatedAt: new Date(),
      },
    });

    return this.mapToSection(section);
  }

  /**
   * Delete section
   */
  async deleteSection(sectionId: string): Promise<void> {
    // Delete line items first
    await prisma.estimateLineItem.deleteMany({
      where: { sectionId },
    });

    await prisma.estimateSection.delete({
      where: { id: sectionId },
    });
  }

  /**
   * Reorder sections
   */
  async reorderSections(
    estimateId: string,
    sectionIds: string[]
  ): Promise<EstimateSection[]> {
    const updates = sectionIds.map((id, index) =>
      prisma.estimateSection.update({
        where: { id },
        data: {
          sortOrder: (index + 1) * 10,
          updatedAt: new Date(),
        },
      })
    );

    await prisma.$transaction(updates);

    return this.getEstimateSections(estimateId);
  }

  /**
   * Create standard CSI sections for estimate
   */
  async createCSISections(
    estimateId: string,
    divisionCodes?: string[]
  ): Promise<EstimateSection[]> {
    const divisions = divisionCodes
      ? this.csiDivisions.filter(d => divisionCodes.includes(d.code))
      : this.csiDivisions;

    const sections: EstimateSection[] = [];

    for (let i = 0; i < divisions.length; i++) {
      const division = divisions[i];
      const section = await this.createSection({
        estimateId,
        csiCode: division.code,
        name: `${division.code} - ${division.name}`,
        sortOrder: (i + 1) * 10,
      });
      sections.push(section);
    }

    return sections;
  }

  /**
   * Get CSI divisions
   */
  getCSIDivisions(): CSIDivision[] {
    return [...this.csiDivisions];
  }

  /**
   * Get division name by code
   */
  getDivisionName(code: string): string {
    const division = this.csiDivisions.find(d => d.code === code);
    return division ? division.name : 'Unknown';
  }

  /**
   * Calculate section totals
   */
  async calculateSectionTotals(sectionId: string): Promise<SectionTotals> {
    const lineItems = await prisma.estimateLineItem.findMany({
      where: { sectionId },
    });

    let subtotalMaterial = new Decimal(0);
    let subtotalLabor = new Decimal(0);
    let subtotalEquipment = new Decimal(0);
    let subtotalSubcontractor = new Decimal(0);
    let subtotalOther = new Decimal(0);

    for (const item of lineItems) {
      subtotalMaterial = subtotalMaterial.plus(item.materialCostAmt || 0);
      subtotalLabor = subtotalLabor.plus(item.laborCost || 0);
      subtotalEquipment = subtotalEquipment.plus(item.equipmentCostAmt || 0);
      subtotalSubcontractor = subtotalSubcontractor.plus(item.subcontractorCost || 0);
      // Other costs can be calculated from totalCost minus the known categories
      const knownCosts = new Decimal(item.materialCostAmt || 0)
        .plus(item.laborCost || 0)
        .plus(item.equipmentCostAmt || 0)
        .plus(item.subcontractorCost || 0);
      const otherCost = new Decimal(item.totalCost || 0).minus(knownCosts);
      if (otherCost.greaterThan(0)) {
        subtotalOther = subtotalOther.plus(otherCost);
      }
    }

    const total = subtotalMaterial
      .plus(subtotalLabor)
      .plus(subtotalEquipment)
      .plus(subtotalSubcontractor)
      .plus(subtotalOther);

    const totals: SectionTotals = {
      subtotalMaterial: subtotalMaterial.toNumber(),
      subtotalLabor: subtotalLabor.toNumber(),
      subtotalEquipment: subtotalEquipment.toNumber(),
      subtotalSubcontractor: subtotalSubcontractor.toNumber(),
      subtotalOther: subtotalOther.toNumber(),
      total: total.toNumber(),
      itemCount: lineItems.length,
    };

    // Update section with calculated totals (flat fields)
    await prisma.estimateSection.update({
      where: { id: sectionId },
      data: {
        subtotalMaterial: totals.subtotalMaterial,
        subtotalLabor: totals.subtotalLabor,
        subtotalEquipment: totals.subtotalEquipment,
        subtotalSubcontractor: totals.subtotalSubcontractor,
        subtotalOther: totals.subtotalOther,
        total: totals.total,
        updatedAt: new Date(),
      },
    });

    return totals;
  }

  /**
   * Duplicate section
   */
  async duplicateSection(
    sectionId: string,
    targetEstimateId?: string
  ): Promise<EstimateSection> {
    const original = await prisma.estimateSection.findUnique({
      where: { id: sectionId },
      include: { lineItems: true },
    });

    if (!original) {
      throw new Error('Section not found');
    }

    const estimateId = targetEstimateId || original.estimateId;

    // Get new sort order
    const maxSection = await prisma.estimateSection.findFirst({
      where: { estimateId },
      orderBy: { sortOrder: 'desc' },
    });
    const sortOrder = (maxSection?.sortOrder || 0) + 10;

    // Create new section
    const newSectionId = uuid();
    const section = await prisma.estimateSection.create({
      data: {
        id: newSectionId,
        estimateId,
        name: targetEstimateId ? original.name : `${original.name} (Copy)`,
        csiCode: original.csiCode,
        csiDivision: original.csiDivision,
        description: original.description,
        sortOrder,
        subtotalMaterial: Number(original.subtotalMaterial) || 0,
        subtotalLabor: Number(original.subtotalLabor) || 0,
        subtotalEquipment: Number(original.subtotalEquipment) || 0,
        subtotalSubcontractor: Number(original.subtotalSubcontractor) || 0,
        subtotalOther: Number(original.subtotalOther) || 0,
        total: Number(original.total) || 0,
        isExpanded: original.isExpanded,
        notes: original.notes,
      },
    });

    // Duplicate line items
    for (const item of original.lineItems) {
      await prisma.estimateLineItem.create({
        data: {
          id: uuid(),
          estimateId,
          sectionId: newSectionId,
          itemType: item.itemType,
          csiCode: item.csiCode,
          category: item.category,
          description: item.description,
          location: item.location,
          quantity: item.quantity,
          unit: item.unit,
          unitCost: item.unitCost,
          laborCost: item.laborCost,
          laborHours: item.laborHours,
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
          difficultyFactor: item.difficultyFactor,
          discount: item.discount,
          isAlternate: item.isAlternate,
          isAllowance: item.isAllowance,
          isExcluded: item.isExcluded,
          isByOwner: item.isByOwner,
          takeoffSource: item.takeoffSource,
          takeoffNotes: item.takeoffNotes,
          notes: item.notes,
          metadata: item.metadata as any,
        },
      });
    }

    return this.mapToSection(section);
  }

  /**
   * Merge sections
   */
  async mergeSections(
    sourceSectionIds: string[],
    targetSectionId: string
  ): Promise<EstimateSection> {
    const target = await prisma.estimateSection.findUnique({
      where: { id: targetSectionId },
    });

    if (!target) {
      throw new Error('Target section not found');
    }

    // Move all line items to target section
    await prisma.estimateLineItem.updateMany({
      where: { sectionId: { in: sourceSectionIds } },
      data: { sectionId: targetSectionId },
    });

    // Delete source sections
    await prisma.estimateSection.deleteMany({
      where: { id: { in: sourceSectionIds } },
    });

    // Recalculate totals
    await this.calculateSectionTotals(targetSectionId);

    const updated = await this.getSection(targetSectionId);
    return updated!;
  }

  /**
   * Get section summary
   */
  async getSectionSummary(sectionId: string): Promise<{
    section: EstimateSection;
    itemCount: number;
    topItems: { code: string; name: string; cost: number }[];
    costBreakdown: { type: string; amount: number; percent: number }[];
  }> {
    const section = await this.getSection(sectionId);
    if (!section) {
      throw new Error('Section not found');
    }

    const lineItems = await prisma.estimateLineItem.findMany({
      where: { sectionId },
      orderBy: { totalCost: 'desc' },
      take: 10,
    });

    const topItems = lineItems.map(item => ({
      code: item.csiCode || '',
      name: item.description,
      cost: Number(item.totalCost) || 0,
    }));

    const totalAmount = section.total || 1;
    const costBreakdown = [
      {
        type: 'Material',
        amount: section.subtotalMaterial,
        percent: (section.subtotalMaterial / totalAmount) * 100,
      },
      {
        type: 'Labor',
        amount: section.subtotalLabor,
        percent: (section.subtotalLabor / totalAmount) * 100,
      },
      {
        type: 'Equipment',
        amount: section.subtotalEquipment,
        percent: (section.subtotalEquipment / totalAmount) * 100,
      },
      {
        type: 'Subcontractor',
        amount: section.subtotalSubcontractor,
        percent: (section.subtotalSubcontractor / totalAmount) * 100,
      },
      {
        type: 'Other',
        amount: section.subtotalOther,
        percent: (section.subtotalOther / totalAmount) * 100,
      },
    ].filter(b => b.amount > 0);

    // Get item count from line items query
    const itemCount = await prisma.estimateLineItem.count({
      where: { sectionId },
    });

    return {
      section,
      itemCount,
      topItems,
      costBreakdown,
    };
  }

  /**
   * Get empty totals
   */
  private getEmptyTotals(): SectionTotals {
    return {
      subtotalMaterial: 0,
      subtotalLabor: 0,
      subtotalEquipment: 0,
      subtotalSubcontractor: 0,
      subtotalOther: 0,
      total: 0,
      itemCount: 0,
    };
  }

  /**
   * Map database record to Section
   */
  private mapToSection(record: any): EstimateSection {
    return {
      id: record.id,
      estimateId: record.estimateId,
      name: record.name,
      csiCode: record.csiCode,
      csiDivision: record.csiDivision,
      description: record.description,
      sortOrder: record.sortOrder,
      subtotalMaterial: Number(record.subtotalMaterial) || 0,
      subtotalLabor: Number(record.subtotalLabor) || 0,
      subtotalEquipment: Number(record.subtotalEquipment) || 0,
      subtotalSubcontractor: Number(record.subtotalSubcontractor) || 0,
      subtotalOther: Number(record.subtotalOther) || 0,
      total: Number(record.total) || 0,
      isExpanded: record.isExpanded ?? true,
      notes: record.notes,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}

export const sectionManager = new SectionManager();
