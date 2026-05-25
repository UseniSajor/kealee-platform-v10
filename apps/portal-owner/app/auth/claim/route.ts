/**
 * GET /auth/claim?t=TOKEN&i=INTAKE_ID
 *
 * One-click portal access route. Validates the portal access token stored in
 * the intake row's metadata, generates a Supabase session server-side (no
 * redirect to Supabase servers), and drops the user directly into their
 * deliverables page — fully authenticated, zero login screens.
 *
 * Flow:
 *   1. Look up intake in public_intake_leads where id = intakeId
 *   2. Validate portalToken matches `t` param and is not expired
 *   3. Call admin.generateLink to get a hashed_token for the user's email
 *   4. Call supabase.auth.verifyOtp(hashed_token) via SSR client so session
 *      cookies are written onto the redirect response
 *   5. Redirect directly to /deliverables/{intakeId}
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr'
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
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error('[auth/claim] missing Supabase env vars')
    return errorRedirect(origin, 'config_error')
  }

  // Admin client — can read intake rows and generate auth links
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

  // Check expiry
  const expiresAt = meta.portalTokenExpiresAt as string | undefined
  if (expiresAt && new Date(expiresAt) < new Date()) {
    return errorRedirect(origin, 'token_expired')
  }

  // Resolve email — prefer stored portalEmail over raw contact_email
  const email = ((meta.portalEmail as string | undefined) ?? intake.contact_email ?? '').trim().toLowerCase()
  if (!email) {
    console.error('[auth/claim] no email found for intake:', intakeId)
    return errorRedirect(origin, 'no_email')
  }

  // Resolve destination path
  const nextPath = (meta.portalNextPath as string | undefined) ?? `/deliverables/${intakeId}`
  const safePath = nextPath.startsWith('/') ? nextPath : `/deliverables/${intakeId}`

  // 3. Generate a server-side magic link to obtain hashed_token
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  })

  if (linkError || !linkData?.properties?.hashed_token) {
    console.error('[auth/claim] generateLink failed:', linkError?.message)
    return errorRedirect(origin, 'auth_failed')
  }

  const hashedToken = linkData.properties.hashed_token

  // 4. Build redirect response and create SSR client that sets cookies on it
  const redirectResponse = NextResponse.redirect(`${origin}${safePath}`)

  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) => {
        cookiesToSet.forEach(({ name, value, options }) =>
          redirectResponse.cookies.set(
            name,
            value,
            options as Parameters<typeof redirectResponse.cookies.set>[2],
          ),
        )
      },
    },
  })

  // Verify OTP directly — sets session cookies on redirectResponse via setAll callback
  const { error: otpError } = await supabase.auth.verifyOtp({
    token_hash: hashedToken,
    type: 'magiclink',
  })

  if (otpError) {
    console.error('[auth/claim] verifyOtp failed:', otpError.message)
    return errorRedirect(origin, 'auth_failed')
  }

  // 5. Invalidate token (fire-and-forget — user is already authed)
  const updatedMeta = {
    ...meta,
    portalToken: null,
    portalTokenExpiresAt: null,
    portalTokenClaimedAt: new Date().toISOString(),
  }
  admin
    .from('public_intake_leads')
    .update({ metadata: updatedMeta })
    .eq('id', intakeId)
    .then(() => {})
    .catch((err: unknown) => {
      console.error('[auth/claim] token invalidation failed:', (err as Error)?.message ?? err)
    })

  return redirectResponse
}
