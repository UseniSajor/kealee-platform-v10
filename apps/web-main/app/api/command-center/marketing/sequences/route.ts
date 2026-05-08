/**
 * GET /api/command-center/marketing/sequences
 *
 * Returns drip queue entries for the CC marketing → Sequences tab.
 *
 * Requires the marketing_drip_queue table in Supabase:
 *
 *   CREATE TABLE IF NOT EXISTS marketing_drip_queue (
 *     id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *     lead_id       text NOT NULL,
 *     email         text NOT NULL,
 *     name          text,
 *     service_label text,
 *     funnel_url    text,
 *     sequence_step integer NOT NULL DEFAULT 1,
 *     send_at       timestamptz NOT NULL,
 *     sent_at       timestamptz,
 *     status        text NOT NULL DEFAULT 'pending',
 *     created_at    timestamptz NOT NULL DEFAULT now()
 *   );
 *   CREATE INDEX IF NOT EXISTS idx_mdrip_status_send ON marketing_drip_queue(status, send_at);
 */

import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'


export const runtime = 'nodejs'

export async function GET() {
  try {
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('marketing_drip_queue')
      .select('id, email, service_label, sequence_step, send_at, status')
      .order('send_at', { ascending: false })
      .limit(100)

    if (error) throw error

    return NextResponse.json({ sequences: data ?? [] })
  } catch (e: any) {
    // Table may not exist yet — return empty gracefully
    return NextResponse.json({ sequences: [], note: e.message })
  }
}
