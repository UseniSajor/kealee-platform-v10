import { NextRequest } from 'next/server'
import {
  guardIntelligenceRequest,
  handleGetProjectTwin,
} from '@/lib/intelligence/api-handlers'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = guardIntelligenceRequest(_req)
  if (guard) return guard
  const { id } = await params
  try {
    return handleGetProjectTwin(id)
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
