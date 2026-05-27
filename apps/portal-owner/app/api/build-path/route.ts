/**
 * GET /api/build-path?intakeId=&projectPath=
 * Returns next-step upsells + bundle for portal UI.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { getBuildPathUpsells } from '@kealee/core-rules'
import { ownedProductsFromRows } from '@/lib/build-path-owned'

export async function GET(req: NextRequest) {
  const intakeId = req.nextUrl.searchParams.get('intakeId')
  const projectPath = req.nextUrl.searchParams.get('projectPath')
  if (!intakeId || !projectPath) {
    return NextResponse.json({ error: 'intakeId and projectPath required' }, { status: 400 })
  }

  const cookieStore = cookies()
  const sessionClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )
  const { data: { user } } = await sessionClient.auth.getUser()
  if (!user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )

  const { data: rows } = await admin
    .from('public_intake_leads')
    .select('id, project_path, status')
    .ilike('contact_email', user.email)

  const ownedProducts = ownedProductsFromRows(rows ?? [])

  const result = getBuildPathUpsells({
    sourceProjectPath: projectPath,
    fromIntakeId: intakeId,
    ownedProducts,
  })

  return NextResponse.json({ ...result, ownedProducts })
}
