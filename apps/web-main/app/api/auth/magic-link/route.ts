/**
 * POST /api/auth/magic-link
 *
 * Generates a Supabase magic link via the admin API (no email sent by Supabase),
 * then delivers it via Resend for reliable inbox placement.
 *
 * Falls back to Supabase signInWithOtp if RESEND_API_KEY is not configured.
 *
 * Body: { email: string, next: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { email, next } = await req.json() as { email?: string; next?: string }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'A valid email address is required' }, { status: 400 })
    }

    const supabaseUrl    = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const resendApiKey   = process.env.RESEND_API_KEY

    const appUrl     = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin
    const safeNext   = next && next.startsWith('/') ? next : '/'
    const redirectTo = `${appUrl}/auth/callback?next=${encodeURIComponent(safeNext)}`

    // ── Generate the magic link via admin API (no Supabase email sent) ──────
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo },
    })

    if (error) {
      console.error('[magic-link] generateLink error:', error.message)
      const isRateLimit = /rate.limit|too many|security purposes|after \d+ second/i.test(error.message)
      const userMessage = isRateLimit
        ? 'We already sent an access link to this email recently. Please check your inbox (and spam folder) — the link expires in 1 hour.'
        : error.message
      return NextResponse.json({ error: userMessage, rateLimit: isRateLimit }, { status: 400 })
    }

    const actionLink = data.properties?.action_link
    if (!actionLink) {
      console.error('[magic-link] No action_link in generateLink response')
      return NextResponse.json({ error: 'Failed to generate access link' }, { status: 500 })
    }

    // ── Send via Resend ──────────────────────────────────────────────────────
    if (resendApiKey) {
      const resend = new Resend(resendApiKey)
      const { error: emailError } = await resend.emails.send({
        from: 'Kealee <noreply@kealee.com>',
        to:   email,
        subject: 'Your Kealee concept access link',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff">
            <div style="margin-bottom:24px">
              <span style="font-size:22px;font-weight:700;color:#0F1A2E">Kealee</span>
            </div>
            <h2 style="margin:0 0 12px;font-size:20px;color:#0F1A2E">Your concept package is ready</h2>
            <p style="color:#555;line-height:1.6;margin:0 0 28px;font-size:15px">
              Click the button below to access your AI design renders, cost estimate,
              permit timeline, and all deliverables. This link expires in <strong>1 hour</strong>.
            </p>
            <a href="${actionLink}"
               style="display:inline-block;background:#E8793A;color:#fff;text-decoration:none;
                      padding:14px 32px;border-radius:8px;font-weight:700;font-size:15px;
                      letter-spacing:0.01em">
              Open My Concept Package →
            </a>
            <p style="color:#aaa;font-size:12px;margin-top:36px;line-height:1.5">
              If you didn't request this link, you can safely ignore this email.<br/>
              Having trouble? Reply to this email and we'll help you out.
            </p>
          </div>
        `,
      })

      if (emailError) {
        console.error('[magic-link] Resend send error — falling back to Supabase OTP:', emailError)
        // Fall through to Supabase OTP fallback below
      } else {
        return NextResponse.json({ ok: true })
      }
    }

    // ── Fallback: Supabase built-in email (used when Resend is not configured or fails) ──
    console.warn('[magic-link] Falling back to Supabase OTP email')
    const supabaseAnon = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { error: otpError } = await supabaseAnon.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo, shouldCreateUser: true },
    })
    if (otpError) {
      const isRateLimit = /rate.limit|too many|security purposes|after \d+ second/i.test(otpError.message)
      const userMessage = isRateLimit
        ? 'We already sent an access link to this email recently. Please check your inbox (and spam folder) — the link expires in 1 hour.'
        : otpError.message
      return NextResponse.json({ error: userMessage, rateLimit: isRateLimit }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[magic-link] unexpected error:', err?.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
