/**
 * Sentry Client Configuration for API
 * This file is used by Sentry CLI for source maps
 */

import * as Sentry from '@sentry/node'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
  ],
  beforeSend(event, hint) {
    // Filter out health check errors
    if (event.request?.url?.includes('/health')) {
      return null
    }
    return event
  },
})
