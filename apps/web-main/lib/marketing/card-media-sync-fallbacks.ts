import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { getAllCardMediaSpecs, type CardMediaSpec } from './card-media-spec'
import type { CardMediaManifest, CardMediaEntry } from './card-media-manifest'
import { loadCardMediaManifest } from './card-media-manifest'
import { downloadUrlToBuffer, saveLocalMarketingAsset } from './card-media-storage'

const MANIFEST_PATH = path.join(process.cwd(), 'public', 'media', 'manifest.json')

export async function syncFallbackCardMedia(opts: {
  scope?: 'home' | 'product' | 'all'
} = {}): Promise<{ manifest: CardMediaManifest; count: number }> {
  const manifest = await loadCardMediaManifest()
  let specs = getAllCardMediaSpecs()
  if (opts.scope && opts.scope !== 'all') {
    specs = specs.filter((s) => s.scope === opts.scope)
  }

  let count = 0
  for (const spec of specs) {
    const entry = await syncOneFallback(spec)
    manifest.cards[spec.key] = entry
    count++
  }

  manifest.updatedAt = new Date().toISOString()
  await mkdir(path.dirname(MANIFEST_PATH), { recursive: true })
  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8')
  return { manifest, count }
}

async function syncOneFallback(spec: CardMediaSpec): Promise<CardMediaEntry> {
  const bytes = await downloadUrlToBuffer(spec.fallbackPhoto)
  const photoUrl = await saveLocalMarketingAsset(spec.scope, spec.id, bytes, 'jpg')
  return {
    photoUrl,
    photoAlt: spec.photoAlt,
    mediaType: spec.mediaType,
    source: 'fallback',
    generatedAt: new Date().toISOString(),
  }
}
