/**
 * Advanced Rate Limiting Middleware
 * Redis-backed rate limiting with multiple strategies
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { createClient, RedisClientType } from 'redis';

// Redis client
let redisClient: RedisClientType | null = null;

// Initialize Redis connection
export async function initializeRedis() {
  if (redisClient) return redisClient;

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  try {
    redisClient = createClient({ url: redisUrl });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis connected for rate limiting');
    });

    await redisClient.connect();

    return redisClient;
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    console.warn('⚠️  Rate limiting will use in-memory fallback');
    return null;
  }
}

// In-memory fallback when Redis is unavailable
const inMemoryStore = new Map<string, { count: number; resetAt: number }>();

// Rate limit configurations
export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum requests per window
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (request: FastifyRequest) => string;
  skip?: (request: FastifyRequest) => boolean;
}

// Predefined rate limit tiers
export const RATE_LIMITS = {
  // Public endpoints (unauthenticated)
  PUBLIC: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes
    message: 'Too many requests from this IP, please try again later',
  },

  // Authentication endpoints (login, register)
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per 15 minutes
    message: 'Too many authentication attempts, please try again later',
  },

  // Authenticated API endpoints
  AUTHENTICATED: {
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute
    message: 'Rate limit exceeded, please slow down',
  },

  // Financial transactions (extra strict)
  FINANCIAL: {
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 requests per minute
    message: 'Financial transaction rate limit exceeded',
  },

  // Admin operations
  ADMIN: {
    windowMs: 60 * 1000, // 1 minute
    max: 120, // 120 requests per minute (higher limit for admins)
    message: 'Admin rate limit exceeded',
  },

  // Webhook endpoints
  WEBHOOK: {
    windowMs: 60 * 1000, // 1 minute
    max: 300, // 300 requests per minute
    message: 'Webhook rate limit exceeded',
  },
};

/**
 * Default key generator (IP-based)
 */
function defaultKeyGenerator(request: FastifyRequest): string {
  const ip = request.ip || request.headers['x-forwarded-for'] || request.headers['x-real-ip'] || 'unknown';
  return `ratelimit:${ip}`;
}

/**
 * User-based key generator (for authenticated requests)
 */
export function userKeyGenerator(request: FastifyRequest): string {
  const user = (request as any).user;
  if (user) {
    return `ratelimit:user:${user.id}`;
  }
  return defaultKeyGenerator(request);
}

/**
 * Endpoint-specific key generator
 */
export function endpointKeyGenerator(endpoint: string) {
  return (request: FastifyRequest): string => {
    const user = (request as any).user;
    const identifier = user ? `user:${user.id}` : `ip:${request.ip}`;
    return `ratelimit:${endpoint}:${identifier}`;
  };
}

/**
 * Check rate limit using Redis
 */
async function checkRateLimitRedis(key: string, config: RateLimitConfig): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: number;
}> {
  if (!redisClient || !redisClient.isOpen) {
    return checkRateLimitMemory(key, config);
  }

  const now = Date.now();
  const windowStart = now - config.windowMs;

  try {
    // Use Redis sorted set for sliding window
    const multi = redisClient.multi();

    // Remove old entries
    multi.zRemRangeByScore(key, 0, windowStart);

    // Add current request
    multi.zAdd(key, { score: now, value: `${now}` });

    // Count requests in window
    multi.zCard(key);

    // Set expiry
    multi.expire(key, Math.ceil(config.windowMs / 1000));

    const results = await multi.exec();
    const count = results[2] as number;

    const allowed = count <= config.max;
    const remaining = Math.max(0, config.max - count);
    const resetAt = now + config.windowMs;

    return { allowed, remaining, resetAt };
  } catch (error) {
    console.error('Redis rate limit error:', error);
    return checkRateLimitMemory(key, config);
  }
}

/**
 * Check rate limit using in-memory store (fallback)
 */
function checkRateLimitMemory(key: string, config: RateLimitConfig): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  const now = Date.now();
  const record = inMemoryStore.get(key);

  if (!record || record.resetAt < now) {
    // Create new window
    inMemoryStore.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });

    return {
      allowed: true,
      remaining: config.max - 1,
      resetAt: now + config.windowMs,
    };
  }

  // Increment count
  record.count++;

  const allowed = record.count <= config.max;
  const remaining = Math.max(0, config.max - record.count);

  return {
    allowed,
    remaining,
    resetAt: record.resetAt,
  };
}

/**
 * Rate limit middleware factory
 */
export function rateLimitMiddleware(config: RateLimitConfig) {
  const keyGenerator = config.keyGenerator || defaultKeyGenerator;

  return async (request: FastifyRequest, reply: FastifyReply) => {
    // Check if request should skip rate limiting
    if (config.skip && config.skip(request)) {
      return;
    }

    const key = keyGenerator(request);
    const result = await checkRateLimitRedis(key, config);

    // Set rate limit headers
    reply.header('X-RateLimit-Limit', config.max);
    reply.header('X-RateLimit-Remaining', result.remaining);
    reply.header('X-RateLimit-Reset', new Date(result.resetAt).toISOString());

    if (!result.allowed) {
      request.log.warn(`Rate limit exceeded for key: ${key}`);

      return reply.status(429).send({
        error: 'Too Many Requests',
        message: config.message || 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
      });
    }
  };
}

/**
 * Predefined rate limit middlewares
 */
export const publicRateLimit = rateLimitMiddleware(RATE_LIMITS.PUBLIC);

export const authRateLimit = rateLimitMiddleware({
  ...RATE_LIMITS.AUTH,
  keyGenerator: (request) => {
    const email = (request.body as any)?.email || 'unknown';
    return `ratelimit:auth:${email}`;
  },
});

export const authenticatedRateLimit = rateLimitMiddleware({
  ...RATE_LIMITS.AUTHENTICATED,
  keyGenerator: userKeyGenerator,
});

export const financialRateLimit = rateLimitMiddleware({
  ...RATE_LIMITS.FINANCIAL,
  keyGenerator: userKeyGenerator,
});

export const adminRateLimit = rateLimitMiddleware({
  ...RATE_LIMITS.ADMIN,
  keyGenerator: userKeyGenerator,
});

export const webhookRateLimit = rateLimitMiddleware({
  ...RATE_LIMITS.WEBHOOK,
  keyGenerator: (request) => {
    // Use webhook signature as key for webhooks
    const signature = request.headers['stripe-signature'] || request.ip;
    return `ratelimit:webhook:${signature}`;
  },
});

/**
 * Clean up expired entries (run periodically)
 */
export async function cleanupRateLimitCache() {
  const now = Date.now();

  // Clean in-memory store
  for (const [key, record] of inMemoryStore.entries()) {
    if (record.resetAt < now) {
      inMemoryStore.delete(key);
    }
  }

  // Redis auto-expires keys, so no cleanup needed
}

/**
 * Graceful shutdown
 */
export async function closeRedis() {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    console.log('Redis connection closed');
  }
}

// Initialize Redis on module load
initializeRedis().catch(console.error);

// Clean up every 5 minutes
setInterval(cleanupRateLimitCache, 5 * 60 * 1000);

