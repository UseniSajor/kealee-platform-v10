/**
 * Assemble the complete visual prompt bundle for a concept package.
 * Includes Midjourney + Stable Diffusion prompts, descriptions, and metadata.
 */

import type { ConceptIntakeInput, FloorPlanJson } from '../floorplan/types';
import { buildMidjourneyPrompts, getStyleKeywords } from './build-midjourney-prompt';
import { buildStableDiffusionPrompts } from './build-stable-diffusion-prompt';
import type { SDPromptPair } from './build-stable-diffusion-prompt';

export interface VisualPromptBundle {
  version:               string;
  generatedAt:           string;
  projectPath:           string;
  styleKeywords:         string[];
  materialKeywords:      string[];
  // Midjourney (mood / wow / client-facing)
  midjourneyPrompts:     string[];
  // Stable Diffusion (controlled generation pipeline)
  stableDiffusionPairs:  SDPromptPair[];
  stableDiffusionPrompts:string[]; // positive prompts only (flat list)
  // Human-readable descriptions
  descriptions:          string[];
  roomFocus:             string[];
  // Handoff consistency fields
  consistencyNotes:      string[];
  paletteSuggestion:     string;
  lightingDirection:     string;
  cameraGuidance:        string;
}

export function buildVisualPromptBundle(
  input: ConceptIntakeInput,
  floorplan: FloorPlanJson,
): VisualPromptBundle {
  const mjPrompts = buildMidjourneyPrompts(input, floorplan);
  const sdPairs   = buildStableDiffusionPrompts(input, floorplan);
  const styleKws  = getStyleKeywords(input.stylePreferences);
  const matKws    = input.desiredMaterials ?? inferMaterialKeywords(input);

  const descriptions = floorplan.rooms.map((room, i) => {
    const style = input.stylePreferences[0] ?? 'contemporary';
    return `${room.label}: ${style} interior concept, ` +
      `approximately ${room.widthFt}' × ${room.depthFt}', ` +
      `emphasizing ${styleKws.slice(0, 2).join(' and ')}.`;
  });

  const consistencyNotes = [
    `All rooms use the same style vocabulary: ${styleKws.slice(0, 3).join(', ')}.`,
    `Material palette is consistent across spaces for visual continuity.`,
    `Lighting direction: ${inferLightingDirection(input)}.`,
    `Color temperature should be warm (2700K–3000K) for interior renders.`,
    `Camera should be set at 5–6 feet height, wide angle (24–35mm equivalent).`,
  ];

  return {
    version:              '1.0',
    generatedAt:          new Date().toISOString(),
    projectPath:          input.projectPath,
    styleKeywords:        styleKws,
    materialKeywords:     matKws,
    midjourneyPrompts:    mjPrompts,
    stableDiffusionPairs: sdPairs,
    stableDiffusionPrompts: sdPairs.map(p => p.positivePrompt),
    descriptions,
    roomFocus:            floorplan.rooms.map(r => r.label),
    consistencyNotes,
    paletteSuggestion:    inferPaletteSuggestion(input),
    lightingDirection:    inferLightingDirection(input),
    cameraGuidance:       'Wide angle (24–35mm), 5–6 ft camera height, eye-level or slightly low',
  };
}

function inferMaterialKeywords(input: ConceptIntakeInput): string[] {
  const style = input.stylePreferences[0]?.toLowerCase() ?? 'transitional';
  const defaults: Record<string, string[]> = {
    modern:        ['polished concrete', 'white oak', 'brushed metal'],
    contemporary:  ['stone', 'warm oak', 'matte black'],
    traditional:   ['marble', 'cherry', 'oil-rubbed bronze'],
    craftsman:     ['quartersawn oak', 'slate', 'copper'],
    farmhouse:     ['white oak', 'quartz', 'aged brass'],
    transitional:  ['quartz', 'medium oak', 'chrome'],
    mediterranean: ['terracotta', 'plaster', 'wrought iron'],
    industrial:    ['concrete', 'weathered steel', 'reclaimed wood'],
  };
  return defaults[style] ?? defaults.transitional;
}

function inferPaletteSuggestion(input: ConceptIntakeInput): string {
  if (input.preferredColorPalette && input.preferredColorPalette.length > 0) {
    return input.preferredColorPalette.join(', ');
  }
  const style = input.stylePreferences[0]?.toLowerCase() ?? 'transitional';
  const palettes: Record<string, string> = {
    modern:        'White, warm gray, black accents',
    contemporary:  'Warm whites, camel, terracotta accents',
    traditional:   'Cream, navy, warm wood tones',
    craftsman:     'Warm greens, brown, natural wood',
    farmhouse:     'White, warm gray, natural wood, black accents',
    transitional:  'Warm whites, greige, soft blues, natural wood',
    mediterranean: 'Terra cotta, gold, deep blue, warm plaster white',
    industrial:    'Charcoal, rust, natural wood, concrete',
  };
  return palettes[style] ?? palettes.transitional;
}

function inferLightingDirection(input: ConceptIntakeInput): string {
  const style = input.stylePreferences[0]?.toLowerCase() ?? '';
  if (['modern', 'industrial'].includes(style)) return 'dramatic directional light with deep shadows';
  if (['farmhouse', 'craftsman'].includes(style)) return 'warm diffused golden hour light';
  if (['mediterranean'].includes(style)) return 'warm afternoon Mediterranean sunlight';
  return 'soft natural light from windows with warm ambient fill';
}
