/**
 * GET /api/admin/knowledge — the intelligence console's numbers (spec §28):
 * corpus size by type and approval, training candidates/approved, generation
 * runs, the learning ledger's latest entries.
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireCommandCenterApi } from '@/lib/command-center-api-auth'
import { knowledge } from '@/lib/knowledge'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const denied = await requireCommandCenterApi(req)
  if (denied) return denied
  const k = knowledge()
  const [stats, recent] = await Promise.all([k.registry.stats(), k.learning.recent(40)])
  return NextResponse.json({
    stats, recent,
    vocabulary: 'ingested → indexed → retrievable → reviewed → training candidate → training approved → dataset → evaluated. Nothing here is "trained": Phase 1 records; Phases 2–8 retrieve, promote and evaluate.',
  })
}
