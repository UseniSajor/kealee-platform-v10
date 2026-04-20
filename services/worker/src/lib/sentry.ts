/**
 * Sentry error tracking for BullMQ Worker
 */

import * as Sentry from '@sentry/node'

let sentryInitialized = false

export function initWorkerSentry() {
  if (sentryInitialized) return

  const sentryDsn = process.env.SENTRY_DSN

  if (!sentryDsn) {
    console.warn('⚠️ SENTRY_DSN not set. Error tracking disabled.')
    return
  }

  try {
    Sentry.init({
      dsn: sentryDsn,
      environment: process.env.NODE_ENV || 'production',
      tracesSampleRate: 0.1,
    })
    sentryInitialized = true
    console.log('✅ Sentry initialized for Worker')
  } catch (error) {
    console.warn('Failed to initialize Sentry:', error)
  }
}

export function captureWorkerError(error: Error, context?: Record<string, unknown>) {
  if (!sentryInitialized) return

  try {
    Sentry.captureException(error, {
      extra: context,
    })
  } catch {
    // Sentry not available
  }
}

export function captureWorkerMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (!sentryInitialized) return

  try {
    Sentry.captureMessage(message, level)
  } catch {
    // Sentry not available
  }
}
