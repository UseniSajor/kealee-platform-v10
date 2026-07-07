import { NextRequest, NextResponse } from 'next/server'
import { authorizeOps, unauthorized } from '@/lib/admin/intelligence-auth'
import { intelligenceAdminService, isIntelligencePersistenceAvailable } from '@kealee/intelligence'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (!authorizeOps(req, 'read:intelligence').authorized) return unauthorized()
  if (!isIntelligencePersistenceAvailable()) {
    return NextResponse.json({ error: 'DATABASE_URL not configured' }, { status: 503 })
  }
  try {
    const limit = Number(req.nextUrl.searchParams.get('limit') ?? 50)
    const items = await intelligenceAdminService.listReviewQueue(limit)
    return NextResponse.json({ items, count: items.length })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!authorizeOps(req, 'write:intelligence').authorized) return unauthorized()
  if (!isIntelligencePersistenceAvailable()) {
    return NextResponse.json({ error: 'DATABASE_URL not configured' }, { status: 503 })
  }
  try {
    const body = await req.json()
    const { loopRunId, decision, notes } = body as {
      loopRunId?: string
      decision?: 'approved' | 'rejected' | 'deferred'
      notes?: string
    }
    if (!loopRunId || !decision) {
      return NextResponse.json({ error: 'loopRunId and decision required' }, { status: 400 })
    }
    const updated = await intelligenceAdminService.resolveReview(loopRunId, decision, notes)
    return NextResponse.json({ ok: true, loopRun: updated })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
