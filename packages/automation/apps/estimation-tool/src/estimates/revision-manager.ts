/**
 * Revision Manager
 * Track and manage estimate revisions
 *
 * Note: Since there is no EstimateRevision model in Prisma,
 * revisions are stored in the estimate.metadata.revisions array.
 */

import { PrismaClient, LineItemType } from '@prisma/client';
import { v4 as uuid } from 'uuid';
import Decimal from 'decimal.js';
import { Estimate, EstimateTotals } from './estimate-builder.js';

const prisma = new PrismaClient();

export interface EstimateRevision {
  id: string;
  estimateId: string;
  version: number;
  name: string;
  description?: string;
  reason: RevisionReason;
  changeType: ChangeType;
  previousTotals: EstimateTotals;
  newTotals: EstimateTotals;
  changes: RevisionChange[];
  createdAt: Date;
  createdBy?: string;
  approved: boolean;
  approvedAt?: Date;
  approvedBy?: string;
  metadata: Record<string, unknown>;
  snapshot?: RevisionSnapshot;
}

export type RevisionReason =
  | 'SCOPE_CHANGE'
  | 'PRICE_UPDATE'
  | 'QUANTITY_ADJUSTMENT'
  | 'ERROR_CORRECTION'
  | 'OWNER_REQUEST'
  | 'DESIGN_CHANGE'
  | 'VALUE_ENGINEERING'
  | 'MARKET_CONDITIONS'
  | 'OTHER';

export type ChangeType =
  | 'ADDITION'
  | 'DELETION'
  | 'MODIFICATION'
  | 'MIXED';

export interface RevisionChange {
  type: 'ADD' | 'REMOVE' | 'MODIFY';
  itemType: 'SECTION' | 'LINE_ITEM';
  itemId: string;
  itemCode?: string;
  itemName: string;
  previousValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  costImpact: number;
}

export interface CreateRevisionInput {
  estimateId: string;
  name: string;
  description?: string;
  reason: RevisionReason;
  createdBy?: string;
}

/** Snapshot of a section at revision time */
interface SectionSnapshot {
  id: string;
  csiCode?: string;
  name: string;
  subtotalMaterial: number;
  subtotalLabor: number;
  subtotalEquipment: number;
  subtotalSubcontractor: number;
  subtotalOther: number;
  total: number;
  lineItems: LineItemSnapshot[];
}

/** Snapshot of a line item at revision time */
interface LineItemSnapshot {
  id: string;
  csiCode?: string;
  description: string;
  quantity: number;
  unit: string;
  totalCost: number;
  unitCost?: number;
  laborCost?: number;
  materialCostAmt?: number;
  equipmentCostAmt?: number;
  subcontractorCost?: number;
  sortOrder?: number;
  markup?: number;
  wasteFactor?: number;
  itemType: LineItemType;
}

/** Full revision snapshot stored in metadata */
interface RevisionSnapshot {
  sections: SectionSnapshot[];
}

/** Structure stored in estimate.metadata.revisions */
interface StoredRevision {
  id: string;
  version: number;
  name: string;
  description?: string;
  reason: RevisionReason;
  changeType: ChangeType;
  previousTotals: EstimateTotals;
  newTotals: EstimateTotals;
  changes: RevisionChange[];
  createdAt: string; // ISO string for JSON storage
  createdBy?: string;
  approved: boolean;
  approvedAt?: string;
  approvedBy?: string;
  metadata: Record<string, unknown>;
  snapshot: RevisionSnapshot;
}

