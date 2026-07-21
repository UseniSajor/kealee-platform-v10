/**
 * Rate Limiting Middleware
 * Implements rate limiting for API requests
 */

import {FastifyRequest, FastifyReply} from 'fastify';
import {apiKeyService} from '../modules/api-keys/api-key.service';

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  max: number; // Max requests per window
  keyGenerator?: (request: FastifyRequest) => string;
  skip?: (request: FastifyRequest) => boolean;
}

export function rateLimit(options: RateLimitOptions) {
  const {windowMs, max, keyGenerator, skip} = options;

  return async (request: FastifyRequest, reply: FastifyReply) => {
    // Skip if configured
    if (skip && skip(request)) {
      return;
    }

    // Generate key (default: IP address or API key)
    const key = keyGenerator
      ? keyGenerator(request)
      : (request.headers['x-api-key'] as string) || request.ip;

    // Check rate limit
    if (request.headers['x-api-key']) {
      const apiKey = await apiKeyService.validateApiKey(
        request.headers['x-api-key'] as string
      );

      if (apiKey) {
        const rateLimit = await apiKeyService.checkRateLimit(apiKey.id);
        if (!rateLimit.allowed) {
          return reply.status(429).send({
            error: 'Rate limit exceeded',
            retryAfter: 60,
          });
        }

        // Add rate limit headers
        reply.header('X-RateLimit-Limit', apiKey.rateLimit.toString());
        reply.header('X-RateLimit-Remaining', rateLimit.remaining.toString());
        reply.header('X-RateLimit-Reset', new Date(Date.now() + 60000).toISOString());

        // Store API key in request for later use
        (request as any).apiKey = apiKey;
        return;
      }
    }

    // Default rate limiting (IP-based)
    // In production, use Redis or similar for distributed rate limiting
    const rateLimitKey = `rate_limit:${key}`;
    // Mock implementation - would use Redis in production
    const currentCount = 0; // Would get from Redis
    const ttl = Math.ceil(windowMs / 1000);

    if (currentCount >= max) {
      return reply.status(429).send({
        error: 'Rate limit exceeded',
        retryAfter: ttl,
      });
    }

    // Add rate limit headers
    reply.header('X-RateLimit-Limit', max.toString());
    reply.header('X-RateLimit-Remaining', (max - currentCount - 1).toString());
    reply.header('X-RateLimit-Reset', new Date(Date.now() + windowMs).toISOString());
  };
}
