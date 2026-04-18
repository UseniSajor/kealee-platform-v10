/**
 * Mock Redis Client for Development/Testing
 * In production, replace with real Redis client
 */

interface RedisOptions {
  host?: string;
  port?: number;
  db?: number;
}

class RedisClient {
  private store: Map<string, string> = new Map();
  private isConnected: boolean = false;

  constructor(options?: RedisOptions) {
    console.log('[Redis] Initializing Redis client (mock mode)');
  }

  async connect(): Promise<void> {
    this.isConnected = true;
    console.log('[Redis] Connected to Redis (mock)');
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
    console.log('[Redis] Disconnected from Redis (mock)');
  }

  async set(key: string, value: string, expirationSeconds?: number): Promise<void> {
    this.store.set(key, value);
    if (expirationSeconds) {
      setTimeout(() => this.store.delete(key), expirationSeconds * 1000);
    }
  }

  async get(key: string): Promise<string | null> {
    return this.store.get(key) || null;
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
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

  static getInstance(): RedisClient {
    if (!redisInstance) {
      redisInstance = new RedisClient();
      // Don't await here - static methods can't be async
      // getInstance returns the instance synchronously
      redisInstance.connect().catch(err => console.error('[Redis] Connection error:', err));
    }
    return redisInstance;
  }
}

// Singleton instance
let redisInstance: RedisClient | null = null;

export async function getRedisClient(): Promise<RedisClient> {
  if (!redisInstance) {
    redisInstance = new RedisClient();
    await redisInstance.connect();
  }
  return redisInstance;
}

export { RedisClient };