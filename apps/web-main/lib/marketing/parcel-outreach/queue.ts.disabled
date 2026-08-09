/**
 * Parcel outreach queue — email, SMS (when phone known), direct mail (when only mailing address).
 */

import { getSupabaseAdmin } from '@/lib/supabase-server'
import { sendMarketingEmail } from '@/lib/marketing/resend'
import { launchDayForProperty } from '@/lib/marketing/five-day-launch-sequence'
import type { PropertyRoutingContext } from '@kealee/intelligence'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kealee.com'

export interface ParcelOutreachTarget {
  id: string
  address: string
  outreach_token: string
  owner_email?: string | null
  owner_phone?: string | null
  owner_name?: string | null
  owner_mailing_address?: string | null
  zoning_code?: string | null
  lot_size_sqft?: number | null
  year_built?: number | null
  property_type?: string | null
  enrichment_status?: string
  recommended_product?: string | null
}

function outreachLandingUrl(token: string): string {
  return `${SITE_URL}/outreach/p/${token}`
}

function propertyContextFromTarget(t: ParcelOutreachTarget): PropertyRoutingContext {
  return {
    lotSize: t.lot_size_sqft ?? undefined,
    yearBuilt: t.year_built ?? undefined,
    propertyType: t.property_type ?? undefined,
    zoning: t.zoning_code ? { code: t.zoning_code } : undefined,
  }
}

export async function queueOutreachForTarget(targetId: string): Promise<{ queued: number }> {
  const supabase = getSupabaseAdmin()
  const { data: target, error } = await supabase
    .from('parcel_outreach_targets')
    .select('*')
    .eq('id', targetId)
    .single()

  if (error || !target) throw new Error('Target not found')

  const t = target as ParcelOutreachTarget
  const step = launchDayForProperty(propertyContextFromTarget(t))
  const landing = outreachLandingUrl(t.outreach_token)
  const now = Date.now()
  const rows: Array<Record<string, unknown>> = []

  if (t.owner_email && t.enrichment_status !== 'mailing_only') {
    rows.push({
      target_id: targetId,
      channel: 'email',
      sequence_step: 1,
      payload: {
        subject: step?.subject ?? `Property feasibility for ${t.address}`,
        body: (step?.body ?? '').replace(/\{\{address\}\}/g, t.address).replace(/\{\{cta_short_link\}\}/g, landing),
        landingUrl: landing,
        recommendedProduct: step?.recommendedProduct ?? t.recommended_product,
      },
      scheduled_at: new Date(now).toISOString(),
      status: 'pending',
    })
  }

  if (t.owner_phone) {
    rows.push({
      target_id: targetId,
      channel: 'sms',
      sequence_step: 1,
      payload: {
        message: `Kealee: We reviewed ${t.address.split(',')[0]} for renovation/ADU feasibility. Details: ${landing} Reply STOP to opt out.`,
      },
      scheduled_at: new Date(now + 3600_000).toISOString(),
      status: 'pending',
    })
  }

  if (
    t.enrichment_status === 'mailing_only' ||
    (!t.owner_email && (t.owner_mailing_address || t.owner_name))
  ) {
    rows.push({
      target_id: targetId,
      channel: 'direct_mail',
      sequence_step: 1,
      payload: {
        mailingAddress: t.owner_mailing_address ?? t.address,
        ownerName: t.owner_name,
        qrUrl: landing,
        headline: step?.title ?? 'Property feasibility review',
      },
      scheduled_at: new Date(now).toISOString(),
      status: 'pending',
    })
  }

  if (!rows.length) return { queued: 0 }

  const { error: insertErr } = await supabase.from('parcel_outreach_queue').insert(rows)
  if (insertErr) throw new Error(insertErr.message)

  return { queued: rows.length }
}

export async function processOutreachQueue(limit = 30): Promise<{
  processed: number
  emailed: number
  directMail: number
  errors: number
}> {
  const supabase = getSupabaseAdmin()
  const { data: rows } = await supabase
    .from('parcel_outreach_queue')
    .select('*, parcel_outreach_targets(*)')
    .eq('status', 'pending')
    .lte('scheduled_at', new Date().toISOString())
    .limit(limit)

  let emailed = 0
  let directMail = 0
  let errors = 0

  for (const row of rows ?? []) {
    try {
      const target = row.parcel_outreach_targets as ParcelOutreachTarget
      const payload = row.payload as Record<string, string>

      if (row.channel === 'email' && target.owner_email) {
        const html = `<div style="font-family:sans-serif;max-width:560px;padding:24px">
          <p style="line-height:1.6;color:#4A5568">${(payload.body ?? '').replace(/\n/g, '<br/>')}</p>
          <p style="margin:24px 0"><a href="${payload.landingUrl}" style="background:#1A2B4A;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none">Review your property →</a></p>
        </div>`
        const ok = await sendMarketingEmail({
          to: target.owner_email,
          subject: payload.subject ?? 'Kealee property review',
          html,
        })
        if (!ok) throw new Error('Resend failed')
        emailed++
      } else if (row.channel === 'direct_mail') {
        directMail++
      } else if (row.channel === 'sms' && target.owner_phone) {
        const { sendSMS } = await import('@/lib/marketing/twilio-client')
        await sendSMS({ to: target.owner_phone, message: payload.message ?? '' })
      }

      await supabase
        .from('parcel_outreach_queue')
        .update({ status: 'processed', sent_at: new Date().toISOString() })
        .eq('id', row.id)
    } catch (e) {
      errors++
      await supabase
        .from('parcel_outreach_queue')
        .update({
          status: 'failed',
          error_message: e instanceof Error ? e.message : String(e),
        })
        .eq('id', row.id)
    }
  }

  return { processed: rows?.length ?? 0, emailed, directMail, errors }
}

export async function exportDirectMailPending(): Promise<
  Array<{ ownerName: string; mailingAddress: string; qrUrl: string; headline: string }>
> {
  const supabase = getSupabaseAdmin()
  const { data } = await supabase
    .from('parcel_outreach_queue')
    .select('payload, parcel_outreach_targets(owner_name, address)')
    .eq('channel', 'direct_mail')
    .eq('status', 'pending')

  return (data ?? []).map((r) => {
    const p = r.payload as Record<string, string>
    return {
      ownerName: p.ownerName ?? '',
      mailingAddress: p.mailingAddress ?? '',
      qrUrl: p.qrUrl ?? '',
      headline: p.headline ?? '',
    }
  })
}
