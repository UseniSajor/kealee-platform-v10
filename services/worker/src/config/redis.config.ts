import Redis from 'ioredis'

// Redis connection configuration
export function createRedisConnection(): Redis {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

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
    console.log('✅ Redis connected')
  })

  redis.on('error', (err) => {
    console.error('❌ Redis connection error:', err)
  })

  redis.on('close', () => {
    console.log('⚠️ Redis connection closed')
  })

  return redis
}

// Default Redis connection instance
export const redis = createRedisConnection()
