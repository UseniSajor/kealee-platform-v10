/**
 * Build Stable Diffusion prompts for the concept floor plan rooms.
 * Structured for SDXL / SD 1.5 with positive + negative prompt pairs.
 */

import type { ConceptIntakeInput, FloorPlanJson } from '../floorplan/types';
import { getStyleKeywords } from './build-midjourney-prompt';

export interface SDPromptPair {
  roomLabel:      string;
  positivePrompt: string;
  negativePrompt: string;
  steps:          number;
  cfgScale:       number;
  aspectRatio:    string;
}

const ROOM_SD_CONTEXT: Record<string, string> = {
  kitchen:           '(modern kitchen interior:1.3), large island, professional appliances, cabinetry',
  dining:            '(dining room interior:1.3), statement chandelier, dining table, artwork',
  living:            '(living room interior:1.3), sofa, coffee table, large windows, fireplace',
  pantry:            '(walk-in pantry:1.2), organized shelving, storage jars, clean aesthetic',
  primary_bedroom:   '(primary bedroom suite:1.3), bed with headboard, nightstands, ensuite bathroom glimpse',
  secondary_bedroom: '(bedroom interior:1.2), bed, desk, windows, comfortable atmosphere',
  primary_bathroom:  '(primary bathroom:1.3), freestanding tub, walk-in shower, double vanity',
  secondary_bathroom:'(bathroom interior:1.2), tile shower, vanity, clean finishes',
  powder_room:       '(powder room:1.2), statement vanity, bold wallcovering, designer fixtures',
  laundry:           '(laundry room:1.2), washer dryer, cabinetry, utility sink, clean organization',
  office:            '(home office interior:1.2), desk, built-in shelves, good lighting, focused space',
  flex_room:         '(flexible room interior:1.2), multi-purpose, natural light, clean design',
  addition_room:     '(home addition interior:1.2), large windows, connection to existing home, bright space',
  front_yard:        '(residential front yard:1.3), landscaping, front walk, curb appeal, garden beds',
  rear_yard:         '(residential backyard:1.3), outdoor furniture, garden, privacy plantings, patio',
  porch:             '(covered front porch:1.2), porch furniture, ceiling fan, welcoming atmosphere',
  deck:              '(outdoor deck:1.2), deck furniture, planters, string lights, outdoor dining',
  covered_patio:     '(covered patio:1.2), outdoor seating, ceiling, shade, outdoor living',
  driveway:          '(residential driveway:1.2), paver or concrete, border planting, curb appeal',
};

const NEGATIVE_BASE =
  'cartoon, anime, watermark, text overlay, signature, blurry, out of focus, ' +
  'low quality, noise, compression artifacts, distorted perspective, fisheye, ' +
  'oversaturated, overexposed, clutter, messy, old, dated, poor construction';

export function buildStableDiffusionPrompts(
  input: ConceptIntakeInput,
  floorplan: FloorPlanJson,
): SDPromptPair[] {
  const styleKws  = getStyleKeywords(input.stylePreferences);
  const styleStr  = styleKws.slice(0, 4).join(', ');
  const materials = (input.desiredMaterials ?? []).slice(0, 3).join(', ');
  const matStr    = materials ? `(${materials}:1.1), ` : '';

  return floorplan.rooms.map(room => {
    const context = ROOM_SD_CONTEXT[room.type] ?? `(${room.label.toLowerCase()} interior:1.2)`;

    const positive = [
      '(photorealistic:1.4)',
      '(architectural photography:1.3)',
      context,
      `(${styleStr}:1.2)`,
      matStr,
      '(natural light:1.2)',
      '(high end residential:1.3)',
      '(interior design magazine quality:1.2)',
      '(sharp focus:1.2)',
      '8k, ultra detailed',
    ].filter(Boolean).join(', ');

    const negative = NEGATIVE_BASE + ', construction mess, unfinished, drywall exposed';

    return {
      roomLabel:      room.label,
      positivePrompt: positive,
      negativePrompt: negative,
      steps:          30,
      cfgScale:       7.5,
      aspectRatio:    '16:9',
    };
  });
}
