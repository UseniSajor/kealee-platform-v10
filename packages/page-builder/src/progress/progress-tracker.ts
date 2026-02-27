import Redis from 'ioredis'

let redis: Redis | null = null

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    })
    redis.on('error', (err) => {
      console.warn('[ProgressTracker] Redis error:', err.message)
    })
  }
  return redis
}

export async function setProgress(sessionId: string, percent: number): Promise<void> {
  try {
    await getRedis().set(`funnel:progress:${sessionId}`, String(Math.round(percent)), 'EX', 600)
  } catch {}
}

export async function getProgress(sessionId: string): Promise<number> {
  try {
    const val = await getRedis().get(`funnel:progress:${sessionId}`)
    return val ? parseInt(val, 10) : 0
  } catch {
    return 0
  }
}
