import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import type { CardMediaSpec } from './card-media-spec'
import { getAllCardMediaSpecs } from './card-media-spec'
import type { CardMediaEntry, CardMediaManifest } from './card-media-manifest'
import { loadCardMediaManifest } from './card-media-manifest'
import { refineImagePromptWithMarketingBot } from './card-media-prompts'
import { downloadUrlToBuffer, uploadMarketingAsset } from './card-media-storage'
import { generateCardImageUrl } from './card-media-image'
import { generateCardProcessVideo } from './process-video-generator'

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

async function persistManifest(manifest: CardMediaManifest): Promise<void> {
  await mkdir(path.dirname(MANIFEST_PATH), { recursive: true })
  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8')
}

export async function generateCardMedia(
  spec: CardMediaSpec,
  opts: GenerateCardMediaOptions = {},
): Promise<CardMediaEntry> {
  const afterDescription = opts.useMarketingBot !== false
    ? await refineImagePromptWithMarketingBot(spec)
    : spec.imageDescription

  if (opts.dryRun) {
    return {
      photoUrl: spec.fallbackPhoto,
      photoAlt: spec.photoAlt,
      mediaType: spec.mediaType,
      narrativeId: spec.narrativeId,
      videoNarrative: spec.cardProcessPrompt,
      promptUsed: afterDescription,
      source: 'fallback',
    }
  }

  let beforePhotoUrl: string | undefined
  if (spec.generatesBefore && spec.beforeImageDescription) {
    const beforeRemote = await generateCardImageUrl(
      { ...spec, imageDescription: spec.beforeImageDescription, imageType: 'before' },
      spec.beforeImageDescription,
    )
    const beforeBytes = await downloadUrlToBuffer(beforeRemote)
    beforePhotoUrl = await uploadMarketingAsset(spec.scope, `${spec.id}-before`, beforeBytes, 'jpg')
  }

  const remoteImageUrl = await generateCardImageUrl(spec, afterDescription)
  const imageBytes = await downloadUrlToBuffer(remoteImageUrl)
  const photoUrl = await uploadMarketingAsset(spec.scope, spec.id, imageBytes, 'jpg')

  let videoUrl: string | undefined
  let videoWebM: string | undefined
  if (spec.mediaType === 'video' && !opts.skipVideo) {
    try {
      const { videoUrl: remoteVideo, prompt } = await generateCardProcessVideo(spec, photoUrl)
      const videoBytes = await downloadUrlToBuffer(remoteVideo)
      videoUrl = await uploadMarketingAsset(spec.scope, `${spec.id}-video`, videoBytes, 'mp4')
      videoWebM = videoUrl
      return {
        photoUrl,
        beforePhotoUrl,
        photoAlt: spec.photoAlt,
        videoUrl,
        videoWebM,
        mediaType: spec.mediaType,
        narrativeId: spec.narrativeId,
        videoNarrative: prompt,
        generatedAt: new Date().toISOString(),
        promptUsed: afterDescription,
        source: 'generated',
      }
    } catch (err) {
      console.warn(`[card-media] Video skipped for ${spec.key}:`, err)
    }
  }

  return {
    photoUrl,
    beforePhotoUrl,
    photoAlt: spec.photoAlt,
    videoUrl,
    videoWebM,
    mediaType: spec.mediaType,
    narrativeId: spec.narrativeId,
    videoNarrative: spec.cardProcessPrompt,
    generatedAt: new Date().toISOString(),
    promptUsed: afterDescription,
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
