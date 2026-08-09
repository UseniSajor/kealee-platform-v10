/**
 * Classify leads into organic vs paid ads vs marketing SaaS (GHL/Klaviyo, etc.)
 * Keep logic aligned with apps/web-main/lib/marketing/channel-attribution.ts
 */

export interface UTMParamsLite {
  source?: string
  medium?: string
  campaign?: string
}

export const MARKETING_CHANNEL_BUCKETS = [
  'organic',
  'paid_ads',
  'marketing_saas',
  'unknown',
] as const

export type MarketingChannelBucket = (typeof MARKETING_CHANNEL_BUCKETS)[number]

export const CHANNEL_LABELS: Record<MarketingChannelBucket, string> = {
  organic: 'Organic (in-repo)',
  paid_ads: 'Paid ads',
  marketing_saas: 'Marketing SaaS',
  unknown: 'Unattributed',
}

export const DEFAULT_COST_PER_SALE_CENTS: Record<MarketingChannelBucket, number> = {
  organic: 0,
  paid_ads: 12_000,
  marketing_saas: 3_500,
  unknown: 0,
}

const PAID_UTM_MEDIUMS = new Set([
  'cpc',
  'paid',
  'paid_social',
  'ppc',
  'display',
  'video',
  'paid_search',
])

const SAAS_SOURCE_MARKERS = [
  'ghl',
  'gohighlevel',
  'klaviyo',
  'hubspot',
  'mailchimp',
  'activecampaign',
  'marketo',
  'salesforce_pardot',
]

const PAID_SOURCE_MARKERS = [
  'google_ads',
  'meta_ads',
  'facebook_ads',
  'instagram_ads',
  'linkedin_ads',
  'nextdoor_ads',
  'paid_meta',
  'paid_google',
]

const ORGANIC_SOURCE_MARKERS = [
  'organic',
  'marketing_bot',
  'marketing',
  'reddit',
  'linkedin',
  'instagram',
  'facebook',
  'nextdoor',
  'email',
  'referral',
  'seo',
  'direct',
]

export interface ChannelAttributionInput {
  source?: string | null
  metadata?: Record<string, unknown> | null
  form_data?: Record<string, unknown> | null
}

function norm(s: string | undefined | null): string {
  return (s ?? '').trim().toLowerCase()
}

function resolveUtm(input: ChannelAttributionInput): UTMParamsLite {
  const meta = (input.metadata ?? {}) as Record<string, unknown>
  const fd = (input.form_data ?? {}) as Record<string, unknown>
  return {
    source:
      (meta.utm_source as string) ??
      (fd.utm_source as string) ??
      (fd.utmSource as string) ??
      undefined,
    medium:
      (meta.utm_medium as string) ??
      (fd.utm_medium as string) ??
      (fd.utmMedium as string) ??
      undefined,
    campaign:
      (meta.utm_campaign as string) ??
      (fd.utm_campaign as string) ??
      (fd.utmCampaign as string) ??
      undefined,
  }
}

