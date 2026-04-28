import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

// POST /api/intake/lead — collect a contractor inquiry / contact lead
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, phone, description, budget, timeline, contractorId } = body

    if (!name || !email || !description) {
      return NextResponse.json(
        { error: 'name, email, and description are required' },
        { status: 400 }
      )
    }

    let saved = false

    try {
      const supabase = getSupabaseAdmin()
      const { error: insertErr } = await supabase
        .from('contact_inquiries')
        .insert({
          name,
          email,
          phone: phone ?? null,
          message: description,
          budget_range: budget ?? null,
          timeline: timeline ?? null,
          source: 'contractor-inquiry',
          metadata: { contractorId: contractorId ?? null },
        })

      if (!insertErr) saved = true
      else console.warn('[lead] Supabase insert failed:', insertErr.message)
    } catch (dbErr) {
      console.warn('[lead] DB unavailable, logging lead only:', dbErr)
    }

    // Always log the lead regardless of DB outcome
    console.log('[lead] Contractor inquiry received', {
      name,
      email,
      phone,
      budget,
      timeline,
      contractorId,
      saved,
    })

    return NextResponse.json({ success: true, saved })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
