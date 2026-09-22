import { NextRequest, NextResponse } from 'next/server'
import {
  ConceptGenerationError,
  requestCanonicalConceptGeneration,
} from '@/lib/concept-generation'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Backward-compatible public endpoint for paid concept orders.
 * All generation is delegated to the canonical v30 orchestration path.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as { intakeId?: string }
  if (!body.intakeId) {
    return NextResponse.json({ error: 'intakeId required' }, { status: 400 })
  }

  try {
    const result = await requestCanonicalConceptGeneration(body.intakeId)
    return NextResponse.json(result, { status: result.state === 'accepted' ? 202 : 200 })
  } catch (error) {
    if (error instanceof ConceptGenerationError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[concept-generate] canonical dispatch failed', error)
    return NextResponse.json(
      { error: 'Concept generation failed. The paid order is safe and can be retried.' },
      { status: 500 },
    )
  }
}