export function classifyMarketingChannel(input: ChannelAttributionInput): MarketingChannelBucket {
  const utm = resolveUtm(input)
  const meta = (input.metadata ?? {}) as Record<string, unknown>
  const fd = (input.form_data ?? {}) as Record<string, unknown>

  const explicit = norm(meta.marketingChannel as string)
  if (MARKETING_CHANNEL_BUCKETS.includes(explicit as MarketingChannelBucket)) {
    return explicit as MarketingChannelBucket
  }

  const source = norm(input.source ?? (fd.source as string) ?? (meta.marketingSource as string))
  const medium = norm(utm.medium)
  const utmSource = norm(utm.source)
  const tags = [...(meta.tags as string[] | undefined) ?? [], ...(fd.tags as string[] | undefined) ?? []]
    .map(t => norm(t))

  if (tags.some(t => t.includes('ghl') || t.includes('klaviyo') || t.includes('marketing-saas'))) {
    return 'marketing_saas'
  }

  if (
    SAAS_SOURCE_MARKERS.some(m => source.includes(m) || utmSource.includes(m)) ||
    norm(meta.crm as string) === 'ghl'
  ) {
    return 'marketing_saas'
  }

  if (
    PAID_UTM_MEDIUMS.has(medium) ||
    PAID_SOURCE_MARKERS.some(m => source.includes(m) || utmSource.includes(m)) ||
    tags.some(t => t.includes('paid') || t.includes('cpc'))
  ) {
    return 'paid_ads'
  }

  if (
    medium === 'organic' ||
    medium === 'email' ||
    medium === 'sms' ||
    medium === 'referral' ||
    ORGANIC_SOURCE_MARKERS.some(m => source.includes(m) || utmSource.includes(m)) ||
    source === 'public_intake' ||
    source === ''
  ) {
    return 'organic'
  }

  if (medium || utmSource) return 'organic'

  return 'unknown'
}

export interface ChannelBucketMetrics {
  bucket: MarketingChannelBucket
  label: string
  projects: number
  leads: number
  sales: number
  conceptReady: number
  revenueCents: number
  conversionRate: string
  estimatedCostCents: number
  roi: string
  revenueUsd: string
  costUsd: string
}

export interface ChannelComparisonReport {
  buckets: ChannelBucketMetrics[]
  totals: {
    projects: number
    leads: number
    sales: number
    revenueCents: number
    estimatedCostCents: number
    roi: string
  }
  notes: string[]
  generatedAt: string
  costSource?: 'actual' | 'estimated' | 'blended'
  dateRange?: { from: string; to: string }
}

export interface ChannelComparisonOptions {
  costPerSaleCents?: Record<MarketingChannelBucket, number>
  periodSpendCents?: Partial<Record<MarketingChannelBucket, number>>
  costSource?: 'actual' | 'estimated' | 'blended'
  dateRange?: { from: string; to: string }
}

export interface LeadForChannelMetrics {
  source?: string | null
  status: string
  project_path?: string | null
  payment_amount?: number | null
  metadata?: Record<string, unknown> | null
  form_data?: Record<string, unknown> | null
}

const CONVERTED_FOR_REVENUE = new Set(['paid', 'concept_ready', 'processing'])

function pct(n: number, d: number): string {
  if (d <= 0) return '0%'
  return `${Math.round((n / d) * 100)}%`
}

