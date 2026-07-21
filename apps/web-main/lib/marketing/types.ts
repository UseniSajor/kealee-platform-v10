/** Funnel stage stored in public_intake_leads.metadata / form_data */
export type FunnelStage =
  | 'lead'
  | 'mql'
  | 'paid_concept'
  | 'concept_ready'
  | 'estimate_interest'
  | 'permit_interest'
  | 'portal_user'
  | 'bundle_interest'
  | 'bundle_purchased'

/** organic | paid_ads | marketing_saas — set at capture from UTM/source */
export type MarketingChannelBucket = 'organic' | 'paid_ads' | 'marketing_saas' | 'unknown'

export interface MarketingLeadMetadata {
  funnelStage?: FunnelStage
  marketingChannel?: MarketingChannelBucket
  tags?: string[]
  marketingSource?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
  capturedAt?: string
  estimateUpsellDripScheduledAt?: string
  [key: string]: unknown
}

export function mergeMarketingMetadata(
  existing: Record<string, unknown> | null | undefined,
  patch: MarketingLeadMetadata,
): MarketingLeadMetadata {
  const base = (existing ?? {}) as MarketingLeadMetadata
  const tags = new Set([...(base.tags ?? []), ...(patch.tags ?? [])])
  return {
    ...base,
    ...patch,
    tags: tags.size ? [...tags] : base.tags,
  }
}
