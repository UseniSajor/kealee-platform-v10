/**
 * AI 3D model generation provider abstraction.
 *
 * Generates photorealistic 3D models via Replicate (Meshy, Tripo3D).
 * Tier-gated: Premium+ only. Premium gets basic, Premium+ gets enhanced.
 *
 * Provider selection (in order of preference):
 *   1. Explicit caller `provider` argument
 *   2. `3D_PROVIDER` env override ('meshy' | 'tripo3d' | 'blockade')
 *   3. REPLICATE_API_TOKEN available → default to meshy
 *
 * Quality ranking for 3D architectural models:
 *   Meshy ≥ Tripo3D > Blockade Labs
 */

import Replicate from 'replicate'

export type ThreeDProvider = 'meshy' | 'tripo3d' | 'blockade'
export type ThreeDQuality = 'basic' | 'enhanced'

export interface Generate3DInput {
  prompt: string
  /** Reference image URL (optional, for image-to-3D). */
  referenceImageUrl?: string
  /** Quality tier: basic (Premium) or enhanced (Premium+). */
  quality: ThreeDQuality
  /** Model type: kitchen, bathroom, room, floorplan, landscape, equipment. */
  modelType: 'kitchen' | 'bathroom' | 'room' | 'floorplan' | 'landscape' | 'equipment' | 'custom'
  /** Provider override; otherwise auto-picks. */
  provider?: ThreeDProvider
}

export interface Generate3DResult {
  provider: ThreeDProvider
  quality: ThreeDQuality
  jobId: string
  status: '3d-queued' | '3d-processing' | '3d-completed' | '3d-failed'
  modelType: string
}

export interface ThreeDStatusResult {
  provider: ThreeDProvider
  quality: ThreeDQuality
  status: '3d-queued' | '3d-processing' | '3d-completed' | '3d-failed'
  /** GLB model URL when status === '3d-completed'. */
  modelUrl?: string
  /** USDZ format (iOS) when status === '3d-completed'. */
  usdzUrl?: string
  /** Thumbnail preview URL. */
  previewUrl?: string
  error?: string
  estimatedTime?: string
}

// ── Provider selection ──────────────────────────────────────────────────────

export function pick3DProvider(): ThreeDProvider {
  const override = process.env['3D_PROVIDER'] as ThreeDProvider | undefined
  if (override) return override
  if (process.env.REPLICATE_API_TOKEN) return 'meshy' // Default to Meshy
  throw new Error(
    'No 3D provider configured. Set REPLICATE_API_TOKEN for Meshy, Tripo3D, or Blockade Labs.',
  )
}

// ── Public API ──────────────────────────────────────────────────────────────

export async function generate3DModel(
  input: Generate3DInput,
): Promise<Generate3DResult> {
  const provider = input.provider ?? pick3DProvider()

  if (input.provider) {
    return dispatch3D(provider, input)
  }

  try {
    return await dispatch3D(provider, input)
  } catch (err: any) {
    if (provider !== 'meshy' && process.env.REPLICATE_API_TOKEN) {
      console.warn(
        `[ai-3d] ${provider} failed (${err?.message ?? err}), falling back to meshy`,
      )
      return submitMeshy(input)
    }
    throw err
  }
}

export async function get3DModelStatus(
  provider: ThreeDProvider,
  jobId: string,
  quality: ThreeDQuality,
): Promise<ThreeDStatusResult> {
  switch (provider) {
    case 'meshy':
      return getMeshyStatus(jobId, quality)
    case 'tripo3d':
      return getTripo3DStatus(jobId, quality)
    case 'blockade':
      return getBlockadeStatus(jobId, quality)
    default:
      throw new Error(`Unknown 3D provider: ${provider}`)
  }
}

// ── Meshy (Replicate) ───────────────────────────────────────────────────────

/**
 * Meshy text-to-3D or image-to-3D via Replicate.
 * Produces GLB + preview image.
 * Quality: basic (512x512) / enhanced (1024x1024 with multi-view).
 */
async function submitMeshy(input: Generate3DInput): Promise<Generate3DResult> {
  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
  })

  const meshyModel =
    input.quality === 'enhanced'
      ? 'meshy-ai/text-to-3d:latest' // High-quality, multi-view
      : 'meshy-ai/text-to-3d-turbo:latest' // Faster

  const meshyInput: Record<string, any> = {
    prompt: input.prompt,
    quality: input.quality === 'enhanced' ? 'high' : 'standard',
    refine: input.quality === 'enhanced',
  }

  if (input.referenceImageUrl) {
    meshyInput.reference_image_url = input.referenceImageUrl
  }

  const prediction = await replicate.predictions.create({
    model: meshyModel,
    input: meshyInput,
    webhook: process.env.REPLICATE_WEBHOOK_URL || undefined,
  })

  return {
    provider: 'meshy',
    quality: input.quality,
    jobId: prediction.id,
    status: 'queued' as any,
    modelType: input.modelType,
  }
}

