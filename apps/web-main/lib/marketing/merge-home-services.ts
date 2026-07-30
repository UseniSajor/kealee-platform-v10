import {
  HOME_JOURNEY_SERVICES,
  type HomeJourneyService,
} from '@/components/home/home-services-data'
import type { CardMediaManifest } from './card-media-manifest'
import { resolveHomeServiceMedia } from './card-media-manifest'

export function mergeHomeServicesWithManifest(
  manifest: CardMediaManifest,
): HomeJourneyService[] {
  return HOME_JOURNEY_SERVICES.map((service) => {
    const media = resolveHomeServiceMedia(service.id, manifest)
    return {
      ...service,
      photoSrc: media.photoUrl || service.photoSrc,
      photoAlt: media.photoAlt || service.photoAlt,
      beforePhotoSrc: media.beforePhotoUrl ?? service.beforePhotoSrc,
      mediaType: media.mediaType ?? service.mediaType,
      videoSrc: media.videoUrl ?? service.videoSrc,
      videoWebM: media.videoWebM ?? service.videoWebM,
    }
  })
}
