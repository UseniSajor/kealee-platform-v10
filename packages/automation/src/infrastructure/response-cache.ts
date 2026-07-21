/**
 * Response Cache Service
 * Caches bot outputs in Redis to eliminate duplicate LLM calls for identical inputs
 * - Design outputs: 24h TTL
 * - Estimate outputs: 7d TTL
 * - Permit outputs: 7d TTL
 * - Contractor outputs: 24h TTL
 */

import crypto from 'crypto'
import { getQueueConnection } from './redis.js'
import type { Redis } from 'ioredis'

export type BotType = 'design' | 'estimate' | 'permit' | 'contractor'

const CACHE_TTL_SECONDS = {
  design: 24 * 60 * 60, // 24 hours
  estimate: 7 * 24 * 60 * 60, // 7 days
  permit: 7 * 24 * 60 * 60, // 7 days
  contractor: 24 * 60 * 60, // 24 hours
} as const

/**
 * Generate cache key from input data + bot type + project context
 * Hashes the JSON input to create deterministic key
 */
function generateCacheKey(botType: BotType, projectId: string, inputData: Record<string, any>): string {
  // Hash the input data to create a consistent key
  const inputHash = crypto
    .createHash('sha256')
    .update(JSON.stringify(inputData))
    .digest('hex')
    .slice(0, 12)

  return `bot-cache:${botType}:${projectId}:${inputHash}`
}

/**
 * Response cache metadata for tracking cache hits/misses
 */
export interface CacheMetrics {
  cacheHit: boolean
  cacheCreationTokens: number
  cacheReadTokens: number
  savedTokens: number
  cachedAtSeconds?: number
}

/**
 * Cached response envelope
 */
interface CachedResponse<T> {
  data: T
  createdAt: number
  ttl: number
  inputHash: string
}

class ResponseCache {
  private redis: Redis

  constructor() {
    this.redis = getQueueConnection()
  }

  /**
   * Attempt to get cached response for bot execution
   * Returns null if not found or expired
   */
  async get<T>(botType: BotType, projectId: string, inputData: Record<string, any>): Promise<{ data: T; metrics: CacheMetrics } | null> {
    const key = generateCacheKey(botType, projectId, inputData)

    try {
      const cached = await this.redis.get(key)
      if (!cached) {
        return null
      }

      const envelope: CachedResponse<T> = JSON.parse(cached)
      const ageSeconds = Math.floor(Date.now() / 1000) - envelope.createdAt

      return {
        data: envelope.data,
        metrics: {
          cacheHit: true,
          cacheReadTokens: 0, // Returned from cache, not charged
          cacheCreationTokens: 0,
          savedTokens: 2000, // Approximate tokens saved per cache hit
          cachedAtSeconds: ageSeconds,
        },
      }
    } catch (err) {
      console.warn(`[ResponseCache] Failed to retrieve cached response for ${botType}:`, err)
      return null
    }
  }

  /**
   * Store response in cache with appropriate TTL
   * Called after successful bot execution
   */
  async set<T>(botType: BotType, projectId: string, inputData: Record<string, any>, response: T): Promise<void> {
    const key = generateCacheKey(botType, projectId, inputData)
    const ttl = CACHE_TTL_SECONDS[botType]

    const envelope: CachedResponse<T> = {
      data: response,
      createdAt: Math.floor(Date.now() / 1000),
      ttl,
      inputHash: generateCacheKey(botType, projectId, inputData).split(':').pop() || '',
    }

    try {
      await this.redis.setex(key, ttl, JSON.stringify(envelope))
    } catch (err) {
      console.warn(`[ResponseCache] Failed to cache response for ${botType}:`, err)
      // Non-fatal: continue execution even if cache write fails
    }
  }

  /**
   * Invalidate cache for a specific bot/project combination
   * Used when project details change and cached results are stale
   */
  async invalidate(botType: BotType | 'all', projectId: string): Promise<number> {
    try {
      if (botType === 'all') {
        const pattern = `bot-cache:*:${projectId}:*`
        const keys = await this.redis.keys(pattern)
        if (keys.length === 0) return 0
        return await this.redis.del(...keys)
      }

      const pattern = `bot-cache:${botType}:${projectId}:*`
      const keys = await this.redis.keys(pattern)
      if (keys.length === 0) return 0
      return await this.redis.del(...keys)
    } catch (err) {
      console.warn(`[ResponseCache] Failed to invalidate cache for ${botType}:${projectId}:`, err)
      return 0
    }
  }

  /**
   * Check Redis connection
   */
  async isHealthy(): Promise<boolean> {
    try {
      const pong = await this.redis.ping()
      return pong === 'PONG'
    } catch {
      return false
    }
  }
}

// Singleton instance
let cacheInstance: ResponseCache | null = null

export function getResponseCache(): ResponseCache {
  if (!cacheInstance) {
    cacheInstance = new ResponseCache()
  }
  return cacheInstance
}

/**
 * Middleware decorator for caching bot responses
 * Usage:
 *   const result = await withCache('design', projectId, inputData, () => runDesignBot(input))
 */
export async function withCache<T>(
  botType: BotType,
  projectId: string,
  inputData: Record<string, any>,
  executeBot: () => Promise<T>,
): Promise<{ result: T; metrics: CacheMetrics }> {
  const cache = getResponseCache()

  // Check cache first
  const cached = await cache.get<T>(botType, projectId, inputData)
  if (cached) {
    return {
      result: cached.data,
      metrics: cached.metrics,
    }
  }

  // Cache miss — execute bot
  const result = await executeBot()

  // Store in cache
  await cache.set(botType, projectId, inputData, result)

  return {
    result,
    metrics: {
      cacheHit: false,
      cacheCreationTokens: 0,
      cacheReadTokens: 0,
      savedTokens: 0,
    },
  }
}
