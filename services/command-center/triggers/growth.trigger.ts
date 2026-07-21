/**
 * services/command-center/triggers/growth.trigger.ts
 *
 * Connects inbound platform events → GrowthBot queue.
 *
 * Two trigger paths:
 * 1. Redis Pub/Sub subscriber — listens to 'kealee:events' channel
 *    and forwards GROWTH_SUBSCRIBED_EVENTS to the BullMQ queue.
 * 2. Cron — enqueues a full analysis at 06:00 UTC daily.
 */

import { Redis } from 'ioredis'
import cron from 'node-cron'
import { createLogger } from '@kealee/observability'
import { randomUUID as uuid } from 'crypto'
import { GROWTH_SUBSCRIBED_EVENTS } from '../bots/growth/growth.events.js'
import {
  createGrowthQueue,
  enqueueFullAnalysis,
  enqueueGrowthEvent,
  type GrowthJobData,
} from '../queues/growth.queue.js'
import type { Queue } from 'bullmq'
import type { BotEvent } from '../bots/shared/bot.interface.js'

const logger = createLogger('growth-trigger')

const SUBSCRIBED_SET = new Set(GROWTH_SUBSCRIBED_EVENTS as readonly string[])

export class GrowthTrigger {
  private queue: Queue<GrowthJobData>
  private subscriber: Redis
  private cronTask?: ReturnType<typeof cron.schedule>

  constructor(private readonly redisUrl: string) {
    this.queue      = createGrowthQueue(redisUrl)
    this.subscriber = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    })
  }

  /**
   * Start listening on the platform event bus + schedule daily cron.
   */
  async start(): Promise<void> {
    // 1. Subscribe to platform events
    await this.subscriber.subscribe('kealee:events', (err) => {
      if (err) logger.error({ err }, 'GrowthTrigger: subscription error')
    })

    this.subscriber.on('message', async (_channel: string, message: string) => {
      try {
        const event = JSON.parse(message) as BotEvent
        if (!SUBSCRIBED_SET.has(event.type)) return

        logger.info({ eventType: event.type, eventId: event.id }, 'GrowthTrigger: forwarding event to queue')
        await enqueueGrowthEvent(this.queue, event)
      } catch (err) {
        logger.error({ err, message }, 'GrowthTrigger: failed to parse/enqueue event')
      }
    })

    // 2. Also subscribe to growth-specific channel
    await this.subscriber.subscribe('kealee:growth')

    // 3. Daily cron: 06:00 UTC
    this.cronTask = cron.schedule('0 6 * * *', async () => {
      logger.info('GrowthTrigger: daily analysis cron firing')
      await enqueueFullAnalysis(this.queue)
    }, { timezone: 'UTC' })

    logger.info('GrowthTrigger started (event bus + daily cron)')
  }

  /**
   * Manually trigger a full analysis (useful for testing or on-demand ops).
   */
  async triggerManualAnalysis(): Promise<void> {
    logger.info('GrowthTrigger: manual analysis triggered')
    await enqueueFullAnalysis(this.queue, { delay: 0 })
  }

  /**
   * Emit a synthetic event from external code (e.g., API webhook handler).
   */
  async emitEvent(
    type: string,
    payload: Record<string, unknown>,
    severity: BotEvent['severity'] = 'LOW',
  ): Promise<void> {
    if (!SUBSCRIBED_SET.has(type)) return

    const event: BotEvent = {
      id: uuid(),
      type,
      source: 'external-trigger',
      severity,
      payload,
      createdAt: new Date().toISOString(),
    }
    await enqueueGrowthEvent(this.queue, event)
  }

  async stop(): Promise<void> {
    this.cronTask?.stop()
    await this.subscriber.unsubscribe()
    await this.subscriber.quit()
    await this.queue.close()
    logger.info('GrowthTrigger stopped')
  }
}

// ─── Singleton trigger used by main worker ────────────────────────────────────

let _trigger: GrowthTrigger | null = null

export function getGrowthTrigger(): GrowthTrigger {
  if (!_trigger) {
    const redisUrl = process.env.REDIS_URL!
    _trigger = new GrowthTrigger(redisUrl)
  }
  return _trigger
}
