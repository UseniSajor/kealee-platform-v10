import { NextRequest, NextResponse } from 'next/server'
import {
  authorizeMarketingAgencySession,
  marketingUnauthorized,
} from '@/lib/admin/marketing-agency-auth'
import { fetchLeadSummary } from '@/lib/marketing-agency/analytics'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const auth = await authorizeMarketingAgencySession(req, 'read:marketing_leads_summary')
  if (!auth.authorized) return marketingUnauthorized()

  const summary = await fetchLeadSummary()
  return NextResponse.json(summary)
}