export class RevisionManager {
  /**
   * Create a revision snapshot
   */
  async createRevision(input: CreateRevisionInput): Promise<EstimateRevision> {
    const estimate = await prisma.estimate.findUnique({
      where: { id: input.estimateId },
      include: {
        sections: {
          include: { lineItems: true },
        },
      },
    });

    if (!estimate) {
      throw new Error('Estimate not found');
    }

    const estimateMetadata = (estimate.metadata as Record<string, unknown>) || {};
    const existingRevisions = (estimateMetadata.revisions as StoredRevision[]) || [];

    // Get previous revision for comparison
    const previousRevision = existingRevisions.length > 0
      ? existingRevisions[existingRevisions.length - 1]
      : null;

    const newVersion = (previousRevision?.version || 0) + 1;
    const previousTotals = previousRevision
      ? previousRevision.newTotals
      : this.getEmptyTotals();
    const newTotals = this.extractTotalsFromEstimate(estimate);

    // Calculate changes
    const changes = this.calculateChangesFromEstimate(estimate, previousRevision?.snapshot);
    const changeType = this.determineChangeType(changes);

    // Create snapshot of current state
    const snapshot: RevisionSnapshot = {
      sections: estimate.sections.map((s) => ({
        id: s.id,
        csiCode: s.csiCode || undefined,
        name: s.name,
        subtotalMaterial: Number(s.subtotalMaterial) || 0,
        subtotalLabor: Number(s.subtotalLabor) || 0,
        subtotalEquipment: Number(s.subtotalEquipment) || 0,
        subtotalSubcontractor: Number(s.subtotalSubcontractor) || 0,
        subtotalOther: Number(s.subtotalOther) || 0,
        total: Number(s.total) || 0,
        lineItems: s.lineItems.map((i) => ({
          id: i.id,
          csiCode: i.csiCode || undefined,
          description: i.description,
          quantity: Number(i.quantity) || 0,
          unit: i.unit,
          totalCost: Number(i.totalCost) || 0,
          unitCost: Number(i.unitCost) || 0,
          laborCost: i.laborCost ? Number(i.laborCost) : undefined,
          materialCostAmt: i.materialCostAmt ? Number(i.materialCostAmt) : undefined,
          equipmentCostAmt: i.equipmentCostAmt ? Number(i.equipmentCostAmt) : undefined,
          subcontractorCost: i.subcontractorCost ? Number(i.subcontractorCost) : undefined,
          sortOrder: i.sortOrder,
          markup: Number(i.markup) || 0,
          wasteFactor: Number(i.wasteFactor) || 1,
          itemType: i.itemType,
        })),
      })),
    };

    const revisionId = uuid();
    const storedRevision: StoredRevision = {
      id: revisionId,
      version: newVersion,
      name: input.name || `Revision ${newVersion}`,
      description: input.description,
      reason: input.reason,
      changeType,
      previousTotals,
      newTotals,
      changes,
      createdAt: new Date().toISOString(),
      createdBy: input.createdBy,
      approved: false,
      metadata: {},
      snapshot,
    };

    // Update estimate with new revision in metadata
    const updatedRevisions = [...existingRevisions, storedRevision];

    await prisma.estimate.update({
      where: { id: input.estimateId },
      data: {
        version: newVersion,
        metadata: {
          ...estimateMetadata,
          revisions: updatedRevisions,
        } as any,
        updatedAt: new Date(),
      },
    });

    return this.mapStoredRevisionToRevision(input.estimateId, storedRevision);
  }

  /**
   * Get revision by ID
   */
  async getRevision(revisionId: string): Promise<EstimateRevision | null> {
    // We need to search through all estimates to find this revision
    const estimates = await prisma.estimate.findMany({
      where: {
        metadata: {
          path: ['revisions'],
          not: { equals: null },
        },
      },
    });

    for (const estimate of estimates) {
      const metadata = (estimate.metadata as Record<string, unknown>) || {};
      const revisions = (metadata.revisions as StoredRevision[]) || [];
      const revision = revisions.find((r: StoredRevision) => r.id === revisionId);
      if (revision) {
        return this.mapStoredRevisionToRevision(estimate.id, revision);
      }
    }

    return null;
  }

  /**
   * Get revisions for estimate
   */
  async getEstimateRevisions(
    estimateId: string,
    options?: { limit?: number }
  ): Promise<EstimateRevision[]> {
    const estimate = await prisma.estimate.findUnique({
      where: { id: estimateId },
    });

    if (!estimate) {
      return [];
    }

    const metadata = (estimate.metadata as Record<string, unknown>) || {};
    const revisions = (metadata.revisions as StoredRevision[]) || [];

    // Sort by version descending
    const sorted = [...revisions].sort((a, b) => b.version - a.version);
    const limited = options?.limit ? sorted.slice(0, options.limit) : sorted;

    return limited.map((r: StoredRevision) => this.mapStoredRevisionToRevision(estimateId, r));
  }

  /**
   * Get latest revision
   */
  async getLatestRevision(estimateId: string): Promise<EstimateRevision | null> {
    const revisions = await this.getEstimateRevisions(estimateId, { limit: 1 });
    return revisions.length > 0 ? revisions[0] : null;
  }

