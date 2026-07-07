import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  authorizeMarketingAgencySession,
  marketingUnauthorized,
} from '@/lib/admin/marketing-agency-auth'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { MarketingAgencyService, ProposeAssetInputSchema } from '@kealee/marketing-agency'

export const dynamic = 'force-dynamic'

const DraftContentSchema = z.object({
  asset_type: z.enum([
    'ad_copy',
    'social_caption',
    'landing_section',
    'video_script',
    'reel_script',
  ]),
  title: z.string().optional(),
  body: z.string().min(1),
  service_type: z.string().optional(),
  city: z.string().optional(),
  county: z.string().optional(),
  campaign: z.string().optional(),
  submit: z.boolean().optional(),
})

const SYSTEM_USER = '00000000-0000-4000-8000-000000000001'

export async function POST(req: NextRequest) {
  const auth = await authorizeMarketingAgencySession(req, 'write:marketing_content_draft')
  if (!auth.authorized) return marketingUnauthorized()

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = DraftContentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const input = ProposeAssetInputSchema.parse({
    ...parsed.data,
    generated_by_ai: true,
    public_safe: false,
    contains_customer_data: false,
    labels: ['Draft — pending Kealee approval'],
  })

  const service = new MarketingAgencyService(getSupabaseAdmin())
  const asset = await service.proposeAsset(input, auth.userId ?? SYSTEM_USER)
  return NextResponse.json({ asset }, { status: 201 })
}
