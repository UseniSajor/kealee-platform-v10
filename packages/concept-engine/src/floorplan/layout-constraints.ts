/**
 * Residential layout hard constraints (IRC-based minimums).
 * These are checked after optimization — violations are flagged, not rejected.
 */

import type { RoomType } from './types';

export interface CodeMinimum {
  minAreaFt2?: number;
  minDimensionFt?: number;  // shortest side must meet this
  minClearanceFt?: number;  // aisle/clearance width
  requiresExteriorWall: boolean;
  requiresEgress: boolean;
}

/** IRC residential code minimums by room type */
export const CODE_MINIMUMS: Partial<Record<RoomType, CodeMinimum>> = {
  primary_bedroom: {
    minAreaFt2: 70,
    minDimensionFt: 7,
    requiresExteriorWall: true,
    requiresEgress: true,
  },
  secondary_bedroom: {
    minAreaFt2: 70,
    minDimensionFt: 7,
    requiresExteriorWall: true,
    requiresEgress: true,
  },
  kitchen: {
    minAreaFt2: 50,
    minClearanceFt: 3.5,  // 42" work aisle
    requiresExteriorWall: false,
    requiresEgress: false,
  },
  primary_bathroom: {
    minAreaFt2: 35,
    minDimensionFt: 5,
    requiresExteriorWall: false,
    requiresEgress: false,
  },
  secondary_bathroom: {
    minAreaFt2: 35,
    minDimensionFt: 5,
    requiresExteriorWall: false,
    requiresEgress: false,
  },
  powder_room: {
    minAreaFt2: 18,
    requiresExteriorWall: false,
    requiresEgress: false,
  },
  hallway: {
    minDimensionFt: 3,  // 36" min ADA path
    requiresExteriorWall: false,
    requiresEgress: false,
  },
  living: {
    minAreaFt2: 120,
    minDimensionFt: 7,
    requiresExteriorWall: true,
    requiresEgress: false,
  },
};

export interface CodeViolation {
  roomId: string;
  roomLabel: string;
  violation: string;
  severity: 'error' | 'warning';
}

export function checkCodeCompliance(
  rooms: Array<{ id: string; type: RoomType; label: string; widthFt: number; depthFt: number; areaFt2: number }>,
): { violations: CodeViolation[]; compliant: boolean } {
  const violations: CodeViolation[] = [];

  for (const room of rooms) {
    const min = CODE_MINIMUMS[room.type];
    if (!min) continue;

    if (min.minAreaFt2 && room.areaFt2 < min.minAreaFt2) {
      violations.push({
        roomId: room.id,
        roomLabel: room.label,
        violation: `${room.label} area (${Math.round(room.areaFt2)} ft²) is below IRC minimum (${min.minAreaFt2} ft²)`,
        severity: 'error',
      });
    }

    if (min.minDimensionFt) {
      const shortest = Math.min(room.widthFt, room.depthFt);
      if (shortest < min.minDimensionFt) {
        violations.push({
          roomId: room.id,
          roomLabel: room.label,
          violation: `${room.label} smallest dimension (${shortest}') is below minimum (${min.minDimensionFt}')`,
          severity: 'error',
        });
      }
    }
  }

  return { violations, compliant: violations.filter(v => v.severity === 'error').length === 0 };
}

/** Rooms that benefit from exterior wall placement (natural light / egress) */
export const EXTERIOR_PREFERRED: Set<RoomType> = new Set([
  'primary_bedroom',
  'secondary_bedroom',
  'living',
  'kitchen',
  'dining',
  'office',
]);

/** Rooms that are interior-acceptable (no exterior wall needed) */
export const INTERIOR_OK: Set<RoomType> = new Set([
  'hallway',
  'connecting_hall',
  'laundry',
  'pantry',
  'mudroom',
  'utility',
  'garage',
]);

/** Max travel distance from any room to egress (exterior door), in feet */
export const MAX_EGRESS_DISTANCE_FT = 75;
