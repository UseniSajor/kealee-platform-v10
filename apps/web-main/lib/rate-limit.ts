/**
 * Minimal in-process rate limiter.
 *
 * Scope note: state lives in the Node process, so on a multi-instance
 * deployment the effective limit is (limit x instances). That is deliberate —
 * these endpoints call external services (a federal geocoder, county GIS, the
 * email provider) and the goal is to stop trivial abuse without introducing
 * Redis into the request path. Move to a shared store if the limits ever need
 * to be exact.
 */

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()
let lastSweep = Date.now()

/** Drop expired buckets occasionally so the map cannot grow without bound. */
function sweep(now: number) {
  if (now - lastSweep < 60_000) return
  lastSweep = now
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now()
  sweep(now)

  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 }
  }

  bucket.count += 1
  const allowed = bucket.count <= limit
  return {
    allowed,
    remaining: Math.max(0, limit - bucket.count),
    retryAfterSeconds: allowed ? 0 : Math.ceil((bucket.resetAt - now) / 1000),
  }
}

/**
 * Best-effort client identity. Behind a proxy the first `x-forwarded-for` hop
 * is the client; falls back to a single shared bucket rather than to no limit
 * at all.
 */
export function clientKey(req: Request, prefix: string): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'
  return `${prefix}:${ip}`
}
