import { NextResponse } from 'next/server'

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

/**
 * GET /api/orders/verify?session_id=cs_xxx
 *
 * Lightweight endpoint that checks whether a ConceptPackageOrder has been
 * created for a given Stripe checkout session.  The checkout success page
 * polls this until the webhook has fired and the order record exists.
 *
 * No authentication required — the Stripe session ID acts as a bearer token
 * (it is unguessable and only returned to the paying customer via redirect).
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get('session_id')

    if (!sessionId || !sessionId.startsWith('cs_')) {
      return NextResponse.json(
        { found: false, error: 'Valid session_id is required' },
        { status: 400 },
      )
    }

    // Proxy to the Fastify API internal endpoint
    const res = await fetch(`${API_URL}/orders/verify?session_id=${encodeURIComponent(sessionId)}`, {
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    })

    if (!res.ok) {
      return NextResponse.json({ found: false })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('[Orders Verify] Error:', error)
    return NextResponse.json({ found: false })
  }
}
