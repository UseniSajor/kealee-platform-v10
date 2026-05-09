import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { guardStripeSecretForHttp } from '@/lib/stripe-vercel-guard'
import { getIntakePrice, SITE_VISIT_FEE_CENTS } from '@kealee/core-rules'

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
      successUrl: string
      cancelUrl: string
      siteVisitRequested?: boolean
      // Legacy `amount` field is accepted for backward compatibility
      // but explicitly NOT used. Server price is authoritative.
      amount?: number
    }

    const { intakeId, projectPath, successUrl, cancelUrl, siteVisitRequested } = body

    if (!intakeId || !projectPath || !successUrl || !cancelUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Server-trusted price lookup. Reject unknown SKUs outright — never let
    // an untyped projectPath through to Stripe.
    const priceEntry = getIntakePrice(projectPath)
    if (!priceEntry) {
      return NextResponse.json(
        { error: `Unknown projectPath: ${projectPath}` },
        { status: 400 }
      )
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (!stripeKey) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
    }

    const guard = guardStripeSecretForHttp(stripeKey)
    if (guard) return guard

    const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' as any })

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price_data: {
          currency: 'usd',
          unit_amount: priceEntry.cents,
          product_data: { name: priceEntry.label },
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

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      allow_promotion_codes: true,
      line_items: lineItems,
      metadata: {
        source: 'public_intake',
        intakeId,
        projectPath,
        siteVisitRequested: siteVisitRequested ? 'true' : 'false',
      },
      payment_intent_data: {
        metadata: {
          source: 'public_intake',
          intakeId,
          projectPath,
        },
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('[intake/checkout]', err?.message)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
