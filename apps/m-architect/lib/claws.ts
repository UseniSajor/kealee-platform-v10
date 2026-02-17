/**
 * m-architect — CLAW Agent Integration
 *
 * CLAWs are active from the moment a design project is created.
 * Behind every user action, CLAW agents handle:
 *   - Claw A: Pre-con scope and initial estimation
 *   - Claw C: Schedule coordination and 48hr SLA tracking
 *   - Claw E: Permit readiness checks and submission
 *   - Claw F: Client communication and document generation
 *   - Claw G: Design risk assessment
 *   - Claw H: Overall orchestration and automation
 */

import { createClawsClient } from '@kealee/ui'

// Auth token getter — uses Supabase session
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

// Architect-specific CLAW actions
export async function submitToPermits(projectId: string, packageTier: string) {
  return claws.submitPermit(projectId, packageTier)
}

export async function generateDrawingSet(projectId: string) {
  return claws.generateDocument(projectId, 'DRAWING_SET')
}

export async function notifyClientReview(projectId: string) {
  return claws.sendMessage(projectId, 'Design ready for review — please check your project dashboard.')
}
