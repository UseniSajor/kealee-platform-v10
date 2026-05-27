/**
 * POST /api/marketing/portal-activated
 * Phase 4 lifecycle: tag portal users for upsell drips.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { mergeMarketingMetadata } from '@/lib/marketing/types'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { email, userId } = (await req.json()) as { email?: string; userId?: string }
    if (!email) {
      return NextResponse.json({ error: 'email required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const { data: rows } = await supabase
      .from('public_intake_leads')
      .select('id, metadata, form_data')
      .ilike('contact_email', email.trim().toLowerCase())
      .limit(20)

    for (const row of rows ?? []) {
      const meta = mergeMarketingMetadata(row.metadata as Record<string, unknown>, {
        funnelStage: 'portal_user',
        tags: ['portal-activated'],
        portalUserId: userId,
        portalActivatedAt: new Date().toISOString(),
      })
      await supabase
        .from('public_intake_leads')
        .update({
          metadata: meta,
          form_data: { ...((row.form_data as Record<string, unknown>) ?? {}), ...meta },
        })
        .eq('id', row.id)
    }

    return NextResponse.json({ ok: true, updated: rows?.length ?? 0 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
