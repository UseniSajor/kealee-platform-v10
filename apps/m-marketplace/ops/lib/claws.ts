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
import { getClerkToken } from '@/lib/clerk-token'

export const claws = createClawsClient({ getToken: getClerkToken })

// Ops-specific 1-click actions
export async function quickServiceSubscription(packageTier: string) {
  return claws.quickStart({
    type: 'ops_service_subscription',
    packageTier,
    activateClaws: true,
  })
}
