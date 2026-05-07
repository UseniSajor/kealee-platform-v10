import * as Sentry from '@sentry/nextjs'

// Auto-injected by @sentry/nextjs webpack plugin as a client-side entry point.
// (When Turbopack is adopted, move this to instrumentation-client.ts instead.)

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  beforeSend(event) {
    if (event.request?.url?.includes('/health')) return null
    if (event.request?.url?.includes('/_next')) return null
    return event
  },

  ignoreErrors: [
    'top.GLOBALS',
    'originalCreateNotification',
    'canvas.contentDocument',
    'MyApp_RemoveAllHighlights',
  ],
})
