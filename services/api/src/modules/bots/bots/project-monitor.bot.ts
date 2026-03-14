/**
 * project-monitor.bot.ts
 *
 * ProjectMonitorBot — Analyses project health from live DB data.
 *
 * Deterministic:  Health score (budget CPI, schedule, open issues)
 * LLM:            Risk narrative, recommended actions
 *
 * Reads from canonical Project + Milestone + Change Order models.
 * Never modifies data — read-only.
 */

import { prismaAny } from '../../../utils/prisma-helper'
import { callModel, parseJSON, isLLMAvailable } from '../bots.router'
import { startStep, recordTrace } from '../bots.logger'
import type {
  IBot, BotInput, BotOutput, BotContext,
  ProjectMonitorBotInput, ProjectMonitorBotOutput, ProjectRisk, ProjectAction,
} from '../bots.types'

// ── Health scoring ────────────────────────────────────────────────────────────

function computeHealthScore(opts: {
  cpi:          number
  spi:          number
  openIssues:   number
  daysDelay:    number
  riskCount:    number
}): { score: number; status: 'healthy' | 'at_risk' | 'critical' } {
  let score = 100

  // Cost performance (CPI < 1 = over budget)
  if (opts.cpi < 0.85)      score -= 30
  else if (opts.cpi < 0.95) score -= 15
  else if (opts.cpi < 1.0)  score -= 5

  // Schedule (SPI < 1 = behind)
  if (opts.spi < 0.80)      score -= 25
  else if (opts.spi < 0.90) score -= 12
  else if (opts.spi < 1.0)  score -= 5

  // Open issues / RFIs
  if (opts.openIssues > 10) score -= 15
  else if (opts.openIssues > 5) score -= 8
  else if (opts.openIssues > 2) score -= 3

  // Schedule delay
  if (opts.daysDelay > 30)  score -= 15
  else if (opts.daysDelay > 14) score -= 8

  score = Math.max(0, Math.min(100, score))

  return {
    score,
    status: score >= 75 ? 'healthy' : score >= 50 ? 'at_risk' : 'critical',
  }
}

// ── LLM prompt ────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a construction project risk analyst.

Given project health metrics, identify risks and recommend actions.

Return ONLY JSON:
{
  "risks": [
    {
      "category": "Budget",
      "severity": "high",
      "description": "CPI of 0.87 indicates costs running 15% over budget",
      "mitigation": "Conduct value engineering review on remaining scope"
    }
  ],
  "actions": [
    {
      "priority": "urgent",
      "action": "Schedule budget review meeting with owner",
      "owner": "Project Manager",
      "dueDate": "2026-03-20"
    }
  ],
  "summary": "2-3 sentence project health narrative"
}

