export type BuiltInMediaProviderId = 'replicate' | 'higgsfield' | 'seedance' | 'veo'
export type MediaProviderId = BuiltInMediaProviderId | (string & {})

export type MediaIntent =
  | 'specialized-model'
  | 'open-source-model'
  | 'image-processing'
  | 'cinematic-video'
  | 'renovation-visualization'
  | 'development-visualization'
  | 'marketing-content'

export type MediaKind = 'image' | 'video'
export type MediaJobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'canceled'
export type MediaAspectRatio = '16:9' | '9:16' | '1:1' | '4:3' | '3:4' | '3:2' | '2:3' | '21:9'

export interface MediaGenerationRequest {
  kind: MediaKind
  intent: MediaIntent
  prompt: string
  provider?: MediaProviderId
  model?: string
  inputImageUrls?: string[]
  inputVideoUrls?: string[]
  durationSec?: number
  aspectRatio?: MediaAspectRatio
  resolution?: '480p' | '720p' | '1080p' | '4k' | '1k' | '2k'
  generateAudio?: boolean
  negativePrompt?: string
  metadata?: Record<string, unknown>
}

export interface MediaJob {
  provider: MediaProviderId
  jobId: string
  model: string
  kind: MediaKind
  status: MediaJobStatus
  statusUrl?: string
  cancelUrl?: string
  submittedAt: string
  raw?: unknown
}

export interface MediaJobResult extends MediaJob {
  outputUrls: string[]
  error?: string
  completedAt?: string
}

export interface MediaProviderHealth {
  provider: MediaProviderId
  configured: boolean
  capabilities: MediaIntent[]
}

export interface MediaProviderAdapter {
  readonly id: MediaProviderId
  readonly capabilities: readonly MediaIntent[]
  isConfigured(): boolean
  supports(request: MediaGenerationRequest): boolean
  submit(request: MediaGenerationRequest): Promise<MediaJob>
  poll(job: MediaJob): Promise<MediaJobResult>
}
