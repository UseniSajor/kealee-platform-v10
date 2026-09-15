/**
 * POST /api/intake/redeem
 * Body: { intakeId?: string; projectPath: string; promoCode: string; validateOnly?: boolean }
 *
 * Validates a free promo code, marks the intake as paid,
 * and triggers concept generation — bypassing Stripe entirely.
 *
 * Valid codes are set via env INTAKE_FREE_CODES (comma-separated).
 * Falls back to the default testing code if the env var is not set.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { SERVICE_DELIVERABLES } from '@/lib/service-deliverables'

export const dynamic = 'force-dynamic'

const DEFAULT_FREE_CODE = 'KEALEE-ALLIN-2026'

function validCodes(): string[] {
  const env = process.env.INTAKE_FREE_CODES ?? DEFAULT_FREE_CODE
  return env.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      intakeId?: string
      projectPath: string
      promoCode: string
      validateOnly?: boolean
    }

    const { intakeId, projectPath, promoCode, validateOnly } = body

    if (!projectPath || !promoCode) {
      return NextResponse.json(
        { error: 'Project and promo code are required' },
        { status: 400 },
      )
    }

    if (!validCodes().includes(promoCode.trim().toUpperCase())) {
      return NextResponse.json({ error: 'Invalid promo code' }, { status: 400 })
    }

    if (validateOnly) {
      return NextResponse.json({ ok: true, free: true })
    }

    if (!intakeId) {
      return NextResponse.json({ error: 'Order information is required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // Mark intake as paid (idempotent — update only if still 'new')
    const { data: updated, error: updateErr } = await supabase
      .from('public_intake_leads')
      .update({ status: 'paid', requires_payment: false, payment_amount: 0 })
      .eq('id', intakeId)
      .select('id')
      .maybeSingle()

    if (updateErr) {
      console.error('[intake/redeem] Failed to mark intake as paid:', updateErr.message)
      return NextResponse.json({ error: 'We could not finish your free order. Please try again.' }, { status: 500 })
    }
    if (!updated) {
      return NextResponse.json({ error: 'We could not find your saved order. Please try again.' }, { status: 404 })
    }

    // Trigger concept generation fire-and-forget (mirrors Stripe webhook behaviour)
    const deliverable = SERVICE_DELIVERABLES[projectPath]
    if (deliverable?.generatesConcept) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin
      fetch(`${baseUrl}/api/concept/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intakeId }),
      }).catch((err: Error) => {
        console.error('[intake/redeem] Concept generation trigger failed:', err.message)
      })
    }

    console.log(`[intake/redeem] Promo code redeemed intakeId=${intakeId} path=${projectPath}`)

    return NextResponse.json({ ok: true, intakeId })
  } catch (err: any) {
    console.error('[intake/redeem]', err?.message)
    return NextResponse.json({ error: 'Redemption failed' }, { status: 500 })
  }
}
