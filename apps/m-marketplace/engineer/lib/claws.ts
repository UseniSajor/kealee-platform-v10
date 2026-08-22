/**
 * m-engineer — CLAW Agent Integration
 *
 * CLAWs support engineering workflows:
 *   - Claw A: Structural scope analysis
 *   - Claw E: Engineering permit coordination
 *   - Claw F: Document generation (calculations, specs)
 *   - Claw G: Structural risk assessment
 *   - Claw H: Task automation
 */

import { createClawsClient } from '@kealee/ui'
import { getClerkToken } from '@/lib/clerk-token'

export const claws = createClawsClient({ getToken: getClerkToken })
