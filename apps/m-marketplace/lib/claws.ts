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
import { getClerkToken } from './clerk-token'

export const claws = createClawsClient({ getToken: getClerkToken })

// Marketplace-specific 1-click actions
export async function quickSubscribe(packageId: string, tier: string) {
  return claws.quickStart({
    type: 'marketplace_subscription',
    packageId,
    tier,
    activateClaws: true,
  })
}
