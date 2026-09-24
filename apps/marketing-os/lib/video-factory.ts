import {
  createMediaRouterFromEnv,
  type MediaProviderId,
} from '@kealee/media-router'
import { requireProvider } from './providers'

export type VideoProvider = 'auto' | 'higgsfield' | 'seedance' | 'veo' | 'replicate' | 'kling' | 'runway'

export interface VideoGenerationRequest {
  provider: VideoProvider
  prompt: string
  inputImageUrl?: string
  durationSeconds?: 5 | 8 | 10
  aspectRatio?: '16:9' | '9:16' | '1:1'
}

export async function submitVideoGeneration(input: VideoGenerationRequest) {
  if (input.provider === 'runway') return submitRunway(input)

  const provider: MediaProviderId | undefined = input.provider === 'auto'
    ? undefined
    : input.provider === 'kling'
      ? 'replicate'
      : input.provider
  const job = await createMediaRouterFromEnv().submit({
    provider,
    kind: 'video',
    intent: 'marketing-content',
    prompt: input.prompt,
    inputImageUrls: input.inputImageUrl ? [input.inputImageUrl] : undefined,
    durationSec: input.durationSeconds,
    aspectRatio: input.aspectRatio,
    model: input.provider === 'kling' ? process.env.KLING_REPLICATE_MODEL : undefined,
    generateAudio: true,
  })
  return {
    provider: input.provider === 'kling' ? 'kling' as const : job.provider,
    jobId: job.jobId,
    response: job.raw,
  }
}

export async function pollVideoGeneration(provider: VideoProvider, jobId: string) {
  if (provider === 'auto') throw new Error('Auto-routed jobs must be stored with their resolved provider')
  if (provider === 'runway') return pollRunway(jobId)

  const routedProvider: MediaProviderId = provider === 'kling' ? 'replicate' : provider
  const result = await createMediaRouterFromEnv().poll({
    provider: routedProvider,
    jobId,
    model: modelForProvider(provider),
    kind: 'video',
    status: 'processing',
    submittedAt: new Date().toISOString(),
  })
  return {
    status: result.status === 'completed'
      ? 'completed' as const
      : result.status === 'failed' || result.status === 'canceled'
        ? 'failed' as const
        : 'running' as const,
    outputUrls: result.outputUrls,
    error: result.error ?? null,
    response: result.raw,
  }
}

function modelForProvider(provider: Exclude<VideoProvider, 'auto' | 'runway'>): string {
  switch (provider) {
    case 'higgsfield': return process.env.HIGGSFIELD_CINEMATIC_MODEL ?? 'higgsfield/cinema-studio/4.0'
    case 'seedance': return process.env.SEEDANCE_VIDEO_MODEL ?? 'dreamina-seedance-2-0-260128'
    case 'veo': return process.env.VEO_VIDEO_MODEL ?? 'veo-3.1-generate-preview'
    case 'kling':
    case 'replicate': return process.env.KLING_REPLICATE_MODEL ?? 'kwaivgi/kling-v2.5-turbo-pro'
  }
}

async function submitRunway(input: VideoGenerationRequest) {
  requireProvider('Runway', ['RUNWAY_API_KEY'])
  const response = await fetch(
    process.env.RUNWAY_IMAGE_TO_VIDEO_URL ?? 'https://api.dev.runwayml.com/v1/image_to_video',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RUNWAY_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Runway-Version': process.env.RUNWAY_API_VERSION ?? '2024-11-06',
      },
      body: JSON.stringify({
        model: process.env.RUNWAY_VIDEO_MODEL ?? 'gen4_turbo',
        promptText: input.prompt,
        promptImage: input.inputImageUrl,
        ratio: input.aspectRatio ?? '16:9',
        duration: input.durationSeconds ?? 5,
      }),
    },
  )
  const body = await response.json().catch(() => ({})) as Record<string, unknown>
  if (!response.ok) throw new Error(`Runway submit failed (${response.status}): ${JSON.stringify(body).slice(0, 400)}`)
  return { provider: 'runway' as const, jobId: String(body.id), response: body }
}

async function pollRunway(jobId: string) {
  requireProvider('Runway', ['RUNWAY_API_KEY'])
  const response = await fetch(
    `${process.env.RUNWAY_TASKS_URL ?? 'https://api.dev.runwayml.com/v1/tasks'}/${encodeURIComponent(jobId)}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.RUNWAY_API_KEY}`,
        'X-Runway-Version': process.env.RUNWAY_API_VERSION ?? '2024-11-06',
      },
    },
  )
  const body = await response.json().catch(() => ({})) as Record<string, unknown>
  if (!response.ok) throw new Error(`Runway poll failed (${response.status}): ${JSON.stringify(body).slice(0, 400)}`)
  const status = String(body.status ?? '').toUpperCase()
  return {
    status: status === 'SUCCEEDED' ? 'completed' as const : status === 'FAILED' ? 'failed' as const : 'running' as const,
    outputUrls: Array.isArray(body.output) ? body.output.filter((value): value is string => typeof value === 'string') : [],
    error: status === 'FAILED' ? String(body.failure ?? body.failureCode ?? 'Runway generation failed') : null,
    response: body,
  }
}

export async function synthesizeNarration(input: {
  text: string
  voiceId: string
  modelId?: string
}) {
  requireProvider('ElevenLabs', ['ELEVENLABS_API_KEY'])
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(input.voiceId)}`, {
    method: 'POST',
    headers: {
      'xi-api-key': process.env.ELEVENLABS_API_KEY!,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text: input.text,
      model_id: input.modelId ?? process.env.ELEVENLABS_MODEL_ID ?? 'eleven_multilingual_v2',
    }),
  })
  if (!response.ok) throw new Error(`ElevenLabs synthesis failed (${response.status}): ${(await response.text()).slice(0, 400)}`)
  return Buffer.from(await response.arrayBuffer())
}
