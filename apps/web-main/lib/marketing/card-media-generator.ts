import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { generateVideo, getVideoStatus, buildArchitecturalVideoPrompt } from '@/lib/ai-video'
import { generateCardImageUrl } from './card-media-image'
import type { CardMediaSpec } from './card-media-spec'
import { getAllCardMediaSpecs } from './card-media-spec'
import type { CardMediaEntry, CardMediaManifest } from './card-media-manifest'
import { loadCardMediaManifest } from './card-media-manifest'
import { refineImagePromptWithMarketingBot } from './card-media-prompts'
import { downloadUrlToBuffer, uploadMarketingAsset } from './card-media-storage'

const MANIFEST_PATH = path.join(process.cwd(), 'public', 'media', 'manifest.json')

export interface GenerateCardMediaOptions {
  keys?: string[]
  scope?: 'home' | 'product' | 'all'
  skipVideo?: boolean
  dryRun?: boolean
  useMarketingBot?: boolean
}

export interface GenerateCardMediaResult {
  key: string
  ok: boolean
  entry?: CardMediaEntry
  error?: string
}

async function pollVideoJob(
  provider: Awaited<ReturnType<typeof generateVideo>>['provider'],
  jobId: string,
  maxMs = 180_000,
): Promise<string> {
  const started = Date.now()
  while (Date.now() - started < maxMs) {
    const status = await getVideoStatus(provider, jobId)
    if (status.status === 'completed' && status.outputUrl) return status.outputUrl
    if (status.status === 'failed') throw new Error(status.error ?? 'Video generation failed')
    await new Promise((r) => setTimeout(r, 4000))
  }
  throw new Error('Video generation timed out')
}

async function persistManifest(manifest: CardMediaManifest): Promise<void> {
  await mkdir(path.dirname(MANIFEST_PATH), { recursive: true })
  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8')
}

export async function generateCardMedia(
  spec: CardMediaSpec,
  opts: GenerateCardMediaOptions = {},
): Promise<CardMediaEntry> {
  const description = opts.useMarketingBot !== false
    ? await refineImagePromptWithMarketingBot(spec)
    : spec.imageDescription

  if (opts.dryRun) {
    return {
      photoUrl: spec.fallbackPhoto,
      photoAlt: spec.photoAlt,
      mediaType: spec.mediaType,
      promptUsed: description,
      source: 'fallback',
    }
  }

  const remoteImageUrl = await generateCardImageUrl(spec, description)
  const imageBytes = await downloadUrlToBuffer(remoteImageUrl)
  const photoUrl = await uploadMarketingAsset(spec.scope, spec.id, imageBytes, 'jpg')

  let videoUrl: string | undefined
  if (spec.mediaType === 'video' && !opts.skipVideo) {
    try {
      const prompt = buildArchitecturalVideoPrompt({
        style: spec.style,
        roomType: spec.roomType ?? 'interior',
        motion: spec.videoMotion ?? 'reveal',
        extra: spec.videoExtra,
      })
      const job = await generateVideo({
        prompt,
        inputImageUrl: photoUrl,
        durationSec: 8,
        aspectRatio: '1:1',
        size: '1080x1920',
      })
      const outputUrl = await pollVideoJob(job.provider, job.jobId)
      const videoBytes = await downloadUrlToBuffer(outputUrl)
      videoUrl = await uploadMarketingAsset(spec.scope, `${spec.id}-video`, videoBytes, 'mp4')
    } catch (err) {
      console.warn(`[card-media] Video skipped for ${spec.key}:`, err)
    }
  }

  return {
    photoUrl,
    photoAlt: spec.photoAlt,
    videoUrl,
    mediaType: spec.mediaType,
    generatedAt: new Date().toISOString(),
    promptUsed: description,
    source: 'generated',
  }
}

export async function runCardMediaBatch(
  opts: GenerateCardMediaOptions = {},
): Promise<{ manifest: CardMediaManifest; results: GenerateCardMediaResult[] }> {
  const manifest = await loadCardMediaManifest()
  let specs = getAllCardMediaSpecs()

  if (opts.scope && opts.scope !== 'all') {
    specs = specs.filter((s) => s.scope === opts.scope)
  }
  if (opts.keys?.length) {
    const set = new Set(opts.keys)
    specs = specs.filter((s) => set.has(s.key))
  }

  const results: GenerateCardMediaResult[] = []

  for (const spec of specs) {
    try {
      console.log(`[card-media] Generating ${spec.key}…`)
      const entry = await generateCardMedia(spec, opts)
      manifest.cards[spec.key] = entry
      results.push({ key: spec.key, ok: true, entry })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[card-media] Failed ${spec.key}:`, message)
      results.push({ key: spec.key, ok: false, error: message })
    }
  }

  manifest.updatedAt = new Date().toISOString()
  if (!opts.dryRun) await persistManifest(manifest)

  return { manifest, results }
}
