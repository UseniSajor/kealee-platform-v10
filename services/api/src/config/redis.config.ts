/**
 * Redis Configuration
 * Centralized Redis configuration for rate limiting and caching
 */

import Redis from 'ioredis';

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  retryStrategy?: (times: number) => number;
  maxRetriesPerRequest?: number;
}

export function createRedisClient(config?: Partial<RedisConfig>): Redis | null {
  const redisConfig: RedisConfig = {
    host: config?.host || process.env.REDIS_HOST || 'localhost',
    port: config?.port || parseInt(process.env.REDIS_PORT || '6379'),
    password: config?.password || process.env.REDIS_PASSWORD,
    db: config?.db || parseInt(process.env.REDIS_DB || '0'),
    retryStrategy: (times) => Math.min(times * 50, 2000),
    maxRetriesPerRequest: 3,
    ...config,
  };

  // If no Redis host configured, return null (use in-memory fallback)
  if (!redisConfig.host || redisConfig.host === 'localhost' && !process.env.REDIS_HOST) {
    return null;
  }

  try {
    const client = new Redis(redisConfig);

    client.on('error', (err) => {
      console.error('Redis error:', err);
    });

    client.on('connect', () => {
      console.log('Redis connected');
    });

    return client;
  } catch (error) {
    console.error('Failed to create Redis client:', error);
    return null;
  }
}

export const redisClient = createRedisClient();
