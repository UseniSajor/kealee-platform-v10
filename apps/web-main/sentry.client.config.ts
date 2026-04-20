/**
 * Sentry Client-Side Configuration
 * Captures frontend errors and performance metrics
 */

import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN

export function initClientSentry() {
  if (!SENTRY_DSN) {
    console.warn('NEXT_PUBLIC_SENTRY_DSN not set. Client error tracking disabled.')
    return
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Filter out health checks and development noise
    beforeSend(event) {
      if (event.request?.url?.includes('/health')) {
        return null
      }
      if (event.request?.url?.includes('/_next')) {
        return null
      }
      return event
    },

    // Ignore common browser errors that don't need reporting
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'originalCreateNotification',
      'canvas.contentDocument',
      'MyApp_RemoveAllHighlights',
    ],
  })
}
