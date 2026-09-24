import { HiggsfieldAdapter, ReplicateAdapter, SeedanceAdapter, VeoAdapter } from './adapters'
import type {
  MediaGenerationRequest,
  MediaJob,
  MediaJobResult,
  MediaProviderAdapter,
  MediaProviderHealth,
  MediaProviderId,
  MediaUsageRecorder,
} from './types'

const ROUTES: Record<MediaGenerationRequest['intent'], MediaProviderId[]> = {
  'specialized-model': ['replicate'],
  'open-source-model': ['replicate'],
  'image-processing': ['replicate'],
  'cinematic-video': ['higgsfield', 'seedance', 'veo', 'replicate'],
  'renovation-visualization': ['higgsfield', 'seedance', 'veo', 'replicate'],
  'development-visualization': ['higgsfield', 'seedance', 'veo', 'replicate'],
  'marketing-content': ['higgsfield', 'seedance', 'veo', 'replicate'],
}

export class KealeeMediaRouter {
  private readonly adapters = new Map<MediaProviderId, MediaProviderAdapter>()
  private readonly usageRecorder?: MediaUsageRecorder

  constructor(adapters: MediaProviderAdapter[] = [], options: { usageRecorder?: MediaUsageRecorder } = {}) {
    this.usageRecorder = options.usageRecorder
    for (const adapter of adapters) this.register(adapter)
  }

  register(adapter: MediaProviderAdapter): this {
    this.adapters.set(adapter.id, adapter)
    return this
  }

  health(): MediaProviderHealth[] {
    return [...this.adapters.values()].map(adapter => ({
      provider: adapter.id,
      configured: adapter.isConfigured(),
      capabilities: [...adapter.capabilities],
    }))
  }

  async submit(request: MediaGenerationRequest): Promise<MediaJob> {
    if (!request.prompt.trim()) throw new Error('A media generation prompt is required')
    const candidates = request.provider ? [request.provider] : ROUTES[request.intent]
    const failures: string[] = []
    for (const provider of candidates) {
      const adapter = this.adapters.get(provider)
      if (!adapter || !adapter.isConfigured() || !adapter.supports(request)) continue
      try {
        return await adapter.submit(request)
      } catch (error) {
        failures.push(`${provider}: ${error instanceof Error ? error.message : String(error)}`)
        if (request.provider) break
      }
    }
    const suffix = failures.length ? ` Attempts: ${failures.join(' | ')}` : ''
    throw new Error(`No configured media provider can handle ${request.kind}/${request.intent}.${suffix}`)
  }

  async poll(job: MediaJob): Promise<MediaJobResult> {
    const adapter = this.adapters.get(job.provider)
    if (!adapter) throw new Error(`Unknown media provider: ${job.provider}`)
    const result = await adapter.poll(job)
    if (result.status === 'completed' && result.tenantId && this.usageRecorder) {
      const isVideo = result.kind === 'video'
      await this.usageRecorder.record({
        tenantId: result.tenantId,
        metric: isVideo ? 'VIDEO_GENERATION_SECOND' : 'IMAGE_GENERATION',
        quantity: isVideo ? result.requestedDurationSec ?? 1 : 1,
        unit: isVideo ? 'second' : 'generation',
        provider: result.provider,
        model: result.model,
        resourceType: 'media_job',
        resourceId: result.jobId,
        idempotencyKey: `media:${result.provider}:${result.jobId}:completed`,
        occurredAt: result.completedAt ?? new Date().toISOString(),
      })
    }
    return result
  }
}

export function createMediaRouterFromEnv(
  extraAdapters: MediaProviderAdapter[] = [],
  options: { usageRecorder?: MediaUsageRecorder } = {},
): KealeeMediaRouter {
  return new KealeeMediaRouter([
    new ReplicateAdapter(),
    new HiggsfieldAdapter(),
    new SeedanceAdapter(),
    new VeoAdapter(),
    ...extraAdapters,
  ], options)
}

export async function waitForMediaJob(
  router: KealeeMediaRouter,
  job: MediaJob,
  options: { timeoutMs?: number; intervalMs?: number } = {},
): Promise<MediaJobResult> {
  const timeoutMs = options.timeoutMs ?? 10 * 60_000
  const intervalMs = options.intervalMs ?? 4_000
  const started = Date.now()
  let current: MediaJobResult = { ...job, outputUrls: [] }
  while (Date.now() - started < timeoutMs) {
    current = await router.poll(current)
    if (current.status === 'completed') return current
    if (current.status === 'failed' || current.status === 'canceled') {
      throw new Error(current.error ?? `${current.provider} generation ${current.status}`)
    }
    await new Promise(resolve => setTimeout(resolve, intervalMs))
  }
  throw new Error(`${job.provider} generation timed out after ${timeoutMs}ms`)
}
