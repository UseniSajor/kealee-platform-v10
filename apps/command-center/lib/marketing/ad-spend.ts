/**
 * Marketing spend loader — keep aligned with apps/web-main/lib/marketing/ad-spend.ts
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

  return { paid_ads, marketing_saas, organic: 0, byProvider, source: 'database' }
}

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
    return env.paid_ads === 0 && env.marketing_saas === 0
      ? { paid_ads: 0, marketing_saas: 0, organic: 0, byProvider: {}, source: 'database' }
      : env
  }

  return aggregateSpendRows(rows)
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
