/**
 * Takeoff Manager
 * Manage takeoff sessions for quantity extraction
 *
 * Note: Takeoff data is stored in-memory and can be exported to/imported from
 * Estimate.metadata for persistence.
 */

import { v4 as uuid } from 'uuid';

// In-memory storage for takeoffs (keyed by takeoff ID)
const takeoffStore = new Map<string, TakeoffRecord>();
const measurementStore = new Map<string, TakeoffMeasurementRecord[]>();

interface TakeoffRecord {
  id: string;
  estimateId?: string;
  projectId?: string;
  name: string;
  type: string;
  status: string;
  documentUrls: string[];
  pageCount: number;
  scale?: string;
  scaleValue?: number;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface TakeoffMeasurementRecord {
  id: string;
  takeoffId: string;
  category: string;
  subcategory?: string;
  description: string;
  location?: string;
  floor?: string;
  room?: string;
  measurementType: string;
  length?: number;
  width?: number;
  height?: number;
  area?: number;
  volume?: number;
  count?: number;
  unit: string;
  quantity: number;
  pageNumber?: number;
  coordinates?: { x: number; y: number }[];
  sourceMethod: string;
  linkedAssemblyId?: string;
  linkedMaterialId?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface Takeoff {
  id: string;
  estimateId?: string;
  projectId?: string;
  name: string;
  type: TakeoffType;
  status: TakeoffStatus;
  documentUrls: string[];
  pageCount: number;
  scale?: string;
  scaleValue?: number; // inches per foot
  measurements: TakeoffMeasurement[];
  summary: TakeoffSummary;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type TakeoffType =
  | 'ARCHITECTURAL'
  | 'STRUCTURAL'
  | 'MECHANICAL'
  | 'ELECTRICAL'
  | 'PLUMBING'
  | 'SITE'
  | 'GENERAL';

export type TakeoffStatus =
  | 'DRAFT'
  | 'IN_PROGRESS'
  | 'REVIEW'
  | 'COMPLETED'
  | 'ARCHIVED';

export interface TakeoffMeasurement {
  id: string;
  takeoffId: string;
  category: string;
  subcategory?: string;
  description: string;
  location?: string;
  floor?: string;
  room?: string;
  measurementType: MeasurementType;
  length?: number;
  width?: number;
  height?: number;
  area?: number;
  volume?: number;
  count?: number;
  unit: string;
  quantity: number;
  pageNumber?: number;
  coordinates?: { x: number; y: number }[];
  sourceMethod: 'MANUAL' | 'PLAN_MEASUREMENT' | 'AI_EXTRACTED' | 'CALCULATED';
  linkedAssemblyId?: string;
  linkedMaterialId?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export type MeasurementType =
  | 'LINEAR'
  | 'AREA'
  | 'VOLUME'
  | 'COUNT'
  | 'PERIMETER';

export interface TakeoffSummary {
  totalMeasurements: number;
  byCategory: { category: string; count: number; totalQuantity: number; unit: string }[];
  byFloor: { floor: string; count: number }[];
  lastUpdated: Date;
}

export interface CreateTakeoffInput {
  estimateId?: string;
  projectId?: string;
  name: string;
  type: TakeoffType;
  documentUrls?: string[];
  pageCount?: number;
  scale?: string;
  createdBy?: string;
}

export interface CreateMeasurementInput {
  takeoffId: string;
  category: string;
  subcategory?: string;
  description: string;
  location?: string;
  floor?: string;
  room?: string;
  measurementType: MeasurementType;
  length?: number;
  width?: number;
  height?: number;
  area?: number;
  volume?: number;
  count?: number;
  unit: string;
  pageNumber?: number;
  coordinates?: { x: number; y: number }[];
  sourceMethod?: TakeoffMeasurement['sourceMethod'];
  linkedAssemblyId?: string;
  linkedMaterialId?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export class TakeoffManager {
  /**
   * Create a new takeoff session
   */
  async createTakeoff(input: CreateTakeoffInput): Promise<Takeoff> {
    const now = new Date();
    const takeoff: TakeoffRecord = {
      id: uuid(),
      estimateId: input.estimateId,
      projectId: input.projectId,
      name: input.name,
      type: input.type,
      status: 'DRAFT',
      documentUrls: input.documentUrls || [],
      pageCount: input.pageCount || 0,
      scale: input.scale,
      createdBy: input.createdBy,
      createdAt: now,
      updatedAt: now,
    };

    takeoffStore.set(takeoff.id, takeoff);
    measurementStore.set(takeoff.id, []);

    return this.mapToTakeoff(takeoff, []);
  }

  /**
   * Get takeoff by ID
   */
  async getTakeoff(id: string): Promise<Takeoff | null> {
    const takeoff = takeoffStore.get(id);
    if (!takeoff) return null;

    const measurements = measurementStore.get(id) || [];
    const sortedMeasurements = [...measurements].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    );

    return this.mapToTakeoff(takeoff, sortedMeasurements);
  }

  /**
   * List takeoffs
   */
  async listTakeoffs(options?: {
    estimateId?: string;
    projectId?: string;
    status?: TakeoffStatus;
    type?: TakeoffType;
    limit?: number;
  }): Promise<Takeoff[]> {
    let takeoffs = Array.from(takeoffStore.values());

    // Apply filters
    if (options?.estimateId) {
      takeoffs = takeoffs.filter((t: TakeoffRecord) => t.estimateId === options.estimateId);
    }
    if (options?.projectId) {
      takeoffs = takeoffs.filter((t: TakeoffRecord) => t.projectId === options.projectId);
    }
    if (options?.status) {
      takeoffs = takeoffs.filter((t: TakeoffRecord) => t.status === options.status);
    }
    if (options?.type) {
      takeoffs = takeoffs.filter((t: TakeoffRecord) => t.type === options.type);
    }

    // Sort by createdAt descending
    takeoffs.sort((a: TakeoffRecord, b: TakeoffRecord) => b.createdAt.getTime() - a.createdAt.getTime());

    // Apply limit
    const limit = options?.limit || 50;
    takeoffs = takeoffs.slice(0, limit);

    return takeoffs.map((t: TakeoffRecord) => {
      const measurements = measurementStore.get(t.id) || [];
      return this.mapToTakeoff(t, measurements);
    });
  }

  /**
   * Update takeoff
   */
  async updateTakeoff(
    id: string,
    updates: Partial<{
      name: string;
      status: TakeoffStatus;
      documentUrls: string[];
      pageCount: number;
      scale: string;
    }>
  ): Promise<Takeoff> {
    const takeoff = takeoffStore.get(id);
    if (!takeoff) {
      throw new Error('Takeoff not found');
    }

    const updated: TakeoffRecord = {
      ...takeoff,
      ...updates,
      updatedAt: new Date(),
    };
    takeoffStore.set(id, updated);

    const measurements = measurementStore.get(id) || [];
    return this.mapToTakeoff(updated, measurements);
  }

  /**
   * Add measurement to takeoff
   */
  async addMeasurement(input: CreateMeasurementInput): Promise<TakeoffMeasurement> {
    const quantity = this.calculateQuantity(input);
    const now = new Date();

    const measurement: TakeoffMeasurementRecord = {
      id: uuid(),
      takeoffId: input.takeoffId,
      category: input.category,
      subcategory: input.subcategory,
      description: input.description,
      location: input.location,
      floor: input.floor,
      room: input.room,
      measurementType: input.measurementType,
      length: input.length,
      width: input.width,
      height: input.height,
      area: input.area,
      volume: input.volume,
      count: input.count,
      unit: input.unit,
      quantity,
      pageNumber: input.pageNumber,
      coordinates: input.coordinates,
      sourceMethod: input.sourceMethod || 'MANUAL',
      linkedAssemblyId: input.linkedAssemblyId,
      linkedMaterialId: input.linkedMaterialId,
      notes: input.notes,
      metadata: input.metadata,
      createdAt: now,
    };

    // Add to measurement store
    const measurements = measurementStore.get(input.takeoffId) || [];
    measurements.push(measurement);
    measurementStore.set(input.takeoffId, measurements);

    // Update takeoff timestamp
    const takeoff = takeoffStore.get(input.takeoffId);
    if (takeoff) {
      takeoff.updatedAt = now;
      takeoffStore.set(input.takeoffId, takeoff);
    }

    return this.mapToMeasurement(measurement);
  }

  /**
   * Update measurement
   */
  async updateMeasurement(
    id: string,
    updates: Partial<CreateMeasurementInput>
  ): Promise<TakeoffMeasurement> {
    // Find measurement across all takeoffs
    let existing: TakeoffMeasurementRecord | undefined;
    let takeoffId: string | undefined;

    for (const [tid, measurements] of measurementStore.entries()) {
      const found = measurements.find((m: TakeoffMeasurementRecord) => m.id === id);
      if (found) {
        existing = found;
        takeoffId = tid;
        break;
      }
    }

    if (!existing || !takeoffId) {
      throw new Error('Measurement not found');
    }

    const merged = { ...existing, ...updates };
    const quantity = this.calculateQuantity(merged as CreateMeasurementInput);

    const updatedMeasurement: TakeoffMeasurementRecord = {
      ...existing,
      ...updates,
      quantity,
    };

    // Update in store
    const measurements = measurementStore.get(takeoffId) || [];
    const index = measurements.findIndex((m: TakeoffMeasurementRecord) => m.id === id);
    if (index !== -1) {
      measurements[index] = updatedMeasurement;
      measurementStore.set(takeoffId, measurements);
    }

    return this.mapToMeasurement(updatedMeasurement);
  }

  /**
   * Delete measurement
   */
  async deleteMeasurement(id: string): Promise<void> {
    // Find measurement across all takeoffs
    for (const [takeoffId, measurements] of measurementStore.entries()) {
      const index = measurements.findIndex((m: TakeoffMeasurementRecord) => m.id === id);
      if (index !== -1) {
        measurements.splice(index, 1);
        measurementStore.set(takeoffId, measurements);

        // Update takeoff timestamp
        const takeoff = takeoffStore.get(takeoffId);
        if (takeoff) {
          takeoff.updatedAt = new Date();
          takeoffStore.set(takeoffId, takeoff);
        }
        break;
      }
    }
  }

  /**
   * Bulk add measurements
   */
  async addMeasurements(
    takeoffId: string,
    measurements: Omit<CreateMeasurementInput, 'takeoffId'>[]
  ): Promise<TakeoffMeasurement[]> {
    const results: TakeoffMeasurement[] = [];

    for (const m of measurements) {
      const result = await this.addMeasurement({ ...m, takeoffId });
      results.push(result);
    }

    return results;
  }

  /**
   * Get measurements by category
   */
  async getMeasurementsByCategory(
    takeoffId: string
  ): Promise<Map<string, TakeoffMeasurement[]>> {
    const measurements = measurementStore.get(takeoffId) || [];
    const sortedMeasurements = [...measurements].sort(
      (a: TakeoffMeasurementRecord, b: TakeoffMeasurementRecord) => a.category.localeCompare(b.category)
    );

    const byCategory = new Map<string, TakeoffMeasurement[]>();

    for (const m of sortedMeasurements) {
      const mapped = this.mapToMeasurement(m);
      if (!byCategory.has(m.category)) {
        byCategory.set(m.category, []);
      }
      byCategory.get(m.category)!.push(mapped);
    }

    return byCategory;
  }

  /**
   * Get summary statistics
   */
  async getSummary(takeoffId: string): Promise<TakeoffSummary> {
    const measurements = measurementStore.get(takeoffId) || [];

    const byCategory: { [key: string]: { count: number; totalQuantity: number; unit: string } } = {};
    const byFloor: { [key: string]: number } = {};

    for (const m of measurements) {
      // By category
      if (!byCategory[m.category]) {
        byCategory[m.category] = { count: 0, totalQuantity: 0, unit: m.unit };
      }
      byCategory[m.category].count++;
      byCategory[m.category].totalQuantity += Number(m.quantity);

      // By floor
      const floor = m.floor || 'Unspecified';
      byFloor[floor] = (byFloor[floor] || 0) + 1;
    }

    return {
      totalMeasurements: measurements.length,
      byCategory: Object.entries(byCategory).map(([category, data]) => ({
        category,
        ...data,
      })),
      byFloor: Object.entries(byFloor).map(([floor, count]) => ({ floor, count })),
      lastUpdated: new Date(),
    };
  }

  /**
   * Clone takeoff
   */
  async cloneTakeoff(id: string, newName?: string): Promise<Takeoff> {
    const original = await this.getTakeoff(id);
    if (!original) {
      throw new Error('Takeoff not found');
    }

    const cloned = await this.createTakeoff({
      estimateId: original.estimateId,
      projectId: original.projectId,
      name: newName || `${original.name} (Copy)`,
      type: original.type,
      documentUrls: original.documentUrls,
      pageCount: original.pageCount,
      scale: original.scale,
    });

    // Clone measurements
    for (const m of original.measurements) {
      await this.addMeasurement({
        takeoffId: cloned.id,
        category: m.category,
        subcategory: m.subcategory,
        description: m.description,
        location: m.location,
        floor: m.floor,
        room: m.room,
        measurementType: m.measurementType,
        length: m.length,
        width: m.width,
        height: m.height,
        area: m.area,
        volume: m.volume,
        count: m.count,
        unit: m.unit,
        pageNumber: m.pageNumber,
        coordinates: m.coordinates,
        sourceMethod: m.sourceMethod,
        linkedAssemblyId: m.linkedAssemblyId,
        linkedMaterialId: m.linkedMaterialId,
        notes: m.notes,
        metadata: m.metadata,
      });
    }

    return this.getTakeoff(cloned.id) as Promise<Takeoff>;
  }

  /**
   * Delete takeoff and all measurements
   */
  async deleteTakeoff(id: string): Promise<void> {
    measurementStore.delete(id);
    takeoffStore.delete(id);
  }

  /**
   * Calculate quantity from measurement inputs
   */
  private calculateQuantity(input: CreateMeasurementInput): number {
    switch (input.measurementType) {
      case 'LINEAR':
        return input.length || 0;
      case 'AREA':
        if (input.area) return input.area;
        return (input.length || 0) * (input.width || 0);
      case 'VOLUME':
        if (input.volume) return input.volume;
        return (input.length || 0) * (input.width || 0) * (input.height || 0);
      case 'COUNT':
        return input.count || 0;
      case 'PERIMETER':
        if (input.length && input.width) {
          return 2 * (input.length + input.width);
        }
        return input.length || 0;
      default:
        return 0;
    }
  }

  /**
   * Export takeoff data for storage in Estimate.metadata
   */
  exportToMetadata(takeoffId: string): {
    takeoff: TakeoffRecord;
    measurements: TakeoffMeasurementRecord[];
  } | null {
    const takeoff = takeoffStore.get(takeoffId);
    if (!takeoff) return null;

    const measurements = measurementStore.get(takeoffId) || [];
    return { takeoff, measurements };
  }

  /**
   * Import takeoff data from Estimate.metadata
   */
  importFromMetadata(data: {
    takeoff: TakeoffRecord;
    measurements: TakeoffMeasurementRecord[];
  }): void {
    takeoffStore.set(data.takeoff.id, data.takeoff);
    measurementStore.set(data.takeoff.id, data.measurements);
  }

  /**
   * Clear all in-memory data
   */
  clearAll(): void {
    takeoffStore.clear();
    measurementStore.clear();
  }

  /**
   * Map record to Takeoff
   */
  private mapToTakeoff(record: TakeoffRecord, measurements: TakeoffMeasurementRecord[]): Takeoff {
    const mappedMeasurements = measurements.map((m: TakeoffMeasurementRecord) => this.mapToMeasurement(m));

    // Calculate summary
    const byCategory: { [key: string]: { count: number; totalQuantity: number; unit: string } } = {};
    const byFloor: { [key: string]: number } = {};

    for (const m of mappedMeasurements) {
      if (!byCategory[m.category]) {
        byCategory[m.category] = { count: 0, totalQuantity: 0, unit: m.unit };
      }
      byCategory[m.category].count++;
      byCategory[m.category].totalQuantity += m.quantity;

      const floor = m.floor || 'Unspecified';
      byFloor[floor] = (byFloor[floor] || 0) + 1;
    }

    return {
      id: record.id,
      estimateId: record.estimateId,
      projectId: record.projectId,
      name: record.name,
      type: record.type as TakeoffType,
      status: record.status as TakeoffStatus,
      documentUrls: record.documentUrls || [],
      pageCount: record.pageCount,
      scale: record.scale,
      scaleValue: record.scaleValue,
      measurements: mappedMeasurements,
      summary: {
        totalMeasurements: mappedMeasurements.length,
        byCategory: Object.entries(byCategory).map(([category, data]) => ({
          category,
          ...data,
        })),
        byFloor: Object.entries(byFloor).map(([floor, count]) => ({ floor, count })),
        lastUpdated: record.updatedAt,
      },
      createdBy: record.createdBy,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  /**
   * Map record to TakeoffMeasurement
   */
  private mapToMeasurement(record: TakeoffMeasurementRecord): TakeoffMeasurement {
    return {
      id: record.id,
      takeoffId: record.takeoffId,
      category: record.category,
      subcategory: record.subcategory,
      description: record.description,
      location: record.location,
      floor: record.floor,
      room: record.room,
      measurementType: record.measurementType as MeasurementType,
      length: record.length ? Number(record.length) : undefined,
      width: record.width ? Number(record.width) : undefined,
      height: record.height ? Number(record.height) : undefined,
      area: record.area ? Number(record.area) : undefined,
      volume: record.volume ? Number(record.volume) : undefined,
      count: record.count ? Number(record.count) : undefined,
      unit: record.unit,
      quantity: Number(record.quantity),
      pageNumber: record.pageNumber,
      coordinates: record.coordinates,
      sourceMethod: record.sourceMethod as TakeoffMeasurement['sourceMethod'],
      linkedAssemblyId: record.linkedAssemblyId,
      linkedMaterialId: record.linkedMaterialId,
      notes: record.notes,
      metadata: record.metadata,
      createdAt: record.createdAt,
    };
  }
}

export const takeoffManager = new TakeoffManager();
