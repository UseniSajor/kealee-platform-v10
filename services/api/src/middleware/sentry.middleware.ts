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
    Sentry.init({
      dsn: sentryDsn,
      environment: environment || process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      integrations: [
        Sentry.httpIntegration(),
      ],
      beforeSend(event) {
        // Filter out health check errors
        if (event.request?.url?.includes('/health')) {
          return null
        }
        return event
      },
    })
    sentryInitialized = true
    console.log('✅ Sentry initialized for API')
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
    // Use newer Sentry v8 API
    const span = Sentry.startInactiveSpan({
      op: 'http.server',
      name: `${request.method} ${request.routerPath || request.url}`,
      attributes: {
        method: request.method,
        url: request.url,
      },
    })

    ;(request as any).__sentrySpan = span

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
    const span = (request as any).__sentrySpan
    if (span) {
      span.setAttribute('http.status_code', reply.statusCode)
      span.end()
    }
  } catch {
    // Sentry not available
  }
}

/**
 * Sentry error handler
 */
export function captureException(error: Error, context?: Record<string, any>) {
  if (!sentryInitialized) return

  try {
    Sentry.captureException(error, {
      extra: context,
    })
  } catch {
    // Sentry not available
  }
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (!sentryInitialized) return

  try {
    Sentry.captureMessage(message, level)
  } catch {
    // Sentry not available
  }
}
