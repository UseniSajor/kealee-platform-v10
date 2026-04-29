import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const TIER_AMOUNTS: Record<string, { amount: number; name: string }> = {
  simple:       { amount: 29700,  name: 'Permit Research' },
  package:      { amount: 49700,  name: 'Full Permit Package' },
  coordination: { amount: 99700,  name: 'Permit Coordination' },
  expediting:   { amount: 199700, name: 'Expedited Filing' },
}

export async function POST(req: NextRequest) {
  try {
    const { tier, intakeId, successUrl, cancelUrl } = await req.json() as {
      tier: string
      intakeId: string
      successUrl: string
      cancelUrl: string
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (!stripeKey) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    const tierData = TIER_AMOUNTS[tier]
    if (!tierData) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
    }

    // Verify intake hasn't been blocked for unavailability (safety check)
    // This shouldn't happen since frontend also checks, but double-check here
    if (intakeId && intakeId !== 'pending') {
      const apiUrl = process.env.INTERNAL_API_URL || 'https://api.kealee.com'
      try {
        const intakeCheck = await fetch(`${apiUrl}/api/v1/permits/intake/${intakeId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        })

        if (!intakeCheck.ok && intakeCheck.status === 400) {
          const error = await intakeCheck.json()
          if (error.error === 'SERVICE_NOT_AVAILABLE') {
            return NextResponse.json(
              { error: 'SERVICE_UNAVAILABLE', message: error.message },
              { status: 400 }
            )
          }
        }
      } catch (err) {
        // Fail-open: allow checkout to proceed if verification fails
        console.warn('[permits/checkout] Availability verification failed (non-blocking):', err)
      }
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' as any })

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: tierData.amount,
            product_data: { name: `Kealee ${tierData.name}` },
          },
          quantity: 1,
        },
      ],
      metadata: { source: 'permit-package', tier, intakeId: intakeId ?? 'pending' },
      payment_intent_data: {
        metadata: {
          source: 'permit-package',
          intakeId: intakeId ?? 'pending',
          projectPath: tier,
        },
      },
      success_url: successUrl ?? `${req.nextUrl.origin}/permits/success`,
      cancel_url:  cancelUrl  ?? `${req.nextUrl.origin}/permits?canceled=true`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('[permits/checkout]', err?.message)
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 })
  }
}
