import { NextRequest, NextResponse } from 'next/server'

const API = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL

export async function GET(req: NextRequest) {
  if (!API) {
    return NextResponse.json({ error: 'API_URL not configured' }, { status: 503 })
  }
  const intakeId = req.nextUrl.searchParams.get('intake_id')
  if (!intakeId) {
    return NextResponse.json({ error: 'Missing intake_id' }, { status: 400 })
  }
  try {
    const upstream = await fetch(
      `${API}/api/v1/permits/intake-status?intake_id=${encodeURIComponent(intakeId)}`
    )
    const data = await upstream.json()
    return NextResponse.json(data, { status: upstream.status })
  } catch (err) {
    console.error('[permits/status]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
