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

  const service = new MarketingAgencyService(getSupabaseAdmin())
  const config = await service.getWorkspaceConfig()
  return NextResponse.json({ config })
}
