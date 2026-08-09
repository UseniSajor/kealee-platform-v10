import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  authorizeMarketingAgencySession,
  marketingUnauthorized,
  marketingForbidden,
} from '@/lib/admin/marketing-agency-auth'
import { canApproveMarketingContent } from '@/lib/admin/access-roles'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { MarketingAgencyService, canAdminTransitionStatus } from '@kealee/marketing-agency'
import { createServerClient } from '@supabase/ssr'

export const dynamic = 'force-dynamic'

const ApproveSchema = z.object({
  assetId: z.string().uuid(),
  status: z.enum(['approved', 'rejected', 'needs_revision', 'published']),
  revision_notes: z.string().optional(),
})

async function getAppRole(req: NextRequest): Promise<string | null> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } },
  )
  const { data: { user } } = await supabase.auth.getUser()
  return (user?.app_metadata?.role as string | undefined)?.toLowerCase() ?? null
}

export async function GET(req: NextRequest) {
  const auth = await authorizeMarketingAgencySession(req, 'read:marketing_assets')
  if (!auth.authorized) return marketingUnauthorized()

  const appRole = await getAppRole(req)
  if (!canApproveMarketingContent(appRole)) return marketingForbidden()

  const service = new MarketingAgencyService(getSupabaseAdmin())
  const status = req.nextUrl.searchParams.get('status') ?? 'submitted'
  const items = await service.listAssets({ status: status as never, limit: 100 })
  return NextResponse.json({ items, count: items.length })
}

export async function POST(req: NextRequest) {
  const auth = await authorizeMarketingAgencySession(req, 'write:marketing_assets')
  if (!auth.authorized) return marketingUnauthorized()

  const appRole = await getAppRole(req)
  if (!canApproveMarketingContent(appRole) || !auth.userId) return marketingForbidden()

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = ApproveSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const service = new MarketingAgencyService(getSupabaseAdmin())
  const existing = await service.getAsset(parsed.data.assetId)
  if (!existing) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
  }

  if (!canAdminTransitionStatus(existing.approval_status, parsed.data.status)) {
    return NextResponse.json({ error: 'Invalid status transition' }, { status: 400 })
  }

  const asset = await service.updateAssetStatus(
    parsed.data.assetId,
    parsed.data.status,
    auth.userId,
    parsed.data.revision_notes,
  )

  await getSupabaseAdmin().from('marketing_agency_audit_log').insert({
    actor_id: auth.userId,
    action: `status:${parsed.data.status}`,
    resource_type: 'marketing_agency_assets',
    resource_id: parsed.data.assetId,
  })

  return NextResponse.json({ asset })
}
