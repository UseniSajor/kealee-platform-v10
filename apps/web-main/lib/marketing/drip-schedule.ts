import { getSupabaseAdmin } from '@/lib/supabase-server'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kealee.com'

/** Aligned with marketing/plan.config.ts DRIP_SEQUENCE */
const PRE_PAYMENT_DRIP = [
  { step: 1, delayDays: 1 },
  { step: 2, delayDays: 3 },
  { step: 3, delayDays: 7 },
] as const

const ESTIMATE_UPSELL_DELAY_DAYS = 14

export function buildConceptFunnelUrl(projectInterest?: string, leadId?: string): string {
  const params = new URLSearchParams()
  if (projectInterest) params.set('service', projectInterest)
  if (leadId) params.set('lead', leadId)
  return `${SITE_URL}/concept?${params}`
}

export function buildEstimateFunnelUrl(leadId: string): string {
  return `${SITE_URL}/estimate/intake?lead=${encodeURIComponent(leadId)}`
}

export async function schedulePrePaymentDrip(opts: {
  leadId: string
  email: string
  name?: string | null
  serviceLabel: string
  funnelUrl: string
}): Promise<void> {
  const supabase = getSupabaseAdmin()
  const now = Date.now()

  const rows = PRE_PAYMENT_DRIP.map(s => ({
    lead_id: opts.leadId,
    email: opts.email,
    name: opts.name ?? null,
    service_label: opts.serviceLabel,
    funnel_url: opts.funnelUrl,
    sequence_step: s.step,
    send_at: new Date(now + s.delayDays * 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
  }))

  const { error } = await supabase.from('marketing_drip_queue').insert(rows)
  if (error) throw new Error(error.message)
}

export async function scheduleEstimateUpsellDrip(opts: {
  leadId: string
  email: string
  name?: string | null
  serviceLabel: string
}): Promise<boolean> {
  const supabase = getSupabaseAdmin()

  const { data: existing } = await supabase
    .from('marketing_drip_queue')
    .select('id')
    .eq('lead_id', opts.leadId)
    .eq('sequence_step', 4)
    .limit(1)

  if (existing && existing.length > 0) return false

  const sendAt = new Date(
    Date.now() + ESTIMATE_UPSELL_DELAY_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString()

  const { error } = await supabase.from('marketing_drip_queue').insert({
    lead_id: opts.leadId,
    email: opts.email,
    name: opts.name ?? null,
    service_label: opts.serviceLabel,
    funnel_url: buildEstimateFunnelUrl(opts.leadId),
    sequence_step: 4,
    send_at: sendAt,
    status: 'pending',
  })

  if (error) {
    console.warn('[drip-schedule] estimate upsell insert failed:', error.message)
    return false
  }
  return true
}
