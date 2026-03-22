/**
 * Infer approximate room dimensions from room type and intake context.
 * These are concept-level estimates — not engineered dimensions.
 */

import type { RoomType, RoomDimensions, ConceptIntakeInput } from './types';

// Default dimensions in feet [width, depth]
const DEFAULT_DIMENSIONS: Record<RoomType, [number, number]> = {
  kitchen:           [14, 16],
  dining:            [12, 14],
  living:            [16, 20],
  pantry:            [6,  8],
  primary_bedroom:   [14, 16],
  secondary_bedroom: [12, 12],
  primary_bathroom:  [10, 12],
  secondary_bathroom:[8,  10],
  powder_room:       [5,  8],
  laundry:           [8,  10],
  hallway:           [4,  20],
  garage:            [20, 22],
  mudroom:           [8,  10],
  office:            [12, 12],
  flex_room:         [12, 14],
  addition_room:     [14, 18],
  connecting_hall:   [4,  12],
  front_yard:        [30, 25],
  rear_yard:         [40, 35],
  side_yard:         [12, 40],
  driveway:          [10, 40],
  porch:             [20, 8],
  deck:              [16, 14],
  covered_patio:     [20, 14],
  utility:           [8,  10],
};

// Scale room size slightly based on budget bracket
const BUDGET_SCALE: Record<string, number> = {
  under_10k:  0.85,
  '10k_25k':  0.92,
  '25k_50k':  1.00,
  '50k_100k': 1.08,
  '100k_plus':1.15,
};

// Exterior features are sized by lot, not budget
const EXTERIOR_TYPES: Set<RoomType> = new Set([
  'front_yard', 'rear_yard', 'side_yard', 'driveway',
]);

export function inferRoomDimensions(
  type: RoomType,
  input: ConceptIntakeInput,
): RoomDimensions {
  const [w, d] = DEFAULT_DIMENSIONS[type] ?? [12, 12];
  const scale = EXTERIOR_TYPES.has(type) ? 1.0 : (BUDGET_SCALE[input.budgetRange] ?? 1.0);
  const widthFt = Math.round(w * scale);
  const depthFt = Math.round(d * scale);
  return { widthFt, depthFt, areaFt2: widthFt * depthFt };
}
