/**
 * services/command-center/bots/growth/growth.bot.ts
 *
 * GrowthBot — marketplace liquidity bot.
 * Extends OperationalBot and wires together service + rules + event emission.
 */

import { Redis } from 'ioredis'
import { createLogger } from '@kealee/observability'
import {
  OperationalBot,
  BotCategory,
  BotEvent,
  BotResult,
  BotAction,
} from '../shared/bot.interface.js'
import { GROWTH_EVENTS, GROWTH_SUBSCRIBED_EVENTS } from './growth.events.js'
import { runGrowthAnalysis, analyzeTradeQuick } from './growth.service.js'
import type {
  GrowthAnalysis,
  GrowthRecommendation,
} from './growth.types.js'

const logger = createLogger('growth-bot')

export class GrowthBot extends OperationalBot {
  readonly id          = 'growth-bot'
  readonly name        = 'GrowthBot'
  readonly category: BotCategory = 'GROWTH_MARKETING'
  readonly description = 'Marketplace liquidity bot — monitors supply/demand, detects shortages, triggers recruitment and demand-gen campaigns.'
  readonly subscribedEvents = [...GROWTH_SUBSCRIBED_EVENTS]
  readonly requiresHumanApproval = true   // outbound campaigns require ops approval
  readonly synchronous           = false  // all runs are async / queued
  readonly internalOnly          = true   // no direct user-facing output

  constructor(private readonly redis: Redis) {
    super()
  }

  // ─── Main event handler ────────────────────────────────────────────────────

