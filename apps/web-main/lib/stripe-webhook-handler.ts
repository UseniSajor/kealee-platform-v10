/**
 * Stripe webhook side effects (invoked after signature verification).
 */

import type Stripe from 'stripe'
import type { NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { SERVICE_DELIVERABLES } from '@/lib/service-deliverables'
import {
  getConceptPackageDeliverableLabelsForIntake,
  renderCountForTier,
  resolveConceptTier,
  isBundleProductKey,
  type ConceptTier,
} from '@kealee/core-rules'
import { isV30IntakeMetadata, triggerV30GenerationForIntake } from '@/lib/v30-trigger'
import { isV30Enabled } from '@kealee/kealee-agent-stack'
import {
  patchIntakeFunnelStage,
  sendPostPaymentCustomerEmail,
} from '@/lib/marketing/lifecycle'
import { trackPurchase } from '@/lib/marketing/ga4-server'
import { parseUtmFromBody } from '@/lib/marketing/utm-metadata'
import { mergeMarketingMetadata } from '@/lib/marketing/types'
import { fulfillRevenueProduct } from '@/lib/revenue-fulfillment'
import { resolveProductAutomationRoute } from '@/lib/product-automation'
import { isSitePlanOrder, evaluateSitePlanOrder, sitePlanRuleFormData } from '@/lib/site-plan-rules'
import { activateSitePlanForOrder, sitePlanWorkflowFormData } from '@/lib/site-plan-workflow'
import { ensureAutonomousFulfillmentRun } from '@/lib/autonomous-fulfillment'
import * as Sentry from '@sentry/nextjs'
import { recordPaidOrderIncident } from '@/lib/paid-order-incident'
import { routeToManualFulfillment } from '@/lib/manual-fulfillment'
import { orderStatusPatch } from '@/lib/order-status'

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

  const session = event.data.object as Stripe.Checkout.Session
  try {
    await handleCheckoutCompleted(session, req, event.id)
  } catch (error) {
    const meta = session.metadata ?? {}
    const message = error instanceof Error ? error.message : String(error)
    // Revenue-product checkouts key on productKey, not projectPath — fall back
    // so this whole order category isn't silently excluded from admin alerts.
    const productLabel = meta.projectPath ?? meta.productKey
    if (isFulfillable(session) && meta.intakeId && productLabel) {
      await recordPaidOrderIncident({
        intakeId: meta.intakeId,
        projectPath: productLabel,
        stripeSessionId: session.id,
        stripeEventId: event.id,
        stage: 'checkout-fulfillment-dispatch',
        error: message,
        customerEmail: session.customer_details?.email,
      }).catch(incidentError => console.error('[stripe-webhook] incident recording failed', incidentError))
    }
    throw error
  }
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
  Sentry.captureMessage('Customer payment failed', {
    level: 'warning',
    tags: { area: 'sales-funnel', stage: 'payment-failed', projectPath: projectPath ?? 'unknown' },
    extra: { intakeId, paymentIntentId: pi.id, failureMessage },
  })

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

/**
 * Whether a completed Checkout Session is owed fulfillment.
 *
 * `paid` is the ordinary case. `no_payment_required` is a session a discount
 * took to zero — it is COMPLETE and terminal, and no later event will ever
 * arrive for it. Treating it as unpaid silently dropped every fully-discounted
 * order: the customer completes checkout and receives nothing, permanently.
 *
 * `unpaid` is the one that genuinely waits. An async payment method settles
 * later and fires checkout.session.async_payment_succeeded, so returning early
 * there is correct.
 */
function isFulfillable(session: Stripe.Checkout.Session): boolean {
  return session.payment_status === 'paid' || session.payment_status === 'no_payment_required'
}

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  req: NextRequest,
  stripeEventId: string,
): Promise<void> {
  const meta = session.metadata ?? {}

  if (!isFulfillable(session)) {
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
  const isPermitAutomation = projectPath === 'permit_path_only'

  if (!intakeId || !projectPath) {
    console.error('[stripe-webhook] Missing intakeId or projectPath in metadata', meta)
    Sentry.captureMessage('Paid checkout missing fulfillment metadata', {
      level: 'fatal',
      tags: { area: 'payment-fulfillment', stage: 'orphan-paid-order' },
      extra: { stripeSessionId: session.id, stripeEventId, metadata: meta },
    })
    throw new Error(`Paid checkout ${session.id} is missing intakeId or projectPath`)
  }

  const supabase = getSupabaseAdmin()
  const deliverable = SERVICE_DELIVERABLES[projectPath]

  const { data: currentIntake, error: fetchErr } = await supabase
    .from('public_intake_leads')
    .select('form_data, metadata, status, stripe_session_id, contact_email')
    .eq('id', intakeId)
    .single()

  if (fetchErr) {
    console.error('[stripe-webhook] intake fetch failed:', fetchErr.message, intakeId)
    Sentry.captureMessage('Paid checkout has no retrievable intake', {
      level: 'fatal',
      tags: { area: 'payment-fulfillment', stage: 'orphan-paid-order', projectPath },
      extra: { intakeId, stripeSessionId: session.id, databaseError: fetchErr.message },
    })
    throw new Error(`Intake fetch failed: ${fetchErr.message}`)
  }

  const existingFormData = (currentIntake?.form_data as Record<string, unknown>) ?? {}
  const paidTierFromMetadata = Number(meta.tier)
  const purchasedTier = (
    paidTierFromMetadata === 1 || paidTierFromMetadata === 2 || paidTierFromMetadata === 3
      ? paidTierFromMetadata
      : resolveConceptTier(existingFormData, { projectPath })
  ) as ConceptTier
  const purchaseUtm = parseUtmFromBody({
    ...((currentIntake?.metadata as Record<string, unknown>) ?? {}),
    ...existingFormData,
  })

  const mergedFormData: Record<string, unknown> = { ...existingFormData }
  if (deliverable) {
    mergedFormData.serviceLabel = deliverable.label
    mergedFormData.serviceCategory = deliverable.category
    mergedFormData.serviceIncludes = deliverable.generatesConcept && !isBundlePurchase
      ? getConceptPackageDeliverableLabelsForIntake(projectPath, purchasedTier)
      : deliverable.includes
    mergedFormData.serviceDeliveryDays = deliverable.deliveryDays
    if (deliverable.generatesConcept && !isBundlePurchase) {
      mergedFormData.renderCount = renderCountForTier(purchasedTier, deliverable.renderCount ?? 3)
      mergedFormData.tier = purchasedTier
    } else if (deliverable.renderCount != null) {
      mergedFormData.renderCount = deliverable.renderCount
    }
    if (deliverable.permitRequired != null) mergedFormData.permitRequired = deliverable.permitRequired
  }
  if (upsellSourceIntakeId) {
    mergedFormData.upsellSourceIntakeId = upsellSourceIntakeId
    if (sourcePath) mergedFormData.upsellSourcePath = sourcePath
  }
  mergedFormData.funnelStage = isBundlePurchase ? 'bundle_purchased' : 'paid_concept'

  // Site Plan orders get their zoning analysis from the rule engine. It runs
  // synchronously because it touches no network and parses no ordinance — the
  // certified pack was prepared by the maintenance workflow, which is the whole
  // point of certifying rules rather than reading them per order.
  //
  // evaluateSitePlanOrder never throws: this is a paid order, and an exception
  // here would leave Stripe retrying a completed payment. Every failure path
  // returns a manual-review report instead.
  if (isSitePlanOrder(projectPath)) {
    const ruleOutcome = evaluateSitePlanOrder({ intakeId, projectPath, formData: mergedFormData })
    Object.assign(mergedFormData, sitePlanRuleFormData(ruleOutcome))
    if (ruleOutcome.error) {
      Sentry.captureMessage('Site plan rule engine failed on a paid order', {
        level: 'error',
        tags: { area: 'payment-fulfillment', stage: 'site-plan-rules', projectPath },
        extra: { intakeId, error: ruleOutcome.error },
      })
    }
    console.log(
      '[stripe-webhook] site-plan rules:', projectPath, intakeId,
      'coverage=' + ruleOutcome.coverage,
      'determined=' + ruleOutcome.determinedRequirements.length,
      'review=' + ruleOutcome.reviewItems.length,
    )

    // Activate the durable workflow. This creates or resumes the workflow row
    // and enqueues the first permitted job — it does NOT run the civil engine,
    // which has no business inside a Stripe webhook. Workers drain the queue
    // asynchronously.
    //
    // Like the rule evaluation above, it never throws: a paid order must not be
    // lost to an exception. A failure returns FAILED with the reason.
    const activation = await activateSitePlanForOrder({
      projectId: intakeId,
      orderId: intakeId,
      productId: projectPath,
      isSitePlan: true,
    })
    Object.assign(mergedFormData, sitePlanWorkflowFormData(activation))
    if (activation.disposition === 'FAILED') {
      Sentry.captureMessage('Site plan workflow activation failed on a paid order', {
        level: 'error',
        tags: { area: 'payment-fulfillment', stage: 'site-plan-workflow', projectPath },
        extra: { intakeId, summary: activation.summary },
      })
    }
    console.log(
      '[stripe-webhook] site-plan workflow:', activation.disposition,
      activation.workflowId ?? '-', 'enqueued=' + activation.enqueued.join(','),
    )
  }

  Object.assign(mergedFormData, orderStatusPatch('processing', { actor: 'system' }))
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

  const clientEmail = session.customer_details?.email ?? currentIntake?.contact_email
  const clientName = session.customer_details?.name ?? 'Customer'
  if (clientEmail && transitionedToPaid) {
    const confirmationSent = await sendPostPaymentCustomerEmail({
      intakeId, email: clientEmail, clientName, projectPath,
    })
    if (!confirmationSent) {
      await recordPaidOrderIncident({
        intakeId, projectPath, stripeSessionId: session.id, stripeEventId,
        stage: 'customer-confirmation-email', error: 'Resend did not accept the confirmation email', customerEmail: clientEmail,
      })
      // Preserve the paid order and continue fulfillment; admins now have a
      // durable incident and can resend after the email provider recovers.
      await supabase.from('public_intake_leads').update({ status: 'paid' }).eq('id', intakeId)
    }
  }

  // Shared context for every path that hands an order to a person.
  const manualFallbackContext = {
    intakeId,
    projectPath,
    stripeSessionId: session.id,
    stripeEventId,
    customerEmail: session.customer_details?.email ?? currentIntake?.contact_email ?? null,
  }

  // Keep the legacy concept generator as the production fallback until the
  // parallel bot service is explicitly enabled. Previously any automation
  // route entered V30 even when the feature flag was off; triggerV30Generation
  // then returned null and the paid order was left without a delivery.
  if ((isV30Enabled() || isPermitAutomation) && (isV30 || automationRoute)) {
    if (automationRoute) {
      try {
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
      } catch (runError) {
        // The autonomous run is bookkeeping around the generation call; losing
        // it must not cost us the order.
        console.error(
          '[stripe-webhook] autonomous run bookkeeping failed:',
          runError instanceof Error ? runError.message : runError,
        )
      }
    }

    let generation: Awaited<ReturnType<typeof triggerV30GenerationForIntake>> = null
    let generationError: string | undefined
    try {
      generation = await triggerV30GenerationForIntake(intakeId, {
        ...automationRoute,
        forceEnabled: isPermitAutomation,
      })
    } catch (error) {
      generationError = error instanceof Error ? error.message : String(error)
    }

    if (!generation) {
      // Previously this threw, which left Stripe retrying an already-paid
      // order and produced no work item anyone could act on. Route it to a
      // human instead: the customer keeps their order and ops gets a task.
      await routeToManualFulfillment({
        ...manualFallbackContext,
        reason: generationError ? 'automation_failed' : 'automation_unavailable',
        detail: generationError
          ? `Automated fulfillment errored (${generationError}). Order routed to the human fulfillment queue.`
          : undefined,
      })
    }
  } else if (deliverable?.generatesConcept && !upsellSourceIntakeId && !isBundlePurchase) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin
    fetch(`${baseUrl}/api/concept/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intakeId }),
    }).catch((err: Error) => {
      console.error('[stripe-webhook] Concept generation trigger failed:', err.message)
      void routeToManualFulfillment({ ...manualFallbackContext, reason: 'automation_failed' })
    })
  } else {
    // Everything else that was paid for but has no automated producer —
    // Site Plan before its bots are live, quote-scoped products, bundles
    // handled by hand. These used to fall through this branch silently.
    await routeToManualFulfillment({
      ...manualFallbackContext,
      reason: automationRoute ? 'automation_disabled' : 'no_automated_route',
    })
  }

  const resendApiKey = process.env.RESEND_API_KEY
  const amountCents = session.amount_total ?? 0
  const amountFormatted = (amountCents / 100).toFixed(2)
  const notificationEmail = clientEmail ?? 'unknown'

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
          `  Client:      ${clientName} <${notificationEmail}>`,
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

  if (clientEmail) {
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
