import { NextRequest, NextResponse } from 'next/server'
import {
  authorizeMarketingAgencySession,
  marketingUnauthorized,
} from '@/lib/admin/marketing-agency-auth'
import { fetchCampaignsList } from '@/lib/marketing-agency/analytics'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const auth = await authorizeMarketingAgencySession(req, 'read:marketing_analytics')
  if (!auth.authorized) return marketingUnauthorized()

  const campaigns = await fetchCampaignsList()
  return NextResponse.json({ campaigns, count: campaigns.length })
}
