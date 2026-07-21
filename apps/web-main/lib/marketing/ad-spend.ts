/**
 * Marketing spend: Supabase daily rows + env overrides + Meta/Google API sync.
 */

import type { MarketingChannelBucket } from '@/lib/marketing/channel-attribution'

export type SpendProvider = 'google_ads' | 'meta_ads' | 'marketing_saas' | 'manual'

export interface PeriodSpend {
  paid_ads: number
  marketing_saas: number
  organic: number
  byProvider: Record<string, number>
  source: 'database' | 'env' | 'blended'
}

export interface DateRangeFilter {
  from: Date
  to: Date
}

export function parseDateRange(
  fromParam?: string | null,
  toParam?: string | null,
): DateRangeFilter {
  const to = toParam ? new Date(toParam) : new Date()
  const from = fromParam
    ? new Date(fromParam)
    : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000)
  from.setHours(0, 0, 0, 0)
  to.setHours(23, 59, 59, 999)
  return { from, to }
}

export function toDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** Map DB providers → channel buckets (cents). */
export function aggregateSpendRows(
  rows: { provider: string; spend_cents: number }[],
): PeriodSpend {
  let paid_ads = 0
  let marketing_saas = 0
  const byProvider: Record<string, number> = {}

  for (const row of rows) {
    const cents = Number(row.spend_cents) || 0
    byProvider[row.provider] = (byProvider[row.provider] ?? 0) + cents
    if (row.provider === 'google_ads' || row.provider === 'meta_ads') {
      paid_ads += cents
    } else if (row.provider === 'marketing_saas' || row.provider === 'ghl') {
      marketing_saas += cents
    }
  }

  return {
    paid_ads,
    marketing_saas,
    organic: 0,
    byProvider,
    source: 'database',
  }
}

/** Env fallbacks when DB empty (monthly totals prorated to daily in sync). */
export function spendFromEnv(): PeriodSpend {
  const google = Number(process.env.MARKETING_SPEND_GOOGLE_CENTS_MONTH ?? 0)
  const meta = Number(process.env.MARKETING_SPEND_META_CENTS_MONTH ?? 0)
  const saas = Number(process.env.MARKETING_SPEND_SAAS_CENTS_MONTH ?? 0)
  const paid_ads = google + meta
  if (paid_ads === 0 && saas === 0) {
    return { paid_ads: 0, marketing_saas: 0, organic: 0, byProvider: {}, source: 'env' }
  }
  return {
    paid_ads,
    marketing_saas: saas,
    organic: 0,
    byProvider: {
      ...(google ? { google_ads: google } : {}),
      ...(meta ? { meta_ads: meta } : {}),
      ...(saas ? { marketing_saas: saas } : {}),
    },
    source: 'env',
  }
}

export function toChannelSpendMap(
  spend: PeriodSpend,
): Partial<Record<MarketingChannelBucket, number>> {
  return {
    organic: 0,
    paid_ads: spend.paid_ads,
    marketing_saas: spend.marketing_saas,
    unknown: 0,
  }
}

export async function loadPeriodSpend(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  range: DateRangeFilter,
): Promise<PeriodSpend> {
  const { data, error } = await supabase
    .from('marketing_channel_spend')
    .select('provider, spend_cents')
    .gte('spend_date', toDateOnly(range.from))
    .lte('spend_date', toDateOnly(range.to))
    .limit(5000)

  if (error) {
    console.warn('[ad-spend] load failed:', error.message)
    return spendFromEnv()
  }

  const rows = (data ?? []) as { provider: string; spend_cents: number }[]
  if (rows.length === 0) {
    const env = spendFromEnv()
    return env.source === 'env' && env.paid_ads === 0 && env.marketing_saas === 0
      ? { paid_ads: 0, marketing_saas: 0, organic: 0, byProvider: {}, source: 'database' }
      : env
  }

  return aggregateSpendRows(rows)
}

/** Meta Marketing API — account insights spend for date range. */
export async function fetchMetaSpendCents(range: DateRangeFilter): Promise<number> {
  const token =
    process.env.META_ACCESS_TOKEN ??
    process.env.FACEBOOK_ACCESS_TOKEN ??
    process.env.META_ADS_ACCESS_TOKEN
  const accountId = process.env.META_AD_ACCOUNT_ID ?? process.env.FACEBOOK_AD_ACCOUNT_ID
  if (!token || !accountId) return 0

  const actId = accountId.startsWith('act_') ? accountId : `act_${accountId}`
  const timeRange = JSON.stringify({
    since: toDateOnly(range.from),
    until: toDateOnly(range.to),
  })
  const url = new URL(`https://graph.facebook.com/v19.0/${actId}/insights`)
  url.searchParams.set('fields', 'spend')
  url.searchParams.set('time_range', timeRange)
  url.searchParams.set('access_token', token)

  const res = await fetch(url.toString(), { next: { revalidate: 0 } })
  if (!res.ok) {
    console.warn('[ad-spend] Meta insights failed:', res.status, await res.text())
    return 0
  }

  const json = (await res.json()) as { data?: { spend?: string }[] }
  const total = (json.data ?? []).reduce((sum, row) => sum + parseFloat(row.spend ?? '0'), 0)
  return Math.round(total * 100)
}

/** Google Ads — env monthly override until OAuth insights wired. */
export async function fetchGoogleSpendCents(range: DateRangeFilter): Promise<number> {
  const monthly = Number(process.env.MARKETING_SPEND_GOOGLE_CENTS_MONTH ?? 0)
  if (monthly > 0) {
    const days = Math.max(
      1,
      Math.ceil((range.to.getTime() - range.from.getTime()) / (24 * 60 * 60 * 1000)),
    )
    const monthDays = 30
    return Math.round((monthly * days) / monthDays)
  }
  return 0
}

export async function syncAdSpendToDatabase(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  range: DateRangeFilter,
): Promise<{ metaCents: number; googleCents: number; saasCents: number }> {
  const [metaCents, googleCents] = await Promise.all([
    fetchMetaSpendCents(range),
    fetchGoogleSpendCents(range),
  ])
  const saasCents = Number(process.env.MARKETING_SPEND_SAAS_CENTS_MONTH ?? 0)

  const spendDate = toDateOnly(range.to)
  const rows: Record<string, unknown>[] = []

  if (metaCents > 0) {
    rows.push({
      spend_date: spendDate,
      provider: 'meta_ads',
      spend_cents: metaCents,
      metadata: { syncedRange: { from: toDateOnly(range.from), to: toDateOnly(range.to) } },
    })
  }
  if (googleCents > 0) {
    rows.push({
      spend_date: spendDate,
      provider: 'google_ads',
      spend_cents: googleCents,
      metadata: { syncedRange: { from: toDateOnly(range.from), to: toDateOnly(range.to) } },
    })
  }
  if (saasCents > 0) {
    rows.push({
      spend_date: spendDate,
      provider: 'marketing_saas',
      spend_cents: saasCents,
      metadata: { source: 'env_monthly' },
    })
  }

  if (rows.length > 0) {
    const { error } = await supabase.from('marketing_channel_spend').upsert(rows, {
      onConflict: 'spend_date,provider',
    })
    if (error) console.warn('[ad-spend] upsert failed:', error.message)
  }

  return { metaCents, googleCents, saasCents }
}

export function filterLeadsByDateRange<T extends { created_at: string }>(
  leads: T[],
  range: DateRangeFilter,
): T[] {
  const fromMs = range.from.getTime()
  const toMs = range.to.getTime()
  return leads.filter(l => {
    const t = new Date(l.created_at).getTime()
    return t >= fromMs && t <= toMs
  })
}
