import type Stripe from 'stripe'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { orderStatusPatch } from '@/lib/order-status'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const SERVICE_CHECKOUT_SOURCES = new Set([
  'public_intake',
  'public_intake_v30',
  'product-order',
  'bundle',
  'permit-package',
  'pre-design',
  'revenue_product',
])

const PRODUCT_PATH_ALIASES: Record<string, string> = {
  'whole-home': 'whole_home_concept',
  'kitchen-remodel': 'kitchen_remodel',
  'bath-remodel': 'bathroom_remodel',
  'interior-reno': 'interior_reno_concept',
  exterior: 'exterior_concept',
  'cost-estimate': 'cost_estimate',
  'certified-estimate': 'certified_estimate',
  'permit-research': 'permit_path_only',
  'permit-package': 'permit_path_only',
  'adu-bundle': 'design_estimate_permit_bundle',
}

export interface PaidOrderLedgerEntry {
  intakeId: string
  projectPath: string
  created: boolean
}

export function isServiceCheckoutSource(source?: string): boolean {
  return Boolean(source && SERVICE_CHECKOUT_SOURCES.has(source))
}

export function resolveCheckoutProjectPath(metadata: Stripe.Metadata): string | null {
  if (metadata.projectPath) return metadata.projectPath
  if (metadata.productKey) return metadata.productKey
  if (metadata.productSlug) {
    return PRODUCT_PATH_ALIASES[metadata.productSlug] ?? metadata.productSlug.replace(/-/g, '_')
  }
  if (metadata.source === 'bundle') return 'design_estimate_permit_bundle'
  if (metadata.source === 'permit-package') return 'permit_path_only'
  if (metadata.source === 'pre-design') {
    const project = metadata.projectType || 'project'
    const tier = metadata.tier || 'package'
    return `pre_design_${project}_${tier}`.replace(/-/g, '_')
  }
  return null
}

/**
 * Guarantees that a successfully paid service checkout has one durable
 * operational record, even when the intake service failed before checkout.
 * Stripe retries database failures; fulfillment failures never erase the row.
 */
export async function ensurePaidOrderLedgerEntry(
  session: Stripe.Checkout.Session,
  stripeEventId: string,
): Promise<PaidOrderLedgerEntry> {
  const metadata = session.metadata ?? {}
  const projectPath = resolveCheckoutProjectPath(metadata)
  if (!projectPath) throw new Error(`Paid checkout ${session.id} has no product identifier`)

  const supabase = getSupabaseAdmin()
  const { data: bySession, error: sessionLookupError } = await supabase
    .from('public_intake_leads')
    .select('id, project_path')
    .eq('stripe_session_id', session.id)
    .maybeSingle()

  if (sessionLookupError) {
    throw new Error(`Paid-order ledger lookup failed: ${sessionLookupError.message}`)
  }
  if (bySession) {
    return { intakeId: bySession.id, projectPath: bySession.project_path, created: false }
  }

  const requestedIntakeId = metadata.intakeId
  if (requestedIntakeId && UUID_PATTERN.test(requestedIntakeId)) {
    const { data: existing, error } = await supabase
      .from('public_intake_leads')
      .select('id, project_path')
      .eq('id', requestedIntakeId)
      .maybeSingle()
    if (error) throw new Error(`Paid-order intake lookup failed: ${error.message}`)
    if (existing) {
      return { intakeId: existing.id, projectPath: existing.project_path, created: false }
    }
  }

  const email = session.customer_details?.email || metadata.customerEmail || metadata.contactEmail || 'customer-information-required@kealee.invalid'
  const name = session.customer_details?.name || metadata.customerName || metadata.contactName || 'Customer information required'
  const address = metadata.propertyAddress || 'Customer information required'
  const now = new Date().toISOString()
  const formData = {
    ...orderStatusPatch('awaiting_customer_information', { actor: 'system' }),
    fulfillmentStatus: 'manual_review',
    requiresHumanFulfillment: true,
    fulfillmentFallbackReason: 'intake_record_missing_at_payment',
    fulfillmentQueuedAt: now,
    stripeEventId,
    stripeCheckoutSource: metadata.source,
    stripeMetadata: metadata,
    serviceLabel: metadata.productName || projectPath.replace(/_/g, ' '),
    missingInformation: address === 'Customer information required',
  }

  const { data: inserted, error: insertError } = await supabase
    .from('public_intake_leads')
    .insert({
      project_path: projectPath,
      client_name: name,
      contact_email: email,
      project_address: address,
      budget_range: 'Paid order',
      source: `stripe:${metadata.source || 'service'}`,
      status: 'new',
      requires_payment: true,
      payment_amount: session.amount_total ?? 0,
      stripe_session_id: session.id,
      metadata: { stripeEventId, stripeCheckoutSource: metadata.source, stripeMetadata: metadata },
      form_data: formData,
    })
    .select('id, project_path')
    .single()

  if (insertError || !inserted) {
    // A concurrent webhook can win the unique-session race. Read its row
    // before treating this as a persistence failure.
    const { data: raced } = await supabase
      .from('public_intake_leads')
      .select('id, project_path')
      .eq('stripe_session_id', session.id)
      .maybeSingle()
    if (raced) return { intakeId: raced.id, projectPath: raced.project_path, created: false }
    throw new Error(`Paid-order ledger insert failed: ${insertError?.message ?? 'no row returned'}`)
  }

  return { intakeId: inserted.id, projectPath: inserted.project_path, created: true }
}
