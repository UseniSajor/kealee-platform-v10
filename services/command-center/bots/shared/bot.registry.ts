/**
 * services/command-center/bots/shared/bot.registry.ts
 *
 * Central registry for all operational bots.
 * Maps event types → list of bots that handle them.
 * Prevents duplicate registration.
 */

import { OperationalBot, BotEvent, BotResult } from './bot.interface.js'
import { createLogger } from '@kealee/observability'

const logger = createLogger('bot-registry')

// ─── Registry ────────────────────────────────────────────────────────────────

class BotRegistry {
  private readonly bots = new Map<string, OperationalBot>()
  private readonly eventMap = new Map<string, Set<string>>() // eventType → Set<botId>

  /**
   * Register a bot. Throws if botId already registered.
   */
  register(bot: OperationalBot): void {
    if (this.bots.has(bot.id)) {
      throw new Error(`BotRegistry: duplicate bot ID "${bot.id}"`)
    }
    this.bots.set(bot.id, bot)

    for (const eventType of bot.subscribedEvents) {
      if (!this.eventMap.has(eventType)) {
        this.eventMap.set(eventType, new Set())
      }
      this.eventMap.get(eventType)!.add(bot.id)
    }

    logger.info({ botId: bot.id, events: bot.subscribedEvents }, 'Bot registered')
  }

  /** Deregister — for testing */
  deregister(botId: string): void {
    const bot = this.bots.get(botId)
    if (!bot) return
    this.bots.delete(botId)
    for (const eventType of bot.subscribedEvents) {
      this.eventMap.get(eventType)?.delete(botId)
    }
  }

  /** Get bots subscribed to an event type */
  getBotsForEvent(eventType: string): OperationalBot[] {
    const ids = this.eventMap.get(eventType) ?? new Set()
    return [...ids].map(id => this.bots.get(id)!).filter(Boolean)
  }

  /** Get a specific bot by ID */
  getBot(botId: string): OperationalBot | undefined {
    return this.bots.get(botId)
  }

  /** List all registered bots */
  list(): OperationalBot[] {
    return [...this.bots.values()]
  }

  /** Get event → bot mapping for observability */
  getEventMap(): Record<string, string[]> {
    const out: Record<string, string[]> = {}
    for (const [event, ids] of this.eventMap.entries()) {
      out[event] = [...ids]
    }
    return out
  }

  get size(): number {
    return this.bots.size
  }
}

// Singleton
export const botRegistry = new BotRegistry()

// ─── KeaBots org chart manifest ───────────────────────────────────────────────
// This is a static reference document (not runtime), listing ALL bots.

export const KEABOTS_ORG_CHART = {
  GROWTH_MARKETING: {
    bots: ['growth-bot'],
    description: 'Marketplace liquidity, supply/demand balance, recruitment campaigns',
  },
  INTAKE_QUALIFICATION: {
    bots: ['lead-bot', 'intake-bot'],
    description: 'Lead capture, qualification scoring, project intake',
  },
  DESIGN_PRECONSTRUCTION: {
    bots: ['estimate-bot', 'design-coordination-bot'],
    description: 'Estimation, design coordination, pre-construction readiness',
  },
  SUPPLY_CONTRACTOR_OPS: {
    bots: ['contractor-match-bot', 'verification-bot'],
    description: 'Contractor matching, credential verification, queue management',
  },
  PROJECT_EXECUTION: {
    bots: ['project-monitor-bot', 'change-order-bot', 'escrow-bot'],
    description: 'Construction monitoring, change orders, escrow state machine',
  },
  SUPPORT_COMMS: {
    bots: ['support-bot', 'notification-bot'],
    description: 'User support, notification routing, dispute escalation',
  },
  INTELLIGENCE_ANALYTICS: {
    bots: ['analytics-bot'],
    description: 'Market insights, scoring, reporting',
  },
  COMPLIANCE_VERIFICATION: {
    bots: ['permit-bot', 'verification-bot'],
    description: 'Permit tracking, license verification, insurance monitoring',
  },
  REVENUE_MONETIZATION: {
    bots: ['revenue-bot'],
    description: 'Subscription events, Stripe webhook handling, upsell triggers',
  },
  ADMIN_INTERNAL: {
    bots: ['crm-ops-bot', 'admin-ops-bot'],
    description: 'GHL CRM automation, internal ops alerts, queue health',
  },
} as const

// ─── Human interaction map ────────────────────────────────────────────────────

export const HUMAN_INTERACTION_MAP = {
  // SAFE TO AUTOMATE (no human needed)
  safe: [
    'marketing.lead_capture',
    'marketing.crm_enrollment',
    'intake.project_scoring',
    'intake.qualification_check',
    'contractor_matching.assignment_routing',
    'notifications.all',
    'escrow.milestone_payment_release', // auto when both parties approve
  ],
  // HUMAN SUPERVISED (bot recommends, human confirms)
  supervised: [
    'intake.project_approval',          // human reviews bot-qualified project
    'contractor_matching.final_selection', // owner selects from bot-matched list
    'engagement.contract_creation',     // bot drafts, owner/contractor sign
    'project_execution.change_order_approval', // bot analyzes, parties approve
    'support.escalation_routing',       // bot triages, human resolves
    'growth.outbound_campaign_launch',  // bot recommends, ops approves
  ],
  // HUMAN REQUIRED (cannot be automated)
  required: [
    'contract_escrow.signing',          // DocuSign requires human identity
    'verification.admin_approval',      // admin must approve contractor credentials
    'dispute.resolution',               // mediation requires human judgment
    'project_kickoff.site_visit',       // physical presence required
    'support.escalated_complaint',      // legal/financial disputes
  ],
} as const
