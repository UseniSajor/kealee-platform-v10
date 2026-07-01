import { NextRequest, NextResponse } from 'next/server'
import {
  authorizeMarketingAgencySession,
  marketingUnauthorized,
  marketingForbidden,
} from '@/lib/admin/marketing-agency-auth'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { MarketingAgencyService, ProposeAssetInputSchema } from '@kealee/marketing-agency'

export const dynamic = 'force-dynamic'

const SYSTEM_USER = '00000000-0000-4000-8000-000000000001'

export async function POST(req: NextRequest) {
  const auth = await authorizeMarketingAgencySession(req, 'write:marketing_assets')
  if (!auth.authorized) return marketingUnauthorized()

  const createdBy = auth.userId ?? SYSTEM_USER
  if (!auth.userId && auth.authMethod === 'api_key') {
    // API keys map to agency role but have no user id — use system placeholder
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = ProposeAssetInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  if (parsed.data.contains_customer_data) {
    return marketingForbidden()
  }

  const service = new MarketingAgencyService(getSupabaseAdmin())
  const asset = await service.proposeAsset(parsed.data, createdBy)
  return NextResponse.json({ asset }, { status: 201 })
}
