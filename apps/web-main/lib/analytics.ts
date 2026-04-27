type EventName =
  | 'video_play'
  | 'video_pause'
  | 'video_complete'
  | 'image_lightbox_open'
  | 'gallery_swipe'
  | 'service_page_view'
  | 'cta_click'
  | 'intake_start'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

export function trackEvent(name: EventName, props?: Record<string, unknown>): void {
  try {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', name, props)
    } else {
      console.log('[analytics]', name, props)
    }
  } catch {
    // never throw
  }
}

export function trackPageView(path: string, title?: string): void {
  try {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', { page_path: path, page_title: title })
    } else {
      console.log('[analytics] page_view', path, title)
    }
  } catch {
    // never throw
  }
}
