import {
  computeChannelComparison,
  type ChannelComparisonOptions,
  type ChannelComparisonReport,
} from '@/lib/marketing/channel-attribution'

export type { ChannelComparisonReport }

export const CONVERTED_STATUSES = ['paid', 'concept_ready', 'processing'] as const

export interface IntakeLeadRow {
  id: string
  contact_email: string
  client_name: string
  project_path: string
  status: string
  source: string
  created_at: string
  form_data: Record<string, unknown> | null
  metadata: Record<string, unknown> | null
  budget_range?: string | null
  project_address?: string | null
  paid_at?: string | null
  payment_amount?: number | null
}

export interface FunnelStats {
  totalLeads: number
  converted: number
  conversionRate: string
  paidCount: number
  conceptReadyCount: number
  bySource: Record<string, number>
  byProjectPath: Record<string, number>
  byUtmSource: Record<string, number>
  byStatus: Record<string, number>
  sequencesPending: number
  last7DaysLeads: number
  last7DaysPaid: number
  channelComparison: ChannelComparisonReport
}

function pct(n: number, d: number): string {
  if (d <= 0) return '0%'
  return `${Math.round((n / d) * 100)}%`
}

function bump(map: Record<string, number>, key: string): void {
  map[key] = (map[key] ?? 0) + 1
}

export interface ComputeFunnelStatsOptions {
  sequencesPending?: number
  channelComparison?: ChannelComparisonOptions
}

export function computeFunnelStats(
  leads: IntakeLeadRow[],
  options: ComputeFunnelStatsOptions | number = {},
): FunnelStats {
  const opts: ComputeFunnelStatsOptions =
    typeof options === 'number' ? { sequencesPending: options } : options
  const sequencesPending = opts.sequencesPending ?? 0

  const bySource: Record<string, number> = {}
  const byProjectPath: Record<string, number> = {}
  const byUtmSource: Record<string, number> = {}
  const byStatus: Record<string, number> = {}

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  let last7DaysLeads = 0
  let last7DaysPaid = 0

  for (const lead of leads) {
    bump(bySource, lead.source || 'unknown')
    bump(byProjectPath, lead.project_path || 'unknown')
    bump(byStatus, lead.status || 'unknown')

    const meta = (lead.metadata ?? {}) as Record<string, unknown>
    const fd = (lead.form_data ?? {}) as Record<string, unknown>
    const utm =
      (meta.utm_source as string) ??
      (fd.utmSource as string) ??
      (fd.utm_source as string) ??
      'direct'
    bump(byUtmSource, utm)

    const created = new Date(lead.created_at).getTime()
    if (created >= weekAgo) {
      last7DaysLeads++
      if (CONVERTED_STATUSES.includes(lead.status as (typeof CONVERTED_STATUSES)[number])) {
        last7DaysPaid++
      }
    }
  }

  const converted = leads.filter(l =>
    CONVERTED_STATUSES.includes(l.status as (typeof CONVERTED_STATUSES)[number]),
  ).length
  const paidCount = leads.filter(l => l.status === 'paid').length
  const conceptReadyCount = leads.filter(l => (l.status === 'concept_ready' || l.status === 'delivered')).length

  const channelComparison = computeChannelComparison(leads, opts.channelComparison ?? {})

  return {
    totalLeads: leads.length,
    converted,
    conversionRate: pct(converted, leads.length),
    paidCount,
    conceptReadyCount,
    bySource,
    byProjectPath,
    byUtmSource,
    byStatus,
    sequencesPending,
    last7DaysLeads,
    last7DaysPaid,
    channelComparison,
  }
}
