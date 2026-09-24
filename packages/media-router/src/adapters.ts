import { errorMessage, extractOutputUrls, fetchJson, mapStatus } from './http'
import type {
  MediaGenerationRequest,
  MediaIntent,
  MediaJob,
  MediaJobResult,
  MediaProviderAdapter,
  MediaProviderId,
} from './types'

const ALL_VISUAL_INTENTS: MediaIntent[] = [
  'cinematic-video',
  'renovation-visualization',
  'development-visualization',
  'marketing-content',
]

abstract class HttpAdapter implements MediaProviderAdapter {
  abstract readonly id: MediaProviderId
  abstract readonly capabilities: readonly MediaIntent[]
  abstract isConfigured(): boolean
  abstract submit(request: MediaGenerationRequest): Promise<MediaJob>
  abstract poll(job: MediaJob): Promise<MediaJobResult>

  supports(request: MediaGenerationRequest): boolean {
    return this.capabilities.includes(request.intent)
  }

  protected job(request: MediaGenerationRequest, model: string, jobId: string, raw: unknown, extra: Partial<MediaJob> = {}): MediaJob {
    return {
      provider: this.id,
      jobId,
      model,
      kind: request.kind,
      status: 'queued',
      submittedAt: new Date().toISOString(),
      tenantId: request.tenantId,
      requestedDurationSec: request.durationSec,
      raw,
      ...extra,
    }
  }

  protected result(job: MediaJob, body: Record<string, unknown>): MediaJobResult {
    const status = mapStatus(body.status ?? body.state ?? (body.done === true ? 'completed' : undefined))
    return {
      ...job,
      status,
      outputUrls: extractOutputUrls(body),
      error: status === 'failed' ? errorMessage(body) ?? `${job.provider} generation failed` : undefined,
      completedAt: ['completed', 'failed', 'canceled'].includes(status) ? new Date().toISOString() : undefined,
      raw: body,
    }
  }
}

export class HiggsfieldAdapter extends HttpAdapter {
  readonly id = 'higgsfield' as const
  readonly capabilities = ALL_VISUAL_INTENTS
  private readonly baseUrl = (process.env.HIGGSFIELD_API_BASE_URL ?? 'https://api.higgsfield.ai').replace(/\/$/, '')

  isConfigured(): boolean {
    return Boolean(this.credentials())
  }

  private credentials(): string | undefined {
    return process.env.HF_CREDENTIALS?.trim()
      || (process.env.HF_API_KEY_ID && process.env.HF_API_KEY_SECRET
        ? `${process.env.HF_API_KEY_ID}:${process.env.HF_API_KEY_SECRET}`
        : undefined)
  }

  private modelFor(request: MediaGenerationRequest): string {
    if (request.model) return request.model
    if (request.kind === 'image') {
      return request.intent === 'marketing-content'
        ? process.env.HIGGSFIELD_MARKETING_IMAGE_MODEL ?? 'marketing-studio/image'
        : process.env.HIGGSFIELD_VISUALIZATION_IMAGE_MODEL ?? 'higgsfield-ai/soul/v2/standard'
    }
    if (request.intent === 'cinematic-video' || request.intent === 'marketing-content') {
      return process.env.HIGGSFIELD_CINEMATIC_MODEL ?? 'higgsfield/cinema-studio/4.0'
    }
    const mode = request.inputImageUrls?.length ? 'image-to-video' : 'text-to-video'
    return process.env.HIGGSFIELD_VISUALIZATION_VIDEO_MODEL ?? `bytedance/seedance-2.0/${mode}`
  }

