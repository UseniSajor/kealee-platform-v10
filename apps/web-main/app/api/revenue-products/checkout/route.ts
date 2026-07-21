import { NextRequest, NextResponse } from 'next/server'
import { createStripe } from '@/lib/stripe-client'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { getRevenueProduct } from '@/lib/revenue-product-catalog'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as { productKey?: string; email?: string; name?: string; address?: string } | null
  const product = getRevenueProduct(body?.productKey ?? '')
  if (!product || !body?.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) return NextResponse.json({ error: 'Valid product and email required' }, { status: 400 })
  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  const supabase = getSupabaseAdmin()
  const { data: intake, error } = await supabase.from('public_intake_leads').insert({
    project_path: product.productKey, client_name: body.name?.trim() || body.email.split('@')[0],
    contact_email: body.email.trim().toLowerCase(), project_address: body.address?.trim() || 'Not yet provided',
    budget_range: 'Not provided', source: 'revenue_product', status: 'new', requires_payment: true,
    payment_amount: product.priceCents,
    form_data: { revenueProductKey: product.productKey, propertyIntelligenceDepth: product.propertyIntelDepth, fulfillmentBotTypes: product.botTypes },
  }).select('id').single()
  if (error || !intake) return NextResponse.json({ error: 'Unable to create product intake' }, { status: 500 })
  const stripe = createStripe(stripeKey)
  const configuredPrice = process.env[product.stripePriceEnvVar]
  const lineItem = configuredPrice
    ? { price: configuredPrice, quantity: 1 }
    : { price_data: { currency: 'usd', unit_amount: product.priceCents, product_data: { name: product.name } }, quantity: 1 }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin
  const session = await stripe.checkout.sessions.create({
    mode: 'payment', customer_email: body.email, line_items: [lineItem],
    success_url: `${appUrl}/products/success?session_id={CHECKOUT_SESSION_ID}&product=${product.productKey}`,
    cancel_url: `${appUrl}/products/${product.productKey}?cancelled=1`,
    metadata: { source: 'revenue_product', intakeId: intake.id, productKey: product.productKey, propertyIntelligenceDepth: product.propertyIntelDepth, workflowTemplateId: product.workflowTemplateId },
  })
  return NextResponse.json({ url: session.url, intakeId: intake.id })
}

