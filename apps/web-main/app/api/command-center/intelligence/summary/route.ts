import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export interface CommandCenterIntelligenceSummary {
  scoredIntakes: number
  autoAssigned: number
  awaitingReview: number
  byPriority: Record<string, number>
  bySegment: Record<string, number>
  recent: Array<{
    id: string
    client_name: string
    project_address: string
    intelligence_priority: string | null
    intelligence_segment: string | null
    lead_score: number | null
    topProduct: string | null
    campaign: string | null
    landingPage: string | null
    offer: string | null
    created_at: string
  }>
}

function metaField(
  metadata: unknown,
  key: string,
): string | null {
  if (!metadata || typeof metadata !== 'object') return null
  const m = metadata as Record<string, unknown>
  const assignment = m.productAssignment as Record<string, unknown> | undefined
  if (key === 'topProduct') return String(m.topProduct ?? assignment?.assignedProduct ?? '') || null
  if (key === 'campaign') return String(assignment?.campaign ?? m.campaign ?? '') || null
  if (key === 'landingPage') return String(assignment?.landingPage ?? m.landingPage ?? '') || null
  if (key === 'offer') return String(assignment?.offer ?? m.offer ?? '') || null
  return null
}

/** GET /api/command-center/intelligence/summary — intake intelligence rollup for Command Center */
export async function GET(_req: NextRequest) {
  const supabase = getSupabaseAdmin()
  const limit = 50

  const { data: rows, error } = await supabase
    .from('public_intake_leads')
    .select(
      'id, client_name, project_address, intelligence_priority, intelligence_segment, intelligence_metadata, lead_score, created_at',
    )
    .not('intelligence_priority', 'is', null)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const byPriority: Record<string, number> = {}
  const bySegment: Record<string, number> = {}
  let autoAssigned = 0
  let awaitingReview = 0

  for (const row of rows ?? []) {
    const p = row.intelligence_priority ?? 'unknown'
    byPriority[p] = (byPriority[p] ?? 0) + 1
    const s = row.intelligence_segment ?? 'unknown'
    bySegment[s] = (bySegment[s] ?? 0) + 1
    const meta = row.intelligence_metadata as Record<string, unknown> | null
    if (meta?.routed === true || meta?.autoAssigned === true) autoAssigned++
    if (meta?.humanReviewRequired === true) awaitingReview++
  }

  const { count: scoredCount } = await supabase
    .from('public_intake_leads')
    .select('id', { count: 'exact', head: true })
    .not('intelligence_priority', 'is', null)

  const summary: CommandCenterIntelligenceSummary = {
    scoredIntakes: scoredCount ?? rows?.length ?? 0,
    autoAssigned,
    awaitingReview,
    byPriority,
    bySegment,
    recent: (rows ?? []).map((row) => ({
      id: row.id,
      client_name: row.client_name,
      project_address: row.project_address,
      intelligence_priority: row.intelligence_priority,
      intelligence_segment: row.intelligence_segment,
      lead_score: row.lead_score,
      topProduct: metaField(row.intelligence_metadata, 'topProduct'),
      campaign: metaField(row.intelligence_metadata, 'campaign'),
      landingPage: metaField(row.intelligence_metadata, 'landingPage'),
      offer: metaField(row.intelligence_metadata, 'offer'),
      created_at: row.created_at,
    })),
  }

  return NextResponse.json(summary)
}
