/**
 * services/command-center/bots/shared/bot.interface.ts
 *
 * Base interface and abstract class for all command-center operational bots.
 * These are background/scheduled bots (distinct from the interactive KeaBots
 * in bots/keabot-*/). They process events, run analytics, and trigger actions.
 */

// ─── Event payload typing ──────────────────────────────────────────────────────

export interface BotEvent {
  id: string                     // uuid
  type: string                   // e.g. 'project.created'
  source: string                 // service name
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  payload: Record<string, unknown>
  correlationId?: string
  createdAt: string              // ISO 8601
}

export type BotEventHandler = (event: BotEvent) => Promise<void>

// ─── Bot action types ──────────────────────────────────────────────────────────

export type ActionType =
  | 'CRM_ENROLL'
  | 'EMAIL_SEQUENCE'
  | 'SMS_OUTREACH'
  | 'INTERNAL_ALERT'
  | 'MARKETPLACE_GAP_ALERT'
  | 'QUEUE_JOB'
  | 'DASHBOARD_METRIC_UPDATE'
  | 'NOOP'

export interface BotAction {
  type: ActionType
  target?: string                // userId, orgId, email, phone, campaignId
  payload: Record<string, unknown>
  requiresApproval: boolean
  autoExecute: boolean           // false = recommendation only
  createdAt: string
}

export interface BotResult {
  botId: string
  eventType: string
  actionsTriggered: BotAction[]
  recommendationsEmitted: BotAction[]
  processingMs: number
  error?: string
}

// ─── Human-handoff types ──────────────────────────────────────────────────────

export interface HumanHandoff {
  botId: string
  reason: string
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  context: Record<string, unknown>
  assignTo?: string              // team role or userId
  dueBy?: string                 // ISO
}

// ─── Base operational bot class ───────────────────────────────────────────────

export abstract class OperationalBot {
  abstract readonly id: string
  abstract readonly name: string
  abstract readonly category: BotCategory
  abstract readonly description: string

  /** Events this bot subscribes to */
  abstract readonly subscribedEvents: string[]

  /** Whether any output actions require human approval */
  abstract readonly requiresHumanApproval: boolean

  /** true = responds inline (fast), false = queued async */
  abstract readonly synchronous: boolean

  /** true = internal only, false = user-facing outputs */
  abstract readonly internalOnly: boolean

  /**
   * Primary handler — called when a subscribed event arrives.
   * Must be idempotent; duplicate events should be safe.
   */
  abstract handle(event: BotEvent): Promise<BotResult>

  /**
   * Optional: periodic run triggered by cron, not event.
   */
  async runScheduled?(): Promise<BotResult>

  protected makeResult(
    eventType: string,
    actionsTriggered: BotAction[],
    recommendationsEmitted: BotAction[],
    startMs: number,
  ): BotResult {
    return {
      botId: this.id,
      eventType,
      actionsTriggered,
      recommendationsEmitted,
      processingMs: Date.now() - startMs,
    }
  }

  protected makeAction(
    type: ActionType,
    payload: Record<string, unknown>,
    opts: { requiresApproval?: boolean; autoExecute?: boolean; target?: string } = {},
  ): BotAction {
    return {
      type,
      target: opts.target,
      payload,
      requiresApproval: opts.requiresApproval ?? false,
      autoExecute:      opts.autoExecute      ?? true,
      createdAt: new Date().toISOString(),
    }
  }
}

// ─── Bot category enum ────────────────────────────────────────────────────────

export type BotCategory =
  | 'GROWTH_MARKETING'
  | 'INTAKE_QUALIFICATION'
  | 'DESIGN_PRECONSTRUCTION'
  | 'SUPPLY_CONTRACTOR_OPS'
  | 'PROJECT_EXECUTION'
  | 'SUPPORT_COMMS'
  | 'INTELLIGENCE_ANALYTICS'
  | 'COMPLIANCE_VERIFICATION'
  | 'REVENUE_MONETIZATION'
  | 'ADMIN_INTERNAL'
