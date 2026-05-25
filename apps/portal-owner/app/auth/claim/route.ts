/**
 * GET /auth/claim?t=TOKEN&i=INTAKE_ID
 *
 * Validates the portal access token stored in the intake row's metadata,
 * then redirects to /login with the email pre-filled and welcome=1 so the
 * login page shows an account-creation / sign-in form.
 *
 * This keeps authentication in Supabase's hands — the user sets (or provides)
 * their password, signs in, and lands on their deliverables page.
 */

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function errorRedirect(origin: string, code: string): NextResponse {
  const url = new URL('/login', origin)
  url.searchParams.set('error', code)
  return NextResponse.redirect(url)
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const token = searchParams.get('t')
  const intakeId = searchParams.get('i')

  if (!token || !intakeId) {
    return errorRedirect(origin, 'invalid_claim_link')
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('[auth/claim] missing Supabase env vars')
    return errorRedirect(origin, 'config_error')
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // 1. Look up intake
  const { data: intake, error: intakeError } = await admin
    .from('public_intake_leads')
    .select('id, contact_email, metadata')
    .eq('id', intakeId)
    .single()

  if (intakeError || !intake) {
    console.error('[auth/claim] intake not found:', intakeId, intakeError?.message)
    return errorRedirect(origin, 'intake_not_found')
  }

  const meta = (intake.metadata as Record<string, unknown>) ?? {}

  // 2. Validate token
  if (!meta.portalToken || meta.portalToken !== token) {
    console.error('[auth/claim] token mismatch for intake:', intakeId)
    return errorRedirect(origin, 'invalid_token')
  }

  // 3. Check expiry
  const expiresAt = meta.portalTokenExpiresAt as string | undefined
  if (expiresAt && new Date(expiresAt) < new Date()) {
    return errorRedirect(origin, 'token_expired')
  }

  // 4. Resolve email and destination
  const email = ((meta.portalEmail as string | undefined) ?? intake.contact_email ?? '').trim().toLowerCase()
  if (!email) {
    console.error('[auth/claim] no email found for intake:', intakeId)
    return errorRedirect(origin, 'no_email')
  }

  const nextPath = (meta.portalNextPath as string | undefined) ?? `/deliverables/${intakeId}`
  const safePath = nextPath.startsWith('/') ? nextPath : `/deliverables/${intakeId}`

  // 5. Redirect to login page with email pre-filled and welcome mode active
  const loginUrl = new URL('/login', origin)
  loginUrl.searchParams.set('email', email)
  loginUrl.searchParams.set('next', safePath)
  loginUrl.searchParams.set('welcome', '1')

  return NextResponse.redirect(loginUrl)
}
