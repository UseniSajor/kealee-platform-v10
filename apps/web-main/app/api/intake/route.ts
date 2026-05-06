import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { randomUUID } from 'crypto'

// POST /api/intake — create a new intake record
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
    } = body

    if (!projectPath || !clientName || !contactEmail || !projectAddress) {
      return NextResponse.json({ error: 'Missing required intake fields' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // form_data is used by concept/generate — must contain the original form fields
    // so description, budget, zip etc. are available to the Claude prompt.
    const resolvedFormData = formData ? { ...formData } : null

    const { data: intake, error: intakeErr } = await supabase
      .from('public_intake_leads')
      .insert({
        project_path: projectPath,
        client_name: clientName,
        contact_email: contactEmail,
        contact_phone: contactPhone ?? null,
        project_address: projectAddress,
        budget_range: budgetRange ?? (formData?.budget ? String(formData.budget) : 'Not provided'),
        source: 'web-main',
        status: 'new',
        requires_payment: true,
        payment_amount: 0,
        metadata: resolvedFormData,
        form_data: resolvedFormData,   // concept/generate reads from form_data
      })
      .select('id')
      .single()

    if (intakeErr || !intake) {
      // Table may not exist yet in this environment — return a deterministic
      // fallback UUID so the Stripe checkout can still proceed.
      // Concept generation will fail gracefully with a 404 in this case.
      console.error('[intake] Supabase insert failed:', intakeErr?.message)
      const fallbackId = randomUUID()
      return NextResponse.json({ intakeId: fallbackId, fallback: true })
    }

    return NextResponse.json({ intakeId: intake.id })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal error'
    console.error('[intake] Unexpected error:', msg)
    // Fallback so Stripe checkout is never blocked by a DB error
    return NextResponse.json({ intakeId: randomUUID(), fallback: true })
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
