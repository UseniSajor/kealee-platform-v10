import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

/** P3 — persist contractor B2B subscribe leads. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { company?: string; email?: string; trades?: string[] }
    if (!body.company || !body.email) {
      return NextResponse.json({ error: 'company and email required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    await supabase.from('public_intake_leads').insert({
      project_path: 'contractor_subscribe_v30',
      client_name: body.company,
      contact_email: body.email,
      project_address: 'B2B — contractor network',
      budget_range: 'B2B subscription',
      source: 'web-main',
      status: 'new',
      requires_payment: false,
      payment_amount: 0,
      form_data: { v30ContractorSubscribe: true, trades: body.trades ?? [] },
      metadata: { source: 'v30_contractor_subscribe' },
    })

    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
