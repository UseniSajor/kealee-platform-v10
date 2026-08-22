/**
 * GET /auth/claim?t=TOKEN&i=INTAKE_ID
 *
 * Validates the portal access token, resolves/creates the matching Clerk user,
 * and exchanges the claim for a short-lived Clerk sign-in ticket.
 * Used by concept-ready emails — one click, no login form.
 */

import { createClient } from '@supabase/supabase-js'
import { clerkClient } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { mergePortalAccessMeta, readPortalAccessMeta } from '@/lib/portal-access-meta'

export const dynamic = 'force-dynamic'

function errorRedirect(origin: string, code: string, next?: string): NextResponse {
  const url = new URL('/login', origin)
  url.searchParams.set('error', code)
  if (next) url.searchParams.set('next', next)
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

  const { data: intake, error: intakeError } = await admin
    .from('public_intake_leads')
    .select('id, contact_email, metadata, form_data')
    .eq('id', intakeId)
    .single()

  if (intakeError || !intake) {
    console.error('[auth/claim] intake not found:', intakeId, intakeError?.message)
    return errorRedirect(origin, 'intake_not_found')
  }

  const meta = readPortalAccessMeta(intake)

  if (!meta.portalToken || meta.portalToken !== token) {
    console.error('[auth/claim] token mismatch for intake:', intakeId)
    return errorRedirect(origin, 'invalid_token', `/deliverables/${intakeId}`)
  }

  const expiresAt = meta.portalTokenExpiresAt
  if (expiresAt && new Date(expiresAt) < new Date()) {
    const expiredEmail = (meta.portalEmail ?? intake.contact_email ?? '').trim().toLowerCase()
    const expiredPath = meta.portalNextPath ?? `/deliverables/${intakeId}`
    const loginUrl = new URL('/login', origin)
    if (expiredEmail) loginUrl.searchParams.set('email', expiredEmail)
    loginUrl.searchParams.set('next', expiredPath.startsWith('/') ? expiredPath : `/deliverables/${intakeId}`)
    loginUrl.searchParams.set('info', 'link_expired')
    console.log('[auth/claim] token expired for intake:', intakeId, '— redirecting to login with email pre-filled')
    return NextResponse.redirect(loginUrl)
  }

  const email = (meta.portalEmail ?? intake.contact_email ?? '').trim().toLowerCase()
  if (!email) {
    console.error('[auth/claim] no email for intake:', intakeId)
    return errorRedirect(origin, 'no_email')
  }

  const nextPath = meta.portalNextPath ?? `/deliverables/${intakeId}`
  const safePath = nextPath.startsWith('/') ? nextPath : `/deliverables/${intakeId}`

  const clerk = clerkClient()
  const existingUsers = await clerk.users.getUserList({ emailAddress: [email], limit: 1 })
  const clerkUser = existingUsers.data[0] ?? await clerk.users.createUser({
    emailAddress: [email],
    skipPasswordRequirement: true,
    publicMetadata: { role: 'owner' },
  })

  const { linkIntakeToUser } = await import('@kealee/auth')
  await linkIntakeToUser(admin, intakeId, clerkUser.id, email).catch((err: unknown) => {
    console.warn('[auth/claim] link intake:', err instanceof Error ? err.message : err)
  })

  const signInToken = await clerk.signInTokens.createSignInToken({
    userId: clerkUser.id,
    expiresInSeconds: 300,
  })
  const destination = new URL(signInToken.url)
  destination.searchParams.set('redirect_url', `${origin}${safePath}`)

  // Invalidate claim token after successful sign-in (fresh token on resend email)
  const existingMetadata = (intake.metadata as Record<string, unknown> | null) ?? {}
  const existingFormData = (intake.form_data as Record<string, unknown> | null) ?? {}
  const merged = mergePortalAccessMeta(existingMetadata, existingFormData, {
    portalToken: null,
    portalTokenClaimedAt: new Date().toISOString(),
  })

  await admin
    .from('public_intake_leads')
    .update({
      metadata: merged.metadata,
      form_data: merged.form_data,
    })
    .eq('id', intakeId)
    .then(({ error }) => {
      if (error) console.warn('[auth/claim] clear portalToken:', error.message)
    })

  return NextResponse.redirect(destination)
}
