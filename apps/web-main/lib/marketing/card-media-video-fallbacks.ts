import type { HomeServiceId } from './card-media-spec'

/**
 * Short, loop-friendly stock MP4s for homepage service cards when AI video gen is skipped.
 * Curated public MP4s keep cards relevant when Replicate video generation is unavailable.
 */
export const HOME_CARD_STOCK_VIDEOS: Partial<
  Record<HomeServiceId, { mp4: string; webm?: string }>
> = {
  design: {
    mp4: 'https://videos.pexels.com/video-files/6474143/6474143-hd_1280_720_25fps.mp4',
  },
  estimate: {
    mp4: 'https://www.w3schools.com/html/mov_bbb.mp4',
  },
  build: {
    mp4: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
}

/** Legacy spec filenames (optional copies for old hardcoded paths). */
export const LEGACY_SERVICE_VIDEO_ALIASES: Record<string, string> = {
  'design-concepts': 'design',
  'cost-estimation': 'estimate',
  'build-manage': 'build',
}
