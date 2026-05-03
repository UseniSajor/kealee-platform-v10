/**
 * POST /api/bundle/checkout
 *
 * Creates a Stripe Checkout session for the $10 Full-Stack Design Bundle.
 * Includes: Design Concept + Cost Estimation + Permit Deliverables.
 *
 * Promo code KEALEE-BUNDLE-TEST (100% off, 500 uses) works via allow_promotion_codes.
 *
 * Required env vars:
 *   STRIPE_SECRET_KEY
 *   STRIPE_PRICE_BUNDLE_TEST  (price_1TSpveIQghAs8OOIHZwsAVsH)
 *   NEXT_PUBLIC_APP_URL       (redirect base)
 */

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  try {
    const { customerEmail, customerName } = await req.json() as {
      customerEmail: string
      customerName?: string
    }

    if (!customerEmail) {
      return NextResponse.json({ error: 'customerEmail required' }, { status: 400 })
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY
    const priceId = process.env.STRIPE_PRICE_BUNDLE_TEST

    if (!stripeKey) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
    }
    if (!priceId) {
      return NextResponse.json({ error: 'Bundle price not configured (STRIPE_PRICE_BUNDLE_TEST)' }, { status: 503 })
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' as any })
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: customerEmail,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      metadata: {
        source: 'bundle',
        includes: 'concept,estimation,permits',
        customerEmail,
        customerName: customerName ?? '',
      },
      payment_intent_data: {
        metadata: {
          source: 'bundle',
          includes: 'concept,estimation,permits',
        },
      },
      success_url: `${appUrl}/bundle/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/bundle?cancelled=1`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('[bundle/checkout]', err?.message)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
