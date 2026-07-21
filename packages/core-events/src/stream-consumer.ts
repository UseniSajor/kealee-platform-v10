/**
 * Stream Consumer — reads events from Redis Streams with consumer groups
 * Provides at-least-once delivery with manual acknowledgment
 */

import Redis from 'ioredis';
import type { EventEnvelope, EventHandler, StreamConsumerConfig } from './types';

export class StreamConsumer {
  private redis: Redis;
  private running = false;
  private handlers = new Map<string, EventHandler[]>();
  private config: Required<StreamConsumerConfig>;

  constructor(
    config: StreamConsumerConfig,
    redisUrl?: string,
  ) {
    const url = redisUrl ?? process.env.REDIS_URL ?? 'redis://localhost:6379';
    this.redis = new Redis(url, { maxRetriesPerRequest: 3, lazyConnect: true });
    this.config = {
      groupName: config.groupName,
      consumerName: config.consumerName,
      streams: config.streams,
      batchSize: config.batchSize ?? 10,
      blockMs: config.blockMs ?? 5000,
      autoAck: config.autoAck ?? true,
    };
  }

  /**
   * Register a handler for events matching a pattern
   */
  on(eventTypePattern: string, handler: EventHandler): void {
    const existing = this.handlers.get(eventTypePattern) ?? [];
    existing.push(handler);
    this.handlers.set(eventTypePattern, existing);
  }

  /**
   * Start consuming events
   */
  async start(): Promise<void> {
    await this.redis.connect();

    // Create consumer groups (ignore if already exists)
    for (const stream of this.config.streams) {
      try {
        await this.redis.xgroup('CREATE', stream, this.config.groupName, '0', 'MKSTREAM');
      } catch (err: any) {
        if (!err.message?.includes('BUSYGROUP')) throw err;
      }
    }

    this.running = true;
    this.consumeLoop();
  }

  /**
   * Main consume loop
   */
  private async consumeLoop(): Promise<void> {
    while (this.running) {
      try {
        // Build XREADGROUP args
        const args: (string | number)[] = [
          'GROUP', this.config.groupName, this.config.consumerName,
          'COUNT', this.config.batchSize,
          'BLOCK', this.config.blockMs,
          'STREAMS', ...this.config.streams,
          ...this.config.streams.map(() => '>'),
        ];

        const results = await (this.redis as any).xreadgroup(...args);
        if (!results) continue;

        for (const [stream, messages] of results) {
          for (const [messageId, fields] of messages) {
            await this.processMessage(stream, messageId, fields);
          }
        }
      } catch (err) {
        if (this.running) {
          console.error('[StreamConsumer] Error in consume loop:', err);
          await new Promise(r => setTimeout(r, 1000)); // Backoff
        }
      }
    }
  }

  /**
   * Process a single message
   */
  private async processMessage(
    stream: string,
    messageId: string,
    fields: string[],
  ): Promise<void> {
    // Parse fields array into key-value pairs
    const fieldMap: Record<string, string> = {};
    for (let i = 0; i < fields.length; i += 2) {
      fieldMap[fields[i]] = fields[i + 1];
    }

    const eventStr = fieldMap['event'];
    if (!eventStr) return;

    let event: EventEnvelope;
    try {
      event = JSON.parse(eventStr);
    } catch {
      console.error(`[StreamConsumer] Failed to parse event from ${stream}:${messageId}`);
      if (this.config.autoAck) {
        await this.redis.xack(stream, this.config.groupName, messageId);
      }
      return;
    }

    // Dispatch to matching handlers
    let handled = false;
    for (const [pattern, handlers] of this.handlers.entries()) {
      if (this.matchPattern(pattern, event.type)) {
        for (const handler of handlers) {
          try {
            await handler(event);
            handled = true;
          } catch (err) {
            console.error(
              `[StreamConsumer] Handler error for ${event.type} (pattern: ${pattern}):`,
              err
            );
            // Move to dead letter on handler failure
            await this.moveToDeadLetter(stream, messageId, event, err);
          }
        }
      }
    }

    // Acknowledge the message
    if (this.config.autoAck && handled) {
      await this.redis.xack(stream, this.config.groupName, messageId);
    }
  }

  /**
   * Move failed message to dead letter stream
   */
  private async moveToDeadLetter(
    stream: string,
    messageId: string,
    event: EventEnvelope,
    error: unknown,
  ): Promise<void> {
    try {
      await this.redis.xadd(
        'events:dead-letter',
        '*',
        'originalStream', stream,
        'messageId', messageId,
        'event', JSON.stringify(event),
        'error', String(error),
        'failedAt', new Date().toISOString(),
      );
    } catch (dlErr) {
      console.error('[StreamConsumer] Failed to write to dead letter queue:', dlErr);
    }
  }

  /**
   * Pattern matching: "twin.*" matches "twin.phase.changed"
   */
  private matchPattern(pattern: string, eventType: string): boolean {
    if (pattern === '*') return true;
    const prefix = pattern.replace(/\.\*$/, '').replace(/\*$/, '');
    return eventType.startsWith(prefix);
  }

  /**
   * Stop consuming
   */
  async stop(): Promise<void> {
    this.running = false;
    this.redis.disconnect();
  }
}
