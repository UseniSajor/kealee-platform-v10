import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { computeFunnelStats, type IntakeLeadRow } from '@/lib/marketing/funnel-stats'
import type { ChannelComparisonOptions } from '@/lib/marketing/channel-attribution'
import { MARKETING_CRON_JOBS } from '@/lib/marketing/cron-registry'
import {
  filterLeadsByDateRange,
  loadPeriodSpend,
  parseDateRange,
  toChannelSpendMap,
  toDateOnly,
} from '@/lib/marketing/ad-spend'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const LEAD_SELECT =
  'id, contact_email, client_name, project_path, status, source, created_at, form_data, metadata, budget_range, project_address, paid_at, payment_amount'

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kealee.com'
    const { searchParams } = new URL(req.url)
    const presetAll = searchParams.get('preset') === 'all'
    const range = presetAll
      ? parseDateRange('2024-01-01', searchParams.get('to'))
      : parseDateRange(searchParams.get('from'), searchParams.get('to'))

    let leadQuery = supabase.from('public_intake_leads').select(LEAD_SELECT)
    if (!presetAll) {
      leadQuery = leadQuery
        .gte('created_at', range.from.toISOString())
        .lte('created_at', range.to.toISOString())
    }
    const { data: leads, error } = await leadQuery
      .order('created_at', { ascending: false })
      .limit(presetAll ? 5000 : 2000)

    if (error) throw error

    const all = (leads ?? []) as IntakeLeadRow[]
    const filtered = filterLeadsByDateRange(all, range)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const leadsToday = all.filter(l => new Date(l.created_at) >= today).length
    const paidToday = all.filter(
      l => l.status === 'paid' && l.paid_at && new Date(l.paid_at) >= today,
    ).length

    let sequencesPending = 0
    const dripByStatus: Record<string, number> = {}
    try {
      const { count } = await supabase
        .from('marketing_drip_queue')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending')
      sequencesPending = count ?? 0

      const { data: dripRows } = await supabase
        .from('marketing_drip_queue')
        .select('status')
        .gte('created_at', weekAgo.toISOString())
        .limit(2000)

      for (const row of dripRows ?? []) {
        const s = (row as { status?: string }).status ?? 'unknown'
        dripByStatus[s] = (dripByStatus[s] ?? 0) + 1
      }
    } catch {
      /* table may not exist in all envs */
    }

    const periodSpend = await loadPeriodSpend(supabase, range)
    const hasActualSpend = periodSpend.paid_ads > 0 || periodSpend.marketing_saas > 0

    const stats = computeFunnelStats(filtered, {
      sequencesPending,
      channelComparison: {
        periodSpendCents: toChannelSpendMap(periodSpend),
        costSource: (hasActualSpend ? 'actual' : 'estimated') as ChannelComparisonOptions['costSource'],
        dateRange: { from: toDateOnly(range.from), to: toDateOnly(range.to) },
      },
    })

    const config = {
      siteUrl,
      hasCronSecret: Boolean(process.env.CRON_SECRET),
      hasSupabaseAdmin: Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
      ),
      cardMediaProxy: `${siteUrl}/api/marketing/card-media`,
    }

    return NextResponse.json({
      live: true,
      generatedAt: new Date().toISOString(),
      dateRange: { from: toDateOnly(range.from), to: toDateOnly(range.to) },
      periodSpend,
      stats,
      leadsToday,
      paidToday,
      dripByStatus,
      crons: MARKETING_CRON_JOBS.map(c => ({
        ...c,
        triggerUrl: `${siteUrl.replace(/\/$/, '')}${c.path}`,
      })),
      config,
      quickLinks: [
        { label: 'Brand strategy', href: '/marketing/strategy' },
        { label: 'Public site', href: siteUrl, external: true },
        { label: 'Card media manifest', href: `${siteUrl}/api/marketing/card-media`, external: true },
      ],
    })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ live: false, error: message }, { status: 500 })
  }
}
