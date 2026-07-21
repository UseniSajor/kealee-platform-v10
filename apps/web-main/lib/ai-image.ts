/**
 * AI image-generation provider abstraction.
 *
 * Production path: Flux 1.1 Pro Ultra on Replicate (4MP, ~$0.06/image,
 * best-in-class architectural realism as of 2026-05).
 *
 * Legacy path:    Stable Diffusion XL — kept for backward compatibility with
 *                 existing pascal_render_jobs rows whose model_version still
 *                 points at SDXL.
 *
 * All providers return a Replicate prediction id; callers poll via
 * `replicate.predictions.get(id)` (already wired in /api/editor/renders/[id]).
 */

import Replicate from 'replicate'
import { AI_MODELS, type ImageProvider } from '@kealee/core-rules'

export interface GenerateImageInput {
  prompt: string
  negativePrompt?: string
  /** Optional image URL for img2img / structural guidance. */
  inputImageUrl?: string
  /** How many output images to request (some providers cap this). */
  count?: number
  /** Aspect ratio. Defaults to 16:9 (architectural). */
  aspectRatio?: '16:9' | '4:3' | '1:1' | '3:4' | '9:16'
  /** Provider override. Defaults to Flux 1.1 Pro Ultra. */
  provider?: ImageProvider
  /** Optional Replicate webhook URL. */
  webhookUrl?: string
}

export interface GenerateImageResult {
  provider: ImageProvider
  modelVersion: string
  predictionId: string
  status: 'starting' | 'processing'
}

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })

/**
 * Submit an image-generation job. Returns immediately with a prediction id;
 * caller is responsible for polling completion via Replicate.
 */
export async function generateImages(
  input: GenerateImageInput,
): Promise<GenerateImageResult> {
  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error('REPLICATE_API_TOKEN is not configured')
  }

  // Pick provider. Img2img cases default to flux-1.1-pro (better at preserving
  // structure than Ultra); pure text-to-image defaults to Ultra.
  const provider: ImageProvider =
    input.provider ??
    (input.inputImageUrl ? 'flux-1.1-pro' : 'flux-1.1-pro-ultra')

  if (provider === 'sdxl') {
    return submitSdxl(input)
  }
  if (provider === 'recraft-v3') {
    return submitRecraft(input)
  }
  return submitFlux(input, provider)
}

// ── Flux 1.1 Pro / Pro Ultra (Replicate / Black Forest Labs) ────────────────

async function submitFlux(
  input: GenerateImageInput,
  provider: 'flux-1.1-pro-ultra' | 'flux-1.1-pro',
): Promise<GenerateImageResult> {
  const model =
    provider === 'flux-1.1-pro-ultra'
      ? AI_MODELS.imageRender
      : AI_MODELS.imageRenderImg2Img

  // Flux Ultra accepts: prompt, aspect_ratio, raw, image_prompt (img2img),
  // image_prompt_strength, output_format, safety_tolerance.
  const fluxInput: Record<string, unknown> = {
    prompt:           input.prompt,
    aspect_ratio:     input.aspectRatio ?? '16:9',
    output_format:    'jpg',
    output_quality:   95,
    safety_tolerance: 2,
    raw:              false,
  }
  if (input.inputImageUrl) {
    fluxInput.image_prompt          = input.inputImageUrl
    fluxInput.image_prompt_strength = 0.6
  }

  const prediction = await replicate.predictions.create({
    model,
    input:   fluxInput,
    webhook: input.webhookUrl,
    webhook_events_filter: input.webhookUrl ? ['completed'] : undefined,
  })

  return {
    provider,
    modelVersion: model,
    predictionId: prediction.id,
    status:       prediction.status === 'starting' ? 'starting' : 'processing',
  }
}

// ── Recraft V3 (Replicate) — best for floor plans + labelled drawings ───────

