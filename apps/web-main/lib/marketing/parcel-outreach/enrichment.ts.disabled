/**
 * Parcel owner contact enrichment strategies.
 *
 * Without email/phone, outreach uses direct mail + unique QR landing page.
 * With enrichment APIs configured, attempts skip-trace and assessor lookup.
 */

import { getSupabaseAdmin } from '@/lib/supabase-server'
import { lookupLocalAssessor } from '@/lib/marketing/parcel-outreach/local-assessor'

export interface ParcelTargetRow {
  id: string
  address: string
  city?: string | null
  county?: string | null
  state?: string | null
  zip_code?: string | null
  owner_name?: string | null
  owner_mailing_address?: string | null
  owner_email?: string | null
  owner_phone?: string | null
  enrichment_status?: string
  enrichment_attempts?: number
}

export interface EnrichmentResult {
  email?: string
  phone?: string
  ownerName?: string
  mailingAddress?: string
  source: string
  status: 'email_found' | 'phone_found' | 'mailing_only' | 'no_contact'
}

/** Match existing Kealee intake leads by normalized address */
export async function enrichFromIntakeMatch(target: ParcelTargetRow): Promise<EnrichmentResult | null> {
  const supabase = getSupabaseAdmin()
  const street = target.address.split(',')[0]?.trim().toLowerCase()
  if (!street || street.length < 5) return null

  const { data: leads } = await supabase
    .from('public_intake_leads')
    .select('contact_email, contact_phone, client_name, project_address')
    .ilike('project_address', `%${street}%`)
    .not('contact_email', 'is', null)
    .order('created_at', { ascending: false })
    .limit(3)

  const match = leads?.find((l) => l.contact_email)
  if (!match?.contact_email) return null

  return {
    email: match.contact_email,
    phone: match.contact_phone ?? undefined,
    ownerName: match.client_name ?? undefined,
    source: 'intake_address_match',
    status: match.contact_phone ? 'phone_found' : 'email_found',
  }
}

/** Local DMV seed assessor — enabled when PARCEL_USE_LOCAL_ASSESSOR=true (default if no API URL) */
export async function enrichFromLocalAssessor(target: ParcelTargetRow): Promise<EnrichmentResult | null> {
  const useLocal =
    process.env.PARCEL_USE_LOCAL_ASSESSOR === 'true' ||
    (!process.env.PARCEL_ASSESSOR_API_URL && process.env.PARCEL_USE_LOCAL_ASSESSOR !== 'false')
  if (!useLocal) return null

  const match = lookupLocalAssessor(target.address)
  if (!match) return null

  return {
    ownerName: target.owner_name ?? 'Property Owner',
    mailingAddress: target.owner_mailing_address ?? match.address,
    source: 'local_dmv_zoning_seed',
    status: 'mailing_only',
  }
}

/** County assessor / GIS API — set PARCEL_ASSESSOR_API_URL */
export async function enrichFromAssessorApi(target: ParcelTargetRow): Promise<EnrichmentResult | null> {
  const base = process.env.PARCEL_ASSESSOR_API_URL
  if (!base) return null

  try {
    const q = new URLSearchParams({
      address: target.address,
      city: target.city ?? '',
      state: target.state ?? 'VA',
    })
    const res = await fetch(`${base}?${q}`, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null
    const data = (await res.json()) as {
      ownerName?: string
      mailingAddress?: string
      email?: string
      phone?: string
    }
    if (!data.ownerName && !data.mailingAddress && !data.email) return null

    return {
      ownerName: data.ownerName,
      mailingAddress: data.mailingAddress,
      email: data.email,
      phone: data.phone,
      source: 'assessor_api',
      status: data.email ? 'email_found' : data.phone ? 'phone_found' : 'mailing_only',
    }
  } catch {
    return null
  }
}

/** Skip-trace API — set SKIP_TRACE_API_URL + SKIP_TRACE_API_KEY */
export async function enrichFromSkipTrace(target: ParcelTargetRow): Promise<EnrichmentResult | null> {
  const url = process.env.SKIP_TRACE_API_URL
  const key = process.env.SKIP_TRACE_API_KEY
  if (!url || !key) return null

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: target.address,
        ownerName: target.owner_name,
        mailingAddress: target.owner_mailing_address,
        city: target.city,
        state: target.state,
        zip: target.zip_code,
      }),
      signal: AbortSignal.timeout(12000),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { emails?: string[]; phones?: string[]; ownerName?: string }
    const email = data.emails?.[0]
    const phone = data.phones?.[0]
    if (!email && !phone) return null

    return {
      email,
      phone,
      ownerName: data.ownerName ?? target.owner_name ?? undefined,
      source: 'skip_trace_api',
      status: email ? 'email_found' : 'phone_found',
    }
  } catch {
    return null
  }
}

export async function enrichParcelTarget(target: ParcelTargetRow): Promise<EnrichmentResult> {
  if (target.owner_email) {
    return {
      email: target.owner_email,
      phone: target.owner_phone ?? undefined,
      ownerName: target.owner_name ?? undefined,
      mailingAddress: target.owner_mailing_address ?? undefined,
      source: 'already_known',
      status: target.owner_phone ? 'phone_found' : 'email_found',
    }
  }

  const strategies = [
    enrichFromIntakeMatch,
    enrichFromAssessorApi,
    enrichFromSkipTrace,
    enrichFromLocalAssessor,
  ]
  for (const strategy of strategies) {
    const result = await strategy(target)
    if (result) return result
  }

  if (target.owner_mailing_address || target.owner_name) {
    return {
      ownerName: target.owner_name ?? undefined,
      mailingAddress: target.owner_mailing_address ?? target.address,
      source: 'assessor_mailing_only',
      status: 'mailing_only',
    }
  }

  return { source: 'none', status: 'no_contact' }
}

export async function applyEnrichment(targetId: string, result: EnrichmentResult): Promise<void> {
  const supabase = getSupabaseAdmin()
  const { data: current } = await supabase
    .from('parcel_outreach_targets')
    .select('enrichment_attempts')
    .eq('id', targetId)
    .single()

  await supabase
    .from('parcel_outreach_targets')
    .update({
      owner_email: result.email ?? null,
      owner_phone: result.phone ?? null,
      owner_name: result.ownerName ?? null,
      owner_mailing_address: result.mailingAddress ?? null,
      enrichment_status: result.status,
      enrichment_source: result.source,
      enrichment_attempts: (current?.enrichment_attempts ?? 0) + 1,
      last_enriched_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', targetId)
}
