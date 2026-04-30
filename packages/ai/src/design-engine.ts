/**
 * Design Engine — Replicate-powered architectural concept image generation
 *
 * Turns intake data into engineered prompts → Replicate SDXL images → structured output.
 * Tier logic: basic=1 image, advanced=3 images, premium=4 images + floor plan
 */

import Replicate from 'replicate'

// ---------------------------------------------------------------------------
// Style presets injected into every prompt
// ---------------------------------------------------------------------------

const STYLE_PRESETS: Record<string, string> = {
  modern:      'modern architecture, glass facade, clean lines, minimalist design',
  luxury:      'high-end residential, premium materials, elegant sophisticated design',
  traditional: 'traditional architecture, classic materials, timeless craftsmanship',
  rustic:      'rustic architecture, natural wood, stone accents, warm character',
  industrial:  'industrial design, exposed concrete, steel elements, urban aesthetic',
  budget:      'cost-efficient construction, simple materials, practical clean design',
}

const QUALITY_SUFFIX =
  'photorealistic, architectural rendering, ultra detailed, 8k resolution, ' +
  'realistic materials, global illumination, ray tracing, professional lighting, ' +
  'sharp shadows, depth of field, hyper realistic'

const CONCEPT_ANGLES = [
  'primary design, cinematic wide angle, golden hour lighting',
  'alternative facade concept, different material palette, overcast dramatic sky',
  'value-engineered version, simplified materials, still premium quality',
  'aerial perspective showing full site context and landscaping',
]

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DesignEngineInput {
  projectType: string
  scope: string
  style?: string
  budget?: string
  location?: string
  tier?: 'basic' | 'advanced' | 'premium'
}

export interface DesignEngineOutput {
  images: string[]
  floorPlans: string[]
  prompts: string[]
  descriptions: string[]
  style: string
  confidence: number
}

// ---------------------------------------------------------------------------
// Prompt builders
// ---------------------------------------------------------------------------

export function buildPrompts(input: DesignEngineInput): string[] {
  const styleKey = input.style?.toLowerCase() ?? 'modern'
  const stylePreset = STYLE_PRESETS[styleKey] ?? STYLE_PRESETS.modern
  const location = input.location ?? 'residential setting'

  const base = [
    input.projectType,
    input.scope,
    stylePreset,
    location,
    QUALITY_SUFFIX,
  ].join(', ')

  return CONCEPT_ANGLES.map(angle => `${base}, ${angle}`)
}

export function buildFloorPlanPrompt(input: DesignEngineInput): string {
  return [
    'architectural floor plan',
    input.projectType,
    'top view, black and white, clean layout, labeled rooms',
    'scaled drawing, professional architectural drawing',
    'precise dimensions, door swings, wall thickness shown',
  ].join(', ')
}

// ---------------------------------------------------------------------------
// Image generation via Replicate SDXL
// ---------------------------------------------------------------------------

export async function generateImages(prompts: string[]): Promise<string[]> {
  const token = process.env.REPLICATE_API_TOKEN
  if (!token) {
    console.warn('[design-engine] REPLICATE_API_TOKEN not set — skipping image generation')
    return []
  }

  const replicate = new Replicate({ auth: token })
  const images: string[] = []

  for (const prompt of prompts) {
    try {
      const output = (await replicate.run('stability-ai/sdxl:latest', {
        input: { prompt, width: 1024, height: 768, num_outputs: 1 },
      })) as string[]

      if (output?.[0]) images.push(output[0])
    } catch (err: any) {
      console.error('[design-engine] Replicate call failed:', err?.message ?? err)
    }
  }

  return images
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

const TIER_IMAGE_COUNTS: Record<string, number> = {
  basic:    1,
  advanced: 3,
  premium:  4,
}

const CONCEPT_DESCRIPTIONS = [
  'Primary design concept with optimal material selection and curb appeal.',
  'Alternative facade exploring a different material palette and composition.',
  'Value-engineered version — same design quality with cost-efficient materials.',
  'Site aerial showing full lot context, landscaping, and neighbour relationship.',
]

export async function runDesignEngine(input: DesignEngineInput): Promise<DesignEngineOutput> {
  const count = TIER_IMAGE_COUNTS[input.tier ?? 'advanced'] ?? 3

  const allPrompts = buildPrompts(input)
  const activePrompts = allPrompts.slice(0, count)

  // Generate concept images
  const images = await generateImages(activePrompts)

  // Generate floor plan only for premium tier
  let floorPlans: string[] = []
  if (input.tier === 'premium') {
    floorPlans = await generateImages([buildFloorPlanPrompt(input)])
  }

  const styleKey = input.style ?? 'modern'
  const styleLabel = styleKey.charAt(0).toUpperCase() + styleKey.slice(1)

  return {
    images,
    floorPlans,
    prompts: activePrompts,
    descriptions: images.map((_, i) => CONCEPT_DESCRIPTIONS[i] ?? `Design concept ${i + 1}`),
    style: `${styleLabel} Architecture`,
    confidence: 0.85,
  }
}
