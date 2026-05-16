/**
 * POST /api/auth/magic-link
 *
 * Triggers a Supabase magic-link (OTP) email for passwordless concept portal access.
 * The emailRedirectTo points at /auth/callback?next=<conceptPath> so that after
 * clicking the link the user lands directly on their concept page with a live session.
 *
 * Body: { email: string, next: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { email, next } = await req.json() as { email?: string; next?: string }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'A valid email address is required' }, { status: 400 })
    }

    const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseAnon) {
      console.error('[magic-link] Missing Supabase env vars')
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
    const safeNext = next && next.startsWith('/') ? next : '/'
    const callbackUrl = `${appUrl}/auth/callback?next=${encodeURIComponent(safeNext)}`

    // Use the anon key — signInWithOtp is a public auth operation.
    // autoRefreshToken/persistSession are irrelevant for a fire-and-forget server call.
    const supabase = createClient(supabaseUrl, supabaseAnon, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo:  callbackUrl,
        shouldCreateUser: true,  // create account on first access
      },
    })

    if (error) {
      console.error('[magic-link] signInWithOtp error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[magic-link] unexpected error:', err?.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
