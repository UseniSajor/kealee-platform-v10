/**
 * workflow.constants.ts
 *
 * Valid stage transition rules and acceptance window defaults.
 */

import type { WorkflowStageName } from './workflow.types'

/**
 * Allowed forward transitions for each stage.
 * Append-only — you never move backward.
 * null means no further transitions are defined (terminal).
 */
export const VALID_TRANSITIONS: Partial<Record<WorkflowStageName, WorkflowStageName[]>> = {
  LEAD_CREATED:               ['LEAD_ASSIGNED'],
  LEAD_ASSIGNED:              ['AWAITING_PRO_ACCEPTANCE'],
  AWAITING_PRO_ACCEPTANCE:    ['ASSIGNMENT_ACCEPTED', 'ASSIGNMENT_DECLINED', 'ASSIGNMENT_EXPIRED'],
  ASSIGNMENT_ACCEPTED:        ['VERIFICATION_PENDING', 'CONTRACT_DRAFTED'],
  ASSIGNMENT_DECLINED:        [],
  ASSIGNMENT_EXPIRED:         [],
  VERIFICATION_PENDING:       ['VERIFICATION_UNDER_REVIEW'],
  VERIFICATION_UNDER_REVIEW:  ['VERIFICATION_APPROVED', 'VERIFICATION_REJECTED'],
  VERIFICATION_APPROVED:      ['DESIGN_READY', 'CONTRACT_DRAFTED'],
  VERIFICATION_REJECTED:      ['VERIFICATION_PENDING'], // allow resubmission
  DESIGN_READY:               ['PERMITS_SUBMITTED'],
  PERMITS_SUBMITTED:          ['CONSTRUCTION_READY'],
  CONSTRUCTION_READY:         ['CONTRACT_DRAFTED'],
  CONTRACT_DRAFTED:           ['CONTRACT_PENDING_SIGNATURE'],
  CONTRACT_PENDING_SIGNATURE: ['ESCROW_DRAFTED'],
  ESCROW_DRAFTED:             ['ESCROW_FUNDED'],
  ESCROW_FUNDED:              ['MILESTONES_INITIALIZED'],
  MILESTONES_INITIALIZED:     [],
}

/** Default acceptance window for ASSIGNMENT_ACCEPTANCE work items (ms) */
export const ASSIGNMENT_ACCEPTANCE_WINDOW_MS = 72 * 60 * 60 * 1000 // 72 hours

/** Default acceptance window for CONTRACT_SIGNATURE work items (ms) */
export const CONTRACT_SIGNATURE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

/** Default acceptance window for ESCROW_FUNDING work items (ms) */
export const ESCROW_FUNDING_WINDOW_MS = 5 * 24 * 60 * 60 * 1000 // 5 days
