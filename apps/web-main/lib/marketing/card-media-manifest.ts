import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { cardKey, getAllCardMediaSpecs, type CardMediaScope, type HomeServiceId } from './card-media-spec'

export interface CardMediaEntry {
  photoUrl: string
  photoAlt: string
  videoUrl?: string
  videoWebM?: string
  mediaType: 'video' | 'photo'
  generatedAt?: string
  promptUsed?: string
  source?: 'generated' | 'fallback'
}

export interface CardMediaManifest {
  version: number
  updatedAt: string | null
  cards: Record<string, CardMediaEntry>
}

const MANIFEST_PATH = path.join(process.cwd(), 'public', 'media', 'manifest.json')

function defaultManifest(): CardMediaManifest {
  const cards: Record<string, CardMediaEntry> = {}
  for (const spec of getAllCardMediaSpecs()) {
    cards[spec.key] = {
      photoUrl: spec.fallbackPhoto,
      photoAlt: spec.photoAlt,
      mediaType: spec.mediaType,
      source: 'fallback',
    }
  }
  return { version: 1, updatedAt: null, cards }
}

export async function loadCardMediaManifest(): Promise<CardMediaManifest> {
  try {
    if (!existsSync(MANIFEST_PATH)) return defaultManifest()
    const raw = await readFile(MANIFEST_PATH, 'utf8')
    const parsed = JSON.parse(raw) as CardMediaManifest
    const base = defaultManifest()
    return {
      version: parsed.version ?? 1,
      updatedAt: parsed.updatedAt ?? null,
      cards: { ...base.cards, ...parsed.cards },
    }
  } catch {
    return defaultManifest()
  }
}

export function resolveCardMedia(
  scope: CardMediaScope,
  id: string,
  manifest: CardMediaManifest,
  fallback?: Partial<CardMediaEntry>,
): CardMediaEntry {
  const key = cardKey(scope, id)
  const entry = manifest.cards[key]
  if (entry?.photoUrl) {
    return {
      photoUrl: entry.photoUrl,
      photoAlt: entry.photoAlt ?? fallback?.photoAlt ?? id,
      videoUrl: entry.videoUrl ?? fallback?.videoUrl,
      videoWebM: entry.videoWebM ?? fallback?.videoWebM,
      mediaType: entry.mediaType ?? fallback?.mediaType ?? 'photo',
      generatedAt: entry.generatedAt,
      promptUsed: entry.promptUsed,
      source: entry.source ?? 'fallback',
    }
  }
  return {
    photoUrl: fallback?.photoUrl ?? '',
    photoAlt: fallback?.photoAlt ?? id,
    mediaType: fallback?.mediaType ?? 'photo',
    source: 'fallback',
    ...fallback,
  }
}

export function resolveHomeServiceMedia(
  id: HomeServiceId,
  manifest: CardMediaManifest,
): CardMediaEntry {
  return resolveCardMedia('home', id, manifest)
}

export function resolveProductMedia(
  slug: string,
  manifest: CardMediaManifest,
  fallbackPhoto: string,
  photoAlt: string,
): CardMediaEntry {
  return resolveCardMedia('product', slug, manifest, {
    photoUrl: fallbackPhoto,
    photoAlt,
    mediaType: 'video',
  })
}

export function publicMediaPath(scope: CardMediaScope, id: string, ext: string): string {
  return `${scope}/${id}.${ext}`
}
