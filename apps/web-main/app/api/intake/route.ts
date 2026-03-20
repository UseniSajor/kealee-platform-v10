import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

// POST /api/intake — create a new intake record and optionally a capture session
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      projectPath,
      clientName,
      contactEmail,
      contactPhone,
      projectAddress,
      budgetRange,
      formData,
      userId,
    } = body

    if (!projectPath || !clientName || !contactEmail || !projectAddress) {
      return NextResponse.json({ error: 'Missing required intake fields' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // Insert into public_intake_leads (existing table)
    const { data: intake, error: intakeErr } = await supabase
      .from('public_intake_leads')
      .insert({
        project_path: projectPath,
        client_name: clientName,
        contact_email: contactEmail,
        contact_phone: contactPhone ?? null,
        project_address: projectAddress,
        budget_range: budgetRange ?? null,
        form_data: formData ?? {},
        source: 'web-main',
        status: 'new',
        requires_payment: false,
        payment_amount: 0,
        created_by_user_id: userId ?? null,
      })
      .select('id')
      .single()

    if (intakeErr || !intake) {
      return NextResponse.json({ error: intakeErr?.message ?? 'Intake creation failed' }, { status: 500 })
    }

    return NextResponse.json({ intakeId: intake.id })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// GET /api/intake?intakeId=xxx
export async function GET(req: NextRequest) {
  const intakeId = req.nextUrl.searchParams.get('intakeId')
  if (!intakeId) {
    return NextResponse.json({ error: 'intakeId required' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('public_intake_leads')
    .select('*')
    .eq('id', intakeId)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}
