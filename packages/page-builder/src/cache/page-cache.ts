import Redis from 'ioredis'
import type { PageBuildResult } from '../types'

const CACHE_TTL = 3600 // 1 hour

let redis: Redis | null = null

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    })
    redis.on('error', (err) => {
      console.warn('[PageCache] Redis connection error:', err.message)
    })
  }
  return redis
}

export async function getCachedPage(sessionId: string): Promise<PageBuildResult | null> {
  try {
    const data = await getRedis().get(`funnel:page:${sessionId}`)
    if (!data) return null
    return JSON.parse(data) as PageBuildResult
  } catch {
    return null
  }
}

export async function setCachedPage(sessionId: string, result: PageBuildResult): Promise<void> {
  try {
    await getRedis().set(`funnel:page:${sessionId}`, JSON.stringify(result), 'EX', CACHE_TTL)
  } catch (err) {
    console.warn('[PageCache] Failed to cache page:', (err as Error).message)
  }
}
