/**
 * Price Updater
 * Automated price updates for material costs
 *
 * Note: Price update schedules and logs are managed in-memory.
 * For production, consider storing these in a dedicated database table.
 */

import { PrismaClient, MaterialCategory } from '@prisma/client';
import { v4 as uuid } from 'uuid';
import Decimal from 'decimal.js';

const prisma = new PrismaClient();

export interface PriceUpdate {
  id: string;
  costDatabaseId: string;
  source: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  itemsProcessed: number;
  itemsUpdated: number;
  itemsFailed: number;
  startedAt: Date;
  completedAt?: Date;
  errors: string[];
  summary?: PriceUpdateSummary;
}

export interface PriceUpdateSummary {
  totalItems: number;
  updatedItems: number;
  unchangedItems: number;
  newItems: number;
  removedItems: number;
  averageChange: number;
  largestIncrease: { item: string; change: number };
  largestDecrease: { item: string; change: number };
}

export interface ExternalPriceSource {
  name: string;
  type: 'API' | 'FILE' | 'MANUAL';
  url?: string;
  credentials?: Record<string, string>;
  mapping: PriceSourceMapping;
}

export interface PriceSourceMapping {
  codeField: string;
  nameField: string;
  priceField: string;
  unitField?: string;
  categoryField?: string;
  descriptionField?: string;
}

export interface PriceUpdateItem {
  csiCode?: string;
  name: string;
  price: number;
  unit?: string;
  category?: MaterialCategory;
  description?: string;
  metadata?: Record<string, unknown>;
}

// In-memory storage for price update logs
const priceUpdateLogs = new Map<string, PriceUpdate>();

// In-memory storage for scheduled updates
interface ScheduledUpdate {
  id: string;
  costDatabaseId: string;
  sourceName: string;
  sourceType: string;
  sourceConfig: ExternalPriceSource;
  cronExpression: string;
  isActive: boolean;
  lastRun: Date | null;
  nextRun: Date;
}
const scheduledUpdates = new Map<string, ScheduledUpdate>();

export class PriceUpdater {
  /**
   * Start a price update job
   */
  async startUpdate(
    costDatabaseId: string,
    source: string,
    items: PriceUpdateItem[]
  ): Promise<PriceUpdate> {
    const update: PriceUpdate = {
      id: uuid(),
      costDatabaseId,
      source,
      status: 'IN_PROGRESS',
      itemsProcessed: 0,
      itemsUpdated: 0,
      itemsFailed: 0,
      startedAt: new Date(),
      errors: [],
    };

    // Save update record
    priceUpdateLogs.set(update.id, update);

    try {
      const result = await this.processItems(costDatabaseId, items, update);
      update.status = 'COMPLETED';
      update.completedAt = new Date();
      update.summary = result;
    } catch (error) {
      update.status = 'FAILED';
      update.errors.push(String(error));
      update.completedAt = new Date();
    }

    priceUpdateLogs.set(update.id, update);
    return update;
  }

