import { NextRequest, NextResponse } from 'next/server'
import {
  authorizeMarketingAgencySession,
  marketingUnauthorized,
} from '@/lib/admin/marketing-agency-auth'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { MarketingAgencyService } from '@kealee/marketing-agency'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const auth = await authorizeMarketingAgencySession(req, 'read:marketing_assets')
  if (!auth.authorized) return marketingUnauthorized()

  const status = req.nextUrl.searchParams.get('status') ?? undefined
  const service = new MarketingAgencyService(getSupabaseAdmin())

  const filter: Parameters<MarketingAgencyService['listAssets']>[0] = { limit: 100 }
  if (status) filter.status = status as never
  if (auth.userId && auth.role === 'marketing_agency') {
    filter.createdBy = auth.userId
  }

  const items = await service.listAssets(filter)
  return NextResponse.json({ items, count: items.length })
}
