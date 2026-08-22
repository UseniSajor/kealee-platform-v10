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
import { getClerkToken } from '@/lib/clerk-token'

export const claws = createClawsClient({ getToken: getClerkToken })
