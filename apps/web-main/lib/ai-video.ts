/**
 * AI video-generation provider abstraction.
 *
 * Three providers, picked in order of:
 *   1. Explicit caller `provider` argument
 *   2. `VIDEO_PROVIDER` env override ('sora-2-pro' | 'sora-2' | 'veo-3.1' | 'kling-2.5')
 *   3. First provider whose API key is configured:
 *        OPENAI_API_KEY  → Sora 2 Pro
 *        GEMINI_API_KEY  → Veo 3.1
 *        REPLICATE_API_TOKEN → Kling 2.5 Turbo Pro (default fallback)
 *
 * Quality ranking for staged interior architectural shots (8s, 1080p):
 *   Sora 2 Pro ≥ Veo 3.1 > Kling 2.5 ≫ no video
 *
 * All providers expose the same shape: `generateVideo()` returns a job id
 * synchronously; `getVideoStatus(id)` polls until the asset is hosted at
 * an HTTPS URL the customer's browser can render.
 */

import Replicate from 'replicate'
import { AI_MODELS, type VideoProvider } from '@kealee/core-rules'

export type VideoStatus = 'queued' | 'processing' | 'completed' | 'failed'

export interface GenerateVideoInput {
  prompt: string
  /** Image URL to use as the starting frame (img2video). Strongly recommended. */
  inputImageUrl?: string
  /** Clip duration in seconds. Defaults: Sora 8s, Veo 8s, Kling 5s. */
  durationSec?: 4 | 5 | 8 | 10 | 12
  /** Output resolution. */
  size?: '1280x720' | '1920x1080' | '720x1280' | '1080x1920'
  /** Aspect ratio (used by Kling/Veo). */
  aspectRatio?: '16:9' | '9:16' | '1:1'
  /** Provider override; otherwise auto-picks. */
  provider?: VideoProvider
}

export interface GenerateVideoResult {
  provider: VideoProvider
  modelVersion: string
  jobId: string
  status: VideoStatus
}

export interface VideoStatusResult {
  provider: VideoProvider
  status: VideoStatus
  /** HTTPS-accessible URL when status === 'completed'. */
  outputUrl?: string
  durationMs?: number
  error?: string
}

// ── Provider selection ──────────────────────────────────────────────────────

export function pickVideoProvider(): VideoProvider {
  const override = process.env.VIDEO_PROVIDER as VideoProvider | undefined
  if (override) return override
  if (process.env.OPENAI_API_KEY)      return 'sora-2-pro'
  if (process.env.GEMINI_API_KEY)      return 'veo-3.1'
  if (process.env.REPLICATE_API_TOKEN) return 'kling-2.5'
  throw new Error(
    'No video provider configured. Set OPENAI_API_KEY (Sora), GEMINI_API_KEY (Veo), or REPLICATE_API_TOKEN (Kling).',
  )
}

// ── Public API ──────────────────────────────────────────────────────────────

export async function generateVideo(
  input: GenerateVideoInput,
): Promise<GenerateVideoResult> {
  const provider = input.provider ?? pickVideoProvider()

  // If caller explicitly requested a provider, no fallback — fail fast.
  if (input.provider) {
    return dispatchVideo(provider, input)
  }

  try {
    return await dispatchVideo(provider, input)
  } catch (err: any) {
    // Primary provider failed — fall back to Kling (Replicate) if available.
    if (provider !== 'kling-2.5' && process.env.REPLICATE_API_TOKEN) {
      console.warn(
        `[ai-video] ${provider} failed (${err?.message ?? err}), falling back to kling-2.5`,
      )
      return submitKling(input)
    }
    throw err
  }
}

function dispatchVideo(
  provider: VideoProvider,
  input: GenerateVideoInput,
): Promise<GenerateVideoResult> {
  switch (provider) {
    case 'sora-2-pro':
    case 'sora-2':
      return submitSora(input, provider)
    case 'veo-3.1':
      return submitVeo(input)
    case 'kling-2.5':
      return submitKling(input)
  }
}

export async function getVideoStatus(
  provider: VideoProvider,
  jobId: string,
): Promise<VideoStatusResult> {
  switch (provider) {
    case 'sora-2-pro':
    case 'sora-2':
      return pollSora(jobId, provider)
    case 'veo-3.1':
      return pollVeo(jobId)
    case 'kling-2.5':
      return pollKling(jobId)
  }
}

// ── Sora 2 / Sora 2 Pro (OpenAI) ────────────────────────────────────────────
//
// REST: POST https://api.openai.com/v1/videos
//       GET  https://api.openai.com/v1/videos/{id}
//       GET  https://api.openai.com/v1/videos/{id}/content   (binary)
//
// IMPORTANT: OpenAI does not host completed videos as public URLs — the
// /content endpoint returns binary. To produce a customer-facing URL, the
// caller (route layer) must download the bytes and re-upload to Supabase
// Storage. `pollSora()` returns a special `outputUrl` of `openai://{id}`
// which the route handler must resolve via `downloadSoraVideo()` below.

