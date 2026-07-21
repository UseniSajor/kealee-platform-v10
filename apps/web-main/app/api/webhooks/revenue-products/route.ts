import { NextRequest, NextResponse } from 'next/server'
import { createStripe } from '@/lib/stripe-client'
import { verifyStripeWebhookEvent } from '@/lib/stripe-webhook-verify'
import { fulfillRevenueProduct } from '@/lib/revenue-fulfillment'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const key = process.env.STRIPE_SECRET_KEY
  const signature = req.headers.get('stripe-signature')
  if (!key || !signature) return NextResponse.json({ error: 'Stripe webhook not configured' }, { status: 503 })
  try {
    const event = verifyStripeWebhookEvent(createStripe(key), await req.text(), signature)
    if (event.type === 'checkout.session.completed') await fulfillRevenueProduct(event.data.object as import('stripe').default.Checkout.Session)
    return NextResponse.json({ received: true, eventId: event.id })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Webhook failed' }, { status: 400 })
  }
}
