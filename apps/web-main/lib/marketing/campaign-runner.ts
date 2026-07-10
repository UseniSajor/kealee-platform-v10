/**
 * Weekly product campaigns — generate + send via Resend (no GHL).
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import {
  CAMPAIGN_TYPES,
  CAMPAIGN_MESSAGE_TEMPLATES,
  KEALEE_PRODUCTS,
  MARKETING_PERSONAS,
  WEEKLY_CAMPAIGN_ROTATION,
} from '@/lib/marketing/marketing-engine'
import { buildUTMUrl } from '@/lib/marketing/utm'
import { sendMarketingEmail } from '@/lib/marketing/resend'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kealee.com'

export interface CampaignRecord {
  id: string
  week_number: number
  product_id: string
  secondary_product: string
  campaign_type: string
  persona_id: string
  theme: string
  scheduled_day: string
  channels: string[]
  status: string
  email_subject?: string
  email_body?: string
  message_template?: string
  created_at: string
}

const PRODUCT_FUNNEL: Record<string, { path: string; service?: string }> = {
  conceptEngine: { path: '/concept', service: 'exterior_concept' },
  estimationTool: { path: '/estimate/intake' },
  permitsService: { path: '/permits' },
  preDesign: { path: '/concept', service: 'whole_home_concept' },
  drawings: { path: '/concept' },
  marketplace: { path: '/marketplace' },
  commandCenter: { path: '/' },
  ddts: { path: '/' },
}

export function getWeekNumber(date = new Date()): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

export function getWeekCampaignKey(weekNum: number): keyof typeof WEEKLY_CAMPAIGN_ROTATION {
  const keys = Object.keys(WEEKLY_CAMPAIGN_ROTATION) as (keyof typeof WEEKLY_CAMPAIGN_ROTATION)[]
  return keys[(weekNum - 1) % keys.length] ?? 'week1'
}

function campaignCtaUrl(productId: string, campaignId: string): string {
  const funnel = PRODUCT_FUNNEL[productId] ?? { path: '/concept' }
  const base = `${SITE_URL}${funnel.path}`
  const params = new URLSearchParams()
  if (funnel.service) params.set('service', funnel.service)
  return buildUTMUrl(base, {
    source: 'email',
    medium: 'campaign',
    campaign: campaignId,
    content: productId,
  })
}

function htmlBody(text: string, ctaUrl: string, ctaLabel: string): string {
  const escaped = text
    .trim()
    .split('\n')
    .map(line => `<p style="color:#4A5568;line-height:1.6;margin:0 0 12px">${line}</p>`)
    .join('')
  return `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
  ${escaped}
  <div style="margin:28px 0;text-align:center">
    <a href="${ctaUrl}" style="display:inline-block;background:#2ABFBF;color:#fff;text-decoration:none;font-weight:700;padding:14px 28px;border-radius:12px">${ctaLabel}</a>
  </div>
  <p style="color:#A0AEC0;font-size:12px"><a href="${SITE_URL}/api/marketing/unsubscribe" style="color:#A0AEC0">Unsubscribe</a></p>
</div>`
}

export async function generateWeeklyCampaigns(
  supabase: SupabaseClient,
  options?: { weekNumber?: number; force?: boolean },
): Promise<{ created: number; skipped: boolean; weekNumber: number; product: string }> {
  const weekNum = options?.weekNumber ?? getWeekNumber()
  const weekKey = getWeekCampaignKey(weekNum)
  const weekCampaign = WEEKLY_CAMPAIGN_ROTATION[weekKey]

  if (!options?.force) {
    const { count } = await supabase
      .from('marketing_email_campaigns')
      .select('id', { count: 'exact', head: true })
      .eq('week_number', weekNum)
    if ((count ?? 0) > 0) {
      return { created: 0, skipped: true, weekNumber: weekNum, product: weekCampaign.primary }
    }
  }

  const campaigns: CampaignRecord[] = []

  for (const [templateKey, day] of Object.entries(CAMPAIGN_TYPES)) {
    const product = KEALEE_PRODUCTS[weekCampaign.primary as keyof typeof KEALEE_PRODUCTS]
    const persona = MARKETING_PERSONAS[weekCampaign.persona as keyof typeof MARKETING_PERSONAS]
    if (!product || !persona) continue

    const id = `${weekCampaign.primary}-w${weekNum}-${templateKey}`
    const templates =
      CAMPAIGN_MESSAGE_TEMPLATES[weekCampaign.primary as keyof typeof CAMPAIGN_MESSAGE_TEMPLATES]
    const msg = templates?.[templateKey as keyof typeof templates]

    const record: CampaignRecord = {
      id,
      week_number: weekNum,
      product_id: weekCampaign.primary,
      secondary_product: weekCampaign.secondary,
      campaign_type: templateKey,
      persona_id: weekCampaign.persona,
      theme: weekCampaign.theme,
      scheduled_day: day.day,
      channels: [...day.channels],
      status: 'scheduled',
      created_at: new Date().toISOString(),
      email_subject: msg?.subject ?? `${product.name} — ${day.name}`,
      email_body: msg?.body ?? weekCampaign.theme,
      message_template: day.name,
    }
    campaigns.push(record)
  }

  if (campaigns.length === 0) {
    return { created: 0, skipped: false, weekNumber: weekNum, product: weekCampaign.primary }
  }

  const { error } = await supabase.from('marketing_email_campaigns').upsert(campaigns, { onConflict: 'id' })
  if (error) throw new Error(error.message)

  return {
    created: campaigns.length,
    skipped: false,
    weekNumber: weekNum,
    product: weekCampaign.primary,
  }
}

export async function sendTodaysCampaigns(
  supabase: SupabaseClient,
  options?: { limitPerCampaign?: number; dryRun?: boolean },
): Promise<{
  day: string
  campaigns: number
  emailsSent: number
  errors: number
  details: { campaignId: string; recipients: number; sent: number }[]
}> {
  const limit = options?.limitPerCampaign ?? 50
  const dayName = new Date().toLocaleString('en-US', { weekday: 'long' })
  const details: { campaignId: string; recipients: number; sent: number }[] = []
  let emailsSent = 0
  let errors = 0

  const { data: campaigns, error: fetchErr } = await supabase
    .from('marketing_email_campaigns')
    .select('*')
    .eq('scheduled_day', dayName)
    .eq('status', 'scheduled')

  if (fetchErr) throw new Error(fetchErr.message)

  if (!campaigns?.length) {
    return { day: dayName, campaigns: 0, emailsSent: 0, errors: 0, details: [] }
  }

  for (const campaign of campaigns) {
    const { data: leads, error: leadsErr } = await supabase
      .from('public_intake_leads')
      .select('id, contact_email, client_name, project_path, status, routing_tag, persona_type')
      .eq('status', 'new')
      .is('campaign_id', null)
      .not('contact_email', 'is', null)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (leadsErr) {
      errors++
      continue
    }

    const ctaUrl = campaignCtaUrl(campaign.product_id, campaign.id)
    const subject = campaign.email_subject ?? 'Kealee — your project on track'
    const bodyText = (campaign.email_body as string) ?? campaign.theme ?? ''
    const html = htmlBody(bodyText, ctaUrl, 'Start on Kealee →')

    let sent = 0
    for (const lead of leads ?? []) {
      const email = lead.contact_email as string
      if (!email) continue

      if (!options?.dryRun) {
        const ok = await sendMarketingEmail({ to: email, subject, html })
        if (!ok) {
          errors++
          continue
        }
        await supabase
          .from('public_intake_leads')
          .update({
            campaign_id: campaign.id,
            campaign_sent_at: new Date().toISOString(),
            persona_type: lead.persona_type ?? campaign.persona_id,
          })
          .eq('id', lead.id)
      }
      sent++
      emailsSent++
    }

    if (!options?.dryRun && sent > 0) {
      await supabase
        .from('marketing_email_campaigns')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          recipients_count: sent,
        })
        .eq('id', campaign.id)
    }

    details.push({ campaignId: campaign.id, recipients: leads?.length ?? 0, sent })
  }

  return {
    day: dayName,
    campaigns: campaigns.length,
    emailsSent,
    errors,
    details,
  }
}

export async function startMarketingCampaign(
  supabase: SupabaseClient,
  options?: { generate?: boolean; send?: boolean; dryRun?: boolean },
): Promise<Record<string, unknown>> {
  const generate = options?.generate !== false
  const send = options?.send !== false

  const result: Record<string, unknown> = { startedAt: new Date().toISOString() }

  if (generate) {
    result.generate = await generateWeeklyCampaigns(supabase)
  }

  if (send) {
    result.send = await sendTodaysCampaigns(supabase, { dryRun: options?.dryRun })
  }

  return result
}
