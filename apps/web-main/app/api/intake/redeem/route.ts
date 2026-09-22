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
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { SERVICE_DELIVERABLES } from '@/lib/service-deliverables'
import { sendPostPaymentCustomerEmail } from '@/lib/marketing/lifecycle'
import { recordPaidOrderIncident } from '@/lib/paid-order-incident'
import {
  getConceptPackageDeliverableLabelsForIntake,
  renderCountForTier,
  type ConceptTier,
} from '@kealee/core-rules'

export const dynamic = 'force-dynamic'

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
      .select('form_data, status, contact_email, client_name')
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

    // Trigger concept generation fire-and-forget (mirrors Stripe webhook behaviour)
    if (deliverable?.generatesConcept) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin
      fetch(`${baseUrl}/api/concept/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intakeId }),
      }).catch((err: Error) => {
        console.error('[intake/redeem] Concept generation trigger failed:', err.message)
      })
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

    return NextResponse.json({ ok: true, intakeId, tier })
  } catch (err: any) {
    console.error('[intake/redeem]', err?.message)
    return NextResponse.json({ error: 'Redemption failed' }, { status: 500 })
  }
}
