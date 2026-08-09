/**
 * bots.registry.ts
 *
 * Central registry for all KeaBots.
 * Bots self-register on startup — no dynamic imports needed.
 */

import type { BotId, BotMigrationStatus, IBot } from './bots.types'
import { LeadBot }             from './bots/lead.bot'
import { EstimateBot }         from './bots/estimate.bot'
import { PermitBot }           from './bots/permit.bot'
import { ContractorMatchBot }  from './bots/contractor-match.bot'
import { ProjectMonitorBot }   from './bots/project-monitor.bot'
import { SupportBot }          from './bots/support.bot'
import { MarketingBot }        from './bots/marketing.bot'
import { MIGRATED_BOT_CATALOG } from './bots.catalog'
import { MigratedBot }          from './bots/migrated.bot'

// Use any-typed IBot to allow specific input/output generics in concrete bots
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyBot = IBot<any, any>

const CORE_BOT_STATUS: Partial<Record<BotId, BotMigrationStatus>> = {
  'lead-bot': 'READY',
  'estimate-bot': 'PARTIAL',
  'permit-bot': 'PARTIAL',
  'contractor-match-bot': 'PARTIAL',
  'project-monitor-bot': 'PARTIAL',
  'support-bot': 'READY',
  'marketing-bot': 'READY',
}

// ── Registry class ────────────────────────────────────────────────────────────

class BotRegistry {
  private readonly _bots = new Map<BotId, AnyBot>()

  constructor() {
    this._register(new LeadBot())
    this._register(new EstimateBot())
    this._register(new PermitBot())
    this._register(new ContractorMatchBot())
    this._register(new ProjectMonitorBot())
    this._register(new SupportBot())
    this._register(new MarketingBot())
    for (const entry of MIGRATED_BOT_CATALOG) {
      this._register(new MigratedBot(entry))
    }
  }

  private _register(bot: AnyBot): void {
    this._bots.set(bot.id, bot)
  }

  get(id: BotId): AnyBot | undefined {
    return this._bots.get(id)
  }

  list(): Array<{
    id:           BotId
    name:         string
    description:  string
    version:      string
    costProfile:  string
    requiresLLM:  boolean
    status:       string
    temporaryReason?: string
  }> {
    return Array.from(this._bots.values()).map(b => ({
      id:          b.id,
      name:        b.name,
      description: b.description,
      version:     b.version,
      costProfile: b.costProfile,
      requiresLLM: b.requiresLLM,
      status:      b.migrationStatus ?? CORE_BOT_STATUS[b.id] ?? 'PARTIAL',
      temporaryReason: MIGRATED_BOT_CATALOG.find(entry => entry.id === b.id)?.temporaryReason,
    }))
  }

  has(id: string): id is BotId {
    return this._bots.has(id as BotId)
  }
}

export const botRegistry = new BotRegistry()
