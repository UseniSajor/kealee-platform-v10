/**
 * Build Midjourney prompts for each room in the concept floor plan.
 * Prompts are structured for mood/wow/client visuals — not technical drawings.
 */

import type { ConceptIntakeInput, FloorPlanJson } from '../floorplan/types';

// Style → Midjourney style keywords
const STYLE_KEYWORDS: Record<string, string[]> = {
  modern:       ['minimalist', 'clean lines', 'monochromatic palette', 'open plan'],
  contemporary: ['modern organic', 'warm neutrals', 'sculptural fixtures', 'layered textures'],
  traditional:  ['classic moldings', 'rich wood tones', 'formal symmetry', 'paneled millwork'],
  craftsman:    ['exposed beams', 'natural wood', 'craftsman detailing', 'earthy palette'],
  farmhouse:    ['shiplap', 'white oak floors', 'apron sink', 'reclaimed wood accents'],
  transitional: ['timeless mix', 'neutral palette', 'updated classic elements', 'clean silhouettes'],
  mediterranean:['terracotta accents', 'arched openings', 'warm plaster walls', 'iron hardware'],
  industrial:   ['exposed brick', 'steel and glass', 'concrete surfaces', 'Edison lighting'],
};

// Room → default prompt context
const ROOM_CONTEXT: Record<string, string> = {
  kitchen:           'spacious kitchen with large island and professional appliances',
  dining:            'elegant dining room with statement lighting',
  living:            'light-filled living room with comfortable furniture grouping',
  pantry:            'organized walk-in pantry with custom shelving',
  primary_bedroom:   'serene primary bedroom suite with luxurious finishes',
  secondary_bedroom: 'comfortable bedroom with ample natural light',
  primary_bathroom:  'spa-inspired primary bathroom with walk-in shower and soaking tub',
  secondary_bathroom:'clean bathroom with quality tile and fixtures',
  powder_room:       'stylish powder room with statement vanity and bold finishes',
  laundry:           'functional laundry room with cabinetry and utility sink',
  office:            'productive home office with built-in shelving and natural light',
  flex_room:         'versatile flex room with multi-function layout',
  addition_room:     'bright addition with large windows and connection to existing home',
  front_yard:        'welcoming front landscape with curb appeal plantings and hardscape',
  rear_yard:         'private rear garden with outdoor living space',
  porch:             'inviting covered porch with comfortable seating',
  deck:              'expansive outdoor deck with dining and lounge area',
  covered_patio:     'shaded covered patio for year-round outdoor living',
  driveway:          'elegant driveway approach with border plantings',
};

const BASE_QUALITY = '--ar 16:9 --q 2 --style raw --v 6';

export function buildMidjourneyPrompts(
  input: ConceptIntakeInput,
  floorplan: FloorPlanJson,
): string[] {
  const styleKws = getStyleKeywords(input.stylePreferences);
  const materialKws = getMaterialKeywords(input);
  const lightingKw  = getLightingKeyword(input);

  return floorplan.rooms.map(room => {
    const context  = ROOM_CONTEXT[room.type] ?? `${room.label.toLowerCase()} interior`;
    const styleStr = styleKws.slice(0, 3).join(', ');
    const matStr   = materialKws.slice(0, 2).join(', ');

    return [
      `photorealistic interior architecture photography`,
      context,
      styleStr,
      matStr,
      lightingKw,
      `professional staging, wide angle, high resolution`,
      `${input.projectPath.replace(/_/g, ' ')} renovation concept`,
      BASE_QUALITY,
    ].filter(Boolean).join(', ');
  });
}

export function getStyleKeywords(stylePreferences: string[]): string[] {
  const kws = new Set<string>();
  for (const pref of stylePreferences) {
    const found = STYLE_KEYWORDS[pref.toLowerCase()];
    if (found) found.forEach(k => kws.add(k));
  }
  if (kws.size === 0) {
    STYLE_KEYWORDS.transitional.forEach(k => kws.add(k));
  }
  return Array.from(kws);
}

function getMaterialKeywords(input: ConceptIntakeInput): string[] {
  if (input.desiredMaterials && input.desiredMaterials.length > 0) {
    return input.desiredMaterials.slice(0, 4);
  }
  // Default material directions per style
  const style = input.stylePreferences[0]?.toLowerCase() ?? 'transitional';
  const defaults: Record<string, string[]> = {
    modern:       ['polished concrete', 'white oak', 'brushed nickel'],
    contemporary: ['stone surfaces', 'warm wood', 'matte black hardware'],
    traditional:  ['marble counters', 'cherry wood', 'oil-rubbed bronze'],
    craftsman:    ['quartersawn oak', 'green slate tile', 'copper fixtures'],
    farmhouse:    ['white oak floors', 'quartz counters', 'matte fixtures'],
    transitional: ['quartz surfaces', 'medium-tone wood', 'chrome hardware'],
    mediterranean:['terracotta tile', 'warm plaster', 'wrought iron'],
    industrial:   ['polished concrete', 'weathered steel', 'reclaimed wood'],
  };
  return defaults[style] ?? defaults.transitional;
}

function getLightingKeyword(input: ConceptIntakeInput): string {
  const style = input.stylePreferences[0]?.toLowerCase() ?? '';
  if (['modern', 'industrial'].includes(style)) return 'dramatic lighting with shadows';
  if (['farmhouse', 'craftsman'].includes(style)) return 'warm golden hour light';
  if (['mediterranean'].includes(style)) return 'warm Mediterranean afternoon light';
  return 'abundant natural light with soft interior lighting';
}
