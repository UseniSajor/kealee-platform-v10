/**
 * Redis Configuration
 * Centralized Redis configuration for rate limiting and caching.
 * Prefers REDIS_URL (Railway/Upstash/Heroku style) over individual REDIS_HOST vars.
 */

import Redis from 'ioredis';

export interface RedisConfig {
  host?: string;
  port?: number;
  password?: string;
  db?: number;
}

export function createRedisClient(config?: Partial<RedisConfig>): Redis | null {
  const redisUrl = process.env.REDIS_URL;
  const redisHost = config?.host || process.env.REDIS_HOST;

  // No Redis configured — cache and rate-limit state will use in-memory fallback
  if (!redisUrl && !redisHost) {
    console.log('[Redis] No REDIS_URL or REDIS_HOST set — using in-memory fallback');
    return null;
  }

  try {
    let client: Redis;

    if (redisUrl) {
      // REDIS_URL preferred: works with Railway, Upstash, Heroku, etc.
      client = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => Math.min(times * 100, 3000),
        enableReadyCheck: false,
        // TLS is inferred from rediss:// scheme automatically by ioredis
      });
    } else {
      client = new Redis({
        host: redisHost!,
        port: config?.port ?? parseInt(process.env.REDIS_PORT ?? '6379', 10),
        password: config?.password ?? process.env.REDIS_PASSWORD,
        db: config?.db ?? parseInt(process.env.REDIS_DB ?? '0', 10),
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => Math.min(times * 100, 3000),
        enableReadyCheck: false,
      });
    }

    client.on('error', (err) => {
      console.error('[Redis] Connection error:', err.message);
    });

    client.on('connect', () => {
      console.log('[Redis] Connected');
    });

    client.on('ready', () => {
      console.log('[Redis] Ready');
    });

    return client;
  } catch (error) {
    console.error('[Redis] Failed to create client:', error);
    return null;
  }
}

export const redisClient = createRedisClient();
