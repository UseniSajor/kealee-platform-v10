/**
 * os-admin — CLAW Agent Integration (Full System View)
 *
 * Admin has visibility into ALL 8 CLAWs across all projects:
 *   A: Acquisition & PreCon      E: Permits & Compliance
 *   B: Contract & Commercials    F: Docs & Communication
 *   C: Schedule & Field Ops      G: Risk & Predictions
 *   D: Budget & Cost Control     H: Command Center & Automation
 *
 * Admin can view CLAW health, override automation rules,
 * and manage system-wide CLAW configuration.
 */

import { createClawsClient } from '@kealee/ui'
import { getClerkToken } from './clerk-token'

async function getToken(): Promise<string | null> {
  return getClerkToken()
}

export const claws = createClawsClient({ getToken })
