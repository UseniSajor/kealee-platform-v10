import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

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
  } catch (e: unknown) {
    return NextResponse.json({
      sequences: [],
      note: e instanceof Error ? e.message : String(e),
    })
  }
}
