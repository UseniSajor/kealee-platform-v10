import { NextResponse } from 'next/server'
import https from 'https'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

/** Test 1: raw HTTPS request to api.stripe.com (bypasses Stripe SDK + fetch patching) */
function rawHttpsTest(apiKey: string): Promise<{ ok: boolean; status?: number; error?: string }> {
  return new Promise(resolve => {
    const req = https.request(
      {
        hostname: 'api.stripe.com',
        path: '/v1/balance',
        method: 'GET',
        headers: { Authorization: `Bearer ${apiKey}` },
        timeout: 8000,
      },
      res => resolve({ ok: res.statusCode === 200, status: res.statusCode }),
    )
    req.on('error', e => resolve({ ok: false, error: e.message }))
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, error: 'timeout' }) })
    req.end()
  })
}

/** Test 2: native global fetch (may be patched by Next.js) */
async function globalFetchTest(apiKey: string): Promise<{ ok: boolean; status?: number; error?: string }> {
  try {
    const res = await fetch('https://api.stripe.com/v1/balance', {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    return { ok: res.status === 200, status: res.status }
  } catch (e: any) {
    return { ok: false, error: e?.message }
  }
}

export async function GET() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return NextResponse.json({ error: 'no STRIPE_SECRET_KEY' })

  const nodeVersion = process.version

  // Test 1: raw https module
  const httpsResult = await rawHttpsTest(key)

  // Test 2: global fetch
  const fetchResult = await globalFetchTest(key)

  // Test 3: Stripe SDK (uses its own HTTP layer)
  let sdkResult: { ok: boolean; available?: number; error?: string; type?: string } = { ok: false }
  try {
    const stripe = new Stripe(key, { apiVersion: '2024-06-20' as any })
    const bal = await stripe.balance.retrieve()
    sdkResult = { ok: true, available: bal.available[0]?.amount }
  } catch (err: any) {
    sdkResult = { ok: false, error: err?.message, type: err?.type }
  }

  return NextResponse.json({
    nodeVersion,
    rawHttps: httpsResult,
    globalFetch: fetchResult,
    stripeSDK: sdkResult,
  })
}
