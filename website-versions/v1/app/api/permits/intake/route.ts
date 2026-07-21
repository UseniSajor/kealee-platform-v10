import { NextRequest, NextResponse } from 'next/server'

const API = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? ''

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Try to persist to backend — fail-open if unavailable
    if (API) {
      try {
        const upstream = await fetch(`${API}/api/v1/permits/intake`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(5000),
        })
        if (upstream.ok) {
          const data = await upstream.json()
          if (data.intakeId) return NextResponse.json(data)
        }
      } catch {
        // Backend unavailable — fall through to local ID
      }
    }

    // Generate a local intake ID so checkout can proceed
    const intakeId = crypto.randomUUID()
    return NextResponse.json({ intakeId, source: 'local' })
  } catch (err: any) {
    console.error('[permits/intake]', err?.message)
    return NextResponse.json({ intakeId: crypto.randomUUID(), source: 'error' })
  }
}
