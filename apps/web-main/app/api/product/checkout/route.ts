import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

// Map product slugs to Stripe price env var names
// NOTE: Some products may not have Stripe configured yet — checkout returns 503
const PRICE_ENV_MAP: Record<string, string> = {
  // AI/Design
  'ai-design':           'STRIPE_PRICE_CONCEPT_VALIDATION',
  'whole-home':          'STRIPE_PRICE_CONCEPT_VALIDATION',
  'kitchen-remodel':     'STRIPE_PRICE_KITCHEN_REMODEL',
  'bath-remodel':        'STRIPE_PRICE_BATH_REMODEL',
  'interior-reno':       'STRIPE_PRICE_INTERIOR_RENO',
  'exterior':            'STRIPE_PRICE_EXTERIOR',
  'garden':              'STRIPE_PRICE_GARDEN',
  'landscape':           'STRIPE_PRICE_LANDSCAPE',
  'basement':            'STRIPE_PRICE_BASEMENT_CONCEPT',
  'adu':                 'STRIPE_PRICE_ADU',
  'tiny-home':           'STRIPE_PRICE_TINY_HOME',
  'new-build':           'STRIPE_PRICE_NEW_BUILD',
  'design-starter':      'STRIPE_PRICE_DESIGN_STARTER',
  'design-visualization':'STRIPE_PRICE_DESIGN_VISUALIZATION',
  'design-full':         'STRIPE_PRICE_DESIGN_FULL',
  
  // Permits
  'permit-package':      'STRIPE_PRICE_PERMIT_PACKAGE',
  'permit-research':     'STRIPE_PRICE_PERMIT_SIMPLE',
  
  // Estimation
  'cost-estimate':       'STRIPE_PRICE_COST_ESTIMATE',
  'certified-estimate':  'STRIPE_PRICE_CERTIFIED_ESTIMATE',
  
  // Construction & PM
  'pm-advisory':         'STRIPE_PRICE_PM_ADVISORY',
  'pm-oversight':        'STRIPE_PRICE_PM_OVERSIGHT',
  'historic-renovation': 'STRIPE_PRICE_HISTORIC_RENOVATION',
  
  // Bundles & Specialty
  'adu-bundle':          'STRIPE_PRICE_ADU_BUNDLE',
  'water-mitigation':    'STRIPE_PRICE_WATER_MITIGATION',
}

export async function POST(req: NextRequest) {
  try {
    const { slug, customerEmail, customerName, productName } = await req.json() as {
      slug: string
      customerEmail: string
      customerName: string
      productName?: string
    }

    if (!slug || !customerEmail) {
      return NextResponse.json({ error: 'slug and customerEmail required' }, { status: 400 })
    }

    const envVar = PRICE_ENV_MAP[slug]
    if (!envVar) {
      return NextResponse.json({ error: 'Product does not support direct checkout' }, { status: 400 })
    }

    const priceId = process.env[envVar]
    if (!priceId) {
      // Env var not set — fall back to inline amount lookup so checkout still works
      return NextResponse.json({ error: `Stripe price not configured (${envVar})` }, { status: 503 })
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (!stripeKey) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://kealee.com'

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: customerEmail,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/products/success?session_id={CHECKOUT_SESSION_ID}&product=${encodeURIComponent(slug)}`,
      cancel_url: `${appUrl}/products/${encodeURIComponent(slug)}?cancelled=1`,
      metadata: {
        source: 'product-order',
        productSlug: slug,
        productName: productName ?? slug,
        customerEmail,
        customerName: customerName ?? '',
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('[product/checkout]', err?.message)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
