import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { guardStripeSecretForHttp } from '@/lib/stripe-vercel-guard'
import { createStripe } from '@/lib/stripe-client'
import { getIntakePrice, SITE_VISIT_FEE_CENTS, getBundleCheckoutCents, isBundleProductKey } from '@kealee/core-rules'
import { isV30Enabled } from '@kealee/kealee-agent-stack'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { trackCheckoutStarted } from '@/lib/marketing/ga4-server'
import { parseUtmFromBody } from '@/lib/marketing/utm-metadata'

export const dynamic = 'force-dynamic'

/**
 * POST /api/intake/checkout
 *
 * Creates a Stripe Checkout Session for an intake-driven purchase.
 *
 * SECURITY: The price is looked up server-side from `@kealee/core-rules`
 * via `projectPath`. Any `amount` in the request body is IGNORED — the
 * client cannot influence what they pay. (P0-1 fix, audit 2026-05-09.)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      intakeId: string
      projectPath: string
      successUrl?: string
      cancelUrl?: string
      returnUrl?: string    // used for embedded mode (replaces success/cancel)
      embedded?: boolean    // true → ui_mode:'embedded', returns clientSecret
      siteVisitRequested?: boolean
      /** Source concept intake — used for project-type bundle pricing */
      sourcePath?: string
      upsellSourceIntakeId?: string
      // Legacy `amount` field is accepted for backward compatibility
      // but explicitly NOT used. Server price is authoritative.
      amount?: number
    }

    const { intakeId, projectPath, successUrl, cancelUrl, returnUrl, embedded, siteVisitRequested, useV30Pricing, sourcePath, upsellSourceIntakeId } = body

    if (!intakeId || !projectPath) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (embedded && !returnUrl) {
      return NextResponse.json({ error: 'returnUrl required for embedded checkout' }, { status: 400 })
    }
    if (!embedded && (!successUrl || !cancelUrl)) {
      return NextResponse.json({ error: 'successUrl and cancelUrl required for hosted checkout' }, { status: 400 })
    }

    let unitAmountCents: number
    let productName: string

    if (useV30Pricing && isV30Enabled()) {
      const supabase = getSupabaseAdmin()
      const { data: intakeRow } = await supabase
        .from('public_intake_leads')
        .select('form_data')
        .eq('id', intakeId)
        .single()

      const formData = (intakeRow?.form_data as Record<string, unknown>) ?? {}
      const v30Quote = formData.v30Quote as { totalPriceCents?: number; features?: string[] } | undefined
      const quoted = v30Quote?.totalPriceCents

      if (!quoted || quoted < 9900 || quoted > 999_900) {
        return NextResponse.json(
          { error: 'Invalid or missing v30 quote — complete /get-concept intake first' },
          { status: 400 },
        )
      }
      unitAmountCents = Math.round(quoted)
      productName = `Kealee Custom Package (${(v30Quote?.features ?? []).join(', ') || 'v30'})`
    } else if (isBundleProductKey(projectPath) && sourcePath) {
      const bundle = getBundleCheckoutCents(
        projectPath as 'design_estimate_permit_bundle' | 'estimate_permit_bundle',
        sourcePath,
      )
      if (!bundle.cents) {
        return NextResponse.json({ error: 'Invalid bundle pricing' }, { status: 400 })
      }
      unitAmountCents = bundle.cents
      productName = bundle.label
    } else {
      // Server-trusted tier price (v20)
      const priceEntry = getIntakePrice(projectPath)
      if (!priceEntry) {
        return NextResponse.json(
          { error: `Unknown projectPath: ${projectPath}` },
          { status: 400 },
        )
      }
      unitAmountCents = priceEntry.cents
      productName = priceEntry.label
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (!stripeKey) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
    }

    const guard = guardStripeSecretForHttp(stripeKey)
    if (guard) return guard

    const stripe = createStripe(stripeKey)

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price_data: {
          currency: 'usd',
          unit_amount: unitAmountCents,
          product_data: { name: productName },
        },
        quantity: 1,
      },
    ]

    if (siteVisitRequested) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          unit_amount: SITE_VISIT_FEE_CENTS,
          product_data: { name: 'Kealee Site Visit Scan' },
        },
        quantity: 1,
      })
    }

    const commonParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      payment_method_types: ['card'],
      allow_promotion_codes: true,
      line_items: lineItems,
      metadata: {
        source: useV30Pricing ? 'public_intake_v30' : 'public_intake',
        intakeId,
        projectPath,
        siteVisitRequested: siteVisitRequested ? 'true' : 'false',
        pricingModel: useV30Pricing ? 'v30_dynamic' : 'tier_fixed',
        ...(sourcePath ? { sourcePath } : {}),
        ...(upsellSourceIntakeId ? { upsellSourceIntakeId } : {}),
        ...(isBundleProductKey(projectPath) ? { bundlePurchase: 'true' } : {}),
      },
      payment_intent_data: {
        metadata: {
          source: useV30Pricing ? 'public_intake_v30' : 'public_intake',
          intakeId,
          projectPath,
          pricingModel: useV30Pricing ? 'v30_dynamic' : 'tier_fixed',
          ...(sourcePath ? { sourcePath } : {}),
          ...(upsellSourceIntakeId ? { upsellSourceIntakeId } : {}),
          ...(isBundleProductKey(projectPath) ? { bundlePurchase: 'true' } : {}),
        },
      },
    }

    const totalCents =
      unitAmountCents + (siteVisitRequested ? SITE_VISIT_FEE_CENTS : 0)

    let checkoutUtm = parseUtmFromBody(body as Record<string, unknown>)
    try {
      const supabase = getSupabaseAdmin()
      const { data: intakeRow } = await supabase
        .from('public_intake_leads')
        .select('metadata, form_data')
        .eq('id', intakeId)
        .single()
      const bag = {
        ...((intakeRow?.metadata as Record<string, unknown>) ?? {}),
        ...((intakeRow?.form_data as Record<string, unknown>) ?? {}),
      }
      checkoutUtm = parseUtmFromBody(bag)
    } catch {
      // non-fatal
    }

    void trackCheckoutStarted({
      intakeId,
      projectPath,
      valueCents: totalCents,
      utm: checkoutUtm,
    })

    if (embedded) {
      // Embedded checkout — Stripe renders the card form inside our page
      const session = await stripe.checkout.sessions.create({
        ...commonParams,
        ui_mode: 'embedded',
        return_url: returnUrl!,
      })
      return NextResponse.json({ clientSecret: session.client_secret })
    }

    // Hosted checkout — redirect to Stripe's hosted page (fallback / legacy)
    const session = await stripe.checkout.sessions.create({
      ...commonParams,
      success_url: successUrl!,
      cancel_url: cancelUrl!,
    })
    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('[intake/checkout]', err?.message, err?.type, err?.code)
    return NextResponse.json({ error: 'Failed to create checkout session', detail: err?.message, type: err?.type, code: err?.code }, { status: 500 })
  }
}
