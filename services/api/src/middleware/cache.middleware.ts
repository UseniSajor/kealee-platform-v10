/**
 * API Response Cache Middleware
 *
 * Redis-based response caching for read-heavy endpoints.
 * Falls back to in-memory LRU cache when Redis is unavailable.
 *
 * Cache TTLs:
 *   - Dashboard data: 30s (real-time enough, prevents hammering)
 *   - Project details: 60s (invalidated on update events)
 *   - Assembly library: 1 hour (rarely changes)
 *   - Analytics/benchmarks: 5 min (pre-calculated)
 *   - User profile: 5 min
 *
 * Usage:
 *   fastify.get('/dashboard', {
 *     preHandler: [authenticateUser],
 *     onSend: [cacheResponse(30, dashboardCacheKey)],
 *     handler: ...
 *   })
 *
 *   // Or as preHandler to short-circuit:
 *   fastify.get('/assemblies', {
 *     preHandler: [cacheMiddleware({ ttl: 3600, key: req => `assemblies:${req.query.page}` })],
 *     handler: ...
 *   })
 */

import { FastifyRequest, FastifyReply, FastifyInstance, HookHandlerDoneFunction } from 'fastify';

// Import the existing redis client
let redis: any = null;
try {
  const { redisClient } = require('../config/redis.config');
  redis = redisClient;
} catch { /* Redis not available */ }

// In-memory LRU fallback
const memoryCache = new Map<string, { data: string; expiresAt: number }>();
const MAX_MEMORY_CACHE_SIZE = 500;

// ── Cache TTL Presets ──
export const CACHE_TTL = {
  DASHBOARD: 30,
  PROJECT_DETAIL: 60,
  ASSEMBLY_LIBRARY: 3600,
  ANALYTICS: 300,
  USER_PROFILE: 300,
  PROJECT_TYPES: 3600,
  ESTIMATE_RESULT: 120,
} as const;

// ── Core get/set helpers ──
async function cacheGet(key: string): Promise<string | null> {
  if (redis) {
    try { return await redis.get(key); } catch { /* fallback */ }
  }
  const entry = memoryCache.get(key);
  if (entry && entry.expiresAt > Date.now()) return entry.data;
  if (entry) memoryCache.delete(key);
  return null;
}

async function cacheSet(key: string, value: string, ttl: number): Promise<void> {
  if (redis) {
    try { await redis.setex(key, ttl, value); return; } catch { /* fallback */ }
  }
  // Memory fallback with LRU eviction
  if (memoryCache.size >= MAX_MEMORY_CACHE_SIZE) {
    const oldest = memoryCache.keys().next().value;
    if (oldest) memoryCache.delete(oldest);
  }
  memoryCache.set(key, { data: value, expiresAt: Date.now() + ttl * 1000 });
}

// ── Cache invalidation ──
export async function invalidateCache(pattern: string): Promise<void> {
  if (redis) {
    try {
      const keys = await redis.keys(`cache:${pattern}*`);
      if (keys.length > 0) await redis.del(...keys);
    } catch { /* ignore */ }
  }
  // Memory fallback
  for (const key of memoryCache.keys()) {
    if (key.startsWith(`cache:${pattern}`)) memoryCache.delete(key);
  }
}

export async function invalidateCacheKeys(...keys: string[]): Promise<void> {
  for (const key of keys) {
    if (redis) {
      try { await redis.del(`cache:${key}`); } catch { /* ignore */ }
    }
    memoryCache.delete(`cache:${key}`);
  }
}

// ── Pre-handler middleware (short-circuits if cached) ──
export function cacheMiddleware(options: {
  ttl: number;
  key: (req: FastifyRequest) => string;
  condition?: (req: FastifyRequest) => boolean;
}) {
  return async function cachePreHandler(request: FastifyRequest, reply: FastifyReply) {
    // Skip cache for non-GET or if condition fails
    if (request.method !== 'GET') return;
    if (options.condition && !options.condition(request)) return;

    const cacheKey = `cache:${options.key(request)}`;
    const cached = await cacheGet(cacheKey);

    if (cached) {
      reply.header('X-Cache', 'HIT');
      reply.header('X-Cache-TTL', String(options.ttl));
      reply.header('Content-Type', 'application/json');
      reply.send(JSON.parse(cached));
      return reply; // Short-circuit
    }

    // Store key and TTL on request for onSend hook
    (request as any)._cacheKey = cacheKey;
    (request as any)._cacheTTL = options.ttl;
  };
}

// ── Fastify plugin to cache successful GET responses ──
export async function registerCachePlugin(fastify: FastifyInstance) {
  fastify.addHook('onSend', async (request, reply, payload) => {
    const cacheKey = (request as any)._cacheKey;
    const cacheTTL = (request as any)._cacheTTL;

    if (!cacheKey || !cacheTTL) return payload;
    if (reply.statusCode !== 200) return payload;
    if (typeof payload !== 'string') return payload;

    // Cache the response
    reply.header('X-Cache', 'MISS');
    await cacheSet(cacheKey, payload, cacheTTL);
    return payload;
  });
}

// ── Event-driven invalidation helper ──
// Call from event handlers to invalidate caches when data changes
export const CACHE_INVALIDATION_MAP: Record<string, string[]> = {
  'task.completed': ['dashboard:', 'project-detail:'],
  'task.created': ['dashboard:', 'project-detail:'],
  'task.updated': ['dashboard:', 'project-detail:'],
  'payment.released': ['dashboard:', 'financial:', 'project-detail:'],
  'payment.received': ['dashboard:', 'financial:'],
  'photo.uploaded': ['photos:', 'project-detail:'],
  'milestone.completed': ['dashboard:', 'project-detail:', 'milestones:'],
  'project.updated': ['dashboard:', 'project-detail:', 'projects:'],
  'lead.created': ['leads:', 'marketplace:'],
  'lead.updated': ['leads:', 'marketplace:'],
  'bid.submitted': ['leads:', 'bids:'],
  'estimate.created': ['estimates:'],
};

export async function handleCacheInvalidation(eventType: string): Promise<void> {
  const patterns = CACHE_INVALIDATION_MAP[eventType];
  if (!patterns) return;
  await Promise.all(patterns.map(invalidateCache));
}

// Periodic memory cache cleanup (every 60 seconds)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of memoryCache.entries()) {
      if (entry.expiresAt <= now) memoryCache.delete(key);
    }
  }, 60_000);
}
