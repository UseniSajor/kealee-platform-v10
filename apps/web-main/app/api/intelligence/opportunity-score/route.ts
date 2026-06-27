import { NextRequest } from 'next/server'
import {
  guardIntelligenceRequest,
  handleIntelligenceRun,
  parseIntelligenceBody,
} from '@/lib/intelligence/api-handlers'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const guard = guardIntelligenceRequest(req)
  if (guard) return guard
  try {
    const body = await parseIntelligenceBody(req)
    return handleIntelligenceRun(body, {
      triggerEvent: 'OPPORTUNITY_SCORE_REQUESTED',
      engine: 'opportunity',
    })
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
