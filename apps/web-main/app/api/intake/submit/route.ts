import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { PROJECT_PATH_META } from '@kealee/intake'
import { mergeAttributionMetadata, parseUtmFromRequest } from '@/lib/marketing/utm-metadata'
import { trackLeadSubmitted } from '@/lib/marketing/ga4-server'
import * as Sentry from '@sentry/nextjs'

export const dynamic = 'force-dynamic'

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
    const projectPath = intake.projectPath as string
    const meta = PROJECT_PATH_META[projectPath as keyof typeof PROJECT_PATH_META]
    const baseAmount = meta?.paymentAmount ?? 58500
    const totalAmount = overrideAmount ?? baseAmount
    const utm = parseUtmFromRequest(req, intake as Record<string, unknown>)
    const formPayload = {
      ...(intake as Record<string, unknown>),
      captureSessionId: captureSessionId ?? null,
      captureMode: captureMode ?? null,
      siteVisitRequested: siteVisitRequested ?? false,
      preferredVisitWindow: preferredVisitWindow ?? null,
      funnelStage: 'lead',
    }
    const metadata = mergeAttributionMetadata(null, utm, {
      funnelStage: 'lead',
      marketingSource: 'web-main',
      capturedAt: new Date().toISOString(),
    })

    try {
      const supabase = getSupabaseAdmin()
      const { data, error } = await supabase
        .from('public_intake_leads')
        .insert({
          project_path: projectPath,
          client_name: intake.clientName,
          contact_email: intake.contactEmail,
          contact_phone: intake.contactPhone ?? null,
          project_address: intake.projectAddress,
          budget_range: intake.budgetRange ?? null,
          form_data: formPayload,
          metadata,
          source: 'web-main',
          status: 'new',
          requires_payment: meta?.requiresPayment ?? true,
          payment_amount: totalAmount,
          created_by_user_id: null,
        })
        .select('id')
        .single()

      if (!error && data) {
        void trackLeadSubmitted({
          intakeId: data.id,
          projectPath,
          source: 'web-main',
          utm,
        })
        return NextResponse.json({
          ok: true,
          intakeId: data.id,
          requiresPayment: meta?.requiresPayment ?? true,
          paymentAmount: totalAmount,
        })
      }
      console.error('[intake/submit] Supabase save failed:', error?.message)
      Sentry.captureMessage('Structured intake persistence failed', {
        level: 'error',
        tags: { area: 'sales-funnel', stage: 'structured-intake-persistence', projectPath },
        extra: { databaseError: error?.message },
      })
    } catch (sbErr) {
      console.error('[intake/submit] Supabase unavailable:', (sbErr as Error)?.message)
      Sentry.captureException(sbErr, {
        tags: { area: 'sales-funnel', stage: 'structured-intake-persistence', projectPath },
      })
    }

    return NextResponse.json({
      ok: false,
      errors: ['We could not save your project securely. Nothing was charged. Please try again or contact hello@kealee.com.'],
      code: 'INTAKE_PERSISTENCE_FAILED',
    }, { status: 503 })
  } catch (err) {
    console.error('[intake/submit]', err)
    Sentry.captureException(err, {
      tags: { area: 'sales-funnel', stage: 'structured-intake-create' },
    })
    return NextResponse.json({ ok: false, errors: ['Internal error'] }, { status: 500 })
  }
}
