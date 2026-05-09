import { NextResponse } from 'next/server'
import { z } from 'zod'

const BodySchema = z.object({
  query: z.string().min(3).max(500),
  source: z.string().min(2).max(64),
})

export async function POST(req: Request) {
  try {
    const json: unknown = await req.json().catch(() => null)
    const parsed = BodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 })
    }

    const { query, source } = parsed.data

    const bridgeEmail =
      process.env.CONCEPT_INTAKE_ANONYMOUS_EMAIL ??
      process.env.NEXT_PUBLIC_CONCEPT_INTAKE_BRIDGE_EMAIL ??
      'concept-intake@bridge.kealee.com'

    const description =
      query.trim().length >= 10 ? query.trim() : `${query.trim()} — additional detail captured on Concept`

    const apiBase =
      process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
    const url = `${apiBase.replace(/\/$/, '')}/concept/intake`

    const upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectType: 'exterior_renovation',
        description,
        email: bridgeEmail,
        name: source === 'homepage' ? 'Homepage visitor' : 'Web visitor',
        budgetRange: 'Not specified yet',
      }),
    })

    const payload: unknown = await upstream.json().catch(() => null)

    if (!upstream.ok || !payload || typeof payload !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Upstream intake failed' },
        { status: upstream.status >= 400 ? upstream.status : 502 },
      )
    }

    const intakeId =
      'intakeId' in payload ? String((payload as { intakeId?: string }).intakeId ?? '') : ''

    if (!intakeId) {
      return NextResponse.json({ success: false, error: 'Missing intake reference' }, { status: 502 })
    }

    return NextResponse.json({ success: true, conceptId: intakeId })
  } catch {
    return NextResponse.json({ success: false, error: 'Unexpected failure' }, { status: 500 })
  }
}
