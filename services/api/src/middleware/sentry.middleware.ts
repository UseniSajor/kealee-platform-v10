/**
 * Sentry Integration for Fastify API
 */

import * as Sentry from '@sentry/node'
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'

let sentryInitialized = false

export function initSentry(dsn?: string, environment?: string) {
  if (sentryInitialized) return

  const sentryDsn = dsn || process.env.SENTRY_DSN

  if (!sentryDsn) {
    console.warn('⚠️ SENTRY_DSN not set. Error tracking disabled.')
    return
  }

  try {
    // Dynamic import to avoid bundling issues if Sentry not installed
    import('@sentry/node').then((Sentry) => {
      Sentry.init({
        dsn: sentryDsn,
        environment: environment || process.env.NODE_ENV || 'development',
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
      sentryInitialized = true
      console.log('✅ Sentry initialized for API')
    }).catch(() => {
      console.warn('Sentry package not installed. Run: pnpm add @sentry/node')
    })
  } catch (error) {
    console.warn('Failed to initialize Sentry:', error)
  }
}

/**
 * Sentry request handler
 */
export async function sentryRequestHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  if (!sentryInitialized) return

  try {
    const Sentry = await import('@sentry/node')
    const transaction = Sentry.startTransaction({
      op: 'http.server',
      name: `${request.method} ${request.routerPath || request.url}`,
      data: {
        method: request.method,
        url: request.url,
        headers: request.headers,
      },
    })

    ;(request as any).__sentryTransaction = transaction

    // Set user context if available
    const user = (request as any).user
    if (user) {
      Sentry.setUser({
        id: user.id,
        email: user.email,
        username: user.name,
      })
    }
  } catch {
    // Sentry not available
  }
}

/**
 * Sentry response handler
 */
export async function sentryResponseHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  if (!sentryInitialized) return

  try {
    const transaction = (request as any).__sentryTransaction
    if (transaction) {
      transaction.setHttpStatus(reply.statusCode)
      transaction.finish()
    }
  } catch {
    // Sentry not available
  }
}

/**
 * Sentry error handler
 */
export async function captureException(error: Error, context?: Record<string, any>) {
  if (!sentryInitialized) return

  try {
    const Sentry = await import('@sentry/node')
    Sentry.captureException(error, {
      extra: context,
    })
  } catch {
    // Sentry not available
  }
}

export async function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (!sentryInitialized) return

  try {
    const Sentry = await import('@sentry/node')
    Sentry.captureMessage(message, level)
  } catch {
    // Sentry not available
  }
}
