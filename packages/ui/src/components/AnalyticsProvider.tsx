'use client'

/**
 * Analytics Provider Component
 * Initializes analytics and tracks page views
 */

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { initAnalytics, trackPageView, initPerformanceMonitoring } from '../lib/analytics'
import { initSentry } from '../lib/sentry'

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  useEffect(() => {
    // Initialize analytics
    initAnalytics('posthog', process.env.NEXT_PUBLIC_POSTHOG_KEY)

    // Initialize Sentry
    initSentry(process.env.NEXT_PUBLIC_SENTRY_DSN, process.env.NODE_ENV)

    // Initialize performance monitoring
    initPerformanceMonitoring()
  }, [])

  useEffect(() => {
    // Track page view on route change
    if (pathname) {
      trackPageView(pathname, {
        timestamp: new Date().toISOString(),
      })
    }
  }, [pathname])

  return <>{children}</>
}
