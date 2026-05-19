/**
 * POST /api/auth/magic-link
 * Body: { email: string }
 *
 * Sends a Supabase magic link that redirects to /auth/callback after click,
 * then on to /deliverables. Allows concept-package clients (who have no
 * password) to access the owner portal using the same email they used at intake.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json() as { email?: string }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    const redirectTo = `${req.nextUrl.origin}/auth/callback?next=/deliverables`

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: true,   // create account if first portal login (intake users have no password)
      },
    })

    if (error) {
      const isRateLimit = /rate.limit|too many/i.test(error.message)
      const userMessage = isRateLimit
        ? 'A link was recently sent to this email. Check your inbox (and spam folder) — it expires in 1 hour.'
        : error.message
      return NextResponse.json(
        { error: userMessage, rateLimit: isRateLimit },
        { status: 400 },
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[portal-owner/magic-link]', err?.message)
    return NextResponse.json({ error: 'Failed to send link' }, { status: 500 })
  }
}
