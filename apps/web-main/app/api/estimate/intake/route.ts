import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const API = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? ''

/** Proxies to services/api `POST /api/v1/estimation/intake` — see estimation-intake.routes.ts. */
export async function POST(req: NextRequest) {
  if (!API) {
    return NextResponse.json({ error: 'Estimation service not configured' }, { status: 503 })
  }
  try {
    const body = await req.json()
    const upstream = await fetch(`${API}/api/v1/estimation/intake`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    })
    const data = await upstream.json().catch(() => ({}))
    return NextResponse.json(data, { status: upstream.status })
  } catch (err: any) {
    console.error('[estimate/intake]', err?.message)
    return NextResponse.json({ error: 'Failed to create estimation intake' }, { status: 502 })
  }
}
