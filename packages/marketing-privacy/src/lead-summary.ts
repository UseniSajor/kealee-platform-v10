/** Aggregate-only lead metrics — no row-level PII. */

export interface LeadSummaryInput {
  project_path?: string | null
  status?: string | null
  source_channel?: string | null
  routing_tag?: string | null
  lead_tier?: string | null
  created_at?: string | null
}

export interface LeadSummary {
  total: number
  today: number
  thisWeek: number
  bySource: Record<string, number>
  byService: Record<string, number>
  byTier: Record<string, number>
  byStatus: Record<string, number>
  hotCount: number
  convertedCount: number
  capacityPerDay: number
}

function bump(map: Record<string, number>, key: string): void {
  const k = key || 'unknown'
  map[k] = (map[k] ?? 0) + 1
}

export function computeLeadSummary(
  rows: LeadSummaryInput[],
  capacityPerDay = 50,
): LeadSummary {
  const now = Date.now()
  const dayStart = new Date()
  dayStart.setHours(0, 0, 0, 0)
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000

  const bySource: Record<string, number> = {}
  const byService: Record<string, number> = {}
  const byTier: Record<string, number> = {}
  const byStatus: Record<string, number> = {}

  let today = 0
  let thisWeek = 0
  let hotCount = 0
  let convertedCount = 0

  const convertedStatuses = new Set(['paid', 'concept_ready', 'processing'])

  for (const row of rows) {
    bump(bySource, row.source_channel ?? 'unknown')
    bump(byService, row.project_path ?? 'unknown')
    bump(byTier, row.lead_tier ?? row.routing_tag ?? 'unknown')
    bump(byStatus, row.status ?? 'unknown')

    const created = row.created_at ? new Date(row.created_at).getTime() : 0
    if (created >= dayStart.getTime()) today++
    if (created >= weekAgo) thisWeek++
    if (row.routing_tag === 'hot') hotCount++
    if (row.status && convertedStatuses.has(row.status)) convertedCount++
  }

  return {
    total: rows.length,
    today,
    thisWeek,
    bySource,
    byService,
    byTier,
    byStatus,
    hotCount,
    convertedCount,
    capacityPerDay,
  }
}
