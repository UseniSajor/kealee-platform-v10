/**
 * POST /api/intake/redeem
 * Body: { intakeId?: string; projectPath: string; promoCode: string; validateOnly?: boolean }
 *
 * Validates a free promo code, marks the intake as paid,
 * and triggers concept generation — bypassing Stripe entirely.
 *
 * Valid codes are set via env INTAKE_FREE_CODES (comma-separated).
 * Falls back to the default testing code if the env var is not set.
 */

import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { SERVICE_DELIVERABLES } from '@/lib/service-deliverables'
import { sendPostPaymentCustomerEmail } from '@/lib/marketing/lifecycle'
import { recordPaidOrderIncident } from '@/lib/paid-order-incident'
import { requestCanonicalConceptGeneration } from '@/lib/concept-generation'
import { routeToManualFulfillment } from '@/lib/manual-fulfillment'
import { isSitePlanOrder, evaluateSitePlanOrder, sitePlanRuleFormData } from '@/lib/site-plan-rules'
import { activateSitePlanForOrder, sitePlanWorkflowFormData } from '@/lib/site-plan-workflow'
import { createSitePlanSlaFormData } from '@/lib/site-plan-sla'
import { orderStatusPatch } from '@/lib/order-status'
import {
  getConceptPackageDeliverableLabelsForIntake,
  renderCountForTier,
  type ConceptTier,
} from '@kealee/core-rules'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const DEFAULT_FREE_CODE = 'KEALEE-ALLIN-2026'

