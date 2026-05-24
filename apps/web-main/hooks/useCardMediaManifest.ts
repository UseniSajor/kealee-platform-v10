'use client'

import { useEffect, useState } from 'react'
import type { CardMediaManifest } from '@/lib/marketing/card-media-manifest'

let cache: CardMediaManifest | null = null

export function useCardMediaManifest() {
  const [manifest, setManifest] = useState<CardMediaManifest | null>(cache)

  useEffect(() => {
    if (cache) return
    fetch('/api/marketing/card-media')
      .then((r) => r.json())
      .then((data: CardMediaManifest) => {
        cache = data
        setManifest(data)
      })
      .catch(() => setManifest(null))
  }, [])

  return manifest
}

export function productHeroFromManifest(
  manifest: CardMediaManifest | null,
  slug: string,
  fallback: string,
): string {
  const entry = manifest?.cards[`product:${slug}`]
  if (entry?.photoUrl && entry.source === 'generated') return entry.photoUrl
  return entry?.photoUrl ?? fallback
}

export function productVideoFromManifest(
  manifest: CardMediaManifest | null,
  slug: string,
): string | undefined {
  return manifest?.cards[`product:${slug}`]?.videoUrl
}
