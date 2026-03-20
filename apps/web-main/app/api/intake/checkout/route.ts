import { NextRequest, NextResponse } from 'next/server'

const INTERNAL_API_URL = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      intakeId: string
      projectPath: string
      amount: number
      successUrl: string
      cancelUrl: string
      siteVisitRequested?: boolean
    }

    const upstream = await fetch(`${INTERNAL_API_URL}/api/v1/intake/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await upstream.json()
    return NextResponse.json(data, { status: upstream.status })
  } catch (err) {
    console.error('[intake/checkout]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
