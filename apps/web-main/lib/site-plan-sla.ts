import { isSitePlanOrder } from './site-plan-rules'

export type SitePlanSlaHealth =
  | 'not_applicable'
  | 'on_track'
  | 'summary_overdue'
  | 'overdue'
  | 'delivered_on_time'
  | 'delivered_late'
  | 'awaiting_scope'

const SITE_PLAN_COMMITMENTS: Record<string, { label: string; deliveryDays: number | null }> = {
  preliminary_site_plan: {
    label: 'Property summary within 1 hour; preliminary package within 5 days',
    deliveryDays: 5,
  },
  verified_site_feasibility: {
    label: 'Property summary within 1 hour; verified package within 7 days',
    deliveryDays: 7,
  },
  permit_site_plan: {
    label: 'Requirements summary within 1 hour; drawing schedule confirmed after survey review',
    deliveryDays: null,
  },
}

function addHours(date: Date, hours: number): string {
  return new Date(date.getTime() + hours * 60 * 60 * 1000).toISOString()
}

function addDays(date: Date, days: number): string {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000).toISOString()
}

/** Flat fields are intentional: worker JSONB patches can complete the SLA atomically. */
export function createSitePlanSlaFormData(
  projectPath: string,
  startedAt: Date = new Date(),
): Record<string, unknown> {
  const commitment = SITE_PLAN_COMMITMENTS[projectPath]
  if (!commitment || !isSitePlanOrder(projectPath)) return {}

  return {
    sitePlanSlaVersion: 1,
    sitePlanSlaState: commitment.deliveryDays == null ? 'awaiting_scope' : 'in_progress',
    sitePlanSlaStartedAt: startedAt.toISOString(),
    sitePlanSummaryDueAt: addHours(startedAt, 1),
    sitePlanDeliveryDueAt:
      commitment.deliveryDays == null ? null : addDays(startedAt, commitment.deliveryDays),
    sitePlanSlaCommitment: commitment.label,
  }
}

function asTimestamp(value: unknown): number | null {
  if (typeof value !== 'string') return null
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) ? timestamp : null
}

export function resolveSitePlanSlaHealth(
  formData: Record<string, unknown> | null | undefined,
  now: Date = new Date(),
): SitePlanSlaHealth {
  if (!formData || formData.sitePlanSlaVersion !== 1) return 'not_applicable'

  const deliveredAt =
    asTimestamp(formData.sitePlanSlaDeliveredAt) ?? asTimestamp(formData.sitePlanDeliveredAt)
  const dueAt = asTimestamp(formData.sitePlanDeliveryDueAt)
  const summaryDueAt = asTimestamp(formData.sitePlanSummaryDueAt)
  const summaryCompletedAt = asTimestamp(formData.sitePlanSummaryCompletedAt)

  if (deliveredAt != null) {
    return dueAt != null && deliveredAt > dueAt ? 'delivered_late' : 'delivered_on_time'
  }
  if (summaryCompletedAt == null && summaryDueAt != null && now.getTime() > summaryDueAt) {
    return 'summary_overdue'
  }
  if (dueAt == null) return 'awaiting_scope'
  return now.getTime() > dueAt ? 'overdue' : 'on_track'
}

export function sitePlanSlaLabel(health: SitePlanSlaHealth): string {
  return {
    not_applicable: 'Not tracked',
    on_track: 'On track',
    summary_overdue: 'Property summary overdue',
    overdue: 'Overdue',
    delivered_on_time: 'Delivered on time',
    delivered_late: 'Delivered late',
    awaiting_scope: 'Schedule after survey review',
  }[health]
}
