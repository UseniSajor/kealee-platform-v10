import { copyFile, writeFile, mkdir, access } from 'fs/promises'
import path from 'path'
import { getAllCardMediaSpecs, type CardMediaSpec } from './card-media-spec'
import type { CardMediaManifest, CardMediaEntry } from './card-media-manifest'
import { loadCardMediaManifest } from './card-media-manifest'
import {
  downloadUrlToBuffer,
  saveLocalMarketingAsset,
  localMediaPath,
} from './card-media-storage'
import { HOME_CARD_STOCK_VIDEOS, LEGACY_SERVICE_VIDEO_ALIASES } from './card-media-video-fallbacks'
import type { HomeServiceId } from './card-media-spec'

const MANIFEST_PATH = path.join(process.cwd(), 'public', 'media', 'manifest.json')

export interface SyncFallbackOptions {
  scope?: 'home' | 'product' | 'all'
  /** Download stock MP4s for cards with mediaType video (home journey). */
  withVideos?: boolean
}

export async function syncFallbackCardMedia(
  opts: SyncFallbackOptions = {},
): Promise<{ manifest: CardMediaManifest; count: number }> {
  const manifest = await loadCardMediaManifest()
  let specs = getAllCardMediaSpecs()
  if (opts.scope && opts.scope !== 'all') {
    specs = specs.filter((s) => s.scope === opts.scope)
  }

  let count = 0
  for (const spec of specs) {
    const entry = await syncOneFallback(spec, opts.withVideos ?? false)
    manifest.cards[spec.key] = entry
    count++
  }

  if (opts.withVideos && (!opts.scope || opts.scope === 'all' || opts.scope === 'home')) {
    await writeLegacyVideoAliases()
  }

  manifest.updatedAt = new Date().toISOString()
  await mkdir(path.dirname(MANIFEST_PATH), { recursive: true })
  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8')
  return { manifest, count }
}

async function syncOneFallback(
  spec: CardMediaSpec,
  withVideos: boolean,
): Promise<CardMediaEntry> {
  const bytes = await downloadUrlToBuffer(spec.fallbackPhoto)
  const photoUrl = await saveLocalMarketingAsset(spec.scope, spec.id, bytes, 'jpg')

  let videoUrl: string | undefined
  let videoWebM: string | undefined

  if (withVideos && spec.mediaType === 'video' && spec.scope === 'home') {
    const stock = HOME_CARD_STOCK_VIDEOS[spec.id as HomeServiceId]
    if (stock?.mp4) {
      try {
        const videoBytes = await downloadUrlToBuffer(stock.mp4)
        videoUrl = await saveLocalMarketingAsset(
          spec.scope,
          `${spec.id}-video`,
          videoBytes,
          'mp4',
        )
        if (stock.webm && stock.webm !== stock.mp4) {
          const webmBytes = await downloadUrlToBuffer(stock.webm)
          videoWebM = await saveLocalMarketingAsset(
            spec.scope,
            `${spec.id}-video`,
            webmBytes,
            'webm',
          )
        } else {
          videoWebM = videoUrl
        }
      } catch (err) {
        console.warn(
          `[card-media] Local video save failed for ${spec.key}, using remote URL:`,
          err instanceof Error ? err.message : err,
        )
        videoUrl = stock.mp4
        videoWebM = stock.webm ?? stock.mp4
      }
    }
  }

  return {
    photoUrl,
    photoAlt: spec.photoAlt,
    mediaType: spec.mediaType,
    narrativeId: spec.narrativeId,
    videoNarrative: spec.cardProcessPrompt,
    videoUrl,
    videoWebM,
    source: 'fallback',
    generatedAt: new Date().toISOString(),
  }
}

/** Copy home-*-video.mp4 to legacy names (design-concepts.mp4, etc.). */
async function writeLegacyVideoAliases(): Promise<void> {
  for (const [legacyName, homeId] of Object.entries(LEGACY_SERVICE_VIDEO_ALIASES)) {
    const src = localMediaPath('home', `${homeId}-video`, 'mp4')
    const dest = path.join(
      process.cwd(),
      'public',
      'media',
      'service-videos',
      `${legacyName}.mp4`,
    )
    try {
      await access(src)
      await mkdir(path.dirname(dest), { recursive: true })
      await copyFile(src, dest)
    } catch {
      // source not created — skip
    }
  }
}
