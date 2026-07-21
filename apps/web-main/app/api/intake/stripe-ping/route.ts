import { NextResponse } from 'next/server'
import { createStripe } from '@/lib/stripe-client'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const key = process.env.STRIPE_SECRET_KEY ?? 'missing'
  const nodeVersion = process.version

  // Test 1: native global fetch
  let fetchResult: { ok: boolean; status?: number; error?: string } = { ok: false }
  try {
    const res = await (globalThis.fetch as typeof fetch)('https://api.stripe.com/v1/balance', {
      // @ts-ignore — bypass Next.js cache for this diagnostic
      cache: 'no-store',
      headers: { Authorization: `Bearer ${key}` },
    })
    fetchResult = { ok: res.status === 200, status: res.status }
  } catch (e: any) {
    fetchResult = { ok: false, error: e?.message }
  }

  // Test 2: Stripe SDK with createFetchHttpClient fix
  let sdkResult: { ok: boolean; available?: number; error?: string; type?: string } = { ok: false }
  try {
    const stripe = createStripe(key)
    const bal = await stripe.balance.retrieve()
    sdkResult = { ok: true, available: bal.available[0]?.amount }
  } catch (err: any) {
    sdkResult = { ok: false, error: err?.message, type: err?.type }
  }

  return NextResponse.json({ nodeVersion, keyPrefix: key.slice(0, 12), fetchResult, sdkResult })
}
