/**
 * services/command-center/bots/growth/growth.rules.ts
 *
 * Decision rules that convert scores into recommendations and actions.
 * All functions are pure (no side effects).
 */

import { v4 as uuid } from 'uuid'
import type {
  TradeScore,
  GeoScore,
  BacklogRiskScore,
  ContractorInactivityScore,
  GrowthRecommendation,
  SuggestedAction,
} from './growth.types.js'

// ─── Thresholds ───────────────────────────────────────────────────────────────

const THRESHOLDS = {
  SHORTAGE_CRITICAL: 75,
  SHORTAGE_HIGH:     50,
  SHORTAGE_MEDIUM:   25,
  SURPLUS_HIGH:      50,
  SURPLUS_MEDIUM:    25,
  BACKLOG_HIGH:      60,
  INACTIVITY_HIGH:   70,
  INACTIVITY_MEDIUM: 40,
}

// ─── Auto-execute config ──────────────────────────────────────────────────────
// HIGH_RISK outbound actions require human approval by default.
// Only internal alerts and dashboard updates are auto-executed.

const AUTO_EXECUTE_RULES: Record<string, boolean> = {
  INTERNAL_SLACK_ALERT: true,
  DASHBOARD_FLAG:       true,
  CRM_TAG:              false,          // requires approval
  CRM_WORKFLOW_ENROLL:  false,          // requires approval
  SENDGRID_SEQUENCE:    false,          // requires approval
  TWILIO_SMS:           false,          // requires approval
}

// ─── Trade shortage → recommendation ─────────────────────────────────────────

export function tradeShortageRecommendations(ts: TradeScore): GrowthRecommendation[] {
  if (ts.shortageScore < THRESHOLDS.SHORTAGE_MEDIUM) return []

  const priority = ts.recruitmentPriority as GrowthRecommendation['priority']
  const actions: SuggestedAction[] = []

  // Always flag on dashboard
  actions.push({
    type: 'DASHBOARD_FLAG',
    params: { trade: ts.trade, shortageScore: ts.shortageScore, metric: 'shortage' },
    requiresApproval: false,
  })

  // Internal alert for HIGH+
  if (ts.shortageScore >= THRESHOLDS.SHORTAGE_HIGH) {
    actions.push({
      type: 'INTERNAL_SLACK_ALERT',
      params: {
        message: `Trade shortage detected: ${ts.trade} — score ${ts.shortageScore}/100. ${ts.demand.openProjectCount} open projects, ${ts.supply.verifiedContractors} verified contractors.`,
        channel: '#ops-alerts',
      },
      requiresApproval: false,
    })
  }

  // CRM enrollment for trade-specific recruitment (requires approval)
  actions.push({
    type: 'CRM_WORKFLOW_ENROLL',
    params: {
      workflowName: `Recruit ${ts.trade} Contractors`,
      tags: ['recruitment', `trade:${ts.trade.toLowerCase().replace(/\s+/g, '-')}`, 'shortage'],
      priority,
    },
    requiresApproval: true,
  })

  // SendGrid sequence for CRITICAL only (requires approval)
  if (ts.shortageScore >= THRESHOLDS.SHORTAGE_CRITICAL) {
    actions.push({
      type: 'SENDGRID_SEQUENCE',
      params: {
        sequenceId: 'contractor-recruitment-urgent',
        variables: { trade: ts.trade, region: 'Platform-wide' },
        audienceSegment: `contractors:interested:${ts.trade}`,
      },
      requiresApproval: true,
    })
  }

  return [{
    id: uuid(),
    type: 'RECRUIT_TRADE',
    priority,
    title: `Recruit ${ts.trade} Contractors`,
    description: `${ts.demand.openProjectCount} open projects requiring ${ts.trade} with only ${ts.supply.verifiedContractors} verified contractors available. Shortage score: ${ts.shortageScore}/100.`,
    targetTrade: ts.trade,
    score: ts.shortageScore,
    suggestedActions: actions,
    autoExecute: false, // all trade recruitment requires review
    createdAt: new Date().toISOString(),
  }]
}

// ─── Trade surplus → demand-gen recommendation ────────────────────────────────

