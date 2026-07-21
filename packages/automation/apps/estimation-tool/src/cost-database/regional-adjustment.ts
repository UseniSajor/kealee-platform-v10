/**
 * Regional Cost Adjustment Manager
 * Handles regional cost indices and adjustments
 *
 * Note: Regional indices are managed in-memory with default values.
 * Custom indices can be stored in the CostDatabase metadata field.
 */

import { PrismaClient } from '@prisma/client';
import Decimal from 'decimal.js';

const prisma = new PrismaClient();

export interface RegionalIndex {
  id: string;
  region: string;
  state: string;
  city?: string;
  zipCode?: string;
  materialIndex: Decimal;
  laborIndex: Decimal;
  equipmentIndex: Decimal;
  overallIndex: Decimal;
  effectiveDate: Date;
  expirationDate?: Date;
  source: string;
  metadata?: Record<string, unknown>;
}

export interface CostAdjustment {
  originalCost: Decimal;
  adjustedCost: Decimal;
  factor: Decimal;
  region: string;
  costType: 'MATERIAL' | 'LABOR' | 'EQUIPMENT' | 'OVERALL';
}

export interface LocationQuery {
  state?: string;
  city?: string;
  zipCode?: string;
}

// Default regional indices based on typical construction cost variations
const DEFAULT_REGIONAL_INDICES: Record<string, Partial<RegionalIndex>> = {
  // High-cost areas
  CA: { materialIndex: new Decimal(1.15), laborIndex: new Decimal(1.35), equipmentIndex: new Decimal(1.10), overallIndex: new Decimal(1.25) },
  NY: { materialIndex: new Decimal(1.20), laborIndex: new Decimal(1.40), equipmentIndex: new Decimal(1.15), overallIndex: new Decimal(1.28) },
  MA: { materialIndex: new Decimal(1.12), laborIndex: new Decimal(1.30), equipmentIndex: new Decimal(1.08), overallIndex: new Decimal(1.20) },
  WA: { materialIndex: new Decimal(1.08), laborIndex: new Decimal(1.20), equipmentIndex: new Decimal(1.05), overallIndex: new Decimal(1.12) },
  HI: { materialIndex: new Decimal(1.35), laborIndex: new Decimal(1.25), equipmentIndex: new Decimal(1.40), overallIndex: new Decimal(1.32) },
  AK: { materialIndex: new Decimal(1.40), laborIndex: new Decimal(1.30), equipmentIndex: new Decimal(1.45), overallIndex: new Decimal(1.38) },
  CT: { materialIndex: new Decimal(1.10), laborIndex: new Decimal(1.28), equipmentIndex: new Decimal(1.08), overallIndex: new Decimal(1.18) },
  NJ: { materialIndex: new Decimal(1.12), laborIndex: new Decimal(1.32), equipmentIndex: new Decimal(1.10), overallIndex: new Decimal(1.20) },

  // Average-cost areas
  FL: { materialIndex: new Decimal(1.00), laborIndex: new Decimal(0.95), equipmentIndex: new Decimal(1.00), overallIndex: new Decimal(0.98) },
  TX: { materialIndex: new Decimal(0.95), laborIndex: new Decimal(0.90), equipmentIndex: new Decimal(0.95), overallIndex: new Decimal(0.93) },
  CO: { materialIndex: new Decimal(1.02), laborIndex: new Decimal(1.05), equipmentIndex: new Decimal(1.00), overallIndex: new Decimal(1.02) },
  AZ: { materialIndex: new Decimal(0.98), laborIndex: new Decimal(0.92), equipmentIndex: new Decimal(0.98), overallIndex: new Decimal(0.96) },
  NC: { materialIndex: new Decimal(0.95), laborIndex: new Decimal(0.88), equipmentIndex: new Decimal(0.95), overallIndex: new Decimal(0.92) },
  GA: { materialIndex: new Decimal(0.96), laborIndex: new Decimal(0.90), equipmentIndex: new Decimal(0.96), overallIndex: new Decimal(0.94) },

  // Low-cost areas
  MS: { materialIndex: new Decimal(0.88), laborIndex: new Decimal(0.75), equipmentIndex: new Decimal(0.90), overallIndex: new Decimal(0.84) },
  AR: { materialIndex: new Decimal(0.85), laborIndex: new Decimal(0.78), equipmentIndex: new Decimal(0.88), overallIndex: new Decimal(0.83) },
  AL: { materialIndex: new Decimal(0.88), laborIndex: new Decimal(0.80), equipmentIndex: new Decimal(0.90), overallIndex: new Decimal(0.86) },
  WV: { materialIndex: new Decimal(0.90), laborIndex: new Decimal(0.82), equipmentIndex: new Decimal(0.92), overallIndex: new Decimal(0.88) },
  OK: { materialIndex: new Decimal(0.88), laborIndex: new Decimal(0.82), equipmentIndex: new Decimal(0.90), overallIndex: new Decimal(0.86) },

  // National average baseline
  US: { materialIndex: new Decimal(1.00), laborIndex: new Decimal(1.00), equipmentIndex: new Decimal(1.00), overallIndex: new Decimal(1.00) },
};

