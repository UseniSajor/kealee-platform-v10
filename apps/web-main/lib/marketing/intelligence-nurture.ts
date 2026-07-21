/**
 * Wire intelligence product assignment → nurture sequences.
 * Enterprise CRM: GHL sequences. Default: Kealee native drip (Resend).
 */

import type { IntelligenceLeadResult } from '@kealee/intelligence'
import { scheduleSequence, type SequenceId } from '@/lib/marketing/sequences'
import { isEnterpriseCrmEnabled } from '@/lib/marketing/crm-enterprise'
import { isGhlEnabled } from '@/lib/marketing/ghl-enabled'
import {
  schedulePrePaymentDrip,
  buildConceptFunnelUrl,
} from '@/lib/marketing/drip-schedule'
import { getSupabaseAdmin } from '@/lib/supabase-server'

const NURTURE_TO_SEQUENCE: Record<string, SequenceId> = {
  kitchen_remodel_14d: 'CONCEPT_SEQUENCE',
  design_concept_14d: 'CONCEPT_SEQUENCE',
  adu_education_21d: 'CONCEPT_SEQUENCE',
  addition_14d: 'CONCEPT_SEQUENCE',
  basement_14d: 'CONCEPT_SEQUENCE',
  permit_status_7d: 'PERMIT_SEQUENCE',
  estimate_followup_7d: 'PERMIT_SEQUENCE',
  contractor_bid_14d: 'CONTRACTOR_SEQUENCE',
  developer_outreach_10d: 'NURTURE_SEQUENCE',
  investor_flip_14d: 'NURTURE_SEQUENCE',
  commercial_ti_21d: 'NURTURE_SEQUENCE',
  finance_review_7d: 'NURTURE_SEQUENCE',
  pm_weekly_checkin: 'NURTURE_SEQUENCE',
  owner_rep_14d: 'NURTURE_SEQUENCE',
}

export function resolveSequenceForIntelligence(intelligence: IntelligenceLeadResult): SequenceId {
  const nurture = intelligence.productAssignment?.nurtureSequence
  if (nurture && NURTURE_TO_SEQUENCE[nurture]) {
    return NURTURE_TO_SEQUENCE[nurture]
  }
  if (intelligence.topProduct?.includes('permit')) return 'PERMIT_SEQUENCE'
  if (intelligence.topProduct?.includes('contractor')) return 'CONTRACTOR_SEQUENCE'
  return 'CONCEPT_SEQUENCE'
}

async function scheduleNativeIntelligenceDrip(opts: {
  leadId: string
  email: string
  name?: string
  projectPath?: string
  intelligence: IntelligenceLeadResult
}): Promise<{ scheduled: boolean; mode: 'native_drip' }> {
  const supabase = getSupabaseAdmin()

  const { data: existing } = await supabase
    .from('marketing_drip_queue')
    .select('id')
    .eq('lead_id', opts.leadId)
    .limit(1)

  if (existing?.length) {
    return { scheduled: false, mode: 'native_drip' }
  }

  const projectType = (opts.projectPath ?? opts.intelligence.topProduct ?? 'renovation').replace(
    /_/g,
    ' ',
  )

  await schedulePrePaymentDrip({
    leadId: opts.leadId,
    email: opts.email,
    name: opts.name,
    serviceLabel: projectType,
    funnelUrl: buildConceptFunnelUrl(opts.projectPath, opts.leadId),
  })

  const { data: row } = await supabase
    .from('public_intake_leads')
    .select('metadata')
    .eq('id', opts.leadId)
    .single()

  const prior = (row?.metadata as Record<string, unknown>) ?? {}
  await supabase
    .from('public_intake_leads')
    .update({
      metadata: {
        ...prior,
        intelligenceNurtureScheduled: 'NATIVE_DRIP',
        intelligenceNurtureAt: new Date().toISOString(),
        nurtureMode: 'kealee_native',
      },
    })
    .eq('id', opts.leadId)

  return { scheduled: true, mode: 'native_drip' }
}

export async function scheduleIntelligenceNurtureIfEligible(opts: {
  leadId: string
  ghlContactId?: string
  intelligence: IntelligenceLeadResult
  email: string
  name?: string
  address?: string
  projectPath?: string
}): Promise<{ scheduled: boolean; sequenceId?: SequenceId | 'NATIVE_DRIP'; mode?: string }> {
  if (!opts.intelligence.productAssignment?.autoAssigned && opts.intelligence.humanReviewRequired) {
    return { scheduled: false }
  }

  if (!isEnterpriseCrmEnabled() || !isGhlEnabled()) {
    const native = await scheduleNativeIntelligenceDrip(opts)
    return { scheduled: native.scheduled, sequenceId: 'NATIVE_DRIP', mode: 'kealee_native' }
  }

  if (!opts.ghlContactId) {
    return { scheduled: false }
  }

  const supabase = getSupabaseAdmin()

  const { data: existing } = await supabase
    .from('ghl_sequence_queue')
    .select('id')
    .eq('contact_id', opts.leadId)
    .ilike('sequence_id', '%SEQUENCE%')
    .limit(1)

  if (existing?.length) {
    return { scheduled: false }
  }

  const sequenceId = resolveSequenceForIntelligence(opts.intelligence)
  const firstName = (opts.name ?? 'there').split(' ')[0]
  const projectType = (opts.projectPath ?? opts.intelligence.topProduct ?? 'renovation').replace(
    /_/g,
    ' ',
  )

  await scheduleSequence(opts.leadId, opts.ghlContactId, sequenceId, {
    firstName,
    projectType,
    projectSlug: opts.projectPath ?? 'kitchen_remodel',
    location: opts.address?.split(',').slice(-2).join(',') ?? 'DMV',
    conceptPrice: '299',
    conceptPriceHigh: '497',
  })

  const { data: row } = await supabase
    .from('public_intake_leads')
    .select('metadata')
    .eq('id', opts.leadId)
    .single()

  const prior = (row?.metadata as Record<string, unknown>) ?? {}
  await supabase
    .from('public_intake_leads')
    .update({
      metadata: {
        ...prior,
        intelligenceNurtureScheduled: sequenceId,
        intelligenceNurtureAt: new Date().toISOString(),
        nurtureMode: 'ghl_sequence',
      },
    })
    .eq('id', opts.leadId)

  return { scheduled: true, sequenceId, mode: 'ghl_sequence' }
}
