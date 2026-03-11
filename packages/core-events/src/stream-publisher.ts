/**
 * Stream Publisher — publishes events to Redis Streams
 * Replaces the basic Redis Pub/Sub with Redis Streams for durability
 */

import Redis from 'ioredis';
import type { EventEnvelope } from './types';

export class StreamPublisher {
  private redis: Redis;
  private connected = false;

  constructor(redisUrl?: string) {
    const url = redisUrl ?? process.env.REDIS_URL ?? 'redis://localhost:6379';
    this.redis = new Redis(url, { maxRetriesPerRequest: 3, lazyConnect: true });
  }

  async connect(): Promise<void> {
    if (this.connected) return;
    await this.redis.connect();
    this.connected = true;
  }

  /**
   * Publish an event to a Redis Stream
   * Stream name derived from event type: "twin.phase.changed" → stream "events:twin"
   */
  async publish(event: EventEnvelope): Promise<string> {
    const streamName = this.getStreamName(event.type);
    const serialized = JSON.stringify(event);

    // XADD to the domain stream
    const messageId = await this.redis.xadd(
      streamName,
      '*', // Auto-generate ID
      'event', serialized,
      'type', event.type,
      'source', event.source,
      'severity', event.severity,
    );

    // Also publish to the global stream for cross-cutting concerns
    await this.redis.xadd(
      'events:global',
      '*',
      'event', serialized,
      'type', event.type,
      'source', event.source,
    );

    return messageId!;
  }

  /**
   * Publish multiple events atomically using pipeline
   */
  async publishBatch(events: EventEnvelope[]): Promise<string[]> {
    const pipeline = this.redis.pipeline();
    const results: string[] = [];

    for (const event of events) {
      const streamName = this.getStreamName(event.type);
      const serialized = JSON.stringify(event);

      pipeline.xadd(
        streamName,
        '*',
        'event', serialized,
        'type', event.type,
        'source', event.source,
        'severity', event.severity,
      );
      pipeline.xadd(
        'events:global',
        '*',
        'event', serialized,
        'type', event.type,
        'source', event.source,
      );
    }

    const pipelineResults = await pipeline.exec();
    if (pipelineResults) {
      // Every other result is domain stream, global stream alternating
      for (let i = 0; i < pipelineResults.length; i += 2) {
        const [err, id] = pipelineResults[i];
        if (!err && id) results.push(id as string);
      }
    }

    return results;
  }

  /**
   * Derive stream name from event type
   * "twin.phase.changed" → "events:twin"
   * "os-land.parcel.created" → "events:os-land"
   */
  private getStreamName(eventType: string): string {
    const domain = eventType.split('.')[0];
    return `events:${domain}`;
  }

  async disconnect(): Promise<void> {
    this.redis.disconnect();
    this.connected = false;
  }
}
