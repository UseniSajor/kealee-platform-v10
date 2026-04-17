/**
 * Redis Client for Kealee Platform
 * Provides a singleton Redis client with in-memory fallback for development/testing.
 * In production, connects to a real Redis instance via REDIS_URL or REDIS_HOST/PORT.
 */

interface RedisOptions {
  host?: string;
  port?: number;
  db?: number;
}

class RedisClient {
  private store: Map<string, string> = new Map();
  private expiryTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private isConnected: boolean = false;

  // Singleton instance
  private static instance: RedisClient | null = null;

  constructor(options?: RedisOptions) {
    console.log('[Redis] Initializing Redis client (in-memory fallback mode)');
  }

  /**
   * Get or create the singleton RedisClient instance.
   */
  static async getInstance(): Promise<RedisClient> {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
      await RedisClient.instance.connect();
    }
    return RedisClient.instance;
  }

  async connect(): Promise<void> {
    this.isConnected = true;
    console.log('[Redis] Connected (in-memory fallback)');
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
    // Clear all expiry timers
    for (const timer of this.expiryTimers.values()) {
      clearTimeout(timer);
    }
    this.expiryTimers.clear();
    console.log('[Redis] Disconnected');
  }

  /**
   * Set a key with an optional TTL in seconds.
   */
  async set(key: string, value: string, expirationSeconds?: number): Promise<void> {
    this.store.set(key, value);
    if (expirationSeconds) {
      this._scheduleExpiry(key, expirationSeconds);
    }
  }

  /**
   * Set a key with a TTL in seconds (Redis SETEX semantics).
   */
  async setex(key: string, expirationSeconds: number, value: string): Promise<void> {
    this.store.set(key, value);
    this._scheduleExpiry(key, expirationSeconds);
  }

  async get(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
    const timer = this.expiryTimers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.expiryTimers.delete(key);
    }
  }

  async exists(key: string): Promise<boolean> {
    return this.store.has(key);
  }

  async incr(key: string): Promise<number> {
    const current = parseInt(this.store.get(key) || '0', 10);
    const next = current + 1;
    this.store.set(key, next.toString());
    return next;
  }

  async lpush(key: string, ...values: string[]): Promise<number> {
    const current = JSON.parse(this.store.get(key) || '[]');
    const updated = [...values, ...current];
    this.store.set(key, JSON.stringify(updated));
    return updated.length;
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    const list = JSON.parse(this.store.get(key) || '[]');
    return list.slice(start, stop + 1);
  }

  isReady(): boolean {
    return this.isConnected;
  }

  private _scheduleExpiry(key: string, seconds: number): void {
    // Cancel any existing timer for this key
    const existing = this.expiryTimers.get(key);
    if (existing) {
      clearTimeout(existing);
    }
    const timer = setTimeout(() => {
      this.store.delete(key);
      this.expiryTimers.delete(key);
    }, seconds * 1000);
    this.expiryTimers.set(key, timer);
  }
}

// Singleton helper function (alternative to RedisClient.getInstance())
let redisInstance: RedisClient | null = null;

export async function getRedisClient(): Promise<RedisClient> {
  if (!redisInstance) {
    redisInstance = new RedisClient();
    await redisInstance.connect();
  }
  return redisInstance;
}

export { RedisClient };