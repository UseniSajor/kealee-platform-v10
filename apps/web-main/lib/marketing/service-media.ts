import { SERVICES, type Service } from '@/lib/services-config'
import { loadCardMediaManifest, resolveProductMedia } from './card-media-manifest'

export interface ServiceMedia {
  heroImage: string
  beforeImage?: string
  heroVideo?: string
  heroVideoWebM?: string
  photoAlt: string
  narrativeId?: string
  source: 'generated' | 'fallback'
}

export async function getServiceMedia(slug: string): Promise<ServiceMedia | null> {
  const svc = SERVICES.find((s) => s.slug === slug)
  if (!svc) return null
  const manifest = await loadCardMediaManifest()
  const media = resolveProductMedia(slug, manifest, svc.heroImage, `${svc.label} — Kealee`)
  return {
    heroImage: media.photoUrl,
    beforeImage: media.beforePhotoUrl,
    heroVideo: media.videoUrl,
    heroVideoWebM: media.videoWebM,
    photoAlt: media.photoAlt,
    narrativeId: media.narrativeId,
    source: media.source ?? 'fallback',
  }
}

export async function getAllProductMediaMap(): Promise<Record<string, ServiceMedia>> {
  const manifest = await loadCardMediaManifest()
  const out: Record<string, ServiceMedia> = {}
  for (const svc of SERVICES.filter((s) => s.phase === 'precon')) {
    const media = resolveProductMedia(svc.slug, manifest, svc.heroImage, `${svc.label} — Kealee`)
    out[svc.slug] = {
      heroImage: media.photoUrl,
      beforeImage: media.beforePhotoUrl,
      heroVideo: media.videoUrl,
      heroVideoWebM: media.videoWebM,
      photoAlt: media.photoAlt,
      narrativeId: media.narrativeId,
      source: media.source ?? 'fallback',
    }
  }
  return out
}

export function applyMediaToService(svc: Service, media: ServiceMedia): Service {
  return { ...svc, heroImage: media.heroImage }
}
