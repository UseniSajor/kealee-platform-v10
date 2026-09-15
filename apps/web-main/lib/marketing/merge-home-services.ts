import {
  HOME_JOURNEY_SERVICES,
  type HomeJourneyService,
} from '@/components/home/home-services-data'
import type { CardMediaManifest } from './card-media-manifest'
import { resolveCardMedia } from './card-media-manifest'

export function mergeHomeServicesWithManifest(
  manifest: CardMediaManifest,
): HomeJourneyService[] {
  return HOME_JOURNEY_SERVICES.map((service) => {
    // New journey services may not have a generated `home:*` manifest entry yet.
    // resolveCardMedia preserves their curated local photo/video fallbacks.
    const media = resolveCardMedia('home', service.id, manifest, {
      photoUrl: service.photoSrc,
      photoAlt: service.photoAlt,
      mediaType: service.mediaType,
      videoUrl: service.videoSrc,
      videoWebM: service.videoWebM,
    })
    return {
      ...service,
      photoSrc: media.photoUrl || service.photoSrc,
      photoAlt: media.photoAlt || service.photoAlt,
      mediaType: media.mediaType ?? service.mediaType,
      videoSrc: media.videoUrl ?? service.videoSrc,
      videoWebM: media.videoWebM ?? service.videoWebM,
    }
  })
}
