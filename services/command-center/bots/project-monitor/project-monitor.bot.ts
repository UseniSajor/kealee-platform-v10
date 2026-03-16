/**
 * services/command-center/bots/project-monitor/project-monitor.bot.ts
 *
 * ProjectMonitorBot — daily health check for active construction projects.
 *
 * Runs on cron: 08:00 UTC daily via runScheduled().
 * Also handles inbound project execution events.
 *
 * Thresholds:
 *   - Milestone overdue > 3 days → WARNING
 *   - Milestone overdue > 7 days → CRITICAL
 *   - Budget variance > 10%      → WARNING
 *   - Budget variance > 20%      → CRITICAL
 *
 * Actions:
 *   - EMAIL_SEQUENCE  → owner + contractor overdue notifications
 *   - SMS_OUTREACH    → CRITICAL overdue only
 *   - INTERNAL_ALERT  → ops team for severe variance
 *   - DASHBOARD_METRIC_UPDATE → project health score
 */

import { createLogger } from '@kealee/observability'
import { getPrisma } from '@kealee/database'
import {
  OperationalBot,
  BotCategory,
  BotEvent,
  BotResult,
  BotAction,
} from '../shared/bot.interface.js'

const logger = createLogger('project-monitor-bot')

const THRESHOLDS = {
  milestoneWarningDays:  3,
  milestoneCriticalDays: 7,
  budgetWarningPct:      0.10,
  budgetCriticalPct:     0.20,
} as const

// ─── Bot ──────────────────────────────────────────────────────────────────────

export class ProjectMonitorBot extends OperationalBot {
  readonly id          = 'project-monitor-bot'
  readonly name        = 'ProjectMonitorBot'
  readonly category: BotCategory = 'PROJECT_EXECUTION'
  readonly description = 'Daily construction project health monitor — flags overdue milestones and budget overruns, notifies owners and contractors.'
  readonly subscribedEvents = [
    'project.milestone.overdue',
    'project.budget.variance.detected',
    'project.execution.started',
  ]
  readonly requiresHumanApproval = false
  readonly synchronous           = false
  readonly internalOnly          = false

  // ─── Event handler ─────────────────────────────────────────────────────────

