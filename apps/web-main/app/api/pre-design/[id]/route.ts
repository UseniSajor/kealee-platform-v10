import { NextRequest, NextResponse } from 'next/server'

const API_BASE = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params

  if (!API_BASE) {
    return NextResponse.json({ error: 'API_URL not configured' }, { status: 503 })
  }

  try {
    const res = await fetch(`${API_BASE}/pre-design/session/${id}`, {
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err: any) {
    console.error('[api/pre-design/[id]] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
