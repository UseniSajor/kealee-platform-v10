/**
 * Token-based one-click portal access.
 *
 * Generates a short-lived UUID token, writes it to the intake row's metadata,
 * and returns a claim URL pointing at portal-owner /auth/claim.
 *
 * The claim route validates the token server-side, creates a real Supabase session
 * via admin.generateLink + verifyOtp, sets session cookies, and redirects directly
 * to the deliverable — no Supabase redirect chain, no login loop.
 */

import { createClient } from '@supabase/supabase-js'

export interface PortalAccessTokenResult {
  claimUrl: string
  token: string
  error?: string
}

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) return null
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

function getOwnerPortalBase(): string {
  return process.env.NEXT_PUBLIC_OWNER_PORTAL_URL ?? 'https://owner.kealee.com'
}

export async function generatePortalAccessToken(opts: {
  intakeId: string
  email: string
  nextPath: string
}): Promise<PortalAccessTokenResult> {
  const admin = getAdminClient()
  if (!admin) {
    return {
      claimUrl: '',
      token: '',
      error: 'Supabase admin credentials not configured',
    }
  }

  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

  // Merge token into existing metadata (preserve other fields)
  const { data: row } = await admin
    .from('public_intake_leads')
    .select('metadata')
    .eq('id', opts.intakeId)
    .single()

  const existingMeta = (row?.metadata as Record<string, unknown>) ?? {}

  const normalizedEmail = opts.email.trim().toLowerCase()

  const { error: updateError } = await admin
    .from('public_intake_leads')
    .update({
      contact_email: normalizedEmail,
      metadata: {
        ...existingMeta,
        portalToken: token,
        portalTokenExpiresAt: expiresAt,
        portalNextPath: opts.nextPath,
        portalEmail: normalizedEmail,
        portalTokenIssuedAt: new Date().toISOString(),
      },
    })
    .eq('id', opts.intakeId)

  if (updateError) {
    console.error('[portal-access-token] update failed:', updateError.message)
    return { claimUrl: '', token: '', error: updateError.message }
  }

  const portalBase = getOwnerPortalBase()
  const claimUrl = `${portalBase}/auth/claim?t=${token}&i=${encodeURIComponent(opts.intakeId)}`

  return { claimUrl, token }
}
