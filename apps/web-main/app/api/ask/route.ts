import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://kealee-platform-v10-staging.up.railway.app'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const res = await fetch(`${API_URL}/api/v1/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: text }, { status: res.status })
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error('[/api/ask] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
