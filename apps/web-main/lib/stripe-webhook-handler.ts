/**
 * Stripe webhook side effects (invoked after signature verification).
 */

import type Stripe from 'stripe'
import type { NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { SERVICE_DELIVERABLES } from '@/lib/service-deliverables'
import { resolveConceptTier, isBundleProductKey } from '@kealee/core-rules'
import { isV30IntakeMetadata, triggerV30GenerationForIntake } from '@/lib/v30-trigger'
import {
  patchIntakeFunnelStage,
  sendPostPaymentCustomerEmail,
} from '@/lib/marketing/lifecycle'
import { trackPurchase } from '@/lib/marketing/ga4-server'
import { parseUtmFromBody } from '@/lib/marketing/utm-metadata'
import { mergeMarketingMetadata } from '@/lib/marketing/types'
import { fulfillRevenueProduct } from '@/lib/revenue-fulfillment'
import { resolveProductAutomationRoute } from '@/lib/product-automation'
import { ensureAutonomousFulfillmentRun } from '@/lib/autonomous-fulfillment'

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

  await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session, req, event.id)
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
  stripeEventId: string,
): Promise<void> {
  const meta = session.metadata ?? {}

  if (session.payment_status !== 'paid') {
    console.log('[stripe-webhook] checkout completed before payment; waiting for paid event', session.id)
    return
  }

  if (meta.source === 'revenue_product') {
    await fulfillRevenueProduct(session, stripeEventId)
    return
  }

  if (meta.source !== 'public_intake' && meta.source !== 'public_intake_v30') {
    console.log('[stripe-webhook] checkout.session.completed ignored source=', meta.source)
    return
  }

  const isV30 = isV30IntakeMetadata(meta)
  const intakeId = meta.intakeId
  const projectPath = meta.projectPath
  const upsellSourceIntakeId = meta.upsellSourceIntakeId
  const sourcePath = meta.sourcePath
  const isBundlePurchase = isBundleProductKey(projectPath)
  const automationRoute = resolveProductAutomationRoute({ source: meta.source, projectPath })

  if (!intakeId || !projectPath) {
    console.error('[stripe-webhook] Missing intakeId or projectPath in metadata', meta)
    return
  }

  const supabase = getSupabaseAdmin()
  const deliverable = SERVICE_DELIVERABLES[projectPath]

  const { data: currentIntake, error: fetchErr } = await supabase
    .from('public_intake_leads')
    .select('form_data, metadata, status, stripe_session_id')
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
  if (typeof mergedFormData.tier !== 'number' && deliverable?.generatesConcept && !isBundlePurchase) {
    mergedFormData.tier = resolveConceptTier(mergedFormData, { projectPath })
  }
  if (upsellSourceIntakeId) {
    mergedFormData.upsellSourceIntakeId = upsellSourceIntakeId
    if (sourcePath) mergedFormData.upsellSourcePath = sourcePath
  }
  mergedFormData.funnelStage = isBundlePurchase ? 'bundle_purchased' : 'paid_concept'
  if (automationRoute) {
    Object.assign(mergedFormData, automationRoute, {
      fulfillmentStatus: 'queued',
      fulfillmentQueuedAt: new Date().toISOString(),
    })
  }

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
  const canRetryAutomation = Boolean(
    automationRoute &&
    currentIntake?.status === 'paid' &&
    currentIntake?.stripe_session_id === session.id &&
    (!existingFormData.v30GenerationStartedAt || ['failed', 'retryable'].includes(String(existingFormData.fulfillmentStatus ?? ''))),
  )
  if (!transitionedToPaid && !canRetryAutomation) {
    console.log('[stripe-webhook] Intake already paid or not found; skip generation', intakeId)
    return
  }

  if (isV30 || automationRoute) {
    if (automationRoute) {
      const run = await ensureAutonomousFulfillmentRun({
        intakeId, stripeSessionId: session.id, productKey: projectPath,
        botTypes: automationRoute.fulfillmentBotTypes,
        workflowTemplateId: automationRoute.workflowTemplateId,
        propertyIntelligenceDepth: automationRoute.propertyIntelligenceDepth,
      })
      const { data: latest } = await supabase.from('public_intake_leads').select('form_data').eq('id', intakeId).single()
      await supabase.from('public_intake_leads').update({ form_data: {
        ...((latest?.form_data as Record<string, unknown>) ?? mergedFormData),
        autonomousRunId: run.runId,
      } }).eq('id', intakeId)
    }
    const generation = await triggerV30GenerationForIntake(intakeId, automationRoute)
    if (!generation) throw new Error(`Automation could not be queued for intake ${intakeId}`)
  } else if (deliverable?.generatesConcept && !upsellSourceIntakeId && !isBundlePurchase) {
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
    const purchasedTier = mergedFormData.tier as number | undefined
    const isPremiumPlusConcept = purchasedTier === 3 && Boolean(deliverable?.generatesConcept) && !isBundlePurchase
    const premiumPlusNote = isPremiumPlusConcept
      ? [
          '',
          '⚠️ PREMIUM+ ORDER — includes a CAD (DXF) file deliverable.',
          'CAD export normally generates automatically with the floor plan. If it is',
          'still missing by the time the customer checks their portal, deliver it',
          'manually from the admin Purchases list:',
          '  https://admin.kealee.com/purchases',
          `  (or trigger directly: POST https://admin.kealee.com/api/purchases/${intakeId}/redeliver)`,
        ].join('\n')
      : ''

    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Kealee Notifications <notifications@kealee.com>',
        to: ['hello@kealee.com'],
        subject: `New purchase — ${isPremiumPlusConcept ? 'Premium+ ' : ''}${projectPath.replace(/_/g, ' ')} $${amountFormatted}`,
        text: [
          'A new purchase has been completed.',
          '',
          `  Intake ID:   ${intakeId}`,
          `  Service:     ${projectPath.replace(/_/g, ' ')}`,
          `  Tier:        ${purchasedTier === 3 ? 'Premium+' : purchasedTier === 2 ? 'Premium' : purchasedTier === 1 ? 'Basic' : 'n/a'}`,
          `  Client:      ${clientName} <${clientEmail}>`,
          `  Amount:      $${amountFormatted}`,
          `  Time:        ${new Date().toISOString()}`,
          premiumPlusNote,
          '',
          'Review in Command Center: https://command.kealee.com/events',
        ].join('\n'),
      }),
    }).catch((err: Error) => {
      console.error('[stripe-webhook] Purchase notification email failed:', err.message)
    })
  }

  patchIntakeFunnelStage(intakeId, isBundlePurchase ? 'bundle_purchased' : 'paid_concept', [
    isBundlePurchase ? 'bundle-checkout' : 'stripe-paid',
  ]).catch((err: Error) => {
    console.error('[stripe-webhook] funnel stage patch failed:', err.message)
  })

  if (upsellSourceIntakeId && isBundlePurchase) {
    linkBundlePurchaseToSourceIntake(supabase, upsellSourceIntakeId, {
      bundleIntakeId: intakeId,
      bundleProjectPath: projectPath,
      sourcePath: sourcePath ?? undefined,
      amountCents: session.amount_total ?? 0,
    }).catch((err: Error) => {
      console.error('[stripe-webhook] bundle source link failed:', err.message)
    })
  }

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

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin
    // For concept services, the concept/generate route fires the deliverable-ready
    // email after generation completes (with the real claim URL + renders ready).
    // Firing it here would be premature — the concept isn't ready yet.
    if (!deliverable?.generatesConcept) {
      const headline = `Payment confirmed — your ${projectPath.replace(/_/g, ' ')} is in progress`
      fetch(`${baseUrl}/api/emails/deliverable-ready`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: clientEmail,
          firstName: clientName.split(' ')[0],
          service: projectPath,
          intakeId,
          headline,
          upsellSourceIntakeId: upsellSourceIntakeId ?? undefined,
        }),
      }).catch((err: Error) => {
        console.error('[stripe-webhook] deliverable-ready email failed:', err.message)
      })
    }
  }
}