  /**
   * Approve revision
   */
  async approveRevision(
    revisionId: string,
    approvedBy: string
  ): Promise<EstimateRevision> {
    // Find the estimate containing this revision
    const estimates = await prisma.estimate.findMany();

    for (const estimate of estimates) {
      const metadata = (estimate.metadata as Record<string, unknown>) || {};
      const revisions = (metadata.revisions as StoredRevision[]) || [];
      const revisionIndex = revisions.findIndex((r: StoredRevision) => r.id === revisionId);

      if (revisionIndex !== -1) {
        revisions[revisionIndex] = {
          ...revisions[revisionIndex],
          approved: true,
          approvedAt: new Date().toISOString(),
          approvedBy,
        };

        await prisma.estimate.update({
          where: { id: estimate.id },
          data: {
            metadata: {
              ...metadata,
              revisions,
            } as any,
          },
        });

        return this.mapStoredRevisionToRevision(estimate.id, revisions[revisionIndex]);
      }
    }

    throw new Error('Revision not found');
  }

  /**
   * Compare two revisions
   */
  async compareRevisions(
    revisionId1: string,
    revisionId2: string
  ): Promise<{
    revision1: { version: number; total: number; date: Date };
    revision2: { version: number; total: number; date: Date };
    totalDifference: number;
    percentChange: number;
    itemChanges: RevisionChange[];
  }> {
    const [rev1, rev2] = await Promise.all([
      this.getRevision(revisionId1),
      this.getRevision(revisionId2),
    ]);

    if (!rev1 || !rev2) {
      throw new Error('One or both revisions not found');
    }

    const totalDifference = rev2.newTotals.grandTotal - rev1.newTotals.grandTotal;
    const percentChange = rev1.newTotals.grandTotal > 0
      ? (totalDifference / rev1.newTotals.grandTotal) * 100
      : 0;

    // Compare snapshots
    const snap1 = this.getItemsFromSnapshot(rev1.snapshot);
    const snap2 = this.getItemsFromSnapshot(rev2.snapshot);

    const itemChanges = this.compareSnapshots(snap1, snap2);

    return {
      revision1: {
        version: rev1.version,
        total: rev1.newTotals.grandTotal,
        date: rev1.createdAt,
      },
      revision2: {
        version: rev2.version,
        total: rev2.newTotals.grandTotal,
        date: rev2.createdAt,
      },
      totalDifference,
      percentChange,
      itemChanges,
    };
  }

  /**
   * Restore to revision
   */
  async restoreToRevision(
    estimateId: string,
    revisionId: string,
    createdBy?: string
  ): Promise<Estimate> {
    const estimate = await prisma.estimate.findUnique({
      where: { id: estimateId },
    });

    if (!estimate) {
      throw new Error('Estimate not found');
    }

    const metadata = (estimate.metadata as Record<string, unknown>) || {};
    const revisions = (metadata.revisions as StoredRevision[]) || [];
    const revision = revisions.find((r: StoredRevision) => r.id === revisionId);

    if (!revision) {
      throw new Error('Revision not found');
    }

    const snapshot = revision.snapshot;

    // Delete current sections and items
    await prisma.estimateLineItem.deleteMany({
      where: { estimateId },
    });
    await prisma.estimateSection.deleteMany({
      where: { estimateId },
    });

    // Restore from snapshot
    for (const sectionSnap of snapshot.sections || []) {
      const sectionId = uuid();
      await prisma.estimateSection.create({
        data: {
          id: sectionId,
          estimateId,
          csiCode: sectionSnap.csiCode,
          name: sectionSnap.name,
          sortOrder: 0,
          subtotalMaterial: sectionSnap.subtotalMaterial,
          subtotalLabor: sectionSnap.subtotalLabor,
          subtotalEquipment: sectionSnap.subtotalEquipment,
          subtotalSubcontractor: sectionSnap.subtotalSubcontractor,
          subtotalOther: sectionSnap.subtotalOther,
          total: sectionSnap.total,
        },
      });

      for (const itemSnap of sectionSnap.lineItems || []) {
        await prisma.estimateLineItem.create({
          data: {
            id: uuid(),
            estimateId,
            sectionId,
            csiCode: itemSnap.csiCode,
            description: itemSnap.description,
            quantity: itemSnap.quantity || 0,
            unit: itemSnap.unit || 'EA',
            unitCost: itemSnap.unitCost || 0,
            laborCost: itemSnap.laborCost || 0,
            materialCostAmt: itemSnap.materialCostAmt || 0,
            equipmentCostAmt: itemSnap.equipmentCostAmt || 0,
            subcontractorCost: itemSnap.subcontractorCost || 0,
            totalCost: itemSnap.totalCost || 0,
            sortOrder: itemSnap.sortOrder || 0,
            markup: itemSnap.markup || 0,
            wasteFactor: itemSnap.wasteFactor || 1,
            itemType: itemSnap.itemType || LineItemType.OTHER_LINE,
          },
        });
      }
    }

    // Update estimate totals from revision
    const revisionTotals = revision.newTotals;
    await prisma.estimate.update({
      where: { id: estimateId },
      data: {
        subtotalMaterial: revisionTotals.materialCost,
        subtotalLabor: revisionTotals.laborCost,
        subtotalEquipment: revisionTotals.equipmentCost,
        subtotalSubcontractor: revisionTotals.subcontractorCost,
        subtotalOther: revisionTotals.otherCost,
        subtotalDirect: revisionTotals.directCost,
        overhead: revisionTotals.overheadAmount,
        profit: revisionTotals.profitAmount,
        contingency: revisionTotals.contingencyAmount,
        bondCost: revisionTotals.bondCost,
        permitFees: revisionTotals.permitCost,
        insuranceCost: revisionTotals.insuranceCost,
        salesTax: revisionTotals.taxAmount,
        totalCost: revisionTotals.grandTotal,
        updatedAt: new Date(),
      },
    });

    // Create new revision for the restore
    await this.createRevision({
      estimateId,
      name: `Restored to v${revision.version}`,
      description: `Restored from revision ${revision.name}`,
      reason: 'OTHER',
      createdBy,
    });

    const updatedEstimate = await prisma.estimate.findUnique({
      where: { id: estimateId },
    });

    return updatedEstimate as unknown as Estimate;
  }

