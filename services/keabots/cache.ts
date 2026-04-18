/**
 * services/keabots/cache.ts
 * Simple in-memory cache for bot responses (Redis in production)
 */

interface CacheEntry {
  value: Record<string, unknown>;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export function cacheGet(key: string): Record<string, unknown> | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

export function cacheSet(key: string, value: Record<string, unknown>, ttlMs = DEFAULT_TTL_MS): void {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function cacheDelete(key: string): void {
  cache.delete(key);
}

export function cacheClear(): void {
  cache.clear();
}

export function cacheStats(): { size: number; keys: string[] } {
  // Prune expired first
  for (const [key, entry] of cache.entries()) {
    if (Date.now() > entry.expiresAt) cache.delete(key);
  }
  return { size: cache.size, keys: [...cache.keys()] };
}

export function buildCacheKey(botName: string, stage: string, projectId: string): string {
  return `bot:${botName}:${stage}:${projectId}`;
}
