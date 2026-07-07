/**
 * GET /api/command-center/marketing — funnel stats for Command Center (all sources).
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { computeFunnelStats, type IntakeLeadRow } from '@/lib/marketing/funnel-stats'
import { requireCommandCenterApi } from '@/lib/command-center-api-auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const LEAD_SELECT =
  'id, contact_email, client_name, project_path, status, source, created_at, form_data, metadata, budget_range, project_address, paid_at, payment_amount'

export async function GET(req: NextRequest) {
  const denied = await requireCommandCenterApi(req)
  if (denied) return denied

  try {
    const supabase = getSupabaseAdmin()

    const { data: leads, error } = await supabase
      .from('public_intake_leads')
      .select(LEAD_SELECT)
      .order('created_at', { ascending: false })
      .limit(500)

    if (error) throw error

    const all = (leads ?? []) as IntakeLeadRow[]

    let sequencesPending = 0
    try {
      const { count } = await supabase
        .from('marketing_drip_queue')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending')
      sequencesPending = count ?? 0
    } catch {
      sequencesPending = 0
    }

    const stats = computeFunnelStats(all, sequencesPending)

    const marketingBotLeads = all.filter(l => l.source === 'marketing_bot')

    return NextResponse.json({
      live: true,
      leads: all,
      marketingBotLeads,
      stats,
      generatedAt: new Date().toISOString(),
    })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json(
      { live: false, error: message, leads: [], stats: null },
      { status: 500 },
    )
  }
}
