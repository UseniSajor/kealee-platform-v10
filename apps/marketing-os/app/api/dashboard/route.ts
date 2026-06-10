import { NextResponse } from 'next/server'
import { requireMarketingAdmin } from '@/lib/auth'
import { getDashboardMetrics } from '@/lib/metrics'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!await requireMarketingAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(await getDashboardMetrics())
}
