/**
 * GET /api/intake/:intakeId
 * Server-side route — uses service_role key so it bypasses RLS.
 * The deliverables page fetches through here instead of directly from Supabase
 * (anon key is blocked by RLS on public_intake_leads).
 */
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function GET(
  _req: Request,
  { params }: { params: { intakeId: string } }
) {
  const { intakeId } = params

  if (!intakeId) {
    return NextResponse.json({ error: 'Missing intakeId' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('public_intake_leads')
    .select('*')
    .eq('id', intakeId)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Intake not found' }, { status: 404 })
  }

  // Also fetch service chain gate for contractor matching unlock status
  const { data: gate } = await supabaseAdmin
    .from('service_chain_gates')
    .select('contractorMatchingUnlocked, permitSubmitted, permitApproved, noPermitRequired')
    .eq('conceptIntakeId', intakeId)
    .maybeSingle()

  return NextResponse.json({ intake: data, gate: gate ?? null })
}
