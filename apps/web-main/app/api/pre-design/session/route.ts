import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-12-18.acacia' })

const PRICE_MAP: Record<string, Record<string, string | undefined>> = {
  starter: {
    exterior: process.env.STRIPE_PRICE_DESIGN_STARTER_EXTERIOR,
    interior: process.env.STRIPE_PRICE_DESIGN_STARTER_INTERIOR,
    landscape: process.env.STRIPE_PRICE_DESIGN_STARTER_LANDSCAPE,
    _default: process.env.STRIPE_PRICE_DESIGN_STARTER,
  },
  visualization: {
    exterior: process.env.STRIPE_PRICE_DESIGN_VISUALIZATION_EXTERIOR,
    interior: process.env.STRIPE_PRICE_DESIGN_VISUALIZATION_INTERIOR,
    landscape: process.env.STRIPE_PRICE_DESIGN_VISUALIZATION_LANDSCAPE,
    _default: process.env.STRIPE_PRICE_DESIGN_VISUALIZATION,
  },
  'pre-design': {
    exterior: process.env.STRIPE_PRICE_DESIGN_PREDESIGN_EXTERIOR,
    interior: process.env.STRIPE_PRICE_DESIGN_PREDESIGN_INTERIOR,
    landscape: process.env.STRIPE_PRICE_DESIGN_PREDESIGN_LANDSCAPE,
    _default: process.env.STRIPE_PRICE_DESIGN_PREDESIGN,
  },
}

const FALLBACK_PRICES: Record<string, Record<string, number>> = {
  starter: { exterior: 14900, interior: 14900, landscape: 14900 },
  visualization: { exterior: 39500, interior: 39500, landscape: 39500 },
  'pre-design': { exterior: 95000, interior: 95000, landscape: 95000 },
}

const TYPE_PRISMA_MAP: Record<string, string> = {
  exterior: 'EXTERIOR_FACADE',
  interior: 'INTERIOR_ADDITION',
  landscape: 'LANDSCAPE_OUTDOOR',
}

const TIER_PRISMA_MAP: Record<string, string> = {
  starter: 'STARTER',
  visualization: 'VISUALIZATION',
  'pre-design': 'PRE_DESIGN',
}

export async function POST(req: NextRequest) {
  try {
    const { projectType, tier, contactName, contactEmail, propertyAddress, notes } = await req.json()

    if (!projectType || !tier || !contactEmail) {
      return NextResponse.json({ error: 'projectType, tier, and contactEmail are required' }, { status: 400 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kealee.com'

    // Build Stripe checkout session
    const tierConfig = PRICE_MAP[tier] ?? {}
    const priceId = tierConfig[projectType] ?? tierConfig['_default']

    let session: Stripe.Checkout.Session

    const metadata: Record<string, string> = {
      source: 'pre-design',
      projectType,
      tier,
      contactName: contactName ?? '',
      contactEmail,
      propertyAddress: propertyAddress ?? '',
      notes: (notes ?? '').slice(0, 500),
    }

    if (priceId) {
      session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer_email: contactEmail,
        line_items: [{ price: priceId, quantity: 1 }],
        metadata,
        success_url: `${appUrl}/pre-design/processing/{CHECKOUT_SESSION_ID}?source=stripe`,
        cancel_url: `${appUrl}/pre-design/${projectType}/checkout?tier=${tier}&cancelled=1`,
      })
    } else {
      // Fallback: create a price on-the-fly from unit_amount
      const unitAmount = FALLBACK_PRICES[tier]?.[projectType] ?? 39500
      const tierLabels: Record<string, string> = {
        starter: 'Starter', visualization: 'Visualization', 'pre-design': 'Pre-Design',
      }
      const typeLabels: Record<string, string> = {
        exterior: 'Exterior Facade', interior: 'Interior Addition', landscape: 'Landscape & Outdoor',
      }
      session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer_email: contactEmail,
        line_items: [
          {
            price_data: {
              currency: 'usd',
              unit_amount: unitAmount,
              product_data: {
                name: `${typeLabels[projectType] ?? projectType} — ${tierLabels[tier] ?? tier} Package`,
                description: 'AI Pre-Design Package by Kealee',
              },
            },
            quantity: 1,
          },
        ],
        metadata,
        success_url: `${appUrl}/pre-design/processing/{CHECKOUT_SESSION_ID}?source=stripe`,
        cancel_url: `${appUrl}/pre-design/${projectType}/checkout?tier=${tier}&cancelled=1`,
      })
    }

    return NextResponse.json({ checkoutUrl: session.url, sessionId: session.id })
  } catch (err: any) {
    console.error('[api/pre-design/session] Error:', err)
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 })
  }
}
