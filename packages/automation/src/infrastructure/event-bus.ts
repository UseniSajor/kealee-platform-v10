import { randomUUID } from 'node:crypto';
import Redis from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { getPubConnection, getSubConnection } from './redis.js';
import type { KealeeEvent } from './event-types.js';

const CHANNEL = 'kealee:events';

type EventHandler = (event: KealeeEvent) => Promise<void>;

const prisma = new PrismaClient();

export class EventBus {
  private pub: Redis | null = null;
  private sub: Redis | null = null;
  private handlers: Map<string, EventHandler[]> = new Map();
  private listening = false;

  /**
   * Publish an event to the bus. Broadcasts via Redis pub/sub and
   * persists to the AutomationEvent table for audit/replay.
   */
  async publish(
    eventType: string,
    data: Record<string, any>,
    sourceApp: string,
    opts?: { projectId?: string; userId?: string },
  ): Promise<string> {
    if (!this.pub) {
      this.pub = getPubConnection();
    }

    const event: KealeeEvent = {
      id: randomUUID(),
      eventType,
      sourceApp,
      projectId: opts?.projectId,
      userId: opts?.userId,
      data,
      timestamp: Date.now(),
    };

    await this.pub.publish(CHANNEL, JSON.stringify(event));

    // Persist to database for audit trail
    try {
      await prisma.automationEvent.create({
        data: {
          id: event.id,
          eventType: event.eventType,
          sourceApp: event.sourceApp,
          projectId: event.projectId,
          payload: event.data,
          processedBy: [],
        },
      });
    } catch (err) {
      console.error('[EventBus] Failed to persist event:', (err as Error).message);
    }

    return event.id;
  }

  /**
   * Register a handler for one or more event types.
   */
  subscribe(eventType: string | string[], handler: EventHandler): void {
    const types = Array.isArray(eventType) ? eventType : [eventType];

    for (const type of types) {
      const existing = this.handlers.get(type) || [];
      existing.push(handler);
      this.handlers.set(type, existing);
    }
  }

  /**
   * Start listening on the Redis pub/sub channel and dispatching
   * incoming events to registered handlers.
   */
  async start(): Promise<void> {
    if (this.listening) return;

    this.sub = getSubConnection();

    this.sub.on('message', async (channel: string, message: string) => {
      if (channel !== CHANNEL) return;

      let event: KealeeEvent;
      try {
        event = JSON.parse(message) as KealeeEvent;
      } catch {
        console.error('[EventBus] Failed to parse event message');
        return;
      }

      const handlers = this.handlers.get(event.eventType) || [];
      if (handlers.length === 0) return;

      const processedBy: string[] = [];

      for (const handler of handlers) {
        try {
          await handler(event);
          processedBy.push(handler.name || 'anonymous');
        } catch (err) {
          console.error(
            `[EventBus] Handler error for ${event.eventType}:`,
            (err as Error).message,
          );
        }
      }

      // Update the persisted event with which processors handled it
      if (processedBy.length > 0) {
        try {
          await prisma.automationEvent.update({
            where: { id: event.id },
            data: { processedBy },
          });
        } catch {
          // Event may not exist yet if publish came from another instance
        }
      }
    });

    await this.sub.subscribe(CHANNEL);
    this.listening = true;
    console.log('[EventBus] Listening on channel:', CHANNEL);
  }

  /**
   * Stop listening and clean up connections.
   */
  async stop(): Promise<void> {
    if (this.sub) {
      await this.sub.unsubscribe(CHANNEL);
      this.sub = null;
    }
    this.pub = null;
    this.listening = false;
    console.log('[EventBus] Stopped');
  }
}

export const eventBus = new EventBus();
