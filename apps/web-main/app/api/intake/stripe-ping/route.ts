import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const key = process.env.STRIPE_SECRET_KEY ?? 'missing'
  const nodeVersion = process.version

  // Test 1: native global fetch (may be patched by Next.js)
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

  // Test 2: Stripe SDK
  let sdkResult: { ok: boolean; available?: number; error?: string; type?: string } = { ok: false }
  try {
    // Dynamic import avoids module-load crash affecting the whole route
    const { default: Stripe } = await import('stripe')
    const stripe = new Stripe(key, { apiVersion: '2024-06-20' as any })
    const bal = await stripe.balance.retrieve()
    sdkResult = { ok: true, available: bal.available[0]?.amount }
  } catch (err: any) {
    sdkResult = { ok: false, error: err?.message, type: err?.type }
  }

  return NextResponse.json({ nodeVersion, keyPrefix: key.slice(0, 12), fetchResult, sdkResult })
}
