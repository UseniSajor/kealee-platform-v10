'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { trackEvent } from '@/lib/analytics'

/** Fires GA4-style events when users land on key conversion paths. */
export function ConversionPathTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname) return

    if (pathname === '/concept' || pathname.startsWith('/concept-engine') || pathname === '/get-concept') {
      trackEvent('intake_start', { funnel: 'concept', path: pathname })
    } else if (pathname === '/permits' || pathname.startsWith('/permits/')) {
      trackEvent('intake_start', { funnel: 'permits', path: pathname })
    } else if (pathname === '/estimate' || pathname.startsWith('/estimate/')) {
      trackEvent('intake_start', { funnel: 'estimate', path: pathname })
    } else if (pathname === '/marketplace' || pathname.startsWith('/marketplace/')) {
      trackEvent('service_page_view', { service: 'marketplace', path: pathname })
    } else if (pathname.startsWith('/service-areas')) {
      trackEvent('service_page_view', { service: 'local_seo', path: pathname })
    }
  }, [pathname])

  return null
}
