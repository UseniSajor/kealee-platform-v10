import { getSupabaseAdmin } from '@/lib/supabase-server'
import { getOwnerPortalDeliverableUrl } from '@/lib/owner-portal-urls'
import {
  buildPostPaymentEmail,
  buildPreconstructionWelcomeEmail,
  buildWelcomeEmail,
} from '@/lib/marketing/email-templates'
import { sendMarketingEmail } from '@/lib/marketing/resend'
import {
  buildConceptFunnelUrl,
  buildPermitDrawingsFunnelUrl,
  schedulePermitDrawingsUpsellDrip,
} from '@/lib/marketing/drip-schedule'
import { mergeMarketingMetadata, type FunnelStage } from '@/lib/marketing/types'

export async function patchIntakeFunnelStage(
  intakeId: string,
  stage: FunnelStage,
  extraTags?: string[],
): Promise<void> {
  const supabase = getSupabaseAdmin()
  const { data: row } = await supabase
    .from('public_intake_leads')
    .select('metadata')
    .eq('id', intakeId)
    .single()

  const metadata = mergeMarketingMetadata(row?.metadata as Record<string, unknown>, {
    funnelStage: stage,
    tags: extraTags,
  })

  await supabase.from('public_intake_leads').update({ metadata }).eq('id', intakeId)
}

const PRECONSTRUCTION_SERVICE_KEYS = new Set([
  'design_estimate_permit_bundle',
  'professional_drawings',
  'permit_path_only',
])

export async function sendWelcomeLeadEmail(opts: {
  email: string
  name: string
  funnelUrl: string
  serviceLabel: string
  serviceKey?: string
}): Promise<boolean> {
  const isPreconstruction = opts.serviceKey && PRECONSTRUCTION_SERVICE_KEYS.has(opts.serviceKey)

  let subject: string
  let html: string

  if (isPreconstruction) {
    const result = buildPreconstructionWelcomeEmail({
      name: opts.name,
      serviceLabel: opts.serviceLabel,
      funnelUrl: opts.funnelUrl,
      email: opts.email,
      serviceKey: opts.serviceKey as string,
    })
    subject = result.subject
    html = result.html
  } else {
    const result = buildWelcomeEmail({
      name: opts.name,
      serviceLabel: opts.serviceLabel,
      funnelUrl: opts.funnelUrl,
      email: opts.email,
    })
    subject = result.subject
    html = result.html
  }

  return sendMarketingEmail({ to: opts.email, subject, html })
}

export async function sendPostPaymentCustomerEmail(opts: {
  intakeId: string
  email: string
  clientName: string
  projectPath: string
}): Promise<boolean> {
  const deliverableUrl = getOwnerPortalDeliverableUrl(opts.intakeId, opts.projectPath)
  const { subject, html, text } = buildPostPaymentEmail({
    clientName: opts.clientName,
    projectPath: opts.projectPath,
    intakeId: opts.intakeId,
    deliverableUrl,
  })
  return sendMarketingEmail({ to: opts.email, subject, html, text })
}

/**
 * After concept_ready: schedule permit-ready drawings upsell (estimate is already included).
 */
export async function onConceptReadyLifecycle(opts: {
  intakeId: string
  email: string
  clientName?: string
  projectPath: string
  serviceLabel?: string
}): Promise<void> {
  await patchIntakeFunnelStage(opts.intakeId, 'concept_ready', ['concept-delivered'])

  const serviceLabel =
    opts.serviceLabel ?? opts.projectPath.replace(/_/g, ' ')

  const scheduled = await schedulePermitDrawingsUpsellDrip({
    leadId: opts.intakeId,
    email: opts.email,
    name: opts.clientName,
    serviceLabel,
    projectPath: opts.projectPath,
  })

  if (scheduled) {
    const supabase = getSupabaseAdmin()
    const { data: row } = await supabase
      .from('public_intake_leads')
      .select('metadata')
      .eq('id', opts.intakeId)
      .single()

    const metadata = mergeMarketingMetadata(row?.metadata as Record<string, unknown>, {
      permitDrawingsUpsellScheduledAt: new Date().toISOString(),
    })
    await supabase.from('public_intake_leads').update({ metadata }).eq('id', opts.intakeId)
  }
}

export { buildConceptFunnelUrl, buildPermitDrawingsFunnelUrl }
