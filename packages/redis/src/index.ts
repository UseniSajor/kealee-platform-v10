/**
 * Redis Client for Kealee Platform
 *
 * Uses REDIS_URL when set (Railway, Upstash, Heroku, etc.).
 * Falls back to an in-memory Map when Redis is not configured,
 * so the app works in local dev without a Redis instance.
 */

import { createClient, RedisClientType } from 'redis';

// ── Internal in-memory fallback ──────────────────────────────────────────────

class MockStore {
  private store = new Map<string, string>();

  get(key: string): string | null { return this.store.get(key) ?? null; }
  set(key: string, value: string, ttlSeconds?: number): void {
    this.store.set(key, value);
    if (ttlSeconds) setTimeout(() => this.store.delete(key), ttlSeconds * 1000);
  }
  del(key: string): void { this.store.delete(key); }
  exists(key: string): boolean { return this.store.has(key); }
  incr(key: string): number {
    const n = parseInt(this.store.get(key) ?? '0', 10) + 1;
    this.store.set(key, String(n));
    return n;
  }
  lpush(key: string, ...values: string[]): number {
    const list: string[] = JSON.parse(this.store.get(key) ?? '[]');
    list.unshift(...values);
    this.store.set(key, JSON.stringify(list));
    return list.length;
  }
  lrange(key: string, start: number, stop: number): string[] {
    const list: string[] = JSON.parse(this.store.get(key) ?? '[]');
    return list.slice(start, stop === -1 ? undefined : stop + 1);
  }
}

// ── RedisClient ──────────────────────────────────────────────────────────────

class RedisClient {
  private static _instance: RedisClient | null = null;

  /** Real redis v4 client; null when using the in-memory fallback */
  private realClient: RedisClientType | null = null;
  private mock = new MockStore();
  private _useMock = true;
  /** Resolves once connection attempt completes (success or fallback) */
  private _ready: Promise<void>;

  private constructor() {
    const url = process.env.REDIS_URL;
    if (!url) {
      console.log('[Redis] No REDIS_URL set — using in-memory mock');
      this._ready = Promise.resolve();
      return;
    }

    const client = createClient({
      url,
      socket: {
        connectTimeout: 3000,
        reconnectStrategy: false,
      },
    }) as RedisClientType;
    client.on('error', (err: Error) => console.error('[Redis] Error:', err.message));

    this._ready = client
      .connect()
      .then(() => {
        this.realClient = client;
        this._useMock = false;
        console.log('[Redis] Connected');
      })
      .catch((err: Error) => {
        console.warn('[Redis] Connection failed, falling back to in-memory mock:', err.message);
      });
  }

  /** Wait for the connection attempt to settle before issuing commands */
  private async ready(): Promise<void> {
    return this._ready;
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  async get(key: string): Promise<string | null> {
    await this.ready();
    if (this._useMock) return this.mock.get(key);
    return this.realClient!.get(key);
  }

  async set(key: string, value: string, expirationSeconds?: number): Promise<void> {
    await this.ready();
    if (this._useMock) { this.mock.set(key, value, expirationSeconds); return; }
    if (expirationSeconds) {
      await this.realClient!.setEx(key, expirationSeconds, value);
    } else {
      await this.realClient!.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.ready();
    if (this._useMock) { this.mock.del(key); return; }
    await this.realClient!.del(key);
  }

  async exists(key: string): Promise<boolean> {
    await this.ready();
    if (this._useMock) return this.mock.exists(key);
    return (await this.realClient!.exists(key)) > 0;
  }

  async incr(key: string): Promise<number> {
    await this.ready();
    if (this._useMock) return this.mock.incr(key);
    return this.realClient!.incr(key);
  }

  async lpush(key: string, ...values: string[]): Promise<number> {
    await this.ready();
    if (this._useMock) return this.mock.lpush(key, ...values);
    return this.realClient!.lPush(key, values);
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    await this.ready();
    if (this._useMock) return this.mock.lrange(key, start, stop);
    return this.realClient!.lRange(key, start, stop);
  }

  /** Returns true only when the configured Redis server answers PING. */
  async ping(): Promise<boolean> {
    await this.ready();
    if (this._useMock || !this.realClient?.isReady) return false;

    try {
      return (await this.realClient.ping()) === 'PONG';
    } catch {
      return false;
    }
  }

  /** @deprecated — kept for legacy callers; all operations auto-connect now */
  async connect(): Promise<void> { return this._ready; }

  /** @deprecated — kept for legacy callers */
  async disconnect(): Promise<void> {
    if (this.realClient) await this.realClient.disconnect();
  }

  isReady(): boolean {
    return !this._useMock && this.realClient?.isReady === true;
  }

  // ── Singleton ──────────────────────────────────────────────────────────────

  static getInstance(): RedisClient {
    if (!RedisClient._instance) {
      RedisClient._instance = new RedisClient();
    }
    return RedisClient._instance;
  }
}

// ── Module exports ───────────────────────────────────────────────────────────

let redisInstance: RedisClient | null = null;

export async function getRedisClient(): Promise<RedisClient> {
  if (!redisInstance) {
    redisInstance = RedisClient.getInstance();
    await redisInstance.connect(); // no-op if already connected
  }
  return redisInstance;
}

export { RedisClient };