  /**
   * Get revision history summary
   */
  async getRevisionHistory(estimateId: string): Promise<{
    totalRevisions: number;
    firstRevision: { version: number; date: Date; total: number };
    latestRevision: { version: number; date: Date; total: number };
    totalChange: number;
    percentChange: number;
    timeline: {
      version: number;
      date: Date;
      total: number;
      change: number;
      reason: RevisionReason;
    }[];
  }> {
    const estimate = await prisma.estimate.findUnique({
      where: { id: estimateId },
    });

    if (!estimate) {
      throw new Error('Estimate not found');
    }

    const metadata = (estimate.metadata as Record<string, unknown>) || {};
    const revisions = (metadata.revisions as StoredRevision[]) || [];

    if (revisions.length === 0) {
      throw new Error('No revisions found');
    }

    // Sort by version ascending for timeline
    const sorted = [...revisions].sort((a, b) => a.version - b.version);
    const first = sorted[0];
    const latest = sorted[sorted.length - 1];

    const timeline = sorted.map((r: StoredRevision, i: number) => {
      const prevTotal = i > 0 ? sorted[i - 1].newTotals.grandTotal : 0;
      return {
        version: r.version,
        date: new Date(r.createdAt),
        total: r.newTotals.grandTotal || 0,
        change: i > 0 ? (r.newTotals.grandTotal || 0) - prevTotal : 0,
        reason: r.reason,
      };
    });

    const totalChange = (latest.newTotals.grandTotal || 0) - (first.newTotals.grandTotal || 0);
    const percentChange = first.newTotals.grandTotal > 0
      ? (totalChange / first.newTotals.grandTotal) * 100
      : 0;

    return {
      totalRevisions: revisions.length,
      firstRevision: {
        version: first.version,
        date: new Date(first.createdAt),
        total: first.newTotals.grandTotal || 0,
      },
      latestRevision: {
        version: latest.version,
        date: new Date(latest.createdAt),
        total: latest.newTotals.grandTotal || 0,
      },
      totalChange,
      percentChange,
      timeline,
    };
  }

