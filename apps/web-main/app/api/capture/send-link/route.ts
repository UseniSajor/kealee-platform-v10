import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { sendMobileCaptureLinkViaTwilio } from '@kealee/intake'

export const dynamic = 'force-dynamic'

export async function GET() {
  const available = Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    (process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_PHONE),
  )
  return NextResponse.json({ available })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { captureSessionId, phoneNumber, clientName, projectPath, returnPath } = body

    if (!captureSessionId || !phoneNumber) {
      return NextResponse.json({ error: 'captureSessionId and phoneNumber required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const { data: session, error } = await supabase
      .from('capture_sessions')
      .select('id, capture_token, token_expires_at, address')
      .eq('id', captureSessionId)
      .single()

    if (error || !session) {
      return NextResponse.json({ error: 'Capture session not found' }, { status: 404 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://kealee.com'

    const result = await sendMobileCaptureLinkViaTwilio({
      captureSessionId: session.id,
      captureSessionToken: session.capture_token,
      phoneNumber,
      baseUrl,
      projectPath: projectPath ?? 'your project',
      clientName: clientName ?? undefined,
      returnPath: typeof returnPath === 'string' && returnPath.startsWith('/') && !returnPath.startsWith('//')
        ? returnPath
        : undefined,
    })

    if (!result.ok) {
      return NextResponse.json(
        {
          error: result.error ?? 'SMS failed to send',
          unavailable: result.unavailable ?? false,
        },
        { status: result.unavailable ? 503 : 502 },
      )
    }

    // Log SMS send
    // Non-critical log insert — failures are swallowed
    try {
      await supabase.from('capture_sms_log').insert({
        capture_session_id: captureSessionId,
        phone_number: phoneNumber,
        message_id: result.messageId ?? null,
        sent_at: new Date().toISOString(),
      })
    } catch { /* non-critical */ }

    return NextResponse.json({ ok: true, messageId: result.messageId })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
