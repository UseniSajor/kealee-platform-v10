/**
 * Dead Letter Queue — manages failed events for retry/inspection
 */

import Redis from 'ioredis';
import type { DeadLetterEntry, EventEnvelope } from './types';

export class DeadLetterQueue {
  private redis: Redis;
  static readonly STREAM_NAME = 'events:dead-letter';
  static readonly MAX_RETRIES = 3;

  constructor(redisUrl?: string) {
    const url = redisUrl ?? process.env.REDIS_URL ?? 'redis://localhost:6379';
    this.redis = new Redis(url, { maxRetriesPerRequest: 3 });
  }

  /**
   * Add a failed event to the dead letter queue
   */
  async add(entry: Omit<DeadLetterEntry, 'retryCount'>): Promise<string> {
    return this.redis.xadd(
      DeadLetterQueue.STREAM_NAME,
      '*',
      'originalStream', entry.originalStream,
      'messageId', entry.messageId,
      'event', JSON.stringify(entry.event),
      'error', entry.error,
      'failedAt', entry.failedAt,
      'retryCount', '0',
    ) as Promise<string>;
  }

  /**
   * List dead letter entries with pagination
   */
  async list(count = 50): Promise<DeadLetterEntry[]> {
    const messages = await this.redis.xrevrange(
      DeadLetterQueue.STREAM_NAME,
      '+', '-',
      'COUNT', count,
    );

    return messages.map(([_id, fields]) => {
      const fieldMap: Record<string, string> = {};
      for (let i = 0; i < fields.length; i += 2) {
        fieldMap[fields[i]] = fields[i + 1];
      }
      return {
        originalStream: fieldMap['originalStream'],
        messageId: fieldMap['messageId'],
        event: JSON.parse(fieldMap['event'] || '{}'),
        error: fieldMap['error'],
        failedAt: fieldMap['failedAt'],
        retryCount: parseInt(fieldMap['retryCount'] || '0'),
      };
    });
  }

  /**
   * Retry a dead letter entry by republishing to its original stream
   */
  async retry(messageId: string): Promise<boolean> {
    const messages = await this.redis.xrange(
      DeadLetterQueue.STREAM_NAME,
      messageId, messageId,
    );

    if (!messages.length) return false;

    const [_id, fields] = messages[0];
    const fieldMap: Record<string, string> = {};
    for (let i = 0; i < fields.length; i += 2) {
      fieldMap[fields[i]] = fields[i + 1];
    }

    const retryCount = parseInt(fieldMap['retryCount'] || '0');
    if (retryCount >= DeadLetterQueue.MAX_RETRIES) {
      console.warn(`[DeadLetterQueue] Max retries (${DeadLetterQueue.MAX_RETRIES}) exceeded for ${messageId}`);
      return false;
    }

    // Republish to original stream
    const event = fieldMap['event'];
    const originalStream = fieldMap['originalStream'];

    await this.redis.xadd(
      originalStream,
      '*',
      'event', event,
      'type', JSON.parse(event).type || '',
      'source', JSON.parse(event).source || '',
      'severity', JSON.parse(event).severity || 'INFO',
    );

    // Remove from dead letter
    await this.redis.xdel(DeadLetterQueue.STREAM_NAME, messageId);

    return true;
  }

  /**
   * Get count of dead letter entries
   */
  async count(): Promise<number> {
    return this.redis.xlen(DeadLetterQueue.STREAM_NAME);
  }

  /**
   * Purge all dead letter entries
   */
  async purge(): Promise<void> {
    await this.redis.del(DeadLetterQueue.STREAM_NAME);
  }

  async disconnect(): Promise<void> {
    this.redis.disconnect();
  }
}