async function submitRecraft(input: GenerateImageInput): Promise<GenerateImageResult> {
  const prediction = await replicate.predictions.create({
    model:   AI_MODELS.imageDrawing,
    input: {
      prompt:        input.prompt,
      style:         'realistic_image',
      size:          aspectToRecraftSize(input.aspectRatio ?? '16:9'),
    },
    webhook: input.webhookUrl,
    webhook_events_filter: input.webhookUrl ? ['completed'] : undefined,
  })

  return {
    provider:     'recraft-v3',
    modelVersion: AI_MODELS.imageDrawing,
    predictionId: prediction.id,
    status:       prediction.status === 'starting' ? 'starting' : 'processing',
  }
}

function aspectToRecraftSize(ar: string): string {
  switch (ar) {
    case '16:9': return '1820x1024'
    case '9:16': return '1024x1820'
    case '4:3':  return '1365x1024'
    case '3:4':  return '1024x1365'
    default:     return '1024x1024'
  }
}

// ── SDXL (legacy) ───────────────────────────────────────────────────────────

async function submitSdxl(input: GenerateImageInput): Promise<GenerateImageResult> {
  const sdxlInput: Record<string, unknown> = {
    prompt:              input.prompt,
    negative_prompt:     input.negativePrompt ?? defaultNegativePrompt(),
    num_outputs:         input.count ?? 2,
    guidance_scale:      7.5,
    num_inference_steps: 30,
    width:  1024,
    height: 768,
  }
  if (input.inputImageUrl) {
    sdxlInput.image           = input.inputImageUrl
    sdxlInput.prompt_strength = 0.65
  }

  const versionHash = AI_MODELS.imageRenderLegacy.includes(':')
    ? AI_MODELS.imageRenderLegacy.split(':')[1]
    : AI_MODELS.imageRenderLegacy

  const prediction = await replicate.predictions.create({
    version: versionHash,
    input:   sdxlInput,
    webhook: input.webhookUrl,
    webhook_events_filter: input.webhookUrl ? ['completed'] : undefined,
  })

  return {
    provider:     'sdxl',
    modelVersion: AI_MODELS.imageRenderLegacy,
    predictionId: prediction.id,
    status:       prediction.status === 'starting' ? 'starting' : 'processing',
  }
}

export function defaultNegativePrompt(): string {
  return 'ugly, blurry, low quality, distorted, unrealistic proportions, bad architecture, deformed, watermark, text, logo, oversaturated, dark, gloomy'
}

/**
 * Build a high-quality architectural prompt from style + room + render mode.
 * Centralised so both /api/editor/renders and /api/concept/renders use the
 * same wording.
 */
export function buildArchitecturalPrompt(opts: {
  style: string
  roomType: string
  renderMode: 'sketch' | 'standard' | 'realistic' | 'cinematic'
  extra?: string
}): string {
  const styleMap: Record<string, string> = {
    modern:       'modern minimalist, clean lines, white and gray palette, high-end materials',
    farmhouse:    'modern farmhouse, shiplap walls, warm wood tones, cozy aesthetic',
    contemporary: 'contemporary design, bold textures, mixed materials, sophisticated',
    luxury:       'ultra-luxury, marble surfaces, designer fixtures, premium finishes',
    traditional:  'traditional style, crown molding, warm wood cabinets, classic elegance',
    industrial:   'industrial aesthetic, exposed brick, metal accents, concrete floors',
    coastal:      'coastal style, white and blue palette, natural wood, beachy feel',
    transitional: 'transitional style, mix of modern and traditional, neutral palette',
  }
  const qualityMap: Record<string, string> = {
    sketch:    'architectural sketch, hand-drawn, clean line art',
    standard:  'architectural visualization, professional render',
    realistic: 'photorealistic interior design, 8K, professional photography, natural daylight',
    cinematic: 'cinematic architectural photography, dramatic lighting, magazine quality, shot on Sony A7R V, 24mm lens',
  }

  const styleDesc   = styleMap[opts.style]      ?? 'modern design'
  const qualityDesc = qualityMap[opts.renderMode] ?? 'professional render'
  const room        = opts.roomType.replace(/_/g, ' ')

  return [
    `${qualityDesc}, ${styleDesc} ${room},`,
    'beautiful interior design, professional architectural visualization,',
    'high quality, detailed,',
    opts.extra?.trim(),
  ].filter(Boolean).join(' ')
}