// In-memory storage for custom regional indices
const customRegionalIndices = new Map<string, RegionalIndex>();

export class RegionalAdjustmentManager {
  /**
   * Get regional index for location
   */
  async getRegionalIndex(location: LocationQuery): Promise<RegionalIndex | null> {
    // Try to find custom index by zip code
    if (location.zipCode) {
      const customKey = `zip-${location.zipCode}`;
      if (customRegionalIndices.has(customKey)) {
        return customRegionalIndices.get(customKey)!;
      }
    }

    // Try to find custom index by city and state
    if (location.city && location.state) {
      const customKey = `city-${location.city.toLowerCase()}-${location.state.toUpperCase()}`;
      if (customRegionalIndices.has(customKey)) {
        return customRegionalIndices.get(customKey)!;
      }
    }

    // Try to find custom index by state
    if (location.state) {
      const customKey = `state-${location.state.toUpperCase()}`;
      if (customRegionalIndices.has(customKey)) {
        return customRegionalIndices.get(customKey)!;
      }
    }

    // Fall back to default indices
    const state = location.state?.toUpperCase();
    if (state && DEFAULT_REGIONAL_INDICES[state]) {
      const defaults = DEFAULT_REGIONAL_INDICES[state];
      return {
        id: `default-${state}`,
        region: state,
        state: state,
        city: location.city,
        zipCode: location.zipCode,
        materialIndex: defaults.materialIndex || new Decimal(1.0),
        laborIndex: defaults.laborIndex || new Decimal(1.0),
        equipmentIndex: defaults.equipmentIndex || new Decimal(1.0),
        overallIndex: defaults.overallIndex || new Decimal(1.0),
        effectiveDate: new Date(),
        source: 'DEFAULT',
      };
    }

    // Return national average
    return {
      id: 'default-US',
      region: 'US',
      state: location.state || 'US',
      materialIndex: new Decimal(1.0),
      laborIndex: new Decimal(1.0),
      equipmentIndex: new Decimal(1.0),
      overallIndex: new Decimal(1.0),
      effectiveDate: new Date(),
      source: 'DEFAULT',
    };
  }

