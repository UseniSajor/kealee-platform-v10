import { getSupabaseAdmin } from '@/lib/supabase-server'
import { computeLeadSummary, sanitizeMarketingExport } from '@kealee/marketing-privacy'

export async function fetchLeadSummary() {
  const supabase = getSupabaseAdmin()
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 30)

  const { data: rows, error } = await supabase
    .from('public_intake_leads')
    .select('project_path, status, source_channel, routing_tag, lead_tier, created_at')
    .gte('created_at', weekAgo.toISOString())

  if (error) throw new Error(error.message)

  const { data: config } = await supabase
    .from('marketing_workspace_config')
    .select('value')
    .eq('key', 'default')
    .maybeSingle()

  const capacity =
    (config?.value as { leadCapacityPerDay?: number } | undefined)?.leadCapacityPerDay ?? 50

  return sanitizeMarketingExport(computeLeadSummary(rows ?? [], capacity))
}

export async function fetchAnalyticsSummary() {
  const supabase = getSupabaseAdmin()
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const { data: spendRows } = await supabase
    .from('marketing_channel_spend')
    .select('provider, spend_cents')
    .gte('spend_date', monthStart.toISOString().slice(0, 10))

  const spendByProvider: Record<string, number> = {}
  for (const row of spendRows ?? []) {
    const p = row.provider ?? 'unknown'
    spendByProvider[p] = (spendByProvider[p] ?? 0) + (row.spend_cents ?? 0)
  }

  const { count: campaignsActive } = await supabase
    .from('marketing_campaigns')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')

  const leadSummary = await fetchLeadSummary()

  return sanitizeMarketingExport({
    period: 'month_to_date',
    spendByProviderCents: spendByProvider,
    activeCampaigns: campaignsActive ?? 0,
    leads: leadSummary,
  })
}

export async function fetchCampaignsList() {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('marketing_campaigns')
    .select('id, week_number, product_id, persona_id, campaign_type, channels, status, leads_generated')
    .order('week_number', { ascending: false })
    .limit(20)

  if (error) throw new Error(error.message)
  return sanitizeMarketingExport(data ?? [])
}
