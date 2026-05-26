/**
 * Stripe webhook side effects (invoked after signature verification).
 */

import type Stripe from 'stripe'
import type { NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { SERVICE_DELIVERABLES } from '@/lib/service-deliverables'
import { isV30IntakeMetadata, triggerV30GenerationForIntake } from '@/lib/v30-trigger'
import {
  patchIntakeFunnelStage,
  sendPostPaymentCustomerEmail,
} from '@/lib/marketing/lifecycle'
import { trackPurchase } from '@/lib/marketing/ga4-server'
import { parseUtmFromBody } from '@/lib/marketing/utm-metadata'

export async function processStripeWebhookEvent(
  event: Stripe.Event,
  req: NextRequest,
): Promise<void> {
  if (event.type === 'payment_intent.payment_failed') {
    await handlePaymentFailed(event.data.object as Stripe.PaymentIntent, req)
    return
  }

  if (event.type === 'checkout.session.expired') {
    const session = event.data.object as Stripe.Checkout.Session
    console.log(
      `[stripe-webhook] checkout.session.expired intakeId=${session.metadata?.intakeId ?? 'n/a'}`,
    )
    return
  }

  if (event.type !== 'checkout.session.completed') {
    return
  }

  await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session, req)
}

async function handlePaymentFailed(pi: Stripe.PaymentIntent, req: NextRequest): Promise<void> {
  const meta = pi.metadata ?? {}
  const intakeId = meta.intakeId
  const projectPath = meta.projectPath
  const source = meta.source
  const failureMessage = pi.last_payment_error?.message ?? 'Unknown error'

  console.log(
    `[stripe-webhook] payment_intent.payment_failed intakeId=${intakeId} reason="${failureMessage}"`,
  )

  if (!intakeId || !source) return

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin
  fetch(`${baseUrl}/api/emails/payment-failed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: pi.receipt_email ?? '',
      firstName: '',
      service: projectPath ?? source,
      amount: pi.amount,
      intakeId,
      failureMessage,
      source,
    }),
  }).catch((err: Error) => {
    console.error('[stripe-webhook] payment-failed email trigger failed:', err.message)
  })
}

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  req: NextRequest,
): Promise<void> {
  const meta = session.metadata ?? {}

  if (meta.source !== 'public_intake' && meta.source !== 'public_intake_v30') {
    console.log('[stripe-webhook] checkout.session.completed ignored source=', meta.source)
    return
  }

  const isV30 = isV30IntakeMetadata(meta)
  const intakeId = meta.intakeId
  const projectPath = meta.projectPath

  if (!intakeId || !projectPath) {
    console.error('[stripe-webhook] Missing intakeId or projectPath in metadata', meta)
    return
  }

  const supabase = getSupabaseAdmin()
  const deliverable = SERVICE_DELIVERABLES[projectPath]

  const { data: currentIntake, error: fetchErr } = await supabase
    .from('public_intake_leads')
    .select('form_data, metadata')
    .eq('id', intakeId)
    .single()

  if (fetchErr) {
    console.error('[stripe-webhook] intake fetch failed:', fetchErr.message, intakeId)
    throw new Error(`Intake fetch failed: ${fetchErr.message}`)
  }

  const existingFormData = (currentIntake?.form_data as Record<string, unknown>) ?? {}
  const purchaseUtm = parseUtmFromBody({
    ...((currentIntake?.metadata as Record<string, unknown>) ?? {}),
    ...existingFormData,
  })

  const mergedFormData: Record<string, unknown> = { ...existingFormData }
  if (deliverable) {
    mergedFormData.serviceLabel = deliverable.label
    mergedFormData.serviceCategory = deliverable.category
    mergedFormData.serviceIncludes = deliverable.includes
    mergedFormData.serviceDeliveryDays = deliverable.deliveryDays
    if (deliverable.renderCount != null) mergedFormData.renderCount = deliverable.renderCount
    if (deliverable.permitRequired != null) mergedFormData.permitRequired = deliverable.permitRequired
  }
  mergedFormData.funnelStage = 'paid_concept'

  const { data: updatedRows, error: updateErr } = await supabase
    .from('public_intake_leads')
    .update({
      status: 'paid',
      form_data: mergedFormData,
      paid_at: new Date().toISOString(),
      stripe_session_id: session.id,
    })
    .eq('id', intakeId)
    .eq('status', 'new')
    .select('id')

  if (updateErr) {
    console.error('[stripe-webhook] Failed to update intake status:', updateErr.message)
    throw new Error(`Intake update failed: ${updateErr.message}`)
  }

  const transitionedToPaid = Boolean(updatedRows && updatedRows.length > 0)
  if (!transitionedToPaid) {
    console.log('[stripe-webhook] Intake already paid or not found; skip generation', intakeId)
    return
  }

  if (isV30) {
    triggerV30GenerationForIntake(intakeId).catch((err: Error) => {
      console.error('[stripe-webhook] v30 generation trigger failed:', err.message)
    })
  } else if (deliverable?.generatesConcept) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin
    fetch(`${baseUrl}/api/concept/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intakeId }),
    }).catch((err: Error) => {
      console.error('[stripe-webhook] Concept generation trigger failed:', err.message)
    })
  }

  const resendApiKey = process.env.RESEND_API_KEY
  const amountCents = session.amount_total ?? 0
  const amountFormatted = (amountCents / 100).toFixed(2)
  const clientEmail = session.customer_details?.email ?? 'unknown'
  const clientName = session.customer_details?.name ?? 'Unknown Client'

  if (resendApiKey) {
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Kealee Notifications <notifications@kealee.com>',
        to: ['hello@kealee.com'],
        subject: `New purchase — ${projectPath.replace(/_/g, ' ')} $${amountFormatted}`,
        text: [
          'A new purchase has been completed.',
          '',
          `  Intake ID:   ${intakeId}`,
          `  Service:     ${projectPath.replace(/_/g, ' ')}`,
          `  Client:      ${clientName} <${clientEmail}>`,
          `  Amount:      $${amountFormatted}`,
          `  Time:        ${new Date().toISOString()}`,
          '',
          'Review in Command Center: https://cc.kealee.com/events',
        ].join('\n'),
      }),
    }).catch((err: Error) => {
      console.error('[stripe-webhook] Purchase notification email failed:', err.message)
    })
  }

  patchIntakeFunnelStage(intakeId, 'paid_concept', ['stripe-paid']).catch((err: Error) => {
    console.error('[stripe-webhook] funnel stage patch failed:', err.message)
  })

  await trackPurchase({
    intakeId,
    projectPath,
    valueCents: amountCents,
    utm: purchaseUtm,
  })

  if (clientEmail !== 'unknown') {
    sendPostPaymentCustomerEmail({
      intakeId,
      email: clientEmail,
      clientName,
      projectPath,
    }).catch((err: Error) => {
      console.error('[stripe-webhook] Customer confirmation email failed:', err.message)
    })
  }
}