export function tradeSurplusRecommendations(ts: TradeScore): GrowthRecommendation[] {
  if (ts.surplusScore < THRESHOLDS.SURPLUS_MEDIUM) return []

  const priority = ts.demandGenPriority as GrowthRecommendation['priority']
  const actions: SuggestedAction[] = []

  actions.push({
    type: 'DASHBOARD_FLAG',
    params: { trade: ts.trade, surplusScore: ts.surplusScore, metric: 'surplus' },
    requiresApproval: false,
  })

  if (ts.surplusScore >= THRESHOLDS.SURPLUS_HIGH) {
    actions.push({
      type: 'CRM_WORKFLOW_ENROLL',
      params: {
        workflowName: `Developer Outreach — ${ts.trade} Demand`,
        tags: ['demand-gen', `trade:${ts.trade.toLowerCase().replace(/\s+/g, '-')}`, 'surplus'],
        priority,
      },
      requiresApproval: true,
    })
  }

  return [{
    id: uuid(),
    type: 'DEMAND_GEN_TRADE',
    priority,
    title: `Generate ${ts.trade} Project Demand`,
    description: `${ts.supply.verifiedContractors} verified ${ts.trade} contractors with only ${ts.demand.openProjectCount} open projects. Surplus score: ${ts.surplusScore}/100.`,
    targetTrade: ts.trade,
    score: ts.surplusScore,
    suggestedActions: actions,
    autoExecute: false,
    createdAt: new Date().toISOString(),
  }]
}

// ─── Geography shortage → regional recruitment ────────────────────────────────

export function geoShortageRecommendations(gs: GeoScore): GrowthRecommendation[] {
  if (gs.shortageScore < THRESHOLDS.SHORTAGE_MEDIUM) return []

  const priority = gs.recruitmentPriority as GrowthRecommendation['priority']
  const locationLabel = gs.city ? `${gs.city}, ${gs.state}` : gs.state

  const actions: SuggestedAction[] = [
    {
      type: 'DASHBOARD_FLAG',
      params: { geo: gs.key, shortageScore: gs.shortageScore, metric: 'geo-shortage' },
      requiresApproval: false,
    },
  ]

  if (gs.shortageScore >= THRESHOLDS.SHORTAGE_HIGH) {
    actions.push({
      type: 'INTERNAL_SLACK_ALERT',
      params: {
        message: `Regional shortage in ${locationLabel}: ${gs.unfilledCount} unfilled projects, only ${gs.verifiedSupplyCount} verified contractors. Score: ${gs.shortageScore}/100.`,
        channel: '#ops-alerts',
      },
      requiresApproval: false,
    })
    actions.push({
      type: 'CRM_WORKFLOW_ENROLL',
      params: {
        workflowName: `Regional Recruitment — ${locationLabel}`,
        tags: ['recruitment', `region:${gs.key}`, 'geo-shortage'],
        priority,
      },
      requiresApproval: true,
    })
  }

  return [{
    id: uuid(),
    type: 'RECRUIT_REGION',
    priority,
    title: `Recruit Contractors in ${locationLabel}`,
    description: `${gs.unfilledCount} unfilled projects in ${locationLabel} with only ${gs.verifiedSupplyCount} verified contractors. Regional shortage score: ${gs.shortageScore}/100.`,
    targetGeo: gs.key,
    score: gs.shortageScore,
    suggestedActions: actions,
    autoExecute: false,
    createdAt: new Date().toISOString(),
  }]
}

// ─── Backlog risk → fill backlog ──────────────────────────────────────────────

