/**
 * POST /api/auth/magic-link
 * Body: { email: string }
 *
 * Generates a Supabase magic link via the admin API (no email sent by Supabase),
 * then delivers it via Resend for reliable inbox placement.
 *
 * Falls back to Supabase signInWithOtp if RESEND_API_KEY is not configured.
 * Allows concept-package clients (who have no password) to access the owner
 * portal using the same email they used at intake.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json() as { email?: string }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    const supabaseUrl    = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const resendApiKey   = process.env.RESEND_API_KEY
    const redirectTo     = `${req.nextUrl.origin}/auth/callback?next=/deliverables`

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
      console.error('[portal-owner/magic-link] generateLink error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const actionLink = data.properties?.action_link
    if (!actionLink) {
      console.error('[portal-owner/magic-link] No action_link in generateLink response')
      return NextResponse.json({ error: 'Failed to generate access link' }, { status: 500 })
    }

    // ── Send via Resend ──────────────────────────────────────────────────────
    if (resendApiKey) {
      const resend = new Resend(resendApiKey)
      const { error: emailError } = await resend.emails.send({
        from: 'Kealee <noreply@kealee.com>',
        to:   email,
        subject: 'Sign in to your Kealee Owner Portal',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff">
            <div style="margin-bottom:24px">
              <span style="font-size:22px;font-weight:700;color:#0F1A2E">Kealee</span>
            </div>
            <h2 style="margin:0 0 12px;font-size:20px;color:#0F1A2E">Access your Owner Portal</h2>
            <p style="color:#555;line-height:1.6;margin:0 0 28px;font-size:15px">
              Click the button below to access your deliverables, concept packages,
              and all project documents. This link expires in <strong>1 hour</strong>.
            </p>
            <a href="${actionLink}"
               style="display:inline-block;background:#E8793A;color:#fff;text-decoration:none;
                      padding:14px 32px;border-radius:8px;font-weight:700;font-size:15px;
                      letter-spacing:0.01em">
              Open My Owner Portal →
            </a>
            <p style="color:#aaa;font-size:12px;margin-top:36px;line-height:1.5">
              If you didn't request this link, you can safely ignore this email.
            </p>
          </div>
        `,
      })

      if (emailError) {
        console.error('[portal-owner/magic-link] Resend send error:', emailError)
        return NextResponse.json({ error: 'Failed to send access link email' }, { status: 500 })
      }
    } else {
      // ── Fallback: Supabase built-in email (limited deliverability) ──────────
      console.warn('[portal-owner/magic-link] RESEND_API_KEY not set — falling back to Supabase OTP email')
      const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo, shouldCreateUser: true },
      })
      if (otpError) {
        const isRateLimit = /rate.limit|too many/i.test(otpError.message)
        const userMessage = isRateLimit
          ? 'A link was recently sent to this email. Check your inbox (and spam folder) — it expires in 1 hour.'
          : otpError.message
        return NextResponse.json({ error: userMessage, rateLimit: isRateLimit }, { status: 400 })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[portal-owner/magic-link]', err?.message)
    return NextResponse.json({ error: 'Failed to send link' }, { status: 500 })
  }
}
