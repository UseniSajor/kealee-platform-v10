import { describe, expect, it, vi } from 'vitest'
import { KealeeMediaRouter } from '../router'
import type { MediaGenerationRequest, MediaIntent, MediaJob, MediaJobResult, MediaProviderAdapter } from '../types'

function adapter(
  id: MediaProviderAdapter['id'],
  configured = true,
  intent: MediaIntent = id === 'replicate' ? 'open-source-model' : 'cinematic-video',
): MediaProviderAdapter {
  return {
    id,
    capabilities: [intent],
    isConfigured: () => configured,
    supports: request => request.intent === intent,
    submit: async request => ({ provider: id, jobId: `${id}-1`, model: 'test', kind: request.kind, status: 'queued', submittedAt: '2026-09-23T00:00:00.000Z', tenantId: request.tenantId, requestedDurationSec: request.durationSec }),
    poll: async job => ({ ...job, status: 'completed', outputUrls: [`https://cdn.example.com/${job.jobId}.mp4`] }),
  }
}

const cinematic: MediaGenerationRequest = { kind: 'video', intent: 'cinematic-video', prompt: 'Cinematic property reveal' }

describe('KealeeMediaRouter', () => {
  it('routes cinematic generation to Higgsfield first', async () => {
    const router = new KealeeMediaRouter([adapter('replicate'), adapter('higgsfield'), adapter('seedance')])
    expect((await router.submit(cinematic)).provider).toBe('higgsfield')
  })

  it('routes marketing prompt-to-video generation to Higgsfield first', async () => {
    const higgsfield = adapter('higgsfield', true, 'marketing-content')
    const router = new KealeeMediaRouter([adapter('replicate'), higgsfield, adapter('seedance')])
    const job = await router.submit({ kind: 'video', intent: 'marketing-content', prompt: 'Campaign reel' })
    expect(job.provider).toBe('higgsfield')
  })

  it('falls back to direct Seedance when Higgsfield is not configured', async () => {
    const router = new KealeeMediaRouter([adapter('higgsfield', false), adapter('seedance')])
    expect((await router.submit(cinematic)).provider).toBe('seedance')
  })

  it('keeps open-source model work on Replicate', async () => {
    const router = new KealeeMediaRouter([adapter('replicate'), adapter('higgsfield')])
    const job = await router.submit({ kind: 'image', intent: 'open-source-model', prompt: 'Architectural render' })
    expect(job.provider).toBe('replicate')
  })

  it('honors an explicit provider without silently changing it', async () => {
    const router = new KealeeMediaRouter([adapter('higgsfield', false), adapter('seedance')])
    await expect(router.submit({ ...cinematic, provider: 'higgsfield' })).rejects.toThrow(/No configured media provider/)
  })

  it('polls through the adapter that owns the job', async () => {
    const router = new KealeeMediaRouter([adapter('higgsfield')])
    const job: MediaJob = await router.submit(cinematic)
    const result: MediaJobResult = await router.poll(job)
    expect(result.status).toBe('completed')
    expect(result.outputUrls[0]).toContain('higgsfield-1.mp4')
  })

  it('allows an explicitly selected future adapter', async () => {
    const future = adapter('future-provider')
    const router = new KealeeMediaRouter([future])
    const job = await router.submit({ ...cinematic, provider: 'future-provider' })
    expect(job.provider).toBe('future-provider')
  })

  it('records tenant usage exactly through an idempotent completion event', async () => {
    const record = vi.fn().mockResolvedValue(undefined)
    const router = new KealeeMediaRouter([adapter('higgsfield')], { usageRecorder: { record } })
    const job = await router.submit({ ...cinematic, tenantId: 'tenant-1', durationSec: 8 })
    await router.poll(job)
    expect(record).toHaveBeenCalledWith(expect.objectContaining({
      tenantId: 'tenant-1',
      metric: 'VIDEO_GENERATION_SECOND',
      quantity: 8,
      idempotencyKey: 'media:higgsfield:higgsfield-1:completed',
    }))
  })
})
