/**
 * Budget Tracker Sync
 * Integration with APP-07 Budget Tracker
 */

import { PrismaClient, EstimateSection } from '@prisma/client';
import { v4 as uuid } from 'uuid';
import Decimal from 'decimal.js';

const prisma = new PrismaClient();

export interface BudgetItem {
  id: string;
  projectId: string;
  category: string;
  subcategory: string | null;
  description: string;
  budgetedAmount: number;
  committedAmount: number;
  actualAmount: number;
  variance: number;
  variancePercent: number;
  status: string;
}

export interface BudgetSyncResult {
  success: boolean;
  syncedAt: Date;
  itemsSynced: number;
  totalBudget: number;
  variances: {
    category: string;
    estimated: number;
    budgeted: number;
    variance: number;
    variancePercent: number;
  }[];
  errors?: string[];
}

export interface BudgetTransfer {
  estimateId: string;
  projectId: string;
  mode: 'CREATE' | 'UPDATE' | 'SUPPLEMENT';
  adjustments?: {
    category: string;
    adjustmentPercent?: number;
    adjustmentAmount?: number;
  }[];
}

// Interface for sync log stored in estimate metadata
interface SyncLogEntry {
  id: string;
  mode: string;
  itemsSynced: number;
  totalBudget: number;
  variances: BudgetSyncResult['variances'];
  syncedAt: Date;
}

export class BudgetTrackerSync {
  private readonly budgetTrackerUrl: string;

  constructor() {
    this.budgetTrackerUrl = process.env.BUDGET_TRACKER_URL || 'http://localhost:3007';
  }

  /**
   * Transfer estimate to budget
   */
  async transferToBudget(transfer: BudgetTransfer): Promise<BudgetSyncResult> {
    const result: BudgetSyncResult = {
      success: true,
      syncedAt: new Date(),
      itemsSynced: 0,
      totalBudget: 0,
      variances: [],
      errors: [],
    };

    try {
      const estimate = await prisma.estimate.findUnique({
        where: { id: transfer.estimateId },
        include: {
          sections: {
            include: { lineItems: true },
          },
        },
      });

      if (!estimate) {
        throw new Error('Estimate not found');
      }

      // Get existing budget if updating
      let existingBudget: BudgetItem[] = [];
      if (transfer.mode !== 'CREATE') {
        existingBudget = await this.getProjectBudget(transfer.projectId);
      }

      // Process each section
      for (const section of estimate.sections) {
        // Use flat field 'total' from EstimateSection
        let budgetAmount = new Decimal(section.total || 0);

        // Apply adjustments - use csiCode instead of code
        const adjustment = transfer.adjustments?.find(
          (a: { category: string; adjustmentPercent?: number; adjustmentAmount?: number }) =>
            a.category === section.csiCode?.substring(0, 2)
        );

        if (adjustment) {
          if (adjustment.adjustmentPercent) {
            budgetAmount = budgetAmount.times(1 + adjustment.adjustmentPercent / 100);
          }
          if (adjustment.adjustmentAmount) {
            budgetAmount = budgetAmount.plus(adjustment.adjustmentAmount);
          }
        }

        // Create or update budget line - use csiCode instead of code
        const existingItem = existingBudget.find(
          (b: BudgetItem) => b.category === section.csiCode?.substring(0, 2)
        );

        if (transfer.mode === 'CREATE' || !existingItem) {
          await prisma.budgetLine.create({
            data: {
              id: uuid(),
              projectId: transfer.projectId,
              category: section.csiCode?.substring(0, 2) || 'OTHER',
              subcategory: section.csiCode || null,
              description: section.name,
              budgetedAmount: budgetAmount.toNumber(),
              committedAmount: 0,
              actualAmount: 0,
              variance: 0,
              variancePercent: 0,
              status: 'ON_TRACK',
            },
          });
        } else if (transfer.mode === 'UPDATE') {
          const newVariance = existingItem.committedAmount - budgetAmount.toNumber();
          const newVariancePercent = budgetAmount.toNumber() > 0
            ? (newVariance / budgetAmount.toNumber()) * 100
            : 0;

          await prisma.budgetLine.update({
            where: { id: existingItem.id },
            data: {
              budgetedAmount: budgetAmount.toNumber(),
              variance: newVariance,
              variancePercent: newVariancePercent,
              status: newVariancePercent > 10 ? 'OVER_BUDGET' : newVariancePercent > 5 ? 'AT_RISK' : 'ON_TRACK',
            },
          });

          result.variances.push({
            category: section.name,
            estimated: budgetAmount.toNumber(),
            budgeted: existingItem.budgetedAmount,
            variance: budgetAmount.toNumber() - existingItem.budgetedAmount,
            variancePercent: existingItem.budgetedAmount > 0
              ? ((budgetAmount.toNumber() - existingItem.budgetedAmount) / existingItem.budgetedAmount) * 100
              : 0,
          });
        } else if (transfer.mode === 'SUPPLEMENT') {
          const newBudget = existingItem.budgetedAmount + budgetAmount.toNumber();
          const newVariance = existingItem.committedAmount - newBudget;
          const newVariancePercent = newBudget > 0 ? (newVariance / newBudget) * 100 : 0;

          await prisma.budgetLine.update({
            where: { id: existingItem.id },
            data: {
              budgetedAmount: newBudget,
              variance: newVariance,
              variancePercent: newVariancePercent,
              status: newVariancePercent > 10 ? 'OVER_BUDGET' : newVariancePercent > 5 ? 'AT_RISK' : 'ON_TRACK',
            },
          });
        }

        result.itemsSynced++;
        result.totalBudget += budgetAmount.toNumber();
      }

      // Record sync event in estimate metadata instead of separate table
      const existingMetadata = (estimate.metadata as Record<string, unknown>) || {};
      const syncLogs: SyncLogEntry[] = (existingMetadata.budgetSyncLogs as SyncLogEntry[]) || [];

      syncLogs.unshift({
        id: uuid(),
        mode: transfer.mode,
        itemsSynced: result.itemsSynced,
        totalBudget: result.totalBudget,
        variances: result.variances,
        syncedAt: result.syncedAt,
      });

      // Keep only last 20 sync logs
      const trimmedLogs = syncLogs.slice(0, 20);

      await prisma.estimate.update({
        where: { id: transfer.estimateId },
        data: {
          metadata: {
            ...existingMetadata,
            budgetSyncLogs: trimmedLogs,
            lastBudgetSync: result.syncedAt,
          } as any,
        },
      });

    } catch (error) {
      result.success = false;
      result.errors?.push(String(error));
    }

    return result;
  }