function validCodes(): string[] {
  const env = process.env.INTAKE_FREE_CODES ?? DEFAULT_FREE_CODE
  return env.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      intakeId?: string
      projectPath: string
      promoCode: string
      validateOnly?: boolean
      tier?: number
    }

    const { intakeId, projectPath, promoCode, validateOnly } = body
    const requestedTier = body.tier === 3 ? 3 : body.tier === 2 ? 2 : body.tier === 1 ? 1 : undefined

    if (!projectPath || !promoCode) {
      return NextResponse.json(
        { error: 'Project and promo code are required' },
        { status: 400 },
      )
    }

    if (!validCodes().includes(promoCode.trim().toUpperCase())) {
      return NextResponse.json({ error: 'Invalid promo code' }, { status: 400 })
    }

    if (validateOnly) {
      return NextResponse.json({ ok: true, free: true })
    }

    if (!intakeId) {
      return NextResponse.json({ error: 'Order information is required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    const { data: savedOrder, error: savedOrderError } = await supabase
      .from('public_intake_leads')
      .select('form_data, status, contact_email, client_name, project_address')
      .eq('id', intakeId)
      .eq('project_path', projectPath)
      .maybeSingle()

    if (savedOrderError || !savedOrder) {
      return NextResponse.json({ error: 'Your order is ready to be saved again' }, { status: 404 })
    }

    const savedFormData = (savedOrder.form_data as Record<string, unknown>) ?? {}
    const savedTier = savedFormData.tier
    const tier = (requestedTier ?? (savedTier === 3 ? 3 : savedTier === 2 ? 2 : 1)) as ConceptTier
    const deliverable = SERVICE_DELIVERABLES[projectPath]
    // A promo order is a real order: it gets the same record a paid one gets,
    // so the portal can say what was charged and margin stays measurable.
    const orderFields = {
      amountPaidCents: 0,
      amountPaidCurrency: 'usd',
      paidAt: new Date().toISOString(),
      pricingModel: 'promo_code',
      promoCode: promoCode.trim().toUpperCase(),
    }
    const formData = deliverable?.generatesConcept
      ? {
          ...savedFormData,
          ...orderFields,
          tier,
          renderCount: renderCountForTier(tier, deliverable.renderCount ?? 3),
          serviceIncludes: getConceptPackageDeliverableLabelsForIntake(projectPath, tier),
          funnelStage: 'paid_concept',
        }
      : { ...savedFormData, ...orderFields }
    const alreadyPaid = savedOrder.status === 'paid'

    // A promo order is fulfilled exactly like a paid one. The Stripe webhook is
    // where site-plan activation lived, and the promo path skips the webhook, so
    // without this a redeemed site plan sat at "Kealee is drafting your site
    // plan" forever: generatesConcept is false for every site-plan product, so
    // the concept branch below never fired and nothing was ever enqueued.
    //
    // Mirrors processStripeWebhookEvent: rules first, then workflow activation,
    // both of which fold their results into form_data before the single write.
    let sitePlanEngineActive = false
    if (isSitePlanOrder(projectPath)) {
      if (savedFormData.sitePlanSlaVersion !== 1) {
        Object.assign(formData, createSitePlanSlaFormData(projectPath, new Date(orderFields.paidAt)))
      }

      const ruleOutcome = evaluateSitePlanOrder({ intakeId, projectPath, formData })
      Object.assign(formData, sitePlanRuleFormData(ruleOutcome))
      if (ruleOutcome.error) {
        Sentry.captureMessage('Site plan rule engine failed on a promo order', {
          level: 'error',
          tags: { area: 'payment-fulfillment', stage: 'site-plan-rules', projectPath },
          extra: { intakeId, error: ruleOutcome.error },
        })
      } else {
        // The synchronous rule report is the promised first-hour property summary.
        Object.assign(formData, { sitePlanSummaryCompletedAt: new Date().toISOString() })
      }

      const activation = await activateSitePlanForOrder({
        projectId: intakeId,
        orderId: intakeId,
        productId: projectPath,
        isSitePlan: true,
        formData,
        // The address lives in the project_address COLUMN, not in form_data.
        // Without it every workflow blocks at resolve_property.
        projectAddress: (savedOrder.project_address as string | null) ?? null,
      })
      Object.assign(formData, sitePlanWorkflowFormData(activation))
      sitePlanEngineActive = ['CREATED', 'RESUMED', 'DUPLICATE', 'ALREADY_COMPLETE']
        .includes(activation.disposition)

      if (activation.disposition === 'FAILED') {
        Sentry.captureMessage('Site plan workflow activation failed on a promo order', {
          level: 'error',
          tags: { area: 'payment-fulfillment', stage: 'site-plan-workflow', projectPath },
          extra: { intakeId, summary: activation.summary },
        })
      }
      console.log(
        '[intake/redeem] site-plan workflow:', activation.disposition,
        activation.workflowId ?? '-', 'enqueued=' + activation.enqueued.join(','),
      )
    }

    Object.assign(formData, orderStatusPatch('processing', { actor: 'system' }))

    // Mark intake as paid and preserve the exact tier selected before the free checkout.
    const { data: updated, error: updateErr } = await supabase
      .from('public_intake_leads')
      .update({ status: 'paid', requires_payment: false, payment_amount: 0, form_data: formData })
      .eq('id', intakeId)
      .eq('project_path', projectPath)
      .select('id')
      .maybeSingle()

    if (updateErr) {
      console.error('[intake/redeem] Failed to mark intake as paid:', updateErr.message)
      return NextResponse.json({ error: 'We could not finish your free order. Please try again.' }, { status: 500 })
    }
    if (!updated) {
      return NextResponse.json({ error: 'We could not find your saved order. Please try again.' }, { status: 404 })
    }

    // A serverless invocation can end as soon as its response is returned, so a
    // detached fetch is not a durable fulfillment trigger. Wait until the
    // canonical generator has accepted the paid order before confirming the
    // redemption. If dispatch is unavailable, record an explicit human handoff
    // instead of leaving the customer on an endless "generating" screen.
    let generationState: 'accepted' | 'ready' | 'manual' | 'not_applicable' = 'not_applicable'
    if (deliverable?.generatesConcept) {
      try {
        const generation = await requestCanonicalConceptGeneration(intakeId)
        generationState = generation.state
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error)
        console.error('[intake/redeem] Concept generation trigger failed:', detail)
        await routeToManualFulfillment({
          intakeId,
          projectPath,
          reason: 'automation_failed',
          stripeSessionId: `promo:${promoCode.trim().toUpperCase()}`,
          customerEmail: (savedOrder.contact_email as string | null) ?? null,
          detail: `Promo order generation was not accepted (${detail}). Order routed to the human fulfillment queue.`,
        })
        generationState = 'manual'
      }
    } else if (sitePlanEngineActive) {
      // The engine owns fulfilment: the worker drains the queue and its
      // delivery bridge adds the human review step for the tiers that include
      // it. Sending this to the manual queue too would tell ops to draft a
      // plan the engine is already drafting.
      generationState = 'accepted'
      console.log('[intake/redeem] site-plan engine owns fulfilment', intakeId)
    } else {
      // Everything else that was redeemed but has no automated producer — a
      // quote-scoped product, a bundle handled by hand, or a site-plan order
      // whose workflow failed to activate. The Stripe path routes these to a
      // human; the promo path used to drop them silently.
      await routeToManualFulfillment({
        intakeId,
        projectPath,
        reason: 'no_automated_route',
        stripeSessionId: `promo:${promoCode.trim().toUpperCase()}`,
        customerEmail: (savedOrder.contact_email as string | null) ?? null,
      })
      generationState = 'manual'
    }

    // The confirmation email is owed on every completed order, not only the
    // ones that went through Stripe. The promo path skips the webhook, so it
    // must send the same email the webhook would have sent.
    const clientEmail = (savedOrder.contact_email as string | null) ?? null
    if (clientEmail && !alreadyPaid) {
      const sent = await sendPostPaymentCustomerEmail({
        intakeId,
        email: clientEmail,
        clientName: (savedOrder.client_name as string | null) ?? 'Customer',
        projectPath,
      })
      if (!sent) {
        await recordPaidOrderIncident({
          intakeId,
          projectPath,
          stripeSessionId: `promo:${promoCode.trim().toUpperCase()}`,
          stage: 'customer-confirmation-email',
          error: 'Resend did not accept the confirmation email for a promo order',
          customerEmail: clientEmail,
        })
      }
    }

    console.log(`[intake/redeem] Promo code redeemed intakeId=${intakeId} path=${projectPath}`)

    return NextResponse.json({ ok: true, intakeId, tier, generationState })
  } catch (err: any) {
    console.error('[intake/redeem]', err?.message)
    return NextResponse.json({ error: 'Redemption failed' }, { status: 500 })
  }
}