  async handle(event: BotEvent): Promise<BotResult> {
    const start = Date.now()
    logger.info({ botId: this.id, eventType: event.type }, 'GrowthBot handling event')

    try {
      switch (event.type) {
        case 'project.created':
        case 'project.readiness.advanced':
          return await this._handleProjectEvent(event, start)

        case 'marketplace.contractor.registered':
        case 'marketplace.contractor.verified':
          return await this._handleContractorEvent(event, start)

        case 'marketplace.assignment.expired':
          return await this._handleAssignmentExpired(event, start)

        case 'growth.analysis.scheduled':
        case 'marketplace.contractor.inactive':
          return await this._handleFullAnalysis(event, start)

        default:
          return this.makeResult(event.type, [], [], start)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      logger.error({ botId: this.id, err: msg }, 'GrowthBot error')
      return { botId: this.id, eventType: event.type, actionsTriggered: [], recommendationsEmitted: [], processingMs: Date.now() - start, error: msg }
    }
  }

  // ─── Scheduled full analysis ───────────────────────────────────────────────

  async runScheduled(): Promise<BotResult> {
    const syntheticEvent: BotEvent = {
      id:        `scheduled-${Date.now()}`,
      type:      'growth.analysis.scheduled',
      source:    'cron',
      severity:  'LOW',
      payload:   {},
      createdAt: new Date().toISOString(),
    }
    return this.handle(syntheticEvent)
  }

  // ─── Internal handlers ─────────────────────────────────────────────────────

  private async _handleProjectEvent(event: BotEvent, start: number): Promise<BotResult> {
    const trade = event.payload.trade as string | undefined
    const autoActions: BotAction[] = []
    const recommendations: BotAction[] = []

    if (trade) {
      const ts = await analyzeTradeQuick(trade)
      if (ts && ts.shortageScore >= 50) {
        logger.warn({ trade, shortageScore: ts.shortageScore }, 'Trade shortage detected on project creation')
        await this._publishEvent(GROWTH_EVENTS.TRADE_SHORTAGE_DETECTED, {
          trade,
          shortageScore: ts.shortageScore,
          projectId: event.payload.projectId,
          unfilledCount: ts.demand.unfilledAssignmentCount,
        }, 'HIGH')

        const alert = this.makeAction('INTERNAL_ALERT', {
          message: `Trade shortage: ${trade} shortage score ${ts.shortageScore}/100 detected after project.created`,
          projectId: event.payload.projectId,
        }, { requiresApproval: false, autoExecute: true })
        autoActions.push(alert)
      }
    }

    return this.makeResult(event.type, autoActions, recommendations, start)
  }

  private async _handleContractorEvent(event: BotEvent, start: number): Promise<BotResult> {
    // A new verified contractor may resolve a shortage — run full analysis
    return this._handleFullAnalysis(event, start)
  }

  private async _handleAssignmentExpired(event: BotEvent, start: number): Promise<BotResult> {
    const autoActions: BotAction[] = []

    await this._publishEvent(GROWTH_EVENTS.BACKLOG_RISK_DETECTED, {
      assignmentId: event.payload.assignmentId,
      trade:        event.payload.trade,
      state:        event.payload.state,
    }, 'MEDIUM')

    const alert = this.makeAction('INTERNAL_ALERT', {
      message: `Assignment expired: ${event.payload.trade} / ${event.payload.state}`,
    }, { autoExecute: true })
    autoActions.push(alert)

    return this.makeResult(event.type, autoActions, [], start)
  }

  private async _handleFullAnalysis(event: BotEvent, start: number): Promise<BotResult> {
    const analysis = await runGrowthAnalysis()
    const autoActions: BotAction[] = []
    const recommendations: BotAction[] = []

    // Emit analysis complete event
    await this._publishEvent(GROWTH_EVENTS.ANALYSIS_COMPLETE, {
      runId:          analysis.runId,
      liquidityScore: analysis.dashboardMetrics.overallLiquidityScore,
      tradeCount:     analysis.tradeScores.length,
      geoCount:       analysis.geoScores.length,
      recommendationCount: analysis.recommendations.length,
    }, 'LOW')

    // Emit METRICS_REFRESHED for dashboard consumers
    await this._publishEvent(GROWTH_EVENTS.METRICS_REFRESHED, {
      runId:   analysis.runId,
      metrics: analysis.dashboardMetrics,
    }, 'LOW')

    // Auto-execute internal alerts + dashboard updates
    for (const rec of analysis.recommendations) {
      for (const action of rec.suggestedActions) {
        const botAction = this.makeAction(
          action.type === 'INTERNAL_SLACK_ALERT' ? 'INTERNAL_ALERT' :
          action.type === 'DASHBOARD_FLAG'       ? 'DASHBOARD_METRIC_UPDATE' :
          'QUEUE_JOB',
          action.params,
          {
            requiresApproval: action.requiresApproval,
            autoExecute:      !action.requiresApproval,
          },
        )
        if (!action.requiresApproval) {
          autoActions.push(botAction)
        } else {
          recommendations.push(botAction)
        }
      }
    }

    // Emit critical shortage/surplus events
    for (const ts of analysis.tradeScores) {
      if (ts.shortageScore >= 75) {
        await this._publishEvent(GROWTH_EVENTS.TRADE_SHORTAGE_DETECTED, {
          trade: ts.trade, shortageScore: ts.shortageScore,
          unfilledCount: ts.demand.unfilledAssignmentCount,
        }, 'HIGH')
      }
      if (ts.surplusScore >= 50) {
        await this._publishEvent(GROWTH_EVENTS.TRADE_SURPLUS_DETECTED, {
          trade: ts.trade, surplusScore: ts.surplusScore,
        }, 'MEDIUM')
      }
    }

    for (const gs of analysis.geoScores) {
      if (gs.shortageScore >= 75) {
        await this._publishEvent(GROWTH_EVENTS.GEO_SHORTAGE_DETECTED, {
          geo: gs.key, shortageScore: gs.shortageScore,
          unfilledCount: gs.unfilledCount,
        }, 'HIGH')
      }
    }

    logger.info({
      runId: analysis.runId,
      autoActions: autoActions.length,
      pendingApproval: recommendations.length,
    }, 'GrowthBot full analysis dispatched')

    return this.makeResult(event.type, autoActions, recommendations, start)
  }

  // ─── Event emission helper ─────────────────────────────────────────────────

  private async _publishEvent(
    type: string,
    payload: Record<string, unknown>,
    severity: BotEvent['severity'] = 'LOW',
  ): Promise<void> {
    try {
      const event = {
        id:        `growth-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type,
        source:    'growth-bot',
        severity,
        payload:   { ...payload, emittedBy: 'growth-bot' },
        createdAt: new Date().toISOString(),
      }
      await this.redis.publish('kealee:growth', JSON.stringify(event))
    } catch (err) {
      logger.error({ err, type }, 'GrowthBot: failed to publish event')
    }
  }
}
