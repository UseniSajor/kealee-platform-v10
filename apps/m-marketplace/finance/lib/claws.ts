/**
 * m-finance-trust — CLAW Agent Integration
 *
 * CLAWs handle financial operations:
 *   - Claw B: Contract execution, payment processing, retainage
 *   - Claw D: Budget control, variance monitoring
 *   - Claw F: Payment notifications, lien waiver generation
 *   - Claw G: Financial risk prediction
 *   - Claw H: Payment automation, milestone tracking
 */

import { createClawsClient } from '@kealee/ui'
import { getClerkToken } from '@/lib/clerk-token'

export const claws = createClawsClient({ getToken: getClerkToken })
