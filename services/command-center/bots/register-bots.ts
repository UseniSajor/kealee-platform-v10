/**
 * services/command-center/bots/register-bots.ts
 *
 * Registers all OperationalBots with botRegistry at service startup.
 * Import and call `registerAllBots()` once in claws-entry.ts.
 */

import { Redis } from 'ioredis'
import { botRegistry } from './shared/bot.registry.js'
import { GrowthBot } from './growth/growth.bot.js'
import { ContractorMatchBot } from './contractor-match/contractor-match.bot.js'
import { ProjectMonitorBot } from './project-monitor/project-monitor.bot.js'
import { SupportBot } from './support/support.bot.js'
import { createLogger } from '@kealee/observability'

const logger = createLogger('bot-registration')

export function registerAllBots(redis: Redis): void {
  const bots = [
    new GrowthBot(redis),
    new ContractorMatchBot(),
    new ProjectMonitorBot(),
    new SupportBot(),
  ]

  for (const bot of bots) {
    botRegistry.register(bot)
    logger.info({ botId: bot.id, events: bot.subscribedEvents }, 'Bot registered')
  }

  logger.info({ total: botRegistry.size }, 'All bots registered')
}