  /**
   * Adjust cost for region
   */
  async adjustCost(
    cost: number | Decimal,
    fromLocation: LocationQuery,
    toLocation: LocationQuery,
    costType: 'MATERIAL' | 'LABOR' | 'EQUIPMENT' | 'OVERALL' = 'OVERALL'
  ): Promise<CostAdjustment> {
    const originalCost = new Decimal(cost);
    const fromIndex = await this.getRegionalIndex(fromLocation);
    const toIndex = await this.getRegionalIndex(toLocation);

    if (!fromIndex || !toIndex) {
      return {
        originalCost,
        adjustedCost: originalCost,
        factor: new Decimal(1.0),
        region: toLocation.state || 'US',
        costType,
      };
    }

    // Get appropriate index based on cost type
    let fromFactor: Decimal;
    let toFactor: Decimal;

    switch (costType) {
      case 'MATERIAL':
        fromFactor = fromIndex.materialIndex;
        toFactor = toIndex.materialIndex;
        break;
      case 'LABOR':
        fromFactor = fromIndex.laborIndex;
        toFactor = toIndex.laborIndex;
        break;
      case 'EQUIPMENT':
        fromFactor = fromIndex.equipmentIndex;
        toFactor = toIndex.equipmentIndex;
        break;
      default:
        fromFactor = fromIndex.overallIndex;
        toFactor = toIndex.overallIndex;
    }

    // Calculate adjustment factor (to/from ratio)
    const factor = toFactor.dividedBy(fromFactor);
    const adjustedCost = originalCost.times(factor);

    return {
      originalCost,
      adjustedCost,
      factor,
      region: toLocation.state || 'US',
      costType,
    };
  }

  /**
   * Adjust estimate for region
   */
  async adjustEstimate(
    estimate: {
      materialCost: number;
      laborCost: number;
      equipmentCost: number;
    },
    fromLocation: LocationQuery,
    toLocation: LocationQuery
  ): Promise<{
    materialCost: CostAdjustment;
    laborCost: CostAdjustment;
    equipmentCost: CostAdjustment;
    totalOriginal: Decimal;
    totalAdjusted: Decimal;
    overallFactor: Decimal;
  }> {
    const [materialAdj, laborAdj, equipmentAdj] = await Promise.all([
      this.adjustCost(estimate.materialCost, fromLocation, toLocation, 'MATERIAL'),
      this.adjustCost(estimate.laborCost, fromLocation, toLocation, 'LABOR'),
      this.adjustCost(estimate.equipmentCost, fromLocation, toLocation, 'EQUIPMENT'),
    ]);

    const totalOriginal = new Decimal(estimate.materialCost)
      .plus(estimate.laborCost)
      .plus(estimate.equipmentCost);

    const totalAdjusted = materialAdj.adjustedCost
      .plus(laborAdj.adjustedCost)
      .plus(equipmentAdj.adjustedCost);

    const overallFactor = totalOriginal.gt(0)
      ? totalAdjusted.dividedBy(totalOriginal)
      : new Decimal(1.0);

    return {
      materialCost: materialAdj,
      laborCost: laborAdj,
      equipmentCost: equipmentAdj,
      totalOriginal,
      totalAdjusted,
      overallFactor,
    };
  }

  /**
   * Create custom regional index
   */
  createRegionalIndex(input: {
    state: string;
    city?: string;
    zipCode?: string;
    materialIndex: number;
    laborIndex: number;
    equipmentIndex: number;
    source: string;
    effectiveDate?: Date;
    expirationDate?: Date;
  }): RegionalIndex {
    const overallIndex = (input.materialIndex + input.laborIndex + input.equipmentIndex) / 3;

    const index: RegionalIndex = {
      id: `custom-${input.zipCode || input.city || input.state}-${Date.now()}`,
      region: input.city ? `${input.city}, ${input.state}` : input.state,
      state: input.state.toUpperCase(),
      city: input.city,
      zipCode: input.zipCode,
      materialIndex: new Decimal(input.materialIndex),
      laborIndex: new Decimal(input.laborIndex),
      equipmentIndex: new Decimal(input.equipmentIndex),
      overallIndex: new Decimal(overallIndex),
      effectiveDate: input.effectiveDate || new Date(),
      expirationDate: input.expirationDate,
      source: input.source,
    };

    // Store in memory
    let key: string;
    if (input.zipCode) {
      key = `zip-${input.zipCode}`;
    } else if (input.city) {
      key = `city-${input.city.toLowerCase()}-${input.state.toUpperCase()}`;
    } else {
      key = `state-${input.state.toUpperCase()}`;
    }
    customRegionalIndices.set(key, index);

    return index;
  }