  /**
   * Process price update items
   */
  private async processItems(
    costDatabaseId: string,
    items: PriceUpdateItem[],
    update: PriceUpdate
  ): Promise<PriceUpdateSummary> {
    const summary: PriceUpdateSummary = {
      totalItems: items.length,
      updatedItems: 0,
      unchangedItems: 0,
      newItems: 0,
      removedItems: 0,
      averageChange: 0,
      largestIncrease: { item: '', change: 0 },
      largestDecrease: { item: '', change: 0 },
    };

    const changes: number[] = [];

    for (const item of items) {
      try {
        update.itemsProcessed++;

        // Find existing material by CSI code or name
        const existing = await prisma.materialCost.findFirst({
          where: {
            costDatabaseId,
            OR: [
              ...(item.csiCode ? [{ csiCode: item.csiCode }] : []),
              { name: item.name },
            ],
          },
        });

        if (existing) {
          const oldPrice = new Decimal(existing.unitCost.toString());
          const newPrice = new Decimal(item.price);

          if (!oldPrice.equals(newPrice)) {
            // Get current price history
            const priceHistory = (existing.priceHistory as any[]) || [];
            priceHistory.push({
              date: new Date(),
              unitCost: oldPrice.toString(),
              source: update.source,
              notes: 'Automated price update',
            });

            // Update price
            await prisma.materialCost.update({
              where: { id: existing.id },
              data: {
                unitCost: item.price,
                ...(item.name && { name: item.name }),
                ...(item.description && { description: item.description }),
                priceHistory: priceHistory as any,
                lastUpdated: new Date(),
                metadata: {
                  ...((existing.metadata as any) || {}),
                  lastPriceUpdate: new Date(),
                  previousPrice: oldPrice.toNumber(),
                  priceSource: update.source,
                } as any,
              },
            });

            summary.updatedItems++;
            update.itemsUpdated++;

            const change = newPrice.minus(oldPrice).dividedBy(oldPrice).times(100).toNumber();
            changes.push(change);

            // Track largest changes
            if (change > summary.largestIncrease.change) {
              summary.largestIncrease = { item: item.csiCode || item.name, change };
            }
            if (change < summary.largestDecrease.change) {
              summary.largestDecrease = { item: item.csiCode || item.name, change };
            }
          } else {
            summary.unchangedItems++;
          }
        } else {
          // Create new material item
          await prisma.materialCost.create({
            data: {
              id: uuid(),
              costDatabaseId,
              csiCode: item.csiCode,
              category: item.category || 'OTHER_MATERIAL',
              name: item.name,
              description: item.description,
              unit: item.unit || 'EA',
              unitCost: item.price,
              wasteFactor: 1.05,
              isActive: true,
              lastUpdated: new Date(),
              priceHistory: [],
              metadata: {
                priceSource: update.source,
                importedAt: new Date(),
                ...item.metadata,
              } as any,
            },
          });

          summary.newItems++;
          update.itemsUpdated++;
        }
      } catch (error) {
        update.itemsFailed++;
        update.errors.push(`Failed to process ${item.csiCode || item.name}: ${error}`);
      }
    }

    // Calculate average change
    if (changes.length > 0) {
      summary.averageChange = changes.reduce((sum, c) => sum + c, 0) / changes.length;
    }

    return summary;
  }

  /**
   * Schedule periodic price updates
   */
  scheduleUpdate(
    costDatabaseId: string,
    source: ExternalPriceSource,
    cronExpression: string
  ): { scheduled: boolean; nextRun?: Date } {
    const key = `${costDatabaseId}-${source.name}`;
    const nextRun = this.getNextRunTime(cronExpression);

    const schedule: ScheduledUpdate = {
      id: uuid(),
      costDatabaseId,
      sourceName: source.name,
      sourceType: source.type,
      sourceConfig: source,
      cronExpression,
      isActive: true,
      lastRun: null,
      nextRun,
    };

    scheduledUpdates.set(key, schedule);

    return {
      scheduled: true,
      nextRun,
    };
  }

  /**
   * Get pending scheduled updates
   */
  getPendingUpdates(): {
    costDatabaseId: string;
    source: ExternalPriceSource;
    scheduledFor: Date;
  }[] {
    const now = new Date();
    const pending: {
      costDatabaseId: string;
      source: ExternalPriceSource;
      scheduledFor: Date;
    }[] = [];

    for (const schedule of scheduledUpdates.values()) {
      if (schedule.isActive && schedule.nextRun <= now) {
        pending.push({
          costDatabaseId: schedule.costDatabaseId,
          source: schedule.sourceConfig,
          scheduledFor: schedule.nextRun,
        });
      }
    }

    return pending;
  }

  /**
   * Get update history for database
   */
  getUpdateHistory(
    costDatabaseId: string,
    options?: { limit?: number; source?: string }
  ): PriceUpdate[] {
    const history: PriceUpdate[] = [];

    for (const update of priceUpdateLogs.values()) {
      if (update.costDatabaseId === costDatabaseId) {
        if (options?.source && update.source !== options.source) continue;
        history.push(update);
      }
    }

    // Sort by startedAt descending
    history.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());

    // Apply limit
    if (options?.limit) {
      return history.slice(0, options.limit);
    }

