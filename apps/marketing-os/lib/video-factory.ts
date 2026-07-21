import Replicate from 'replicate'
import { requireProvider } from './providers'

export type VideoProvider = 'runway' | 'kling' | 'veo'

export interface VideoGenerationRequest {
  provider: VideoProvider
  prompt: string
  inputImageUrl?: string
  durationSeconds?: 5 | 8 | 10
  aspectRatio?: '16:9' | '9:16' | '1:1'
}

export async function submitVideoGeneration(input: VideoGenerationRequest) {
  switch (input.provider) {
    case 'runway':
      return submitRunway(input)
    case 'kling':
      return submitKling(input)
    case 'veo':
      return submitVeo(input)
  }
}

export async function pollVideoGeneration(provider: VideoProvider, jobId: string) {
  switch (provider) {
    case 'runway':
      return pollRunway(jobId)
    case 'kling':
      return pollKling(jobId)
    case 'veo':
      return pollVeo(jobId)
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

async function submitKling(input: VideoGenerationRequest) {
  requireProvider('Kling via Replicate', ['REPLICATE_API_TOKEN'])
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })
  const prediction = await replicate.predictions.create({
    model: process.env.KLING_REPLICATE_MODEL ?? 'kwaivgi/kling-v2.5-turbo-pro',
    input: {
      prompt: input.prompt,
      start_image: input.inputImageUrl,
      duration: input.durationSeconds ?? 5,
      aspect_ratio: input.aspectRatio ?? '16:9',
    },
  })
  return { provider: 'kling' as const, jobId: prediction.id, response: prediction }
}

async function submitVeo(input: VideoGenerationRequest) {
  requireProvider('Google Veo', ['GEMINI_API_KEY'])
  const instance: Record<string, unknown> = { prompt: input.prompt }
  if (input.inputImageUrl) {
    const image = await fetch(input.inputImageUrl)
    if (!image.ok) throw new Error(`Could not load Veo input image (${image.status})`)
    instance.image = {
      bytesBase64Encoded: Buffer.from(await image.arrayBuffer()).toString('base64'),
      mimeType: image.headers.get('content-type') ?? 'image/jpeg',
    }
  }
  const model = process.env.VEO_VIDEO_MODEL ?? 'veo-3.1'
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:predictLongRunning?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [instance],
        parameters: {
          aspectRatio: input.aspectRatio ?? '16:9',
          durationSeconds: input.durationSeconds ?? 8,
          sampleCount: 1,
          generateAudio: true,
        },
      }),
    },
  )
  const body = await response.json().catch(() => ({})) as Record<string, unknown>
  if (!response.ok || !body.name) throw new Error(`Veo submit failed (${response.status}): ${JSON.stringify(body).slice(0, 400)}`)
  return { provider: 'veo' as const, jobId: String(body.name), response: body }
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

async function pollKling(jobId: string) {
  requireProvider('Kling via Replicate', ['REPLICATE_API_TOKEN'])
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })
  const prediction = await replicate.predictions.get(jobId)
  const output = Array.isArray(prediction.output) ? prediction.output : [prediction.output]
  return {
    status: prediction.status === 'succeeded'
      ? 'completed' as const
      : prediction.status === 'failed' || prediction.status === 'canceled'
        ? 'failed' as const
        : 'running' as const,
    outputUrls: output.filter((value): value is string => typeof value === 'string'),
    error: prediction.error ? String(prediction.error) : null,
    response: prediction,
  }
}

async function pollVeo(jobId: string) {
  requireProvider('Google Veo', ['GEMINI_API_KEY'])
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/${jobId}?key=${process.env.GEMINI_API_KEY}`,
  )
  const body = await response.json().catch(() => ({})) as {
    done?: boolean
    error?: { message?: string }
    response?: {
      generateVideoResponse?: {
        generatedSamples?: Array<{ video?: { uri?: string } }>
      }
    }
  }
  if (!response.ok) throw new Error(`Veo poll failed (${response.status}): ${JSON.stringify(body).slice(0, 400)}`)
  const outputUrls = body.response?.generateVideoResponse?.generatedSamples
    ?.map((sample) => sample.video?.uri)
    .filter((value): value is string => typeof value === 'string') ?? []
  return {
    status: body.error ? 'failed' as const : body.done ? 'completed' as const : 'running' as const,
    outputUrls,
    error: body.error?.message ?? null,
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
