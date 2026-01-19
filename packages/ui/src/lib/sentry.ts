/**
 * Sentry Integration
 * Error tracking and performance monitoring
 */

let sentryInitialized = false

export function initSentry(dsn?: string, environment?: string) {
  if (typeof window === 'undefined' || sentryInitialized) return

  const sentryDsn = dsn || process.env.NEXT_PUBLIC_SENTRY_DSN

  if (!sentryDsn) {
    console.warn('Sentry DSN not configured. Error tracking disabled.')
    return
  }

  try {
    // Dynamic import to avoid bundling issues
    import('@sentry/nextjs').then((Sentry) => {
      Sentry.init({
        dsn: sentryDsn,
        environment: environment || process.env.NODE_ENV || 'development',
        tracesSampleRate: 1.0, // 100% in development, adjust for production
        replaysSessionSampleRate: 0.1, // 10% of sessions
        replaysOnErrorSampleRate: 1.0, // 100% of error sessions
        integrations: [
          new Sentry.BrowserTracing(),
          new Sentry.Replay(),
        ],
        beforeSend(event, hint) {
          // Filter out non-critical errors in production
          if (process.env.NODE_ENV === 'production') {
            // Don't send console errors
            if (event.exception?.values?.[0]?.type === 'Error' && 
                event.exception.values[0].value?.includes('console')) {
              return null
            }
          }
          return event
        },
      })
      sentryInitialized = true
      console.log('✅ Sentry initialized')
    }).catch(() => {
      console.warn('Sentry package not installed. Run: pnpm add @sentry/nextjs')
    })
  } catch (error) {
    console.warn('Failed to initialize Sentry:', error)
  }
}

export function captureException(error: Error, context?: Record<string, any>) {
  if (typeof window === 'undefined') return

  try {
    if ((window as any).Sentry) {
      ;(window as any).Sentry.captureException(error, {
        extra: context,
      })
    }
  } catch {
    // Ignore Sentry errors
  }
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (typeof window === 'undefined') return

  try {
    if ((window as any).Sentry) {
      ;(window as any).Sentry.captureMessage(message, level)
    }
  } catch {
    // Ignore Sentry errors
  }
}

export function setUser(user: { id: string; email?: string; username?: string }) {
  if (typeof window === 'undefined') return

  try {
    if ((window as any).Sentry) {
      ;(window as any).Sentry.setUser(user)
    }
  } catch {
    // Ignore Sentry errors
  }
}
