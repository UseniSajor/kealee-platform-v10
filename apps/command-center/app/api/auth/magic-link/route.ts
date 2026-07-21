/**
 * POST /api/auth/magic-link
 * Body: { email: string }
 *
 * Generates a Supabase magic link via admin API, sends via Resend.
 * Falls back to Supabase OTP email if RESEND_API_KEY is not set.
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
    const baseUrl        = (process.env.NEXT_PUBLIC_COMMAND_CENTER_URL ?? req.nextUrl.origin).replace(/\/$/, '')
    const redirectTo     = `${baseUrl}/auth/callback`

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo },
    })

    if (error) {
      console.error('[command-center/magic-link] generateLink error:', error.message)
      const isRateLimit = /rate.limit|too many|security purposes|after \d+ second/i.test(error.message)
      return NextResponse.json(
        { error: isRateLimit ? 'A link was recently sent. Check your inbox — it expires in 1 hour.' : error.message, rateLimit: isRateLimit },
        { status: 400 },
      )
    }

    const actionLink = data.properties?.action_link
    if (!actionLink) {
      return NextResponse.json({ error: 'Failed to generate access link' }, { status: 500 })
    }

    if (resendApiKey) {
      const resend = new Resend(resendApiKey)
      const { error: emailError } = await resend.emails.send({
        from: 'Kealee <noreply@kealee.com>',
        to:   email,
        subject: 'Sign in to Kealee Command Center',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff">
            <div style="margin-bottom:24px">
              <span style="font-size:22px;font-weight:700;color:#0F1A2E">Kealee</span>
            </div>
            <h2 style="margin:0 0 12px;font-size:20px;color:#0F1A2E">Access Command Center</h2>
            <p style="color:#555;line-height:1.6;margin:0 0 28px;font-size:15px">
              Click the button below to sign in to the Kealee Command Center.
              This link expires in <strong>1 hour</strong>.
            </p>
            <a href="${actionLink}"
               style="display:inline-block;background:#E8793A;color:#fff;text-decoration:none;
                      padding:14px 32px;border-radius:8px;font-weight:700;font-size:15px">
              Open Command Center →
            </a>
            <p style="color:#aaa;font-size:12px;margin-top:36px">
              If you didn't request this, you can safely ignore this email.
            </p>
          </div>
        `,
      })
      if (emailError) {
        console.error('[command-center/magic-link] Resend error:', emailError)
        return NextResponse.json({ error: 'Failed to send access link' }, { status: 500 })
      }
    } else {
      const supabaseAnon = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const { error: otpError } = await supabaseAnon.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo, shouldCreateUser: false },
      })
      if (otpError) {
        const isRateLimit = /rate.limit|too many/i.test(otpError.message)
        return NextResponse.json(
          { error: isRateLimit ? 'A link was recently sent. Check your inbox.' : otpError.message, rateLimit: isRateLimit },
          { status: 400 },
        )
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[command-center/magic-link]', err?.message)
    return NextResponse.json({ error: 'Failed to send link' }, { status: 500 })
  }
}