async function submitSora(
  input: GenerateVideoInput,
  variant: 'sora-2-pro' | 'sora-2',
): Promise<GenerateVideoResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured for Sora')

  // Docs: https://developers.openai.com/api/docs/guides/video-generation
  // JSON requests accept input_reference as { file_id } | { image_url }.
  // Size must match the reference image resolution when img-guided.
  const seconds = String(input.durationSec ?? 8)
  const size    = input.size ?? (variant === 'sora-2-pro' ? '1920x1080' : '1280x720')
  const model   = variant === 'sora-2-pro' ? AI_MODELS.videoSora2Pro : AI_MODELS.videoSora2

  const body: Record<string, unknown> = {
    prompt:  input.prompt,
    model,
    seconds,
    size,
  }
  if (input.inputImageUrl) {
    body.input_reference = { image_url: input.inputImageUrl }
  }

  const res = await fetch('https://api.openai.com/v1/videos', {
    method:  'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })

  if (!res.ok) {
    const errBody = await res.text().catch(() => '')
    throw new Error(`Sora submit failed (${res.status}): ${errBody.slice(0, 200)}`)
  }
  const json = await res.json() as { id: string; status: string }
  return {
    provider:     variant,
    modelVersion: model,
    jobId:        json.id,
    status:       mapSoraStatus(json.status),
  }
}

async function pollSora(
  jobId: string,
  variant: 'sora-2-pro' | 'sora-2',
): Promise<VideoStatusResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured for Sora')

  const res = await fetch(`https://api.openai.com/v1/videos/${jobId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  })

  if (!res.ok) {
    return { provider: variant, status: 'failed', error: `Sora poll failed: ${res.status}` }
  }
  const json = await res.json() as { id: string; status: string; error?: { message?: string } }
  const status = mapSoraStatus(json.status)
  return {
    provider:  variant,
    status,
    // Caller must download via downloadSoraVideo() and mirror to storage.
    outputUrl: status === 'completed' ? `openai://${jobId}` : undefined,
    error:     json.error?.message,
  }
}

/**
 * Download the rendered video bytes from Sora. Returns a Buffer that the
 * caller is responsible for uploading to Supabase Storage (or any CDN).
 */
export async function downloadSoraVideo(jobId: string): Promise<Buffer> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured for Sora')

  const res = await fetch(`https://api.openai.com/v1/videos/${jobId}/content`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  })
  if (!res.ok) throw new Error(`Sora content fetch failed: ${res.status}`)
  const bytes = await res.arrayBuffer()
  return Buffer.from(bytes)
}

function mapSoraStatus(s: string): VideoStatus {
  switch (s) {
    case 'queued':                       return 'queued'
    case 'in_progress': case 'running':  return 'processing'
    case 'completed': case 'succeeded':  return 'completed'
    case 'failed': case 'cancelled':     return 'failed'
    default:                             return 'processing'
  }
}

// ── Google Veo 3.1 (Gemini API) ─────────────────────────────────────────────
//
// REST: POST https://generativelanguage.googleapis.com/v1beta/models/veo-3.1:generateVideos?key=API_KEY
//       GET  https://generativelanguage.googleapis.com/v1beta/{operationName}?key=API_KEY
// Same operation/poll pattern as Vertex AI long-running ops.

/**
 * Google Veo 3.1 (Gemini API / Vertex-compatible REST).
 *
 * Requires `GEMINI_API_KEY` from AI Studio. If generations fail, fall back to
 * `VIDEO_PROVIDER=kling-2.5` or use Sora (`OPENAI_API_KEY`).
 */