  /**
   * Extract totals from estimate record (flat fields to EstimateTotals)
   */
  private extractTotalsFromEstimate(estimate: any): EstimateTotals {
    return {
      directCost: Number(estimate.subtotalDirect) || 0,
      materialCost: Number(estimate.subtotalMaterial) || 0,
      laborCost: Number(estimate.subtotalLabor) || 0,
      equipmentCost: Number(estimate.subtotalEquipment) || 0,
      subcontractorCost: Number(estimate.subtotalSubcontractor) || 0,
      otherCost: Number(estimate.subtotalOther) || 0,
      subtotal: Number(estimate.subtotalDirect) || 0,
      markup: 0,
      markupAmount: 0,
      contingency: Number(estimate.contingencyPercent) || 0,
      contingencyAmount: Number(estimate.contingency) || 0,
      overhead: Number(estimate.overheadPercent) || 0,
      overheadAmount: Number(estimate.overhead) || 0,
      profit: Number(estimate.profitPercent) || 0,
      profitAmount: Number(estimate.profit) || 0,
      bondCost: Number(estimate.bondCost) || 0,
      insuranceCost: Number(estimate.insuranceCost) || 0,
      permitCost: Number(estimate.permitFees) || 0,
      tax: Number(estimate.taxRate) || 0,
      taxAmount: Number(estimate.salesTax) || 0,
      grandTotal: Number(estimate.totalCost) || 0,
    };
  }

  /**
   * Calculate changes from current estimate compared to previous snapshot
   */
  private calculateChangesFromEstimate(
    estimate: any,
    previousSnapshot?: RevisionSnapshot
  ): RevisionChange[] {
    const changes: RevisionChange[] = [];

    if (!previousSnapshot) {
      // First revision - all items are additions
      for (const section of estimate.sections) {
        for (const item of section.lineItems) {
          changes.push({
            type: 'ADD',
            itemType: 'LINE_ITEM',
            itemId: item.id,
            itemCode: item.csiCode || undefined,
            itemName: item.description,
            newValue: {
              quantity: Number(item.quantity) || 0,
              totalCost: Number(item.totalCost) || 0,
            },
            costImpact: Number(item.totalCost) || 0,
          });
        }
      }
      return changes;
    }

    // Compare with previous snapshot
    const currentItems = this.getItemsFromEstimate(estimate);
    const previousItems = this.getItemsFromSnapshot(previousSnapshot);

    const prevItemMap = new Map(previousItems.map((i) => [i.id, i]));
    const currItemMap = new Map(currentItems.map((i) => [i.id, i]));

    // Find added items
    Array.from(currItemMap.entries()).forEach(([id, item]) => {
      if (!prevItemMap.has(id)) {
        changes.push({
          type: 'ADD',
          itemType: 'LINE_ITEM',
          itemId: id,
          itemCode: item.csiCode,
          itemName: item.description,
          newValue: {
            quantity: item.quantity,
            totalCost: item.totalCost,
          },
          costImpact: item.totalCost,
        });
      }
    });

    // Find removed items
    Array.from(prevItemMap.entries()).forEach(([id, item]) => {
      if (!currItemMap.has(id)) {
        changes.push({
          type: 'REMOVE',
          itemType: 'LINE_ITEM',
          itemId: id,
          itemCode: item.csiCode,
          itemName: item.description,
          previousValue: {
            quantity: item.quantity,
            totalCost: item.totalCost,
          },
          costImpact: -item.totalCost,
        });
      }
    });

    // Find modified items
    Array.from(currItemMap.entries()).forEach(([id, currItem]) => {
      const prevItem = prevItemMap.get(id);
      if (prevItem) {
        const currTotal = currItem.totalCost;
        const prevTotal = prevItem.totalCost;
        const currQty = currItem.quantity;
        const prevQty = prevItem.quantity;

        if (currTotal !== prevTotal || currQty !== prevQty) {
          changes.push({
            type: 'MODIFY',
            itemType: 'LINE_ITEM',
            itemId: id,
            itemCode: currItem.csiCode,
            itemName: currItem.description,
            previousValue: {
              quantity: prevQty,
              totalCost: prevTotal,
            },
            newValue: {
              quantity: currQty,
              totalCost: currTotal,
            },
            costImpact: currTotal - prevTotal,
          });
        }
      }
    });

    return changes;
  }

  /**
   * Get items from estimate for comparison
   */
  private getItemsFromEstimate(estimate: any): {
    id: string;
    csiCode?: string;
    description: string;
    quantity: number;
    totalCost: number;
  }[] {
    const items: { id: string; csiCode?: string; description: string; quantity: number; totalCost: number }[] = [];
    for (const section of estimate.sections || []) {
      for (const item of section.lineItems || []) {
        items.push({
          id: item.id,
          csiCode: item.csiCode || undefined,
          description: item.description,
          quantity: Number(item.quantity) || 0,
          totalCost: Number(item.totalCost) || 0,
        });
      }
    }
    return items;
  }