  /**
   * Get project budget
   */
  async getProjectBudget(projectId: string): Promise<BudgetItem[]> {
    const items = await prisma.budgetLine.findMany({
      where: { projectId },
      orderBy: { category: 'asc' },
    });

    return items.map((item) => ({
      id: item.id,
      projectId: item.projectId,
      category: item.category,
      subcategory: item.subcategory,
      description: item.description,
      budgetedAmount: Number(item.budgetedAmount),
      committedAmount: Number(item.committedAmount),
      actualAmount: Number(item.actualAmount),
      variance: Number(item.variance),
      variancePercent: Number(item.variancePercent),
      status: item.status,
    }));
  }

  /**
   * Compare estimate to budget
   */
  async compareEstimateToBudget(
    estimateId: string,
    projectId: string
  ): Promise<{
    estimate: {
      total: number;
      byCategory: { category: string; amount: number }[];
    };
    budget: {
      total: number;
      byCategory: { category: string; amount: number }[];
    };
    comparison: {
      category: string;
      estimated: number;
      budgeted: number;
      variance: number;
      variancePercent: number;
      status: 'UNDER' | 'ON_TARGET' | 'OVER';
    }[];
    summary: {
      totalVariance: number;
      totalVariancePercent: number;
      categoriesOverBudget: number;
      categoriesUnderBudget: number;
    };
  }> {
    const estimate = await prisma.estimate.findUnique({
      where: { id: estimateId },
      include: { sections: true },
    });

    if (!estimate) {
      throw new Error('Estimate not found');
    }

    const budget = await this.getProjectBudget(projectId);

    // Build estimate by category - use csiCode and total fields
    const estimateByCategory: { category: string; amount: number }[] = [];
    for (const section of estimate.sections) {
      estimateByCategory.push({
        category: section.csiCode?.substring(0, 2) || 'OTHER',
        amount: Number(section.total) || 0,
      });
    }

    // Build budget by category
    const budgetByCategory = budget.map((b: BudgetItem) => ({
      category: b.category,
      amount: b.budgetedAmount,
    }));

    // Build comparison
    const allCategories = new Set([
      ...estimateByCategory.map((e: { category: string; amount: number }) => e.category),
      ...budgetByCategory.map((b: { category: string; amount: number }) => b.category),
    ]);

    const comparison: {
      category: string;
      estimated: number;
      budgeted: number;
      variance: number;
      variancePercent: number;
      status: 'UNDER' | 'ON_TARGET' | 'OVER';
    }[] = [];

    let totalEstimated = 0;
    let totalBudgeted = 0;
    let categoriesOver = 0;
    let categoriesUnder = 0;

    for (const category of allCategories) {
      const estimated = estimateByCategory.find((e: { category: string; amount: number }) => e.category === category)?.amount || 0;
      const budgeted = budgetByCategory.find((b: { category: string; amount: number }) => b.category === category)?.amount || 0;
      const variance = estimated - budgeted;
      const variancePercent = budgeted > 0 ? (variance / budgeted) * 100 : 0;

      let status: 'UNDER' | 'ON_TARGET' | 'OVER';
      if (variancePercent > 5) {
        status = 'OVER';
        categoriesOver++;
      } else if (variancePercent < -5) {
        status = 'UNDER';
        categoriesUnder++;
      } else {
        status = 'ON_TARGET';
      }

      comparison.push({
        category,
        estimated,
        budgeted,
        variance,
        variancePercent,
        status,
      });

      totalEstimated += estimated;
      totalBudgeted += budgeted;
    }

    const totalVariance = totalEstimated - totalBudgeted;
    const totalVariancePercent = totalBudgeted > 0
      ? (totalVariance / totalBudgeted) * 100
      : 0;

    return {
      estimate: {
        // Use flat totalCost field from Estimate
        total: Number(estimate.totalCost) || totalEstimated,
        byCategory: estimateByCategory,
      },
      budget: {
        total: budget.reduce((sum: number, b: BudgetItem) => sum + b.budgetedAmount, 0),
        byCategory: budgetByCategory,
      },
      comparison,
      summary: {
        totalVariance,
        totalVariancePercent,
        categoriesOverBudget: categoriesOver,
        categoriesUnderBudget: categoriesUnder,
      },
    };
  }

