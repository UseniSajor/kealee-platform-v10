/**
 * POST /api/marketing/bundle-interest
 * Tags source concept intake when owner opens a bundle upsell checkout.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { mergeMarketingMetadata } from '@/lib/marketing/types'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { intakeId, bundleProjectPath, sourcePath } = (await req.json()) as {
      intakeId?: string
      bundleProjectPath?: string
      sourcePath?: string
    }
    if (!intakeId) {
      return NextResponse.json({ error: 'intakeId required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const { data: row } = await supabase
      .from('public_intake_leads')
      .select('id, metadata, form_data')
      .eq('id', intakeId)
      .single()

    if (!row) {
      return NextResponse.json({ ok: true, skipped: true })
    }

    const meta = mergeMarketingMetadata(row.metadata as Record<string, unknown>, {
      funnelStage: 'bundle_interest',
      tags: ['bundle-checkout-opened'],
      bundleInterestAt: new Date().toISOString(),
      bundleInterestProduct: bundleProjectPath,
      bundleInterestSourcePath: sourcePath,
    })

    await supabase
      .from('public_intake_leads')
      .update({
        metadata: meta,
        form_data: { ...((row.form_data as Record<string, unknown>) ?? {}), ...meta },
      })
      .eq('id', intakeId)

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
