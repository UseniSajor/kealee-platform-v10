/**
 * POST /api/emails/resend-portal-access
 * Body: { intakeId: string, email?: string }
 *
 * Regenerates the 7-day claim link and resends concept-ready email (internal/cron).
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { intakeId?: string; email?: string }
    const intakeId = body.intakeId?.trim()
    if (!intakeId) {
      return NextResponse.json({ error: 'intakeId required' }, { status: 400 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    )

    const { data: intake, error: dbErr } = await supabaseAdmin
      .from('public_intake_leads')
      .select('id, contact_email, project_path, client_name')
      .eq('id', intakeId)
      .single()

    if (dbErr || !intake) {
      return NextResponse.json({ error: 'Intake not found' }, { status: 404 })
    }

    const to = (body.email?.trim() || intake.contact_email || '').toLowerCase()
    if (!to) {
      return NextResponse.json({ error: 'No email on intake' }, { status: 400 })
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_WEB_MAIN_URL ??
      process.env.NEXT_PUBLIC_APP_URL ??
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

    const res = await fetch(`${baseUrl}/api/emails/deliverable-ready`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to,
        intakeId,
        service: intake.project_path ?? 'concept',
        firstName: intake.client_name?.split(' ')[0],
      }),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json({ error: data.error ?? 'Resend failed', detail: data }, { status: res.status })
    }

    return NextResponse.json({ ok: true, ...data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[resend-portal-access]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
