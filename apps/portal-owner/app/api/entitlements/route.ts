/**
 * GET /api/entitlements — apps + products for the signed-in user (Phase 3).
 */
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { entitlementsFromIntakePaths } from '@kealee/auth'

export async function GET() {
  const cookieStore = cookies()
  const supabaseSession = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    },
  )

  const { data: { user } } = await supabaseSession.auth.getUser()
  if (!user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )

  const { data: intakes, error } = await admin
    .from('public_intake_leads')
    .select('id, project_path, status, metadata, form_data, contact_email')
    .ilike('contact_email', user.email)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows = intakes ?? []

  const role = (user.user_metadata?.role as string | undefined) ?? user.app_metadata?.role ?? 'homeowner'
  const entitlements = entitlementsFromIntakePaths(
    rows.map((r) => ({
      id: r.id as string,
      project_path: r.project_path as string,
      status: r.status as string,
    })),
    role,
  )

  return NextResponse.json({
    userId: user.id,
    email: user.email,
    persona: entitlements.persona,
    products: entitlements.products,
    apps: entitlements.apps,
    intakeIds: entitlements.intakeIds,
  })
}
