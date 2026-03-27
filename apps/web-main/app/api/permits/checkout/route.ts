import { NextRequest, NextResponse } from 'next/server'

const API = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const upstream = await fetch(`${API}/api/v1/permits/intake-checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await upstream.json()
    return NextResponse.json(data, { status: upstream.status })
  } catch (err) {
    console.error('[permits/checkout]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
