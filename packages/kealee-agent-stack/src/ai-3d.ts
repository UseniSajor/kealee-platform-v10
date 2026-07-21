import Replicate from 'replicate'

export type ThreeDProvider = 'meshy' | 'tripo3d' | 'blockade'
export type ThreeDQuality = 'basic' | 'enhanced'

export interface Generate3DInput {
  prompt: string
  referenceImageUrl?: string
  quality: ThreeDQuality
  modelType: 'kitchen' | 'bathroom' | 'room' | 'floorplan' | 'landscape' | 'equipment' | 'custom'
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
  modelUrl?: string
  usdzUrl?: string
  previewUrl?: string
  error?: string
  estimatedTime?: string
}

function client(): Replicate {
  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error('No 3D provider configured. Set REPLICATE_API_TOKEN.')
  }
  return new Replicate({ auth: process.env.REPLICATE_API_TOKEN })
}

export function pick3DProvider(): ThreeDProvider {
  const provider = process.env['3D_PROVIDER'] as ThreeDProvider | undefined
  return provider ?? 'meshy'
}

export async function generate3DModel(input: Generate3DInput): Promise<Generate3DResult> {
  const provider = input.provider ?? pick3DProvider()
  const models: Record<ThreeDProvider, string> = {
    meshy: input.quality === 'enhanced' ? 'meshy-ai/text-to-3d:latest' : 'meshy-ai/text-to-3d-turbo:latest',
    tripo3d: 'tripo-ai/tripo-3d-turbo:latest',
    blockade: 'blockadelabs/skybox-ai:latest',
  }
  const prediction = await client().predictions.create({
    model: models[provider],
    input: {
      prompt: input.prompt,
      quality: input.quality === 'enhanced' ? 'high' : 'standard',
      reference_image_url: input.referenceImageUrl,
    },
    webhook: process.env.REPLICATE_WEBHOOK_URL || undefined,
  })
  return {
    provider,
    quality: input.quality,
    jobId: prediction.id,
    status: '3d-queued',
    modelType: input.modelType,
  }
}

export async function get3DModelStatus(
  provider: ThreeDProvider,
  jobId: string,
  quality: ThreeDQuality,
): Promise<ThreeDStatusResult> {
  const prediction = await client().predictions.get(jobId)
  if (prediction.status === 'processing' || prediction.status === 'starting') {
    return { provider, quality, status: '3d-processing', estimatedTime: '2-10 minutes' }
  }
  if (prediction.status === 'succeeded') {
    const output = prediction.output as Record<string, string> | string | null
    const data = typeof output === 'object' && output ? output : {}
    return {
      provider,
      quality,
      status: '3d-completed',
      modelUrl: typeof output === 'string' ? output : data.model_url ?? data.glb_url,
      usdzUrl: data.usdz_url,
      previewUrl: data.preview_url ?? data.image_url,
    }
  }
  if (prediction.status === 'failed' || prediction.status === 'canceled') {
    return { provider, quality, status: '3d-failed', error: String(prediction.error ?? prediction.status) }
  }
  return { provider, quality, status: '3d-queued' }
}

export function qualityForTier(tier: number): ThreeDQuality {
  return tier >= 3 ? 'enhanced' : 'basic'
}

export function is3DAvailable(tier: number): boolean {
  return tier >= 2
}
