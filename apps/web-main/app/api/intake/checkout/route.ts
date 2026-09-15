import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { guardStripeSecretForHttp } from '@/lib/stripe-vercel-guard'
import { createStripe } from '@/lib/stripe-client'
import { getIntakePrice, getIntakePriceByTier, SITE_VISIT_FEE_CENTS, getBundleCheckoutCents, isBundleProductKey } from '@kealee/core-rules'
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
      /** Whether to price this checkout from a v30 dynamic quote in form_data. */
      useV30Pricing?: boolean
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
    let checkoutTier: number | undefined
    /** What actually priced this session. Recorded in metadata for the webhook. */
    let pricingModel: 'v30_dynamic' | 'tier_fixed' | 'bundle' = 'tier_fixed'

    // A dynamic quote prices the session when one exists. When it does not —
    // the quote step failed, the flag is on server-side but the funnel never
    // built one, an older intake — the customer is NOT turned away: the price
    // falls back to the server-trusted tier table below. This used to return
    // 400 "Invalid or missing v30 quote", which failed checkout for every
    // service on the /concept funnel whenever the quote was absent.
    let v30Quoted: { cents: number; label: string } | null = null
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

      if (quoted && quoted >= 9900 && quoted <= 999_900) {
        v30Quoted = {
          cents: Math.round(quoted),
          label: `Kealee Custom Package (${(v30Quote?.features ?? []).join(', ') || 'v30'})`,
        }
      } else {
        console.warn(
          '[intake/checkout] v30 pricing requested but no valid quote on intake; ' +
          'pricing from the tier table instead.', intakeId, projectPath, quoted ?? null,
        )
      }
    }

    if (v30Quoted) {
      unitAmountCents = v30Quoted.cents
      productName = v30Quoted.label
      pricingModel = 'v30_dynamic'
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
      pricingModel = 'bundle'
    } else {
      // Server-trusted tier price (v20) — read tier from intake form_data
      try {
        const supabase = getSupabaseAdmin()
        const { data: tierRow } = await supabase
          .from('public_intake_leads')
          .select('form_data')
          .eq('id', intakeId)
          .single()
        checkoutTier = ((tierRow?.form_data as Record<string, unknown>) ?? {}).tier as number | undefined
      } catch { /* non-fatal — falls back to flat price */ }

      const priceEntry = checkoutTier
        ? getIntakePriceByTier(projectPath, checkoutTier)
        : getIntakePrice(projectPath)
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
        source: pricingModel === 'v30_dynamic' ? 'public_intake_v30' : 'public_intake',
        intakeId,
        projectPath,
        siteVisitRequested: siteVisitRequested ? 'true' : 'false',
        pricingModel,
        ...(checkoutTier ? { tier: String(checkoutTier) } : {}),
        ...(sourcePath ? { sourcePath } : {}),
        ...(upsellSourceIntakeId ? { upsellSourceIntakeId } : {}),
        ...(isBundleProductKey(projectPath) ? { bundlePurchase: 'true' } : {}),
      },
      payment_intent_data: {
        metadata: {
          source: pricingModel === 'v30_dynamic' ? 'public_intake_v30' : 'public_intake',
          intakeId,
          projectPath,
          pricingModel,
          ...(checkoutTier ? { tier: String(checkoutTier) } : {}),
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
