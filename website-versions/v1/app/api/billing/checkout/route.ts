import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

type GCPlanSlug = 'package-a' | 'package-b' | 'package-c' | 'package-d'
type BillingInterval = 'month' | 'year'

/**
 * Get Stripe price ID for a plan and billing interval
 * Uses environment variables: STRIPE_PRICE_PACKAGE_{A|B|C|D}_{MONTH|YEAR}
 */
function getPriceIdForPlan(planSlug: GCPlanSlug, interval: BillingInterval): string {
  const packageUpper = planSlug.toUpperCase().replace('-', '_')
  const intervalUpper = interval.toUpperCase()
  const key = `STRIPE_PRICE_PACKAGE_${packageUpper}_${intervalUpper}`
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing Stripe price env var: ${key}`)
  }
  return value
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      planSlug: GCPlanSlug
      interval: BillingInterval
      orgId: string
      customerEmail?: string
      successUrl?: string
      cancelUrl?: string
    }

    const { planSlug, interval, orgId, customerEmail, successUrl, cancelUrl } = body

    // Validate inputs
    if (!planSlug || !interval || !orgId) {
      return NextResponse.json(
        { error: 'Missing required fields: planSlug, interval, orgId' },
        { status: 400 }
      )
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (!stripeKey) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    // Get price ID from env vars
    let priceId: string
    try {
      priceId = getPriceIdForPlan(planSlug, interval)
    } catch (err) {
      return NextResponse.json(
        { error: 'Plan not configured' },
        { status: 500 }
      )
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' as any })

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          orgId,
          planSlug,
          interval,
          moduleKey: 'm-ops-services',
        },
      },
      metadata: {
        orgId,
        planSlug,
        interval,
      },
      customer_email: customerEmail,
      allow_promotion_codes: true,
      success_url: successUrl ?? `${req.nextUrl.origin}/dashboard/billing?success=true`,
      cancel_url: cancelUrl ?? `${req.nextUrl.origin}/checkout`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('[api/billing/checkout]', err?.message)
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 })
  }
}
