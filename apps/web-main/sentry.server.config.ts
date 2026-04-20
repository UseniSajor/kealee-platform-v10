/**
 * Sentry Server-Side Configuration
 * Captures Next.js API routes and server-side errors
 */

import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN

export function initServerSentry() {
  if (!SENTRY_DSN) {
    console.warn('SENTRY_DSN not set. Server error tracking disabled.')
    return
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Filter out health checks
    beforeSend(event) {
      if (event.request?.url?.includes('/health')) {
        return null
      }
      if (event.request?.url?.includes('/_next')) {
        return null
      }
      return event
    },
  })
}
