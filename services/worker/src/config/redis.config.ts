import Redis from 'ioredis'

/**
 * Railway's private network is IPv6-only. Node's default resolution order tries
 * the A record first, and a `.railway.internal` host publishes only AAAA — so
 * every connection fails with `getaddrinfo ENOTFOUND` while the URL, the
 * password and the port are all correct. `family: 6` is what makes ioredis ask
 * for the address that exists.
 *
 * Conditional on purpose: forcing IPv6 would break localhost in development and
 * the public TCP proxy, both of which resolve over IPv4.
 */
function railwayPrivateNetworkFamily(url: string): 6 | undefined {
  return url.includes('.railway.internal') ? 6 : undefined
}


// Redis connection configuration
export function createRedisConnection(): Redis {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

  const redis = new Redis(redisUrl, {
    family: railwayPrivateNetworkFamily(redisUrl),
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
