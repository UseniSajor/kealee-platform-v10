/**
 * GET /api/intake/list?email=user@example.com
 *
 * Returns all intake records for the given contact_email,
 * filtered to those that have a conceptOutput (concept_ready status).
 * Used by the owner portal to list a user's purchased concepts.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')

  if (!email) {
    return NextResponse.json({ error: 'email query param is required' }, { status: 400 })
  }

  try {
    const supabase = getSupabaseAdmin()

    const { data: intakes, error } = await supabase
      .from('public_intake_leads')
      .select('id, project_path, client_name, contact_email, status, created_at, form_data, budget_range, project_address')
      .eq('contact_email', email)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[intake/list] Supabase error:', error.message)
      return NextResponse.json({ error: 'Failed to fetch intakes' }, { status: 500 })
    }

    return NextResponse.json({ intakes: intakes ?? [] })
  } catch (err: any) {
    console.error('[intake/list] error:', err?.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