  /**
   * List all regional indices (defaults + custom)
   */
  listRegionalIndices(
    options?: {
      state?: string;
      source?: string;
    }
  ): RegionalIndex[] {
    const indices: RegionalIndex[] = [];

    // Add default indices
    for (const [state, defaults] of Object.entries(DEFAULT_REGIONAL_INDICES)) {
      if (options?.state && state !== options.state.toUpperCase()) continue;
      if (options?.source && options.source !== 'DEFAULT') continue;

      indices.push({
        id: `default-${state}`,
        region: state,
        state: state,
        materialIndex: defaults.materialIndex || new Decimal(1.0),
        laborIndex: defaults.laborIndex || new Decimal(1.0),
        equipmentIndex: defaults.equipmentIndex || new Decimal(1.0),
        overallIndex: defaults.overallIndex || new Decimal(1.0),
        effectiveDate: new Date(),
        source: 'DEFAULT',
      });
    }

    // Add custom indices
    for (const [key, index] of customRegionalIndices.entries()) {
      if (options?.state && index.state !== options.state.toUpperCase()) continue;
      if (options?.source && index.source !== options.source) continue;
      indices.push(index);
    }

    return indices.sort((a, b) => a.state.localeCompare(b.state));
  }

  /**
   * Get default indices for all states
   */
  getDefaultIndices(): { state: string; index: Partial<RegionalIndex> }[] {
    return Object.entries(DEFAULT_REGIONAL_INDICES).map(([state, index]) => ({
      state,
      index,
    }));
  }

  /**
   * Compare costs across regions
   */
  async compareCostsAcrossRegions(
    baseCost: number,
    baseLocation: LocationQuery,
    targetStates: string[],
    costType: 'MATERIAL' | 'LABOR' | 'EQUIPMENT' | 'OVERALL' = 'OVERALL'
  ): Promise<
    {
      state: string;
      adjustedCost: Decimal;
      factor: Decimal;
      difference: Decimal;
      percentDifference: number;
    }[]
  > {
    const results = await Promise.all(
      targetStates.map(async (state) => {
        const adjustment = await this.adjustCost(
          baseCost,
          baseLocation,
          { state },
          costType
        );

        const difference = adjustment.adjustedCost.minus(baseCost);
        const percentDifference = new Decimal(baseCost).gt(0)
          ? difference.dividedBy(baseCost).times(100).toNumber()
          : 0;

        return {
          state,
          adjustedCost: adjustment.adjustedCost,
          factor: adjustment.factor,
          difference,
          percentDifference,
        };
      })
    );

    return results.sort((a, b) => a.adjustedCost.minus(b.adjustedCost).toNumber());
  }

  /**
   * Remove custom regional index
   */
  removeRegionalIndex(indexId: string): boolean {
    for (const [key, index] of customRegionalIndices.entries()) {
      if (index.id === indexId) {
        customRegionalIndices.delete(key);
        return true;
      }
    }
    return false;
  }

  /**
   * Clear all custom regional indices
   */
  clearCustomIndices(): void {
    customRegionalIndices.clear();
  }

  /**
   * Get regional index by ID
   */
  getRegionalIndexById(id: string): RegionalIndex | null {
    // Check if it's a default index
    if (id.startsWith('default-')) {
      const state = id.replace('default-', '');
      if (DEFAULT_REGIONAL_INDICES[state]) {
        const defaults = DEFAULT_REGIONAL_INDICES[state];
        return {
          id,
          region: state,
          state,
          materialIndex: defaults.materialIndex || new Decimal(1.0),
          laborIndex: defaults.laborIndex || new Decimal(1.0),
          equipmentIndex: defaults.equipmentIndex || new Decimal(1.0),
          overallIndex: defaults.overallIndex || new Decimal(1.0),
          effectiveDate: new Date(),
          source: 'DEFAULT',
        };
      }
    }

    // Check custom indices
    for (const index of customRegionalIndices.values()) {
      if (index.id === id) {
        return index;
      }
    }

    return null;
  }
}

export const regionalAdjustmentManager = new RegionalAdjustmentManager();
