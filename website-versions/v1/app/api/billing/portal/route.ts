import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      customerId: string
      returnUrl: string
    }

    const { customerId, returnUrl } = body

    if (!customerId || !returnUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: customerId, returnUrl' },
        { status: 400 }
      )
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (!stripeKey) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' as any })

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('[api/billing/portal]', err?.message)
    return NextResponse.json({ error: 'Portal session failed' }, { status: 500 })
  }
}
