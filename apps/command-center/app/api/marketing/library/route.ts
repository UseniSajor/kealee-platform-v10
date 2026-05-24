import { NextResponse } from 'next/server'
import { loadFullLibrary } from '@/lib/marketing/library'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** GET /api/marketing/library — plans, stacks, campaigns from marketing/ folder */
export async function GET() {
  try {
    const library = loadFullLibrary()
    return NextResponse.json({
      ok: true,
      generatedAt: new Date().toISOString(),
      ...library,
      organicPlanDoc: 'marketing/ORGANIC-AUTOMATION-PLAN.md',
    })
  } catch (e: unknown) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    )
  }
}
