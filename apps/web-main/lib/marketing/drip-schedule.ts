import { getSupabaseAdmin } from '@/lib/supabase-server'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kealee.com'

/** Aligned with marketing/plan.config.ts DRIP_SEQUENCE */
const PRE_PAYMENT_DRIP = [
  { step: 1, delayDays: 1 },
  { step: 2, delayDays: 3 },
  { step: 3, delayDays: 7 },
] as const

const PERMIT_DRAWINGS_UPSELL_DELAY_DAYS = 14

export function buildConceptFunnelUrl(projectInterest?: string, leadId?: string): string {
  const params = new URLSearchParams()
  if (projectInterest) params.set('service', projectInterest)
  if (leadId) params.set('lead', leadId)
  return `${SITE_URL}/concept?${params}`
}

export function buildPermitDrawingsFunnelUrl(leadId: string, projectPath?: string): string {
  const params = new URLSearchParams({ lead: leadId })
  if (projectPath) params.set('service', projectPath)
  return `${SITE_URL}/intake/professional_drawings?${params}`
}

/** @deprecated Standalone estimate upsell removed — estimate bundled with design/permit packages */
export function buildEstimateFunnelUrl(leadId: string): string {
  return buildPermitDrawingsFunnelUrl(leadId)
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

/** After concept_ready: permit-ready professional drawings upsell (estimate already included). */
export async function schedulePermitDrawingsUpsellDrip(opts: {
  leadId: string
  email: string
  name?: string | null
  serviceLabel: string
  projectPath?: string
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
    Date.now() + PERMIT_DRAWINGS_UPSELL_DELAY_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString()

  const { error } = await supabase.from('marketing_drip_queue').insert({
    lead_id: opts.leadId,
    email: opts.email,
    name: opts.name ?? null,
    service_label: opts.serviceLabel,
    funnel_url: buildPermitDrawingsFunnelUrl(opts.leadId, opts.projectPath),
    sequence_step: 4,
    send_at: sendAt,
    status: 'pending',
  })

  if (error) {
    console.warn('[drip-schedule] permit drawings upsell insert failed:', error.message)
    return false
  }
  return true
}

/** @deprecated Use schedulePermitDrawingsUpsellDrip */
export const scheduleEstimateUpsellDrip = schedulePermitDrawingsUpsellDrip