  async submit(request: MediaGenerationRequest): Promise<MediaJob> {
    const credentials = this.credentials()
    if (!credentials) throw new Error('Higgsfield is not configured. Set HF_CREDENTIALS or HF_API_KEY_ID and HF_API_KEY_SECRET.')
    const model = this.modelFor(request)
    const input: Record<string, unknown> = {
      prompt: request.prompt,
      aspect_ratio: request.aspectRatio ?? (request.kind === 'image' ? '16:9' : '16:9'),
    }
    if (request.kind === 'image') {
      input.resolution = request.resolution && ['1k', '2k', '4k'].includes(request.resolution) ? request.resolution : '2k'
      input.image_urls = request.inputImageUrls
      input.enhance_prompt = request.intent === 'marketing-content'
      input.quality = 'high'
      input.moderation = 'auto'
    } else {
      input.duration = request.durationSec ?? 5
      input.resolution = request.resolution && ['480p', '720p', '1080p', '4k'].includes(request.resolution) ? request.resolution : '720p'
      input.generate_audio = request.generateAudio ?? true
      if (model.endsWith('/image-to-video')) input.image_url = request.inputImageUrls?.[0]
      else if (request.inputImageUrls?.length) input.image_urls = request.inputImageUrls
      if (request.inputVideoUrls?.length) input.video_urls = request.inputVideoUrls
    }
    const body = await fetchJson(`${this.baseUrl}/${model}`, {
      method: 'POST',
      headers: { Authorization: `Key ${credentials}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    const jobId = String(body.request_id ?? body.id ?? '')
    if (!jobId) throw new Error('Higgsfield response did not include a request ID')
    return this.job(request, model, jobId, body, {
      statusUrl: typeof body.status_url === 'string' ? body.status_url : `${this.baseUrl}/requests/${jobId}/status`,
      cancelUrl: typeof body.cancel_url === 'string' ? body.cancel_url : undefined,
    })
  }

  async poll(job: MediaJob): Promise<MediaJobResult> {
    const credentials = this.credentials()
    if (!credentials) throw new Error('Higgsfield credentials are missing')
    const body = await fetchJson(job.statusUrl ?? `${this.baseUrl}/requests/${job.jobId}/status`, {
      headers: { Authorization: `Key ${credentials}` },
    })
    return this.result(job, body)
  }
}

export class ReplicateAdapter extends HttpAdapter {
  readonly id = 'replicate' as const
  readonly capabilities = [
    'specialized-model',
    'open-source-model',
    'image-processing',
    'cinematic-video',
    'renovation-visualization',
    'development-visualization',
    'marketing-content',
  ] as const
  private readonly baseUrl = 'https://api.replicate.com/v1'

  isConfigured(): boolean {
    return Boolean(process.env.REPLICATE_API_TOKEN?.trim())
  }

  async submit(request: MediaGenerationRequest): Promise<MediaJob> {
    const token = process.env.REPLICATE_API_TOKEN
    if (!token) throw new Error('Replicate is not configured. Set REPLICATE_API_TOKEN.')
    const model = request.model ?? (request.kind === 'video'
      ? process.env.REPLICATE_VIDEO_MODEL ?? 'kwaivgi/kling-v2.5-turbo-pro'
      : process.env.REPLICATE_IMAGE_MODEL ?? 'black-forest-labs/flux-1.1-pro-ultra')
    const input: Record<string, unknown> = {
      prompt: request.prompt,
      aspect_ratio: request.aspectRatio ?? '16:9',
    }
    if (request.negativePrompt) input.negative_prompt = request.negativePrompt
    if (request.inputImageUrls?.[0]) input.start_image = request.inputImageUrls[0]
    if (request.durationSec) input.duration = request.durationSec
    const version = model.includes(':') ? model.split(':').pop() : undefined
    const url = version ? `${this.baseUrl}/predictions` : `${this.baseUrl}/models/${model}/predictions`
    const body = await fetchJson(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(version ? { version, input } : { input }),
    })
    const jobId = String(body.id ?? '')
    if (!jobId) throw new Error('Replicate response did not include a prediction ID')
    return this.job(request, model, jobId, body, { status: mapStatus(body.status) })
  }

  async poll(job: MediaJob): Promise<MediaJobResult> {
    const token = process.env.REPLICATE_API_TOKEN
    if (!token) throw new Error('Replicate credentials are missing')
    const body = await fetchJson(`${this.baseUrl}/predictions/${job.jobId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return this.result(job, body)
  }
}

export class SeedanceAdapter extends HttpAdapter {
  readonly id = 'seedance' as const
  readonly capabilities = ['cinematic-video', 'renovation-visualization', 'development-visualization', 'marketing-content'] as const
  private readonly baseUrl = (process.env.SEEDANCE_API_BASE_URL ?? 'https://ark.ap-southeast.bytepluses.com/api/v3').replace(/\/$/, '')

  isConfigured(): boolean {
    return Boolean((process.env.SEEDANCE_API_KEY ?? process.env.ARK_API_KEY)?.trim())
  }

  supports(request: MediaGenerationRequest): boolean {
    return request.kind === 'video' && super.supports(request)
  }

  async submit(request: MediaGenerationRequest): Promise<MediaJob> {
    const token = process.env.SEEDANCE_API_KEY ?? process.env.ARK_API_KEY
    if (!token) throw new Error('Seedance is not configured. Set SEEDANCE_API_KEY or ARK_API_KEY.')
    const model = request.model ?? process.env.SEEDANCE_VIDEO_MODEL ?? 'dreamina-seedance-2-0-260128'
    const content: Array<Record<string, unknown>> = [{ type: 'text', text: request.prompt }]
    for (const [index, url] of (request.inputImageUrls ?? []).entries()) {
      content.push({ type: 'image_url', image_url: { url }, role: index === 0 ? 'first_frame' : 'reference_image' })
    }
    for (const url of request.inputVideoUrls ?? []) {
      content.push({ type: 'video_url', video_url: { url }, role: 'reference_video' })
    }
    const body = await fetchJson(`${this.baseUrl}/contents/generations/tasks`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        content,
        duration: request.durationSec ?? 5,
        ratio: request.aspectRatio ?? '16:9',
        resolution: request.resolution ?? '720p',
        generate_audio: request.generateAudio ?? true,
      }),
    })
    const jobId = String(body.id ?? '')
    if (!jobId) throw new Error('Seedance response did not include a task ID')
    return this.job(request, model, jobId, body)
  }

  async poll(job: MediaJob): Promise<MediaJobResult> {
    const token = process.env.SEEDANCE_API_KEY ?? process.env.ARK_API_KEY
    if (!token) throw new Error('Seedance credentials are missing')
    const body = await fetchJson(`${this.baseUrl}/contents/generations/tasks/${encodeURIComponent(job.jobId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return this.result(job, body)
  }
}

export class VeoAdapter extends HttpAdapter {
  readonly id = 'veo' as const
  readonly capabilities = ['cinematic-video', 'renovation-visualization', 'development-visualization', 'marketing-content'] as const
  private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta'

  isConfigured(): boolean {
    return Boolean(process.env.GEMINI_API_KEY?.trim())
  }

  supports(request: MediaGenerationRequest): boolean {
    return request.kind === 'video' && super.supports(request)
  }

  async submit(request: MediaGenerationRequest): Promise<MediaJob> {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error('Veo is not configured. Set GEMINI_API_KEY.')
    const model = request.model ?? process.env.VEO_VIDEO_MODEL ?? 'veo-3.1-generate-preview'
    const instance: Record<string, unknown> = { prompt: request.prompt }
    if (request.inputImageUrls?.[0]) {
      const image = await fetch(request.inputImageUrls[0])
      if (!image.ok) throw new Error(`Could not load Veo input image (${image.status})`)
      instance.image = {
        bytesBase64Encoded: Buffer.from(await image.arrayBuffer()).toString('base64'),
        mimeType: image.headers.get('content-type') ?? 'image/jpeg',
      }
    }
    const body = await fetchJson(`${this.baseUrl}/models/${model}:predictLongRunning?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [instance],
        parameters: {
          aspectRatio: request.aspectRatio ?? '16:9',
          durationSeconds: request.durationSec ?? 8,
          sampleCount: 1,
          generateAudio: request.generateAudio ?? true,
        },
      }),
    })
    const jobId = String(body.name ?? '')
    if (!jobId) throw new Error('Veo response did not include an operation name')
    return this.job(request, model, jobId, body)
  }

  async poll(job: MediaJob): Promise<MediaJobResult> {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error('Veo credentials are missing')
    const body = await fetchJson(`${this.baseUrl}/${job.jobId}?key=${apiKey}`)
    return this.result(job, body)
  }
}
