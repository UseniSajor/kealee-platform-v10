/**
 * POST /api/auth/magic-link
 * Body: { email: string }
 *
 * Generates a Supabase magic link via admin API and delivers it via Resend.
 * This endpoint is for admin console access — email content is admin-specific,
 * never concept/deliverable messaging.
 *
 * Falls back to Supabase OTP email if RESEND_API_KEY is not configured.
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
    const adminBaseUrl   = (process.env.NEXT_PUBLIC_ADMIN_URL ?? req.nextUrl.origin).replace(/\/$/, '')
    const redirectTo     = `${adminBaseUrl}/auth/callback`

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo },
    })

    if (error) {
      console.error('[os-admin/magic-link] generateLink error:', error.message)
      const isRateLimit = /rate.limit|too many|security purposes|after \d+ second/i.test(error.message)
      return NextResponse.json(
        {
          error: isRateLimit
            ? 'A sign-in link was recently sent. Check your inbox — it expires in 1 hour.'
            : error.message,
          rateLimit: isRateLimit,
        },
        { status: 400 },
      )
    }

    const actionLink = data.properties?.action_link
    if (!actionLink) {
      console.error('[os-admin/magic-link] No action_link in generateLink response')
      return NextResponse.json({ error: 'Failed to generate sign-in link' }, { status: 500 })
    }

    if (resendApiKey) {
      const resend = new Resend(resendApiKey)
      const { error: emailError } = await resend.emails.send({
        from: 'Kealee Admin <noreply@kealee.com>',
        to: email,
        subject: 'Sign in to Kealee Admin Console',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff">
            <div style="margin-bottom:24px;display:flex;align-items:center;gap:10px">
              <div style="width:36px;height:36px;background:#3B82F6;border-radius:8px;display:flex;align-items:center;justify-content:center">
                <span style="color:#fff;font-weight:700;font-size:18px">K</span>
              </div>
              <span style="font-size:20px;font-weight:700;color:#0F172A">Kealee</span>
            </div>
            <h2 style="margin:0 0 12px;font-size:20px;color:#0F172A">Admin Console sign-in link</h2>
            <p style="color:#475569;line-height:1.6;margin:0 0 28px;font-size:15px">
              Click the button below to sign in to the Kealee Admin Console.
              This link expires in <strong>1 hour</strong> and can only be used once.
            </p>
            <a href="${actionLink}"
               style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;
                      padding:14px 32px;border-radius:8px;font-weight:700;font-size:15px">
              Sign In to Admin Console
            </a>
            <p style="color:#94A3B8;font-size:12px;margin-top:36px;line-height:1.5">
              If you didn&apos;t request this link, you can safely ignore this email.<br/>
              This link grants admin access — do not share it.
            </p>
          </div>
        `,
      })

      if (emailError) {
        console.error('[os-admin/magic-link] Resend error:', emailError)
        return NextResponse.json({ error: 'Failed to send sign-in link' }, { status: 500 })
      }
    } else {
      // Fallback: Supabase built-in OTP email (uses Supabase Dashboard email template)
      console.warn('[os-admin/magic-link] RESEND_API_KEY not set — falling back to Supabase OTP email')
      const supabaseAnon = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const { error: otpError } = await supabaseAnon.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo, shouldCreateUser: false },
      })
      if (otpError) {
        const isRateLimit = /rate.limit|too many/i.test(otpError.message)
        return NextResponse.json(
          {
            error: isRateLimit
              ? 'A sign-in link was recently sent. Check your inbox — it expires in 1 hour.'
              : otpError.message,
            rateLimit: isRateLimit,
          },
          { status: 400 },
        )
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[os-admin/magic-link]', err?.message)
    return NextResponse.json({ error: 'Failed to send sign-in link' }, { status: 500 })
  }
}
