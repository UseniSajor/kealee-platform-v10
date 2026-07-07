import { NextRequest, NextResponse } from 'next/server'
import {
  authorizeMarketingAgencySession,
  marketingUnauthorized,
} from '@/lib/admin/marketing-agency-auth'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { MarketingAgencyService, ConceptVisualInputSchema } from '@kealee/marketing-agency'
import {
  generateConceptVisualWithReplicate,
  isReplicateConfigured,
} from '@/lib/marketing-agency/concept-visual-generate'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

const SYSTEM_USER = '00000000-0000-4000-8000-000000000001'

export async function POST(req: NextRequest) {
  const auth = await authorizeMarketingAgencySession(req, 'write:marketing_assets')
  if (!auth.authorized) return marketingUnauthorized()

  if (!isReplicateConfigured()) {
    return NextResponse.json(
      { error: 'REPLICATE_API_TOKEN not configured — image generation unavailable' },
      { status: 503 },
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = ConceptVisualInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const generated = await generateConceptVisualWithReplicate(parsed.data)
  const service = new MarketingAgencyService(getSupabaseAdmin())

  const asset = await service.proposeAsset(
    {
      asset_type: parsed.data.variant === 'before' ? 'before_after_simulation' : 'concept_photo',
      service_type: parsed.data.service_type,
      city: parsed.data.city,
      county: parsed.data.county,
      campaign: parsed.data.campaign,
      title: `${parsed.data.service_type.replace(/_/g, ' ')} concept visual`,
      storage_url: generated.storageUrl,
      thumbnail_url: generated.storageUrl,
      generated_by_ai: true,
      public_safe: false,
      contains_customer_data: false,
      labels: ['Concept visual', 'Representative example'],
      submit: false,
    },
    auth.userId ?? SYSTEM_USER,
  )

  return NextResponse.json({
    asset,
    generation: {
      provider: generated.provider,
      model: generated.model,
    },
  }, { status: 201 })
}
