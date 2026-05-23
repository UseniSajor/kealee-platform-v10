import { FastifyRequest, FastifyReply } from 'fastify'
import rateLimit from '@fastify/rate-limit'
import { redisClient } from '../config/redis.config'

/**
 * Rate limit configuration
 * - Authenticated users: 100 req/min (keyed by userId)
 * - Unauthenticated: 50 req/min (keyed by IP)
 */
export const RATE_LIMIT_CONFIG = {
  perUser: {
    max: 100,
    timeWindow: '1 minute',
  },
  global: {
    max: 50,
    timeWindow: '1 minute',
  },
}

/**
 * Unified rate limiter
 * Authenticated users get 100 req/min keyed by userId.
 * Unauthenticated traffic gets 50 req/min keyed by IP.
 * When REDIS_URL is set, state is persisted in Redis (shared across restarts/instances).
 * Falls back to in-memory when Redis is unavailable.
 */
export async function registerRateLimits(fastify: any) {
  if (redisClient) {
    console.log('[RateLimit] Using Redis store for rate limiting')
  } else {
    console.log('[RateLimit] Redis unavailable — using in-memory rate limiting')
  }

  await fastify.register(rateLimit, {
    // Pass ioredis client when available; @fastify/rate-limit accepts ioredis instances
    redis: redisClient ?? undefined,
    max: (request: FastifyRequest, key: string) => {
      if (key.startsWith('user:')) return RATE_LIMIT_CONFIG.perUser.max
      return RATE_LIMIT_CONFIG.global.max
    },
    timeWindow: RATE_LIMIT_CONFIG.perUser.timeWindow,
    keyGenerator: (request: FastifyRequest) => {
      const user = (request as any).user
      if (user?.id) return `user:${user.id}`
      return `ip:${request.ip || 'unknown'}`
    },
    errorResponseBuilder: (request: FastifyRequest, context: any) => ({
      error: {
        message: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        statusCode: 429,
        limit: context.max,
        remaining: 0,
        reset: new Date(Date.now() + (context.ttl || 60000)).toISOString(),
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    }),
  })
}

// Backward-compatible aliases
export const registerGlobalRateLimit = registerRateLimits
export const registerPerUserRateLimit = async () => {}
export const registerPerOrgRateLimit = async () => {}