export function backlogRiskRecommendations(br: BacklogRiskScore): GrowthRecommendation[] {
  if (br.backlogScore < THRESHOLDS.BACKLOG_HIGH) return []

  const actions: SuggestedAction[] = [
    {
      type: 'INTERNAL_SLACK_ALERT',
      params: {
        message: `Backlog risk in ${br.trade} / ${br.state}: ${br.queueDepth} pending assignments, oldest unfilled ${br.oldestUnfilledDays} days. Score: ${br.backlogScore}/100.`,
        channel: '#marketplace-ops',
      },
      requiresApproval: false,
    },
    {
      type: 'DASHBOARD_FLAG',
      params: { trade: br.trade, state: br.state, backlogScore: br.backlogScore, metric: 'backlog' },
      requiresApproval: false,
    },
  ]

  return [{
    id: uuid(),
    type: 'FILL_BACKLOG',
    priority: br.urgency,
    title: `Clear Assignment Backlog: ${br.trade} / ${br.state}`,
    description: `${br.queueDepth} unassigned projects in ${br.trade} (${br.state}). Oldest has been unfilled for ${br.oldestUnfilledDays} days. Score: ${br.backlogScore}/100.`,
    targetTrade: br.trade,
    targetGeo: br.state,
    score: br.backlogScore,
    suggestedActions: actions,
    autoExecute: true, // internal alerts auto-fire
    createdAt: new Date().toISOString(),
  }]
}

// ─── Contractor inactivity → reactivation ─────────────────────────────────────

export function inactivityRecommendations(
  inactive: ContractorInactivityScore[],
): GrowthRecommendation[] {
  const highRisk = inactive.filter(c => c.inactivityRiskScore >= THRESHOLDS.INACTIVITY_HIGH)
  const medRisk  = inactive.filter(c =>
    c.inactivityRiskScore >= THRESHOLDS.INACTIVITY_MEDIUM &&
    c.inactivityRiskScore < THRESHOLDS.INACTIVITY_HIGH
  )

  if (highRisk.length === 0 && medRisk.length === 0) return []

  const all = [...highRisk, ...medRisk]
  const actions: SuggestedAction[] = []

  if (highRisk.length > 0) {
    actions.push({
      type: 'TWILIO_SMS',
      params: {
        message: 'You have projects waiting in your Kealee lead queue. Log in to stay active: {portalUrl}',
        audienceProfileIds: highRisk.map(c => c.profileId),
        audienceEmails: highRisk.map(c => c.email).filter(Boolean),
      },
      requiresApproval: true,
    })
  }

  if (all.length > 0) {
    actions.push({
      type: 'SENDGRID_SEQUENCE',
      params: {
        sequenceId: 'contractor-reactivation',
        audienceProfileIds: all.map(c => c.profileId),
        variables: { daysSinceLastActivity: 'see_payload' },
      },
      requiresApproval: true,
    })
  }

  return [{
    id: uuid(),
    type: 'REACTIVATE_CONTRACTOR',
    priority: highRisk.length > 0 ? 'HIGH' : 'MEDIUM',
    title: `Reactivate ${all.length} Inactive Contractor(s)`,
    description: `${highRisk.length} high-risk and ${medRisk.length} medium-risk contractors at churn risk. High-risk avg inactivity: ${highRisk.length > 0 ? Math.round(highRisk.reduce((s, c) => s + c.daysSinceLastActivity, 0) / highRisk.length) : 0} days.`,
    targetProfileIds: all.map(c => c.profileId),
    score: highRisk.length > 0 ? highRisk[0].inactivityRiskScore : medRisk[0].inactivityRiskScore,
    suggestedActions: actions,
    autoExecute: false,
    createdAt: new Date().toISOString(),
  }]
}

// ─── All recommendations from a full analysis ─────────────────────────────────

export function deriveAllRecommendations(
  tradeScores: TradeScore[],
  geoScores: GeoScore[],
  backlogRisks: BacklogRiskScore[],
  inactiveContractors: ContractorInactivityScore[],
): GrowthRecommendation[] {
  const recs: GrowthRecommendation[] = []

  for (const ts of tradeScores) {
    recs.push(...tradeShortageRecommendations(ts))
    recs.push(...tradeSurplusRecommendations(ts))
  }
  for (const gs of geoScores) {
    recs.push(...geoShortageRecommendations(gs))
  }
  for (const br of backlogRisks) {
    recs.push(...backlogRiskRecommendations(br))
  }
  recs.push(...inactivityRecommendations(inactiveContractors))

  // Sort: CRITICAL first, then HIGH, MEDIUM, LOW
  const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, NONE: 4 }
  recs.sort((a, b) => (order[a.priority] ?? 99) - (order[b.priority] ?? 99))

  return recs
}
