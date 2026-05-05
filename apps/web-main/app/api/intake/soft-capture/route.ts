import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * POST /api/intake/soft-capture
 *
 * Fire-and-forget lead capture called at step 1 of every funnel (before payment).
 * Saves email + service interest so no lead is ever lost even on abandonment.
 *
 * Always returns 200 — never blocks the user flow.
 * Client should call this with fetch(...).catch(() => {}) — completely silent.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { email = '', name = '', phone = '', service = '', source = '' } = body

    // Minimal validation — bad email just logs and exits cleanly
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: false, reason: 'invalid_email' })
    }

    try {
      const supabase = getSupabaseAdmin()
      await supabase.from('contact_inquiries').insert({
        name:        name || null,
        email,
        phone:       phone || null,
        message:     `Soft capture — ${service || source || 'unknown flow'}`,
        source:      'soft_capture',
        metadata: {
          service:     service || null,
          source:      source  || null,
          capturedAt:  new Date().toISOString(),
          userAgent:   req.headers.get('user-agent') ?? null,
        },
      })
    } catch {
      // DB unavailable — swallow silently, still log
      console.log('[soft-capture] DB write skipped:', { email, service, source })
    }

    console.log('[soft-capture] captured:', { email, name: name || '—', service: service || source || '—' })
    return NextResponse.json({ ok: true })
  } catch {
    // Never surface errors — this is background telemetry
    return NextResponse.json({ ok: false })
  }
}
