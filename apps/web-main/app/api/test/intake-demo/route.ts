/**
 * POST /api/test/intake-demo
 * Dev/staging only — creates a paid intake record and triggers concept generation.
 *
 * Body: { projectPath: string; description?: string; address?: string }
 * Response: { intakeId: string; deliverableUrl: string }
 *
 * Only enabled when NODE_ENV !== 'production' OR ALLOW_TEST_INTAKE=true.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

const ALLOWED =
  process.env.NODE_ENV !== 'production' || process.env.ALLOW_TEST_INTAKE === 'true'

export async function POST(req: NextRequest) {
  if (!ALLOWED) {
    return NextResponse.json(
      { error: 'Test intake endpoint is disabled in production' },
      { status: 403 }
    )
  }

  try {
    const body = await req.json()
    const {
      projectPath,
      description = 'Test concept generation via intake-demo endpoint.',
      address = '1600 Pennsylvania Ave NW, Washington DC 20500',
    } = body as { projectPath?: string; description?: string; address?: string }

    if (!projectPath) {
      return NextResponse.json({ error: 'projectPath is required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // 1. Create intake record with status 'paid' (skips Stripe)
    const { data: intake, error: insertErr } = await supabase
      .from('public_intake_leads')
      .insert({
        project_path: projectPath,
        client_name: 'Test User',
        contact_email: 'test@kealee.com',
        contact_phone: null,
        project_address: address,
        budget_range: '$25,000 – $50,000',
        form_data: { description, squareFootage: 200, timeline: 'Flexible', testRun: true },
        source: 'intake-demo-test',
        status: 'paid',
        requires_payment: false,
        payment_amount: 0,
        created_by_user_id: null,
      })
      .select('id')
      .single()

    if (insertErr || !intake) {
      return NextResponse.json(
        { error: insertErr?.message ?? 'Failed to create intake record' },
        { status: 500 }
      )
    }

    const intakeId: string = intake.id

    // 2. Call concept generation internally
    const baseUrl = req.nextUrl.origin
    const genRes = await fetch(`${baseUrl}/api/concept/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intakeId }),
    })

    // Even if generation fails we still return the intake URL
    if (!genRes.ok) {
      const genBody = await genRes.json().catch(() => ({}))
      console.warn('[intake-demo] Concept generation failed:', genBody)
    }

    const deliverableUrl = `/concept/deliverable?intakeId=${intakeId}`

    return NextResponse.json({ intakeId, deliverableUrl })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
