import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { PROJECT_PATH_META } from '@kealee/intake'

const INTERNAL_API_URL = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      intake?: Record<string, unknown>
      captureSessionId?: string
      captureMode?: string
      scanCompleted?: boolean
      siteVisitRequested?: boolean
      siteVisitFee?: number
      preferredVisitWindow?: string
      overrideAmount?: number
    }
    const {
      intake,
      captureSessionId,
      captureMode,
      siteVisitRequested,
      preferredVisitWindow,
      overrideAmount,
    } = body

    if (!intake) {
      return NextResponse.json({ ok: false, errors: ['Missing intake payload'] }, { status: 400 })
    }

    // Try backend API first if explicitly configured (not localhost fallback)
    if (INTERNAL_API_URL && !INTERNAL_API_URL.includes('localhost')) {
      try {
        const upstream = await fetch(`${INTERNAL_API_URL}/api/v1/intake/public`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...intake, captureSessionId, captureMode }),
          signal: AbortSignal.timeout(8000),
        })
        if (upstream.ok) {
          const data = await upstream.json() as Record<string, unknown>
          return NextResponse.json(data)
        }
      } catch {
        // Fall through to Supabase direct save
      }
    }

    // Direct Supabase save — works without backend API configured
    const supabase = getSupabaseAdmin()
    const projectPath = intake.projectPath as string
    const meta = PROJECT_PATH_META[projectPath as keyof typeof PROJECT_PATH_META]

    const baseAmount = meta?.paymentAmount ?? 58500
    const totalAmount = overrideAmount ?? baseAmount

    const { data, error } = await supabase
      .from('public_intake_leads')
      .insert({
        project_path: projectPath,
        client_name: intake.clientName,
        contact_email: intake.contactEmail,
        contact_phone: intake.contactPhone ?? null,
        project_address: intake.projectAddress,
        budget_range: intake.budgetRange ?? null,
        form_data: {
          ...intake,
          captureSessionId: captureSessionId ?? null,
          captureMode: captureMode ?? null,
          siteVisitRequested: siteVisitRequested ?? false,
          preferredVisitWindow: preferredVisitWindow ?? null,
        },
        source: 'web-main',
        status: 'new',
        requires_payment: meta?.requiresPayment ?? true,
        payment_amount: totalAmount,
        created_by_user_id: null,
      })
      .select('id')
      .single()

    if (error || !data) {
      console.error('[intake/submit] Supabase error:', error)
      return NextResponse.json({ ok: false, errors: [error?.message ?? 'Save failed'] }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      intakeId: data.id,
      requiresPayment: meta?.requiresPayment ?? true,
      paymentAmount: totalAmount,
    })
  } catch (err) {
    console.error('[intake/submit]', err)
    return NextResponse.json({ ok: false, errors: ['Internal error'] }, { status: 500 })
  }
}
