import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

// Map product slugs to Stripe price env var names
// NOTE: Some products may not have Stripe configured yet — checkout returns 503
const PRICE_ENV_MAP: Record<string, string> = {
  // AI/Design — Estimation Services
  'ai-design':           'STRIPE_PRICE_CONCEPT',           // $395 - EST_BASIC equivalent
  'whole-home':          'STRIPE_PRICE_WHOLE_HOME',        // $585 - EST_STANDARD equivalent
  'kitchen-remodel':     'STRIPE_PRICE_KITCHEN',           // $395 - EST_BASIC equivalent
  'bath-remodel':        'STRIPE_PRICE_BATH',              // $395 - EST_BASIC equivalent
  'interior-reno':       'STRIPE_PRICE_INTERIOR',          // $395 - EST_BASIC equivalent
  'exterior':            'STRIPE_PRICE_EXTERIOR',          // $395 - EST_BASIC equivalent
  'garden':              'STRIPE_PRICE_GARDEN',            // $395 - EST_BASIC equivalent
  'landscape':           'STRIPE_PRICE_LANDSCAPE',         // $395 - EST_BASIC equivalent
  'basement':            'STRIPE_PRICE_BASEMENT',          // $395 - EST_BASIC equivalent
  'adu':                 'STRIPE_PRICE_ADU',               // $395 - EST_BASIC equivalent
  'tiny-home':           'STRIPE_PRICE_TINY_HOME',         // $395 - EST_BASIC equivalent
  'new-build':           'STRIPE_PRICE_NEW_BUILD',         // $395 - EST_BASIC equivalent
  'design-starter':      'STRIPE_PRICE_DESIGN_STARTER',    // $695 - EST_STANDARD equivalent
  'design-visualization':'STRIPE_PRICE_DESIGN_VIZ',        // $695 - EST_STANDARD equivalent
  'design-full':         'STRIPE_PRICE_DESIGN_FULL',       // $1,200+ - Custom
  
  // Permits — On-Demand Services
  'permit-package':      'STRIPE_PRICE_OD_PERMIT_APP',     // $325 - OD Permit Application
  'permit-research':     'STRIPE_PRICE_PERMIT_RESEARCH',   // $149-$297 - OD Scope Review
  'permit-coordination': 'STRIPE_PRICE_OD_CONTRACTOR_COORD',// $500 - OD Contractor Coordination
  'permit-expediting':   'STRIPE_PRICE_PERMIT_EXPEDITING', // $1,997 - Custom
  
  // Estimation — Estimation Services
  'cost-estimate':       'STRIPE_PRICE_EST_STANDARD',      // $595 - EST_STANDARD
  'certified-estimate':  'STRIPE_PRICE_EST_CERTIFIED',     // $1,850 - Custom
  
  // Construction & PM — Monthly Packages
  'pm-advisory':         'STRIPE_PRICE_OD_PROGRESS_REPORT',// $250 - OD Progress Reporting (monthly proxy)
  'pm-oversight':        'STRIPE_PRICE_OD_SCHEDULE_OPT',   // $1,250 - OD Schedule Optimization
  'historic-renovation': 'STRIPE_PRICE_HISTORIC',          // $1,500 - Custom
  
  // Bundles & Specialty
  'adu-bundle':          'STRIPE_PRICE_ADU_BUNDLE',        // $1,345 - Custom bundle
  'water-mitigation':    'STRIPE_PRICE_WATER_MITIGATION',  // $395 - EST_BASIC equivalent
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

    const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' as any })

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
