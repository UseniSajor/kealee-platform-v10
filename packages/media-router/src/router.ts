import { HiggsfieldAdapter, ReplicateAdapter, SeedanceAdapter, VeoAdapter } from './adapters'
import type {
  MediaGenerationRequest,
  MediaJob,
  MediaJobResult,
  MediaProviderAdapter,
  MediaProviderHealth,
  MediaProviderId,
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

  constructor(adapters: MediaProviderAdapter[] = []) {
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
    return adapter.poll(job)
  }
}

export function createMediaRouterFromEnv(extraAdapters: MediaProviderAdapter[] = []): KealeeMediaRouter {
  return new KealeeMediaRouter([
    new ReplicateAdapter(),
    new HiggsfieldAdapter(),
    new SeedanceAdapter(),
    new VeoAdapter(),
    ...extraAdapters,
  ])
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
