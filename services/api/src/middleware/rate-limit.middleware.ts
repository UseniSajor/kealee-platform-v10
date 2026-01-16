import { FastifyRequest, FastifyReply } from 'fastify'
import rateLimit from '@fastify/rate-limit'
import { RateLimitError } from '../errors/app.error'

/**
 * Rate limit configuration
 */
export const RATE_LIMIT_CONFIG = {
  // Per-user rate limits (authenticated users)
  perUser: {
    max: 100, // requests
    timeWindow: '1 minute', // time window
  },
  // Per-org rate limits
  perOrg: {
    max: 500, // requests
    timeWindow: '1 minute',
  },
  // Global rate limits (unauthenticated)
  global: {
    max: 50, // requests
    timeWindow: '1 minute',
  },
}

/**
 * Create per-user rate limiter
 * Limits requests per authenticated user
 */
export async function registerPerUserRateLimit(fastify: any) {
  await fastify.register(rateLimit, {
    max: RATE_LIMIT_CONFIG.perUser.max,
    timeWindow: RATE_LIMIT_CONFIG.perUser.timeWindow,
    keyGenerator: (request: FastifyRequest) => {
      const user = (request as any).user
      if (user?.id) {
        return `user:${user.id}`
      }
      // Fallback to IP if not authenticated
      return request.ip || 'unknown'
    },
    errorResponseBuilder: (request: FastifyRequest, context: any) => {
      return {
        error: {
          message: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          statusCode: 429,
          limit: context.max,
          remaining: 0,
          reset: new Date(Date.now() + context.timeWindow).toISOString(),
          timestamp: new Date().toISOString(),
          path: request.url,
        },
      }
    },
  })
}

/**
 * Create per-org rate limiter
 * Limits requests per organization
 */
export async function registerPerOrgRateLimit(fastify: any) {
  await fastify.register(rateLimit, {
    max: RATE_LIMIT_CONFIG.perOrg.max,
    timeWindow: RATE_LIMIT_CONFIG.perOrg.timeWindow,
    keyGenerator: (request: FastifyRequest) => {
      // Try to get orgId from various sources
      const orgId =
        (request.params as any)?.orgId ||
        (request.query as any)?.orgId ||
        (request.body as any)?.orgId ||
        (request.headers as any)['x-org-id']

      if (orgId) {
        return `org:${orgId}`
      }

      // Fallback to user ID if available
      const user = (request as any).user
      if (user?.id) {
        return `user:${user.id}`
      }

      // Fallback to IP
      return request.ip || 'unknown'
    },
    errorResponseBuilder: (request: FastifyRequest, context: any) => {
      return {
        error: {
          message: 'Organization rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          statusCode: 429,
          limit: context.max,
          remaining: 0,
          reset: new Date(Date.now() + context.timeWindow).toISOString(),
          timestamp: new Date().toISOString(),
          path: request.url,
        },
      }
    },
  })
}

/**
 * Create global rate limiter
 * Basic rate limiting for all requests
 */
export async function registerGlobalRateLimit(fastify: any) {
  await fastify.register(rateLimit, {
    max: RATE_LIMIT_CONFIG.global.max,
    timeWindow: RATE_LIMIT_CONFIG.global.timeWindow,
    keyGenerator: (request: FastifyRequest) => {
      return request.ip || 'unknown'
    },
    errorResponseBuilder: (request: FastifyRequest, context: any) => {
      return {
        error: {
          message: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          statusCode: 429,
          limit: context.max,
          remaining: 0,
          reset: new Date(Date.now() + context.timeWindow).toISOString(),
          timestamp: new Date().toISOString(),
          path: request.url,
        },
      }
    },
  })
}

/**
 * Custom rate limit middleware for specific routes
 */
export function createRateLimitMiddleware(options: {
  max: number
  timeWindow: string | number
  keyGenerator?: (request: FastifyRequest) => string
}) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    // This would integrate with Redis or in-memory store
    // For now, we'll use the Fastify rate limit plugin
    // Custom implementation can be added here if needed
  }
}
