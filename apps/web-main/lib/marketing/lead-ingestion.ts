import { createHash } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { normalizeContactIdentity } from './contact-identity'
import { scoreLead, type LeadScoreInput } from './lead-score-v2'

export interface CanonicalLeadInput extends LeadScoreInput {
  organizationId: string
  name: string
  email?: string
  phone?: string
  companyName?: string
  companyDomain?: string
  source: string
  sourceRecordId?: string
  projectPath: string
  projectAddress: string
  budgetRange?: string
  metadata?: Record<string, unknown>
  formData?: Record<string, unknown>
}

export interface CanonicalLeadResult {
  leadId: string
  contactId: string
  duplicate: boolean
  score: ReturnType<typeof scoreLead>
}

function sourceRecordFallback(input: CanonicalLeadInput, identity: ReturnType<typeof normalizeContactIdentity>) {
  return createHash('sha256')
    .update(`${input.organizationId}:${input.source}:${identity.email ?? identity.phone ?? input.name}`)
    .digest('hex')
}

export async function ingestCanonicalLead(
  input: CanonicalLeadInput,
  client: SupabaseClient = getSupabaseAdmin(),
): Promise<CanonicalLeadResult> {
  const identity = normalizeContactIdentity(input)
  if (!identity.email && !identity.phone) throw new Error('A valid email or phone is required')
  const score = scoreLead(input)
  const sourceRecordId = input.sourceRecordId ?? sourceRecordFallback(input, identity)

  let query = client.from('marketing_contacts').select('id, intake_lead_id')
    .eq('organization_id', input.organizationId)
  query = identity.email
    ? query.eq('normalized_email', identity.email)
    : query.eq('normalized_phone', identity.phone as string)
  const { data: existing, error: lookupError } = await query.maybeSingle()
  if (lookupError) throw new Error(`Contact lookup failed: ${lookupError.message}`)

  if (existing?.intake_lead_id) {
    await client.from('marketing_contacts').update({
      contact_name: input.name,
      normalized_phone: identity.phone,
      company_name: input.companyName ?? null,
      company_domain: identity.domain,
      metadata: { ...(input.metadata ?? {}), leadScore: score },
      updated_at: new Date().toISOString(),
    }).eq('id', existing.id)
    return { leadId: existing.intake_lead_id, contactId: existing.id, duplicate: true, score }
  }

  const { data: lead, error: leadError } = await client.from('public_intake_leads').insert({
    project_path: input.projectPath,
    client_name: input.name,
    contact_email: identity.email ?? '',
    contact_phone: identity.phone,
    project_address: input.projectAddress,
    budget_range: input.budgetRange ?? 'Not provided',
    source: input.source,
    status: 'new',
    requires_payment: true,
    payment_amount: 0,
    metadata: { ...(input.metadata ?? {}), leadScore: score },
    form_data: input.formData ?? {},
  }).select('id').single()
  if (leadError || !lead) throw new Error(`Lead creation failed: ${leadError?.message ?? 'no row returned'}`)

  const { data: contact, error: contactError } = await client.from('marketing_contacts').upsert({
    organization_id: input.organizationId,
    intake_lead_id: lead.id,
    normalized_email: identity.email,
    normalized_phone: identity.phone,
    company_name: input.companyName ?? null,
    company_domain: identity.domain,
    contact_name: input.name,
    job_title: input.roleSeniority ?? null,
    location: input.projectAddress,
    source: input.source,
    source_record_id: sourceRecordId,
    metadata: { ...(input.metadata ?? {}), leadScore: score },
  }, { onConflict: 'organization_id,source,source_record_id' }).select('id').single()
  if (contactError || !contact) throw new Error(`Contact creation failed: ${contactError?.message ?? 'no row returned'}`)

  const { error: attributionError } = await client.from('marketing_attributions').insert({
    organization_id: input.organizationId,
    intake_lead_id: lead.id,
    contact_id: contact.id,
    touch_type: 'first',
    source: input.source,
    utm_source: input.metadata?.utm_source ?? null,
    utm_medium: input.metadata?.utm_medium ?? null,
    utm_campaign: input.metadata?.utm_campaign ?? null,
    utm_content: input.metadata?.utm_content ?? null,
    utm_term: input.metadata?.utm_term ?? null,
    metadata: {},
  })
  if (attributionError) throw new Error(`Attribution creation failed: ${attributionError.message}`)

  return { leadId: lead.id, contactId: contact.id, duplicate: false, score }
}
