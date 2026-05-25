/**
 * Generate a one-click Owner Portal sign-in link (Supabase admin.generateLink + redirectTo).
 * Used by concept-ready email and post-payment flows — deliverable URLs alone require a session.
 */

import { createClient } from '@supabase/supabase-js'
import { getOwnerPortalBaseUrl } from '@/lib/owner-portal-urls'

export interface OwnerPortalMagicLinkResult {
  actionLink: string | null
  redirectTo: string
  error?: string
}

export function buildOwnerPortalAuthCallbackUrl(nextPath: string): string {
  const portalBase = getOwnerPortalBaseUrl()
  const safeNext = nextPath.startsWith('/') ? nextPath : `/${nextPath}`
  return `${portalBase}/auth/callback?next=${encodeURIComponent(safeNext)}`
}

/**
 * Returns Supabase `action_link` for Resend emails ("Open My Owner Portal").
 */
export async function createOwnerPortalMagicLink(opts: {
  email: string
  nextPath: string
}): Promise<OwnerPortalMagicLinkResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  const redirectTo = buildOwnerPortalAuthCallbackUrl(opts.nextPath)

  if (!supabaseUrl || !serviceRoleKey) {
    return {
      actionLink: null,
      redirectTo,
      error: 'Supabase admin credentials not configured',
    }
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: opts.email.trim().toLowerCase(),
    options: { redirectTo },
  })

  if (error) {
    return { actionLink: null, redirectTo, error: error.message }
  }

  const actionLink = data.properties?.action_link ?? null
  if (!actionLink) {
    return { actionLink: null, redirectTo, error: 'No action_link from generateLink' }
  }

  return { actionLink, redirectTo }
}
