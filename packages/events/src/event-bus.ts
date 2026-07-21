import Redis from 'ioredis';
import type { KealeeEventEnvelope, EventHandler } from './envelope';

/**
 * EventBus — Redis Pub/Sub for inter-claw communication.
 * See: _docs/kealee-architecture.md §5.1
 *
 * - publish(): sends to domain channel AND kealee.* wildcard (for Claw H)
 * - subscribe(): pattern matching with handler registry
 */
export class EventBus {
  private pub: Redis;
  private sub: Redis;
  private handlers = new Map<string, EventHandler[]>();
  private connected = false;

  constructor(redisUrl?: string) {
    const url = redisUrl ?? process.env.REDIS_URL ?? 'redis://localhost:6379';
    this.pub = new Redis(url, { maxRetriesPerRequest: 3, lazyConnect: true });
    this.sub = new Redis(url, { maxRetriesPerRequest: 3, lazyConnect: true });
  }

  async connect(): Promise<void> {
    if (this.connected) return;
    await Promise.all([this.pub.connect(), this.sub.connect()]);
    this.connected = true;

    // Listen for pattern-matched messages
    this.sub.on('pmessage', (_pattern: string, _channel: string, message: string) => {
      try {
        const event: KealeeEventEnvelope = JSON.parse(message);
        this.dispatch(event);
      } catch (err) {
        console.error('[EventBus] Failed to parse message:', err);
      }
    });
  }

  /**
   * Publish an event to its domain channel AND the kealee.* wildcard channel.
   */
  async publish(event: KealeeEventEnvelope): Promise<void> {
    const serialized = JSON.stringify(event);

    // Domain channel: e.g. "estimate.created" → channel "estimate"
    const domainChannel = event.type.split('.').slice(0, 2).join('.');
    await this.pub.publish(domainChannel, serialized);

    // Wildcard channel for Claw H (command-automation)
    await this.pub.publish('kealee.*', serialized);
  }

  /**
   * Subscribe to a pattern. Patterns can be:
   * - 'budget.*' → all budget events
   * - 'schedule.*' → all schedule events
   * - 'kealee.*' → ALL events (Claw H only)
   */
  subscribe(pattern: string, handler: EventHandler): void {
    const existing = this.handlers.get(pattern) ?? [];
    existing.push(handler);
    this.handlers.set(pattern, existing);

    // Subscribe to Redis pattern
    this.sub.psubscribe(pattern).catch((err) => {
      console.error(`[EventBus] Failed to psubscribe to ${pattern}:`, err);
    });
  }

  /**
   * Dispatch an event to all matching handlers.
   */
  private dispatch(event: KealeeEventEnvelope): void {
    for (const [pattern, handlers] of this.handlers.entries()) {
      if (this.matchPattern(pattern, event.type)) {
        for (const handler of handlers) {
          handler(event).catch((err) => {
            console.error(
              `[EventBus] Handler error for ${event.type} (pattern: ${pattern}):`,
              err
            );
          });
        }
      }
    }
  }

  /**
   * Simple pattern matching: 'budget.*' matches 'budget.updated', 'budget.alert.variance.high'
   */
  private matchPattern(pattern: string, eventType: string): boolean {
    if (pattern === 'kealee.*') return true;
    const prefix = pattern.replace('.*', '').replace('*', '');
    return eventType.startsWith(prefix);
  }

  async disconnect(): Promise<void> {
    this.pub.disconnect();
    this.sub.disconnect();
    this.connected = false;
  }
}
