'use client'

import { useCallback } from 'react'
import { trackEvent } from '@/lib/analytics'

export function useMediaAnalytics(context: string) {
  const onVideoPlay = useCallback(
    (videoId: string) => trackEvent('video_play', { context, videoId }),
    [context]
  )

  const onVideoComplete = useCallback(
    (videoId: string, watchPct: number) =>
      trackEvent('video_complete', { context, videoId, watchPct }),
    [context]
  )

  const onImageOpen = useCallback(
    (imageIndex: number) => trackEvent('image_lightbox_open', { context, imageIndex }),
    [context]
  )

  const onCtaClick = useCallback(
    (label: string, href: string) => trackEvent('cta_click', { context, label, href }),
    [context]
  )

  return { onVideoPlay, onVideoComplete, onImageOpen, onCtaClick }
}
