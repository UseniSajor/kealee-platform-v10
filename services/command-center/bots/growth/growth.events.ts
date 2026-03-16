/**
 * services/command-center/bots/growth/growth.events.ts
 *
 * GrowthBot event type constants and inbound event subscriptions.
 */

// ─── GrowthBot outbound events ─────────────────────────────────────────────────

export const GROWTH_EVENTS = {
  // Analysis complete
  ANALYSIS_COMPLETE:       'growth.analysis.complete',
  // Trade shortage detected
  TRADE_SHORTAGE_DETECTED: 'growth.trade.shortage_detected',
  // Trade surplus detected
  TRADE_SURPLUS_DETECTED:  'growth.trade.surplus_detected',
  // Geography shortage
  GEO_SHORTAGE_DETECTED:   'growth.geo.shortage_detected',
  // Backlog risk
  BACKLOG_RISK_DETECTED:   'growth.backlog.risk_detected',
  // Contractor churn risk
  CONTRACTOR_CHURN_RISK:   'growth.contractor.churn_risk',
  // Recruitment recommendation
  RECRUITMENT_RECOMMENDED: 'growth.recruitment.recommended',
  // Demand-gen recommendation
  DEMAND_GEN_RECOMMENDED:  'growth.demand_gen.recommended',
  // Internal ops alert
  OPS_ALERT:               'growth.ops.alert',
  // Dashboard metrics refreshed
  METRICS_REFRESHED:       'growth.metrics.refreshed',
} as const

export type GrowthEventType = typeof GROWTH_EVENTS[keyof typeof GROWTH_EVENTS]

// ─── Inbound events that trigger GrowthBot ─────────────────────────────────────

export const GROWTH_SUBSCRIBED_EVENTS = [
  // New project → check if supply exists
  'project.created',
  // Readiness advance → check if contractors available
  'project.readiness.advanced',
  // New contractor registered → rebalance supply
  'marketplace.contractor.registered',
  // Contractor verified → rebalance supply
  'marketplace.contractor.verified',
  // Assignment expired → backlog risk trigger
  'marketplace.assignment.expired',
  // Contractor inactive → churn risk
  'marketplace.contractor.inactive',
  // Periodic analysis (cron-driven synthetic event)
  'growth.analysis.scheduled',
] as const

export type GrowthSubscribedEvent = typeof GROWTH_SUBSCRIBED_EVENTS[number]
