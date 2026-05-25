import type { HomeServiceId } from './card-media-spec'

/**
 * Short, loop-friendly stock MP4s for homepage service cards when AI video gen is skipped.
 * Google sample bucket — stable URLs, muted-friendly, <3MB each.
 */
export const HOME_CARD_STOCK_VIDEOS: Partial<
  Record<HomeServiceId, { mp4: string; webm?: string }>
> = {
  design: {
    mp4: 'https://download.samplelib.com/mp4/sample-5s.mp4',
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
