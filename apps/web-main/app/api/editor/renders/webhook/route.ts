/**
 * POST /api/editor/renders/webhook
 *
 * Replicate callback when a render job completes or fails.
 * Replicate sends a POST with the full prediction object.
 *
 * Payload shape:
 * {
 *   id: string            — Replicate prediction ID (matches externalJobId)
 *   status: 'succeeded' | 'failed' | 'canceled'
 *   output: string[]      — Array of output image URLs (when succeeded)
 *   error: string | null  — Error message (when failed)
 *   metrics: { predict_time: number }
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()
    const { id: externalJobId, status, output, error: replicateError, metrics } = payload

    if (!externalJobId || !status) {
      return NextResponse.json({ error: 'Missing id or status' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // Map Replicate status → PascalRenderStatus
    const renderStatus =
      status === 'succeeded' ? 'COMPLETED' :
      status === 'failed'    ? 'FAILED' :
      status === 'canceled'  ? 'FAILED' : null

    if (!renderStatus) {
      // starting / processing — ignore intermediate callbacks
      return NextResponse.json({ ok: true, ignored: true })
    }

    const updatePayload: Record<string, unknown> = {
      status: renderStatus,
      updated_at: new Date().toISOString(),
    }

    if (renderStatus === 'COMPLETED' && Array.isArray(output)) {
      updatePayload.output_urls = output
    }

    if (renderStatus === 'FAILED' && replicateError) {
      updatePayload.error_msg = String(replicateError).slice(0, 500)
    }

    if (metrics?.predict_time) {
      updatePayload.duration_ms = Math.round(metrics.predict_time * 1000)
    }

    const { error: updateErr } = await supabase
      .from('pascal_render_jobs')
      .update(updatePayload)
      .eq('external_job_id', externalJobId)

    if (updateErr) {
      console.error('[renders/webhook] DB update failed:', updateErr.message)
      // Still return 200 so Replicate does not retry indefinitely
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[renders/webhook] error:', err?.message)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
