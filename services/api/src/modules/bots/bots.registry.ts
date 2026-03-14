/**
 * bots.registry.ts
 *
 * Central registry for all KeaBots.
 * Bots self-register on startup — no dynamic imports needed.
 */

import type { BotId, IBot } from './bots.types'
import { LeadBot }             from './bots/lead.bot'
import { EstimateBot }         from './bots/estimate.bot'
import { PermitBot }           from './bots/permit.bot'
import { ContractorMatchBot }  from './bots/contractor-match.bot'
import { ProjectMonitorBot }   from './bots/project-monitor.bot'
import { SupportBot }          from './bots/support.bot'

// ── Registry class ────────────────────────────────────────────────────────────

class BotRegistry {
  private readonly _bots = new Map<BotId, IBot>()

  constructor() {
    this._register(new LeadBot())
    this._register(new EstimateBot())
    this._register(new PermitBot())
    this._register(new ContractorMatchBot())
    this._register(new ProjectMonitorBot())
    this._register(new SupportBot())
  }

  private _register(bot: IBot): void {
    this._bots.set(bot.id, bot)
  }

  get(id: BotId): IBot | undefined {
    return this._bots.get(id)
  }

  list(): Array<{
    id:           BotId
    name:         string
    description:  string
    version:      string
    costProfile:  string
    requiresLLM:  boolean
  }> {
    return Array.from(this._bots.values()).map(b => ({
      id:          b.id,
      name:        b.name,
      description: b.description,
      version:     b.version,
      costProfile: b.costProfile,
      requiresLLM: b.requiresLLM,
    }))
  }

  has(id: string): id is BotId {
    return this._bots.has(id as BotId)
  }
}

export const botRegistry = new BotRegistry()