severity: "high" | "medium" | "low"
priority: "urgent" | "high" | "medium"
Limit to top 5 risks and top 5 actions. Be specific and actionable.`

// ── Bot class ─────────────────────────────────────────────────────────────────

export class ProjectMonitorBot implements IBot<ProjectMonitorBotInput, ProjectMonitorBotOutput> {
  readonly id          = 'project-monitor-bot' as const
  readonly name        = 'ProjectMonitorBot'
  readonly description = 'Analyses project health from live data and generates risk/action recommendations'
  readonly version     = '1.0.0'
  readonly costProfile = 'medium' as const
  readonly requiresLLM = false

  async execute(
    input: BotInput<ProjectMonitorBotInput>,
    ctx:   BotContext,
  ): Promise<BotOutput<ProjectMonitorBotOutput>> {
    const { data }  = input
    const requestId = ctx.requestId
    const startedAt = new Date()
    const steps     = []

    // ── Step 1: Load project data ─────────────────────────────────────────────
    const loadTimer = startStep('lookup', 'load_project', data.projectId)
    let project: any   = null
    let milestones: any[] = []

    try {
      project = await prismaAny.project.findUnique({
        where:  { id: data.projectId },
        select: {
          id: true, name: true, status: true, lifecyclePhase: true,
          totalBudget: true, spentToDate: true, progressPct: true,
          startDate: true, targetEndDate: true, twinHealthScore: true,
          constructionReadinessStatus: true,
        },
      })

      milestones = await prismaAny.milestone?.findMany?.({
        where:   { projectId: data.projectId },
        orderBy: { dueDate: 'asc' },
        select:  { id: true, title: true, status: true, dueDate: true, completedAt: true },
      }).catch(() => []) ?? []

      steps.push(loadTimer.finish(`project=${project?.name ?? 'not found'}, milestones=${milestones.length}`))
    } catch (err: any) {
      steps.push(loadTimer.finish(undefined, err.message))
    }

    if (!project) {
      const trace = {
        requestId, botId: this.id, startedAt, completedAt: new Date(),
        durationMs: Date.now() - startedAt.getTime(),
        deterministic: true, steps, cost: { estimatedUSD: 0 },
      }
      recordTrace(trace)
      return {
        success: false,
        result:  buildEmptyOutput(),
        trace,
        error:   `Project ${data.projectId} not found`,
      }
    }

    // ── Step 2: Compute budget metrics ────────────────────────────────────────
    const budgetTimer = startStep('deterministic', 'compute_budget_metrics')
    const allocated = Number(project.totalBudget ?? 0)
    const spent     = Number(project.spentToDate  ?? 0)
    const remaining = allocated - spent
    const progress  = project.progressPct ?? 0

    // Earned Value: what SHOULD have been spent at this progress level
    const plannedValue = allocated * (progress / 100)
    const cpi = plannedValue > 0 ? plannedValue / Math.max(spent, 1) : 1.0
    // Burn rate: spent / progress%
    const burnRate = progress > 0 ? (spent / progress) * 100 : 0
    const forecastTotal   = burnRate
    const forecastOverrun = Math.max(0, forecastTotal - allocated)

    steps.push(budgetTimer.finish(`CPI=${cpi.toFixed(2)}, overrun=$${forecastOverrun.toLocaleString()}`))

    // ── Step 3: Compute schedule metrics ──────────────────────────────────────
    const schedTimer = startStep('deterministic', 'compute_schedule_metrics')
    const now  = new Date()
    let daysDelay    = 0
    let onSchedule   = true
    let projectedEnd: string | undefined
    let spi          = 1.0

    if (project.targetEndDate) {
      const targetEnd = new Date(project.targetEndDate)
      // SPI: progress earned / progress planned
      if (project.startDate) {
        const totalDays  = (targetEnd.getTime() - new Date(project.startDate).getTime()) / 86_400_000
        const elapsedDays = (now.getTime() - new Date(project.startDate).getTime()) / 86_400_000
        const plannedPct  = Math.min((elapsedDays / totalDays) * 100, 100)
        spi = plannedPct > 0 ? (progress / plannedPct) : 1.0
      }

      const completedMilestones = milestones.filter(m => m.status === 'COMPLETED').length
      const overdueMilestones   = milestones.filter(
        m => m.status !== 'COMPLETED' && m.dueDate && new Date(m.dueDate) < now
      ).length

      if (overdueMilestones > 0 || spi < 0.9) {
        onSchedule = false
        daysDelay  = Math.round((1 - spi) * (
          (targetEnd.getTime() - new Date(project.startDate ?? now).getTime()) / 86_400_000
        ))
        daysDelay  = Math.max(0, daysDelay)
        const projectedMs = targetEnd.getTime() + daysDelay * 86_400_000
        projectedEnd = new Date(projectedMs).toISOString().split('T')[0]
      }
    }
    steps.push(schedTimer.finish(`SPI=${spi.toFixed(2)}, delay=${daysDelay}d`))

    // ── Step 4: Health score ──────────────────────────────────────────────────
    const healthTimer = startStep('deterministic', 'compute_health_score')
    const { score: healthScore, status } = computeHealthScore({
      cpi, spi, openIssues: 0, daysDelay, riskCount: 0,
    })
    steps.push(healthTimer.finish(`${healthScore} (${status})`))

    // ── Step 5 (optional): LLM risks + actions ────────────────────────────────
    let risks:       ProjectRisk[]  = buildFallbackRisks(cpi, spi, daysDelay, forecastOverrun)
    let actions:     ProjectAction[] = buildFallbackActions(status)
    let summary      = `Project is ${status} with health score ${healthScore}/100.`
    let modelUsed: string | undefined
    let inputTokens  = 0
    let outputTokens = 0
    let costUSD      = 0

    const wantsRisk = input.data.includeRiskAnalysis !== false

    if (isLLMAvailable() && wantsRisk) {
      const llmTimer = startStep('llm', 'generate_risk_analysis', `health=${healthScore}`)
      try {
        const metrics = {
          healthScore, status, cpi: cpi.toFixed(2), spi: spi.toFixed(2),
          allocated, spent, remaining, forecastOverrun,
          progressPct: progress, daysDelay,
          milestonesTotal: milestones.length,
          milestonesOverdue: milestones.filter(m =>
            m.status !== 'COMPLETED' && m.dueDate && new Date(m.dueDate) < now
          ).length,
          phase: project.lifecyclePhase,
        }

        const result = await callModel({
          systemPrompt: SYSTEM_PROMPT,
          userPrompt:   `Project: ${project.name}\nMetrics: ${JSON.stringify(metrics, null, 2)}`,
          tier:         'standard',
          temperature:  0.3,
        })

        const parsed = parseJSON<{
          risks?: ProjectRisk[]
          actions?: ProjectAction[]
          summary?: string
        }>(result.content, {})

        risks   = parsed.risks   ?? risks
        actions = parsed.actions ?? actions
        summary = parsed.summary ?? summary
        modelUsed    = result.model
        inputTokens  = result.inputTokens
        outputTokens = result.outputTokens
        costUSD      = result.estimatedCostUSD
        steps.push(llmTimer.finish(`${risks.length} risks, ${actions.length} actions`))
      } catch (err: any) {
        steps.push(llmTimer.finish(undefined, err.message))
      }
    }

    const completedAt = new Date()
    const trace = {
      requestId,
      botId:        this.id,
      startedAt,
      completedAt,
      durationMs:   completedAt.getTime() - startedAt.getTime(),
      modelUsed,
      inputTokens,
      outputTokens,
      deterministic: !modelUsed,
      steps,
      cost: { estimatedUSD: costUSD },
    }
    recordTrace(trace)

    return {
      success: true,
      result: {
        healthScore,
        status,
        summary,
        budget: { allocated, spent, remaining, burnRate, forecastOverrun, cpi },
        schedule: { completionPct: progress, onSchedule, projectedCompletion: projectedEnd, daysDelay },
        risks,
        actions,
      },
      trace,
    }
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildEmptyOutput(): ProjectMonitorBotOutput {
  return {
    healthScore: 0, status: 'critical', summary: 'Project data unavailable.',
    budget: { allocated: 0, spent: 0, remaining: 0, burnRate: 0, forecastOverrun: 0, cpi: 1 },
    schedule: { completionPct: 0, onSchedule: false },
    risks: [], actions: [],
  }
}

function buildFallbackRisks(cpi: number, spi: number, delay: number, overrun: number): ProjectRisk[] {
  const risks: ProjectRisk[] = []
  if (cpi < 0.95) risks.push({
    category: 'Budget', severity: cpi < 0.85 ? 'high' : 'medium',
    description: `CPI of ${cpi.toFixed(2)} indicates cost overrun risk of $${overrun.toLocaleString()}`,
    mitigation: 'Review scope, identify VE opportunities, and update owner forecast.',
  })
  if (spi < 0.90) risks.push({
    category: 'Schedule', severity: spi < 0.80 ? 'high' : 'medium',
    description: `Schedule performance index ${spi.toFixed(2)} — project running behind`,
    mitigation: `Address ${delay} day delay with revised schedule and recovery plan.`,
  })
  return risks
}

function buildFallbackActions(status: string): ProjectAction[] {
  if (status === 'critical') {
    return [{
      priority: 'urgent', action: 'Convene project recovery meeting', owner: 'Project Manager',
    }]
  }
  if (status === 'at_risk') {
    return [{
      priority: 'high', action: 'Issue updated cost-at-completion forecast to owner', owner: 'Project Manager',
    }]
  }
  return [{
    priority: 'medium', action: 'Continue monitoring — no immediate action required', owner: 'Project Manager',
  }]
}
