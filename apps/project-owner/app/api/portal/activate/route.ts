/**
 * POST /api/portal/activate
 * Phase 4: mark user as portal_user after account completion (password set).
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { linkUserToIntakesAfterAuth } from '@/lib/link-intake-user-portal'

export async function POST(req: NextRequest) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await linkUserToIntakesAfterAuth(user.id, user.email)

  const body = (await req.json().catch(() => ({}))) as { intakeId?: string }
  if (body.intakeId) {
    await linkUserToIntakesAfterAuth(user.id, user.email, body.intakeId)
  }

  const webMain = (process.env.NEXT_PUBLIC_WEB_MAIN_URL ?? 'https://kealee.com').replace(/\/$/, '')
  fetch(`${webMain}/api/marketing/portal-activated`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user.email, userId: user.id }),
  }).catch(() => {})

  return NextResponse.json({ ok: true, persona: 'homeowner' })
}