async function getMeshyStatus(
  jobId: string,
  quality: ThreeDQuality,
): Promise<ThreeDStatusResult> {
  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
  })

  const prediction = await replicate.predictions.get(jobId)

  if (prediction.status === 'processing') {
    return {
      provider: 'meshy',
      quality,
      status: '3d-processing',
      estimatedTime: '2-5 minutes for basic, 5-10 for enhanced',
    }
  }

  if (prediction.status === 'succeeded') {
    const output = prediction.output as Record<string, any>
    return {
      provider: 'meshy',
      quality,
      status: '3d-completed',
      modelUrl: output.model_url || output.glb_url,
      previewUrl: output.preview_url || output.image_url,
    }
  }

  if (prediction.status === 'failed') {
    return {
      provider: 'meshy',
      quality,
      status: '3d-failed',
      error: (prediction.error as Record<string, any>)?.message || 'Model generation failed',
    }
  }

  return {
    provider: 'meshy',
    quality,
    status: '3d-queued',
  }
}

// ── Tripo3D (Replicate) ──────────────────────────────────────────────────────

/**
 * Tripo3D text-to-3D via Replicate.
 * Fast turnaround, good for real-time generation.
 */
async function submitTripo3D(input: Generate3DInput): Promise<Generate3DResult> {
  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
  })

  const prediction = await replicate.predictions.create({
    model: 'tripo-ai/tripo-3d-turbo:latest',
    input: {
      prompt: input.prompt,
      chunk_size: input.quality === 'enhanced' ? 1024 : 512,
    },
  })

  return {
    provider: 'tripo3d',
    quality: input.quality,
    jobId: prediction.id,
    status: 'queued' as any,
    modelType: input.modelType,
  }
}

async function getTripo3DStatus(
  jobId: string,
  quality: ThreeDQuality,
): Promise<ThreeDStatusResult> {
  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
  })

  const prediction = await replicate.predictions.get(jobId)

  if (prediction.status === 'processing') {
    return {
      provider: 'tripo3d',
      quality,
      status: '3d-processing',
      estimatedTime: '1-3 minutes',
    }
  }

  if (prediction.status === 'succeeded') {
    const output = prediction.output as Record<string, any>
    return {
      provider: 'tripo3d',
      quality,
      status: '3d-completed',
      modelUrl: output.model_url || output.glb_url,
      previewUrl: output.preview_url,
    }
  }

  if (prediction.status === 'failed') {
    return {
      provider: 'tripo3d',
      quality,
      status: '3d-failed',
      error: (prediction.error as Record<string, any>)?.message || 'Model generation failed',
    }
  }

  return {
    provider: 'tripo3d',
    quality,
    status: '3d-queued',
  }
}

// ── Blockade Labs (Skybox AI) ────────────────────────────────────────────────

/**
 * Blockade Labs 3D environment generation.
 * Best for landscapes, outdoor scenes, full environments.
 */
async function submitBlockade(input: Generate3DInput): Promise<Generate3DResult> {
  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
  })

  const prediction = await replicate.predictions.create({
    model: 'blockadelabs/skybox-ai:latest',
    input: {
      prompt: input.prompt,
      negative_prompt: 'people, humans, text, watermark',
      steps: input.quality === 'enhanced' ? 75 : 50,
    },
  })

  return {
    provider: 'blockade',
    quality: input.quality,
    jobId: prediction.id,
    status: 'queued' as any,
    modelType: input.modelType,
  }
}

async function getBlockadeStatus(
  jobId: string,
  quality: ThreeDQuality,
): Promise<ThreeDStatusResult> {
  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
  })

  const prediction = await replicate.predictions.get(jobId)

  if (prediction.status === 'processing') {
    return {
      provider: 'blockade',
      quality,
      status: '3d-processing',
      estimatedTime: '2-4 minutes',
    }
  }

  if (prediction.status === 'succeeded') {
    const output = prediction.output as Record<string, any>
    return {
      provider: 'blockade',
      quality,
      status: '3d-completed',
      modelUrl: output.model_url,
      previewUrl: output.preview_url || output.image_url,
    }
  }

  if (prediction.status === 'failed') {
    return {
      provider: 'blockade',
      quality,
      status: '3d-failed',
      error: (prediction.error as Record<string, any>)?.message || 'Model generation failed',
    }
  }

  return {
    provider: 'blockade',
    quality,
    status: '3d-queued',
  }
}

// ── Utilities ───────────────────────────────────────────────────────────────

/**
 * Tier-gated quality selector.
 * Premium → basic, Premium+ → enhanced.
 */
export function qualityForTier(tier: number): ThreeDQuality {
  if (tier >= 3) return 'enhanced'
  if (tier >= 2) return 'basic'
  return 'basic' // Shouldn't reach here for non-premium, but fallback
}

/**
 * Check if 3D models are available for this tier.
 */
export function is3DAvailable(tier: number): boolean {
  return tier >= 2 // Premium and above
}
