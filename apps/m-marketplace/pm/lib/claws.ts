/**
 * os-pm — CLAW Agent Integration (PM Operations View)
 *
 * PM has operational control of CLAWs for managed projects:
 *   - Claw A: Monitor estimates, bids, contractor matching
 *   - Claw B: Manage contracts, change orders, payments
 *   - Claw C: Control schedules, site visits, weather
 *   - Claw D: Track budgets, variances, forecasts
 *   - Claw E: Coordinate permits, inspections, compliance
 *   - Claw F: Manage communications, documents
 *   - Claw G: Review risks, predictions, decisions
 *   - Claw H: Configure automation, dispatch jobs
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
