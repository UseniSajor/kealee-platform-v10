/**
 * m-ops-services — CLAW Agent Integration
 *
 * CLAWs manage operations from service subscription:
 *   - Claw B: Contract management for PM service agreements
 *   - Claw C: Schedule & field ops coordination
 *   - Claw D: Budget tracking for managed projects
 *   - Claw F: Client communication, daily reports, weekly summaries
 *   - Claw H: Automation rules, job scheduling
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

// Ops-specific 1-click actions
export async function quickServiceSubscription(packageTier: string) {
  return claws.quickStart({
    type: 'ops_service_subscription',
    packageTier,
    activateClaws: true,
  })
}