    return history;
  }

  /**
   * Get price change analytics
   */
  async getPriceAnalytics(
    costDatabaseId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      category?: MaterialCategory;
    }
  ): Promise<{
    periodStart: Date;
    periodEnd: Date;
    totalItems: number;
    itemsWithChanges: number;
    averageChange: number;
    categoryBreakdown: { category: MaterialCategory; averageChange: number; count: number }[];
    topIncreases: { csiCode: string | null; name: string; change: number }[];
    topDecreases: { csiCode: string | null; name: string; change: number }[];
  }> {
    const startDate = options?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = options?.endDate || new Date();

    const items = await prisma.materialCost.findMany({
      where: {
        costDatabaseId,
        ...(options?.category && { category: options.category }),
        lastUpdated: { gte: startDate, lte: endDate },
      },
    });

    const changes: {
      csiCode: string | null;
      name: string;
      category: MaterialCategory;
      change: number;
    }[] = [];

    for (const item of items) {
      const metadata = item.metadata as any;
      if (metadata?.previousPrice !== undefined) {
        const oldPrice = new Decimal(metadata.previousPrice);
        const newPrice = new Decimal(item.unitCost.toString());
        if (!oldPrice.equals(0)) {
          const change = newPrice.minus(oldPrice).dividedBy(oldPrice).times(100).toNumber();
          changes.push({
            csiCode: item.csiCode,
            name: item.name,
            category: item.category,
            change,
          });
        }
      }
    }

    // Calculate category breakdown
    const categoryMap = new Map<MaterialCategory, { total: number; count: number }>();
    for (const c of changes) {
      const cat = c.category;
      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, { total: 0, count: 0 });
      }
      const entry = categoryMap.get(cat)!;
      entry.total += c.change;
      entry.count++;
    }

    const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      averageChange: data.total / data.count,
      count: data.count,
    }));

    // Get top changes
    const sorted = [...changes].sort((a, b) => b.change - a.change);
    const topIncreases = sorted.slice(0, 10).filter((c) => c.change > 0);
    const topDecreases = sorted.slice(-10).filter((c) => c.change < 0).reverse();

    const averageChange = changes.length > 0
      ? changes.reduce((sum, c) => sum + c.change, 0) / changes.length
      : 0;

    return {
      periodStart: startDate,
      periodEnd: endDate,
      totalItems: items.length,
      itemsWithChanges: changes.length,
      averageChange,
      categoryBreakdown,
      topIncreases,
      topDecreases,
    };
  }

  /**
   * Validate price update items
   */
  validateItems(items: PriceUpdateItem[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.name) {
        errors.push(`Item ${i + 1}: Missing name`);
      }
      if (item.price === undefined || item.price === null || isNaN(item.price)) {
        errors.push(`Item ${i + 1} (${item.csiCode || item.name}): Invalid price`);
      }
      if (item.price < 0) {
        errors.push(`Item ${i + 1} (${item.csiCode || item.name}): Negative price`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Get update by ID
   */
  getUpdate(id: string): PriceUpdate | null {
    return priceUpdateLogs.get(id) || null;
  }

  /**
   * Cancel scheduled update
   */
  cancelScheduledUpdate(costDatabaseId: string, sourceName: string): boolean {
    const key = `${costDatabaseId}-${sourceName}`;
    const schedule = scheduledUpdates.get(key);
    if (schedule) {
      schedule.isActive = false;
      scheduledUpdates.set(key, schedule);
      return true;
    }
    return false;
  }

  /**
   * Get all scheduled updates for a database
   */
  getScheduledUpdates(costDatabaseId: string): ScheduledUpdate[] {
    const schedules: ScheduledUpdate[] = [];
    for (const schedule of scheduledUpdates.values()) {
      if (schedule.costDatabaseId === costDatabaseId) {
        schedules.push(schedule);
      }
    }
    return schedules;
  }

  /**
   * Clear update history
   */
  clearUpdateHistory(costDatabaseId?: string): void {
    if (costDatabaseId) {
      for (const [id, update] of priceUpdateLogs.entries()) {
        if (update.costDatabaseId === costDatabaseId) {
          priceUpdateLogs.delete(id);
        }
      }
    } else {
      priceUpdateLogs.clear();
    }
  }

  /**
   * Get next run time from cron expression
   */
  private getNextRunTime(cron: string): Date {
    // Simplified - return next day at midnight
    // In production, use a cron parser library like 'node-cron' or 'cron-parser'
    const next = new Date();
    next.setDate(next.getDate() + 1);
    next.setHours(0, 0, 0, 0);
    return next;
  }

  /**
   * Mark scheduled update as run
   */
  markScheduledUpdateRun(costDatabaseId: string, sourceName: string): void {
    const key = `${costDatabaseId}-${sourceName}`;
    const schedule = scheduledUpdates.get(key);
    if (schedule) {
      schedule.lastRun = new Date();
      schedule.nextRun = this.getNextRunTime(schedule.cronExpression);
      scheduledUpdates.set(key, schedule);
    }
  }
}

export const priceUpdater = new PriceUpdater();