  /**
   * Get items from revision snapshot
   */
  private getItemsFromSnapshot(
    snapshot?: RevisionSnapshot
  ): { id: string; csiCode?: string; description: string; quantity: number; totalCost: number }[] {
    if (!snapshot) {
      return [];
    }

    const items: { id: string; csiCode?: string; description: string; quantity: number; totalCost: number }[] = [];
    for (const section of snapshot.sections || []) {
      for (const item of section.lineItems || []) {
        items.push({
          id: item.id,
          csiCode: item.csiCode,
          description: item.description,
          quantity: item.quantity || 0,
          totalCost: item.totalCost || 0,
        });
      }
    }
    return items;
  }

  /**
   * Compare two snapshots
   */
  private compareSnapshots(
    snap1Items: { id: string; csiCode?: string; description: string; quantity: number; totalCost: number }[],
    snap2Items: { id: string; csiCode?: string; description: string; quantity: number; totalCost: number }[]
  ): RevisionChange[] {
    const changes: RevisionChange[] = [];
    const map1 = new Map(snap1Items.map((i) => [i.id, i]));
    const map2 = new Map(snap2Items.map((i) => [i.id, i]));

    Array.from(map2.entries()).forEach(([id, item]) => {
      if (!map1.has(id)) {
        changes.push({
          type: 'ADD',
          itemType: 'LINE_ITEM',
          itemId: id,
          itemCode: item.csiCode,
          itemName: item.description,
          newValue: { quantity: item.quantity, totalCost: item.totalCost },
          costImpact: item.totalCost,
        });
      }
    });

    Array.from(map1.entries()).forEach(([id, item]) => {
      if (!map2.has(id)) {
        changes.push({
          type: 'REMOVE',
          itemType: 'LINE_ITEM',
          itemId: id,
          itemCode: item.csiCode,
          itemName: item.description,
          previousValue: { quantity: item.quantity, totalCost: item.totalCost },
          costImpact: -item.totalCost,
        });
      }
    });

    Array.from(map2.entries()).forEach(([id, item2]) => {
      const item1 = map1.get(id);
      if (item1 && (item1.totalCost !== item2.totalCost || item1.quantity !== item2.quantity)) {
        changes.push({
          type: 'MODIFY',
          itemType: 'LINE_ITEM',
          itemId: id,
          itemCode: item2.csiCode,
          itemName: item2.description,
          previousValue: { quantity: item1.quantity, totalCost: item1.totalCost },
          newValue: { quantity: item2.quantity, totalCost: item2.totalCost },
          costImpact: item2.totalCost - item1.totalCost,
        });
      }
    });

    return changes;
  }

  /**
   * Determine change type
   */
  private determineChangeType(changes: RevisionChange[]): ChangeType {
    const hasAdd = changes.some((c) => c.type === 'ADD');
    const hasRemove = changes.some((c) => c.type === 'REMOVE');
    const hasModify = changes.some((c) => c.type === 'MODIFY');

    if ((hasAdd && hasRemove) || (hasAdd && hasModify) || (hasRemove && hasModify)) {
      return 'MIXED';
    }
    if (hasAdd) return 'ADDITION';
    if (hasRemove) return 'DELETION';
    return 'MODIFICATION';
  }

  /**
   * Get empty totals
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
   * Map stored revision to EstimateRevision
   */
  private mapStoredRevisionToRevision(
    estimateId: string,
    stored: StoredRevision
  ): EstimateRevision {
    return {
      id: stored.id,
      estimateId,
      version: stored.version,
      name: stored.name,
      description: stored.description,
      reason: stored.reason,
      changeType: stored.changeType,
      previousTotals: stored.previousTotals || this.getEmptyTotals(),
      newTotals: stored.newTotals || this.getEmptyTotals(),
      changes: stored.changes || [],
      createdAt: new Date(stored.createdAt),
      createdBy: stored.createdBy,
      approved: stored.approved,
      approvedAt: stored.approvedAt ? new Date(stored.approvedAt) : undefined,
      approvedBy: stored.approvedBy,
      metadata: stored.metadata || {},
      snapshot: stored.snapshot,
    };
  }
}

export const revisionManager = new RevisionManager();