  async handle(event: BotEvent): Promise<BotResult> {
    const start = Date.now()
    logger.info({ botId: this.id, eventType: event.type }, 'ProjectMonitorBot handling event')

    try {
      switch (event.type) {
        case 'project.milestone.overdue': {
          const { projectId, milestoneId, overdueDays } = event.payload as {
            projectId:   string
            milestoneId: string
            overdueDays: number
          }
          const actions = this._buildMilestoneActions(projectId, milestoneId, overdueDays)
          return this.makeResult(event.type, actions, [], start)
        }

        case 'project.budget.variance.detected': {
          const { projectId, variancePct, forecastAtComplete, contractedAmount } = event.payload as {
            projectId:        string
            variancePct:      number
            forecastAtComplete: number
            contractedAmount: number
          }
          const actions = this._buildBudgetActions(projectId, variancePct, forecastAtComplete, contractedAmount)
          return this.makeResult(event.type, actions, [], start)
        }

        default:
          return this.makeResult(event.type, [], [], start)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      logger.error({ botId: this.id, err: msg }, 'ProjectMonitorBot error')
      return {
        botId: this.id,
        eventType: event.type,
        actionsTriggered: [],
        recommendationsEmitted: [],
        processingMs: Date.now() - start,
        error: msg,
      }
    }
  }

  // ─── Scheduled daily run (cron: 08:00 UTC) ─────────────────────────────────

  async runScheduled(): Promise<BotResult> {
    const start = Date.now()
    const syntheticEvent: BotEvent = {
      id:        `scheduled-${Date.now()}`,
      type:      'project.monitor.daily',
      source:    'cron',
      severity:  'LOW',
      payload:   {},
      createdAt: new Date().toISOString(),
    }

    logger.info('ProjectMonitorBot daily scan starting')

    try {
      const prisma = getPrisma()
      const allActions: BotAction[] = []
      const now = new Date()

      // Find all projects in active construction
      const activeProjects = await prisma.project.findMany({
        where: { lifecyclePhase: 'CONSTRUCTION', archived: false },
        select: { id: true, name: true, ownerId: true },
      })

      for (const project of activeProjects) {
        // ── Check milestone health ──────────────────────────────────────────
        const overdueMilestones = await prisma.milestone.findMany({
          where: {
            projectId:  project.id,
            status:     { notIn: ['COMPLETED', 'CANCELLED'] },
            targetDate: { lt: now },
          },
          select: { id: true, name: true, targetDate: true },
        })

        for (const milestone of overdueMilestones) {
          const overdueDays = Math.floor(
            (now.getTime() - new Date(milestone.targetDate).getTime()) / 86_400_000,
          )
          if (overdueDays >= THRESHOLDS.milestoneWarningDays) {
            allActions.push(
              ...this._buildMilestoneActions(project.id, milestone.id, overdueDays),
            )
          }
        }

        // ── Check budget variance ───────────────────────────────────────────
        const budget = await prisma.projectBudget.findFirst({
          where: { projectId: project.id },
          select: {
            contractedAmount: true,
            forecastAtComplete: true,
          },
        }).catch(() => null)

        if (budget?.contractedAmount && budget.forecastAtComplete) {
          const contracted = Number(budget.contractedAmount)
          const forecast   = Number(budget.forecastAtComplete)
          const variancePct = (forecast - contracted) / contracted

          if (variancePct > THRESHOLDS.budgetWarningPct) {
            allActions.push(
              ...this._buildBudgetActions(project.id, variancePct, forecast, contracted),
            )
          }
        }

        // ── Update health score metric ──────────────────────────────────────
        const healthScore = _computeHealthScore({
          overdueCount:  overdueMilestones.length,
          budgetVariance: 0, // already handled above
        })

        allActions.push(
          this.makeAction(
            'DASHBOARD_METRIC_UPDATE',
            { projectId: project.id, metric: 'health_score', value: healthScore },
            { requiresApproval: false, autoExecute: true },
          ),
        )
      }

      logger.info(
        { scanned: activeProjects.length, actionsGenerated: allActions.length },
        'ProjectMonitorBot daily scan complete',
      )

      return this.makeResult(syntheticEvent.type, allActions, [], start)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      logger.error({ botId: this.id, err: msg }, 'ProjectMonitorBot daily scan error')
      return {
        botId: this.id,
        eventType: syntheticEvent.type,
        actionsTriggered: [],
        recommendationsEmitted: [],
        processingMs: Date.now() - start,
        error: msg,
      }
    }
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private _buildMilestoneActions(
    projectId:   string,
    milestoneId: string,
    overdueDays: number,
  ): BotAction[] {
    const severity = overdueDays >= THRESHOLDS.milestoneCriticalDays ? 'CRITICAL' : 'WARNING'
    const actions: BotAction[] = []

    actions.push(
      this.makeAction(
        'EMAIL_SEQUENCE',
        {
          templateId:  severity === 'CRITICAL' ? 'milestone_critical' : 'milestone_overdue',
          projectId,
          milestoneId,
          overdueDays,
          severity,
        },
        { requiresApproval: false, autoExecute: true },
      ),
    )

    if (severity === 'CRITICAL') {
      actions.push(
        this.makeAction(
          'SMS_OUTREACH',
          {
            templateId: 'milestone_critical_sms',
            projectId,
            milestoneId,
            overdueDays,
          },
          { requiresApproval: false, autoExecute: true },
        ),
      )
    }

    return actions
  }

  private _buildBudgetActions(
    projectId:        string,
    variancePct:      number,
    forecastAtComplete: number,
    contractedAmount: number,
  ): BotAction[] {
    const severity = variancePct >= THRESHOLDS.budgetCriticalPct ? 'CRITICAL' : 'WARNING'
    const actions: BotAction[] = []

    actions.push(
      this.makeAction(
        'EMAIL_SEQUENCE',
        {
          templateId:         severity === 'CRITICAL' ? 'budget_critical' : 'budget_variance',
          projectId,
          variancePct:        Math.round(variancePct * 100),
          forecastAtComplete,
          contractedAmount,
          severity,
        },
        { requiresApproval: false, autoExecute: true },
      ),
    )

    if (severity === 'CRITICAL') {
      actions.push(
        this.makeAction(
          'INTERNAL_ALERT',
          {
            message:   `Budget CRITICAL on project ${projectId}: ${Math.round(variancePct * 100)}% over contract`,
            projectId,
            severity:  'CRITICAL',
          },
          { requiresApproval: false, autoExecute: true },
        ),
      )
    }

    return actions
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function _computeHealthScore({
  overdueCount,
  budgetVariance,
}: {
  overdueCount:  number
  budgetVariance: number
}): number {
  let score = 100
  score -= overdueCount  * 10
  score -= budgetVariance * 100 * 2
  return Math.max(0, Math.min(100, Math.round(score)))
}
