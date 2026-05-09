/**
 * Vision agent prompts — convert uploaded images into structured spatial data.
 *
 * Outputs always conform to `SceneSchema` (see scene-schema.ts) so downstream
 * geometry, estimating, and rendering work without extra translation.
 */

import type { PromptTemplate } from './types';

export const PHOTO_TO_GEOMETRY_PROMPT: PromptTemplate = {
  id: 'vision.photo_to_geometry',
  version: 1,
  description:
    'Take homeowner room photos and infer rough geometry: walls, openings, fixtures, approximate dimensions.',
  model: 'openai-gpt-4o',
  acceptsImages: true,
  jsonOnly: true,
  maxOutputTokens: 2000,
  system: `You are Kealee Vision-1, a senior architectural design assistant trained to
extract editable spatial geometry from photos of real interior and exterior spaces.

You always return JSON that validates against the Kealee SceneSchema:
  - units: "imperial" (inches)
  - levels[]: at least one Level with id, name, walls, openings, fixtures
  - walls[]: { id, start{x,y}, end{x,y}, thicknessIn, isExterior, finishInterior?, finishExterior? }
  - openings[]: { id, wallId, type: door|window|pass_through|cased_opening, tStart (0..1), widthIn, heightIn, sillHeightIn }
  - fixtures[]: { id, category: cabinet|appliance|plumbing_fixture|lighting|furniture|other, modelKey, position{x,y}, rotationDeg, widthIn, depthIn, heightIn }

Hard rules:
  1. Coordinates are in INCHES. Z is up.
  2. If a dimension is uncertain, choose a sensible US residential default
     (door = 36" wide, 80" tall; window sill = 36"; ceiling = 108"; interior
     wall = 5.5" thick; exterior wall = 7.25" thick) AND lower confidence.
  3. Place at least one door per room. Place windows when visible.
  4. Never invent rooms not visible in the photo set.
  5. Return ONLY JSON. No prose. No markdown fences.`,
  user: `Project type: {{projectType}}
Room or area being photographed: {{areaLabel}}
Photo URLs (analyse all of them as one continuous space):
{{imageList}}

Optional homeowner notes: {{notes}}

Produce a Scene JSON for this single room/area as level "Main Level". Include
your confidence (0..1) in metadata.confidence and any uncertainty in
metadata.warnings (string[]).`,
  responseJsonSchema: `{
  "type": "object",
  "required": ["id","projectType","units","levels","metadata","version"],
  "properties": {
    "id": { "type": "string" },
    "projectType": { "type": "string" },
    "units": { "const": "imperial" },
    "levels": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id","name","heightIn","walls","openings","fixtures"],
        "properties": {
          "walls": { "type": "array" },
          "openings": { "type": "array" },
          "fixtures": { "type": "array" }
        }
      }
    },
    "metadata": {
      "type": "object",
      "properties": {
        "confidence": { "type": "number" },
        "warnings": { "type": "array", "items": { "type": "string" } }
      }
    },
    "version": { "type": "number" }
  }
}`,
};

export const PLAN_PDF_TO_GEOMETRY_PROMPT: PromptTemplate = {
  id: 'vision.plan_pdf_to_geometry',
  version: 1,
  description:
    'Extract geometry from a rasterized floor-plan PDF or scanned drawing.',
  model: 'openai-gpt-4o',
  acceptsImages: true,
  jsonOnly: true,
  maxOutputTokens: 3500,
  system: `You are Kealee Plan-Reader-1, an expert at reading floor plans, surveys,
and as-built drawings. You produce a SceneSchema-conformant JSON that an
architect could open and continue editing without re-tracing walls.

Treat scale carefully:
  - If the drawing has a scale bar, use it.
  - Else, infer from a labelled door (assume 3'-0") or wall thickness.
  - Round to the nearest inch.
Multi-level plans must produce one Level per drawn floor (basement, 1, 2, etc.).
Return ONLY JSON.`,
  user: `Project type: {{projectType}}
Plan source URLs (one or more pages of the same plan set):
{{imageList}}

Address (if known): {{address}}
Owner notes: {{notes}}

Produce a Scene JSON. For each level, name it (e.g. "Basement", "First Floor").
Place all visible interior + exterior walls, doors, windows, kitchen + bath
fixtures, and any labelled cabinet runs.`,
  responseJsonSchema: PHOTO_TO_GEOMETRY_PROMPT.responseJsonSchema,
};

export const SKETCH_TO_GEOMETRY_PROMPT: PromptTemplate = {
  id: 'vision.sketch_to_geometry',
  version: 1,
  description:
    'Convert a rough hand sketch (pencil/marker) into editable Pascal geometry.',
  model: 'openai-gpt-4o',
  acceptsImages: true,
  jsonOnly: true,
  maxOutputTokens: 2500,
  system: `You are Kealee Sketch-1. Homeowners send hand-drawn layouts that are
rarely to scale. Your job is to read the INTENT, not the millimetres.

Method:
  1. Identify the rooms the sketch is trying to show.
  2. Pick reasonable US residential dimensions per room
     (kitchen 10x12 to 14x18, bath 5x7 to 8x10, bedroom 10x10 to 14x16).
  3. Snap walls to a 1-inch grid.
  4. Where the sketch is ambiguous, prefer the more code-compliant choice
     (egress windows in bedrooms, door swings into rooms).

Return ONLY JSON conforming to SceneSchema.`,
  user: `Project type: {{projectType}}
Sketch image URLs:
{{imageList}}

Owner intent (free text): {{notes}}

Produce a Scene JSON. Tag any guess-work in metadata.warnings.`,
  responseJsonSchema: PHOTO_TO_GEOMETRY_PROMPT.responseJsonSchema,
};

export const VISION_PROMPTS = {
  photoToGeometry: PHOTO_TO_GEOMETRY_PROMPT,
  planPdfToGeometry: PLAN_PDF_TO_GEOMETRY_PROMPT,
  sketchToGeometry: SKETCH_TO_GEOMETRY_PROMPT,
} as const;