async function linkBundlePurchaseToSourceIntake(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  sourceIntakeId: string,
  bundle: {
    bundleIntakeId: string
    bundleProjectPath: string
    sourcePath?: string
    amountCents: number
  },
): Promise<void> {
  const { data: sourceRow } = await supabase
    .from('public_intake_leads')
    .select('metadata, form_data')
    .eq('id', sourceIntakeId)
    .single()

  if (!sourceRow) return

  const existingForm = (sourceRow.form_data as Record<string, unknown>) ?? {}
  const purchases = Array.isArray(existingForm.bundlePurchases)
    ? (existingForm.bundlePurchases as Record<string, unknown>[])
    : []

  purchases.push({
    intakeId: bundle.bundleIntakeId,
    projectPath: bundle.bundleProjectPath,
    purchasedAt: new Date().toISOString(),
    amountCents: bundle.amountCents,
  })

  const metadata = mergeMarketingMetadata(sourceRow.metadata as Record<string, unknown>, {
    funnelStage: 'bundle_purchased',
    tags: ['bundle-upsell-converted'],
    lastBundleIntakeId: bundle.bundleIntakeId,
    lastBundleProjectPath: bundle.bundleProjectPath,
  })

  await supabase
    .from('public_intake_leads')
    .update({
      metadata,
      form_data: {
        ...existingForm,
        bundlePurchases: purchases,
        lastBundleIntakeId: bundle.bundleIntakeId,
      },
    })
    .eq('id', sourceIntakeId)
}