  /**
   * Get budget status for estimate
   */
  async getBudgetStatus(
    estimateId: string
  ): Promise<{
    hasActiveBudget: boolean;
    lastSyncAt?: Date;
    currentBudgetTotal?: number;
    estimateTotal: number;
    variance?: number;
  }> {
    const estimate = await prisma.estimate.findUnique({
      where: { id: estimateId },
    });

    if (!estimate) {
      throw new Error('Estimate not found');
    }

    // Use flat totalCost field from Estimate
    const estimateTotal = Number(estimate.totalCost) || 0;

    // Get sync logs from estimate metadata
    const metadata = (estimate.metadata as Record<string, unknown>) || {};
    const syncLogs = (metadata.budgetSyncLogs as SyncLogEntry[]) || [];
    const lastSync = syncLogs.length > 0 ? syncLogs[0] : null;

    if (!lastSync) {
      return {
        hasActiveBudget: false,
        estimateTotal,
      };
    }

    // Get budget lines for the project
    const budgetLines = estimate.projectId
      ? await prisma.budgetLine.findMany({
          where: { projectId: estimate.projectId },
        })
      : [];

    if (budgetLines.length === 0) {
      return {
        hasActiveBudget: false,
        estimateTotal,
      };
    }

    const currentBudgetTotal = budgetLines.reduce(
      (sum: number, b) => sum + Number(b.budgetedAmount),
      0
    );

    return {
      hasActiveBudget: true,
      lastSyncAt: lastSync.syncedAt ? new Date(lastSync.syncedAt) : undefined,
      currentBudgetTotal,
      estimateTotal,
      variance: estimateTotal - currentBudgetTotal,
    };
  }

  /**
   * Get sync history
   */
  async getSyncHistory(
    estimateId: string
  ): Promise<{
    id: string;
    mode: string;
    itemsSynced: number;
    totalBudget: number;
    syncedAt: Date;
  }[]> {
    const estimate = await prisma.estimate.findUnique({
      where: { id: estimateId },
    });

    if (!estimate) {
      return [];
    }

    // Get sync logs from estimate metadata
    const metadata = (estimate.metadata as Record<string, unknown>) || {};
    const syncLogs = (metadata.budgetSyncLogs as SyncLogEntry[]) || [];

    return syncLogs.map((log: SyncLogEntry) => ({
      id: log.id,
      mode: log.mode,
      itemsSynced: log.itemsSynced,
      totalBudget: Number(log.totalBudget),
      syncedAt: new Date(log.syncedAt),
    }));
  }
}

export const budgetTrackerSync = new BudgetTrackerSync();
