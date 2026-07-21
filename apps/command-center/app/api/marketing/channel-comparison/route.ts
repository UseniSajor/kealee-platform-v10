import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { computeChannelComparison } from '@/lib/marketing/channel-attribution'
import {
  filterLeadsByDateRange,
  loadPeriodSpend,
  parseDateRange,
  toChannelSpendMap,
  toDateOnly,
} from '@/lib/marketing/ad-spend'
import type { IntakeLeadRow } from '@/lib/marketing/funnel-stats'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const LEAD_SELECT =
  'source, status, project_path, payment_amount, form_data, metadata, created_at'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const range = parseDateRange(searchParams.get('from'), searchParams.get('to'))

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('public_intake_leads')
      .select(LEAD_SELECT)
      .gte('created_at', range.from.toISOString())
      .lte('created_at', range.to.toISOString())
      .order('created_at', { ascending: false })
      .limit(2000)

    if (error) throw error

    const leads = filterLeadsByDateRange((data ?? []) as IntakeLeadRow[], range)
    const periodSpend = await loadPeriodSpend(supabase, range)
    const hasActualSpend = periodSpend.paid_ads > 0 || periodSpend.marketing_saas > 0

    const report = computeChannelComparison(leads, {
      periodSpendCents: toChannelSpendMap(periodSpend),
      costSource: hasActualSpend ? 'actual' : 'estimated',
      dateRange: { from: toDateOnly(range.from), to: toDateOnly(range.to) },
    })

    return NextResponse.json({ ok: true, periodSpend, ...report })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
