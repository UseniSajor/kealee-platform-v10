/**
 * services/command-center/bots/shared/bot.dispatcher.ts
 *
 * Routes BotEvents from the event bus to the correct registered bots.
 * - Prevents duplicate execution via event deduplication (Redis set with TTL)
 * - Catches per-bot errors without failing the entire dispatch cycle
 * - Logs results for observability
 */

import { Redis } from 'ioredis'
import { botRegistry } from './bot.registry.js'
import { BotEvent, BotResult } from './bot.interface.js'
import { createLogger } from '@kealee/observability'
import { randomUUID as uuid } from 'crypto'

const logger = createLogger('bot-dispatcher')

const DEDUP_TTL_SECONDS = 3600 // 1 hour deduplication window

// ─── Dispatcher ───────────────────────────────────────────────────────────────

export class BotDispatcher {
  constructor(private readonly redis: Redis) {}

  /**
   * Dispatch an event to all registered bots that subscribe to it.
   * Returns an array of BotResult (one per bot that handled the event).
   * Never throws — per-bot errors are captured in result.error.
   */
  async dispatch(event: BotEvent): Promise<BotResult[]> {
    const bots = botRegistry.getBotsForEvent(event.type)
    if (bots.length === 0) {
      logger.debug({ eventType: event.type }, 'No bots subscribed to event type')
      return []
    }

    const results: BotResult[] = []

    for (const bot of bots) {
      const dedupKey = `bot-dispatch:${bot.id}:${event.id}`

      // Deduplication check
      const alreadyProcessed = await this.redis.set(
        dedupKey,
        '1',
        'EX', DEDUP_TTL_SECONDS,
        'NX', // Only set if Not eXists
      )
      if (alreadyProcessed === null) {
        logger.warn({ botId: bot.id, eventId: event.id }, 'Duplicate event skipped')
        continue
      }

      try {
        logger.info({ botId: bot.id, eventType: event.type, eventId: event.id }, 'Dispatching to bot')
        const result = await bot.handle(event)
        results.push(result)
        logger.info({
          botId: bot.id,
          actions: result.actionsTriggered.length,
          recommendations: result.recommendationsEmitted.length,
          ms: result.processingMs,
        }, 'Bot handled event')
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err)
        logger.error({ botId: bot.id, eventId: event.id, err: errMsg }, 'Bot handler threw')
        results.push({
          botId: bot.id,
          eventType: event.type,
          actionsTriggered: [],
          recommendationsEmitted: [],
          processingMs: 0,
          error: errMsg,
        })
      }
    }

    return results
  }

  /**
   * Create a well-formed BotEvent with a generated ID.
   */
  static buildEvent(
    type: string,
    source: string,
    payload: Record<string, unknown>,
    severity: BotEvent['severity'] = 'LOW',
    correlationId?: string,
  ): BotEvent {
    return {
      id: uuid(),
      type,
      source,
      severity,
      payload,
      correlationId,
      createdAt: new Date().toISOString(),
    }
  }
}
