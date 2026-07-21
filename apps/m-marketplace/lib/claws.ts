/**
 * m-marketplace — CLAW Agent Integration
 *
 * CLAWs power the marketplace from the moment a user interacts:
 *   - Claw A: Bid engine, contractor matching via Fair Bid Rotation
 *   - Claw B: Contract initiation when bid accepted
 *   - Claw D: Budget estimation for listed projects
 *   - Claw F: Communication hub for buyer-seller messaging
 *   - Claw H: Activity tracking and automation
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

// Marketplace-specific 1-click actions
export async function quickSubscribe(packageId: string, tier: string) {
  return claws.quickStart({
    type: 'marketplace_subscription',
    packageId,
    tier,
    activateClaws: true,
  })
}