async function submitVeo(input: GenerateVideoInput): Promise<GenerateVideoResult> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured for Veo')

  let instance: Record<string, unknown>

  if (input.inputImageUrl) {
    const imgRes = await fetch(input.inputImageUrl)
    if (!imgRes.ok) throw new Error(`Veo: failed to fetch reference image (${imgRes.status})`)
    const mime = imgRes.headers.get('content-type') ?? 'image/jpeg'
    const b64  = Buffer.from(await imgRes.arrayBuffer()).toString('base64')
    instance = {
      prompt: input.prompt,
      image:  { bytesBase64Encoded: b64, mimeType: mime },
    }
  } else {
    instance = { prompt: input.prompt }
  }

  const body: Record<string, unknown> = {
    instances: [instance],
    parameters: {
      aspectRatio:     input.aspectRatio ?? '16:9',
      durationSeconds: input.durationSec ?? 8,
      sampleCount:     1,
      generateAudio:   true,
    },
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${AI_MODELS.videoVeo}:predictLongRunning?key=${apiKey}`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    },
  )

  if (!res.ok) {
    const errBody = await res.text().catch(() => '')
    throw new Error(
      `Veo submit failed (${res.status}). Try VIDEO_PROVIDER=kling-2.5 or OPENAI_API_KEY. ${errBody.slice(0, 200)}`,
    )
  }
  const json = await res.json() as { name?: string }
  if (!json.name) throw new Error('Veo response missing operation name')

  return {
    provider:     'veo-3.1',
    modelVersion: AI_MODELS.videoVeo,
    jobId:        json.name,
    status:       'queued',
  }
}

async function pollVeo(operationName: string): Promise<VideoStatusResult> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured for Veo')

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${apiKey}`,
  )
  if (!res.ok) {
    return { provider: 'veo-3.1', status: 'failed', error: `Veo poll failed: ${res.status}` }
  }

  const json = await res.json() as {
    done?: boolean
    error?: { message?: string }
    response?: { generatedSamples?: { video?: { uri?: string } }[] }
  }

  if (json.error?.message) return { provider: 'veo-3.1', status: 'failed', error: json.error.message }
  if (!json.done)          return { provider: 'veo-3.1', status: 'processing' }

  const uri = json.response?.generatedSamples?.[0]?.video?.uri
  if (!uri) return { provider: 'veo-3.1', status: 'failed', error: 'Veo returned no video URI' }

  // Veo URIs are signed Google Cloud Storage URLs that include the API key
  // pattern; safe to return directly to the browser.
  return { provider: 'veo-3.1', status: 'completed', outputUrl: uri }
}

// ── Kling 2.5 Turbo Pro (Replicate) ─────────────────────────────────────────

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })

async function submitKling(input: GenerateVideoInput): Promise<GenerateVideoResult> {
  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error('REPLICATE_API_TOKEN not configured for Kling')
  }

  const klingInput: Record<string, unknown> = {
    prompt:        input.prompt,
    duration:      input.durationSec ?? 5,
    aspect_ratio:  input.aspectRatio ?? '16:9',
    cfg_scale:     0.5,
  }
  if (input.inputImageUrl) klingInput.start_image = input.inputImageUrl

  const prediction = await replicate.predictions.create({
    model: AI_MODELS.videoKling,
    input: klingInput,
  })

  return {
    provider:     'kling-2.5',
    modelVersion: AI_MODELS.videoKling,
    jobId:        prediction.id,
    status:       prediction.status === 'starting' ? 'queued' : 'processing',
  }
}

async function pollKling(predictionId: string): Promise<VideoStatusResult> {
  if (!process.env.REPLICATE_API_TOKEN) {
    return { provider: 'kling-2.5', status: 'failed', error: 'REPLICATE_API_TOKEN missing' }
  }

  const prediction = await replicate.predictions.get(predictionId)

  if (prediction.status === 'succeeded') {
    const out = prediction.output as string | string[] | undefined
    const url = Array.isArray(out) ? out[0] : out
    return {
      provider:   'kling-2.5',
      status:     'completed',
      outputUrl:  url,
      durationMs: prediction.metrics?.predict_time
        ? Math.round(prediction.metrics.predict_time * 1000)
        : undefined,
    }
  }
  if (prediction.status === 'failed' || prediction.status === 'canceled') {
    return {
      provider: 'kling-2.5',
      status:   'failed',
      error:    prediction.error ? String(prediction.error) : 'Kling failed',
    }
  }
  return { provider: 'kling-2.5', status: 'processing' }
}

// ── Helper: build a high-quality architectural video prompt ────────────────

export function buildArchitecturalVideoPrompt(opts: {
  style: string
  roomType: string
  motion?: 'slow_pan' | 'reveal' | 'walkthrough' | 'orbit'
  extra?: string
}): string {
  const motionMap: Record<string, string> = {
    slow_pan:    'slow horizontal camera pan, smooth gimbal movement',
    reveal:      'slow dolly-in revealing the room, cinematic camera move',
    walkthrough: 'first-person walkthrough, natural camera motion, smooth gait',
    orbit:       'slow orbiting camera around the centre of the room',
  }
  const motion = motionMap[opts.motion ?? 'reveal']
  const room   = opts.roomType.replace(/_/g, ' ')

  return [
    `Cinematic architectural reveal of a ${opts.style} ${room},`,
    `${motion},`,
    'photorealistic, natural daylight through windows, professional real-estate videography,',
    '24mm wide lens, magazine-quality interior design, shallow depth of field on foreground,',
    opts.extra?.trim(),
  ].filter(Boolean).join(' ')
}
