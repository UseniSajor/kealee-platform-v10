import { NextRequest, NextResponse } from 'next/server'

const INTERNAL_API_URL = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { intake?: Record<string, unknown> }
    const { intake } = body

    if (!intake) {
      return NextResponse.json({ ok: false, errors: ['Missing intake payload'] }, { status: 400 })
    }

    const upstream = await fetch(`${INTERNAL_API_URL}/api/v1/intake/public`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(intake),
    })

    const data = await upstream.json()
    return NextResponse.json(data, { status: upstream.status })
  } catch (err) {
    console.error('[intake/submit]', err)
    return NextResponse.json({ ok: false, errors: ['Internal error'] }, { status: 500 })
  }
}
