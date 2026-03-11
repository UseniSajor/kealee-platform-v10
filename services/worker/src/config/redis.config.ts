import Redis from 'ioredis'

/**
 * Validates that REDIS_URL is set. In production this is fatal.
 * In development, falls back to localhost with a warning.
 */
function getRedisUrl(): string {
  const redisUrl = process.env.REDIS_URL
  const isProduction = process.env.NODE_ENV === 'production' || process.env.APP_ENV === 'production'

  if (!redisUrl || redisUrl.trim() === '') {
    if (isProduction) {
      console.error('')
      console.error('='.repeat(80))
      console.error('FATAL: REDIS_URL is not set')
      console.error('='.repeat(80))
      console.error('')
      console.error('Redis is required in production for all BullMQ job queues:')
      console.error('  - Email delivery')
      console.error('  - Webhook dispatch')
      console.error('  - ML processing')
      console.error('  - Report generation')
      console.error('  - Concept delivery')
      console.error('  - Spatial verification')
      console.error('')
      console.error('Set REDIS_URL in your deployment environment (Railway dashboard).')
      console.error('Example: redis://default:password@redis-host:6379')
      console.error('')
      console.error('='.repeat(80))
      process.exit(1)
    }

    console.warn('[redis] REDIS_URL not set — falling back to redis://localhost:6379 (dev only)')
    return 'redis://localhost:6379'
  }

  return redisUrl
}

// Redis connection configuration
export function createRedisConnection(): Redis {
  const redisUrl = getRedisUrl()

  const redis = new Redis(redisUrl, {
    // BullMQ requirement: must be null
    maxRetriesPerRequest: null,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000)
      return delay
    },
    reconnectOnError: (err) => {
      // Reconnect on transient errors (matches automation package redis.ts)
      if (
        err.message.includes('READONLY') ||
        err.message.includes('ECONNRESET') ||
        err.message.includes('ETIMEDOUT')
      ) {
        return true
      }
      return false
    },
  })

  redis.on('connect', () => {
    console.log('Redis connected')
  })

  redis.on('error', (err) => {
    console.error('Redis connection error:', err)
  })

  redis.on('close', () => {
    console.log('Redis connection closed')
  })

  return redis
}

// Default Redis connection instance
export const redis = createRedisConnection()
