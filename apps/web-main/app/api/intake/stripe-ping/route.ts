import { NextResponse } from 'next/server'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

export async function GET() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return NextResponse.json({ error: 'no key' })
  try {
    const stripe = new Stripe(key, { apiVersion: '2024-06-20' as any })
    const bal = await stripe.balance.retrieve()
    return NextResponse.json({ ok: true, available: bal.available[0]?.amount })
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err?.message, type: err?.type, code: err?.code })
  }
}
