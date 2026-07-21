/**
 * m-permits-inspections — CLAW Agent Integration
 *
 * Claw E (Permits & Compliance) is the primary agent here:
 *   - Claw E: Multi-jurisdiction permit portal checking, deadline monitoring,
 *             inspection pass/fail authority, Claude Vision QA analysis
 *   - Claw C: Inspection timing coordination with schedule
 *   - Claw F: Permit status notifications, document generation
 *   - Claw H: Deadline automation, expiration alerts
 */

import { createClawsClient } from '@kealee/ui'

async function getToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null
  try {
    const { createBrowserClient } = await import('@supabase/ssr')
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    )
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || null
  } catch {
    return null
  }
}

export const claws = createClawsClient({ getToken })

// Permits-specific 1-click actions
export async function quickPermitSubmission(projectId: string, permitType: string) {
  return claws.submitPermit(projectId, permitType)
}

export async function checkPermitStatus(projectId: string) {
  return claws.getPermitStatus(projectId)
}
