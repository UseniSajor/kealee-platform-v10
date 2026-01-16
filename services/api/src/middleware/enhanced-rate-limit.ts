/**
 * Enhanced Rate Limiting Middleware
 * Supports both global and per-key rate limiting with Redis
 */

import {FastifyRequest, FastifyReply} from 'fastify';
import {apiKeyService} from '../modules/api-keys/api-key.service';
import Redis from 'ioredis';

interface RateLimitConfig {
  // Global rate limits
  globalWindowMs: number;
  globalMax: number;
  
  // Per-key rate limits (from API key config)
  useKeyRateLimit: boolean;
  
  // Redis configuration (optional, falls back to in-memory)
  redis?: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  limit: number;
}

// In-memory store for rate limiting (fallback if Redis not available)
const memoryStore = new Map<string, {count: number; resetTime: number}>();

export class EnhancedRateLimitService {
  private config: RateLimitConfig;
  private redisClient: Redis | null = null;

  constructor(config: RateLimitConfig) {
    this.config = config;
    this.initializeRedis();
  }

  private async initializeRedis() {
    // Try to connect to Redis if configured
    if (this.config.redis) {
      try {
        this.redisClient = new Redis({
          host: this.config.redis.host,
          port: this.config.redis.port,
          password: this.config.redis.password,
          db: this.config.redis.db || 0,
          retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
          maxRetriesPerRequest: 3,
        });

        this.redisClient.on('error', (err) => {
          console.warn('Redis connection error, falling back to in-memory:', err.message);
          this.redisClient = null;
        });

        this.redisClient.on('connect', () => {
          console.log('Redis connected for rate limiting');
        });

        // Test connection
        await this.redisClient.ping();
      } catch (error: any) {
        console.warn('Redis not available, using in-memory rate limiting:', error.message);
        this.redisClient = null;
      }
    }
  }

  /**
   * Get rate limit for a key
   */
  private async getRateLimit(key: string, windowMs: number, max: number): Promise<RateLimitResult> {
    if (this.redisClient) {
      return this.getRateLimitRedis(key, windowMs, max);
    }
    return this.getRateLimitMemory(key, windowMs, max);
  }

  private async getRateLimitRedis(key: string, windowMs: number, max: number): Promise<RateLimitResult> {
    try {
      const redisKey = `rate_limit:${key}`;
      const now = Date.now();
      const windowStart = now - (now % windowMs);
      const windowKey = `${redisKey}:${windowStart}`;

      // Get current count
      const count = await this.redisClient!.incr(windowKey);
      
      // Set expiration
      if (count === 1) {
        await this.redisClient!.pexpire(windowKey, windowMs);
      }

      const remaining = Math.max(0, max - count);
      const resetTime = new Date(windowStart + windowMs);

      return {
        allowed: count <= max,
        remaining,
        resetTime,
        limit: max,
      };
    } catch (error) {
      // Fall back to memory on Redis error
      console.warn('Redis error, falling back to memory:', error);
      return this.getRateLimitMemory(key, windowMs, max);
    }
  }

  private async getRateLimitMemory(key: string, windowMs: number, max: number): Promise<RateLimitResult> {
    const now = Date.now();
    const stored = memoryStore.get(key);

    if (!stored || stored.resetTime < now) {
      // New window
      memoryStore.set(key, {count: 1, resetTime: now + windowMs});
      return {
        allowed: true,
        remaining: max - 1,
        resetTime: new Date(now + windowMs),
        limit: max,
      };
    }

    // Existing window
    if (stored.count >= max) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(stored.resetTime),
        limit: max,
      };
    }

    stored.count++;
    return {
      allowed: true,
      remaining: max - stored.count,
      resetTime: new Date(stored.resetTime),
      limit: max,
    };
  }

  /**
   * Check rate limit for request
   */
  async checkRateLimit(request: FastifyRequest): Promise<RateLimitResult> {
    // Check API key rate limit first
    const apiKey = (request as any).apiKey;
    if (apiKey && this.config.useKeyRateLimit) {
      const keyLimit = await this.getRateLimit(
        `api_key:${apiKey.id}`,
        60000, // 1 minute
        apiKey.rateLimit
      );
      return keyLimit;
    }

    // Check global rate limit
    const ipAddress = request.ip || 'unknown';
    return await this.getRateLimit(
      `global:${ipAddress}`,
      this.config.globalWindowMs,
      this.config.globalMax
    );
  }

  /**
   * Cleanup (close Redis connection)
   */
  async close(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.quit();
    }
  }
}

// Default configuration from environment variables
const defaultRateLimitService = new EnhancedRateLimitService({
  globalWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute
  globalMax: parseInt(process.env.RATE_LIMIT_GLOBAL_MAX || '100'), // 100 requests per minute globally
  useKeyRateLimit: process.env.RATE_LIMIT_USE_KEY_LIMIT !== 'false',
  redis: process.env.REDIS_HOST
    ? {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
      }
    : undefined,
});

/**
 * Enhanced rate limiting middleware
 */
export function enhancedRateLimit(config?: Partial<RateLimitConfig>) {
  const service = config
    ? new EnhancedRateLimitService({...defaultRateLimitService['config'], ...config})
    : defaultRateLimitService;

  return async (request: FastifyRequest, reply: FastifyReply) => {
    const result = await service.checkRateLimit(request);

    // Set rate limit headers
    reply.header('X-RateLimit-Limit', result.limit.toString());
    reply.header('X-RateLimit-Remaining', result.remaining.toString());
    reply.header('X-RateLimit-Reset', result.resetTime.toISOString());

    if (!result.allowed) {
      return reply.status(429).send({
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((result.resetTime.getTime() - Date.now()) / 1000),
        limit: result.limit,
        remaining: result.remaining,
        resetTime: result.resetTime.toISOString(),
      });
    }
  };
}