function usd(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

function roiString(revenueCents: number, costCents: number): string {
  if (costCents <= 0) return revenueCents > 0 ? '∞ (no spend)' : '—'
  const roi = ((revenueCents - costCents) / costCents) * 100
  return `${roi >= 0 ? '+' : ''}${Math.round(roi)}%`
}

function resolveBucketCost(
  bucket: MarketingChannelBucket,
  sales: number,
  costPerSaleCents: Record<MarketingChannelBucket, number>,
  periodSpendCents?: Partial<Record<MarketingChannelBucket, number>>,
): { costCents: number; usedActual: boolean } {
  const actual = periodSpendCents?.[bucket]
  if (actual !== undefined && actual > 0) return { costCents: actual, usedActual: true }
  if (bucket === 'organic' || bucket === 'unknown') return { costCents: 0, usedActual: false }
  return { costCents: sales * (costPerSaleCents[bucket] ?? 0), usedActual: false }
}

export function computeChannelComparison(
  leads: LeadForChannelMetrics[],
  options: ChannelComparisonOptions = {},
): ChannelComparisonReport {
  const costPerSaleCents = options.costPerSaleCents ?? DEFAULT_COST_PER_SALE_CENTS
  const periodSpendCents = options.periodSpendCents
  const empty = (): ChannelBucketMetrics => ({
    bucket: 'organic',
    label: '',
    projects: 0,
    leads: 0,
    sales: 0,
    conceptReady: 0,
    revenueCents: 0,
    conversionRate: '0%',
    estimatedCostCents: 0,
    roi: '—',
    revenueUsd: '$0',
    costUsd: '$0',
  })

  const byBucket = new Map<MarketingChannelBucket, ChannelBucketMetrics>()
  for (const b of MARKETING_CHANNEL_BUCKETS) {
    byBucket.set(b, { ...empty(), bucket: b, label: CHANNEL_LABELS[b] })
  }

  const projectPathsByBucket = new Map<MarketingChannelBucket, Set<string>>()

  for (const lead of leads) {
    const bucket = classifyMarketingChannel(lead)
    const row = byBucket.get(bucket)!
    row.leads++

    const pathKey = lead.project_path || 'unknown'
    if (!projectPathsByBucket.has(bucket)) projectPathsByBucket.set(bucket, new Set())
    projectPathsByBucket.get(bucket)!.add(pathKey)

    if (lead.status === 'paid') row.sales++
    if (lead.status === 'concept_ready' || lead.status === 'delivered') row.conceptReady++

    if (CONVERTED_FOR_REVENUE.has(lead.status)) {
      row.revenueCents += lead.payment_amount ?? 0
    }
  }

  let anyActual = false
  let anyEstimated = false

  for (const bucket of MARKETING_CHANNEL_BUCKETS) {
    const row = byBucket.get(bucket)!
    const paths = projectPathsByBucket.get(bucket)
    row.projects = paths?.size ?? 0
    row.conversionRate = pct(row.sales, row.leads)
    const { costCents, usedActual } = resolveBucketCost(
      bucket,
      row.sales,
      costPerSaleCents,
      periodSpendCents,
    )
    row.estimatedCostCents = costCents
    if (usedActual) anyActual = true
    else if (costCents > 0) anyEstimated = true
    row.roi = roiString(row.revenueCents, row.estimatedCostCents)
    row.revenueUsd = usd(row.revenueCents)
    row.costUsd = usd(row.estimatedCostCents)
  }

  const buckets = MARKETING_CHANNEL_BUCKETS.map(b => byBucket.get(b)!)
  const costSource: ChannelComparisonReport['costSource'] =
    options.costSource ??
    (anyActual && anyEstimated ? 'blended' : anyActual ? 'actual' : 'estimated')

  const totals = buckets.reduce(
    (acc, b) => ({
      projects: acc.projects + b.projects,
      leads: acc.leads + b.leads,
      sales: acc.sales + b.sales,
      revenueCents: acc.revenueCents + b.revenueCents,
      estimatedCostCents: acc.estimatedCostCents + b.estimatedCostCents,
      roi: '',
    }),
    { projects: 0, leads: 0, sales: 0, revenueCents: 0, estimatedCostCents: 0, roi: '' },
  )
  totals.roi = roiString(totals.revenueCents, totals.estimatedCostCents)

  const notes = [
    'Organic: in-repo stack (SEO, Resend drip, organic social) — $0 default ad/SaaS spend.',
    'Paid ads: utm_medium cpc | paid_social | display, or paid source tags.',
    'Marketing SaaS: GHL/Klaviyo/etc. when enabled.',
    'Revenue = sum of payment_amount (cents) for paid, concept_ready, and processing intakes.',
    'Projects = distinct project_path values per channel bucket.',
  ]
  if (costSource === 'actual') {
    notes.push('Cost: actual spend from marketing_channel_spend (Meta/Google/SaaS sync).')
  } else if (costSource === 'blended') {
    notes.push('Cost: blended — actual spend where synced, CPA estimate elsewhere.')
  } else {
    notes.push('Cost: estimated CPA × sales (set MARKETING_SPEND_*_CENTS_MONTH or run ad-spend sync).')
  }

  return {
    buckets,
    totals,
    notes,
    generatedAt: new Date().toISOString(),
    costSource,
    dateRange: options.dateRange,
  }
}
