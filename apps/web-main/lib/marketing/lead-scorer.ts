/**
 * Lead Scoring Engine
 *
 * Calculates a 0–100 score for each lead based on:
 *   - Source (web, meta, organic, referral, etc.)
 *   - Budget
 *   - Timeline
 *   - Service type (concept → estimate → permit)
 *
 * Outputs:
 *   - lead_score (0–100)
 *   - routing_tag ('hot' | 'medium' | 'cold' | 'nurture')
 */

export type RoutingTag = 'hot' | 'medium' | 'cold' | 'nurture' | 'pending'

export interface LeadData {
  source?: string                          // 'web', 'meta', 'google', 'organic', 'referral', 'direct'
  budget?: number                          // Budget in USD
  timeline?: string                        // 'asap', '1-2-weeks', '1-month', '2-3-months', '3plus-months'
  service?: string                         // 'concept', 'estimate', 'permit', 'full-design'
  previousInteraction?: boolean             // Has interacted before?
  hasPhoto?: boolean                        // Uploaded area photo?
  hasDocuments?: boolean                    // Uploaded construction docs?
  phone?: string                            // Has phone number?
}

export interface LeadScore {
  score: number                             // 0–100
  tag: RoutingTag
  breakdown: {
    sourceWeight: number
    budgetWeight: number
    timelineWeight: number
    serviceWeight: number
    documentsWeight: number
  }
}

/**
 * Calculate lead score
 */
export function calculateLeadScore(data: LeadData): LeadScore {
  let score = 50                            // Base score

  // ── Source Weight (±15) ────────────────────────────────────────────────
  let sourceWeight = 0
  switch (data.source?.toLowerCase()) {
    case 'meta':
    case 'facebook':
      sourceWeight = 10                     // Paid traffic, high intent
      break
    case 'google':
      sourceWeight = 8                      // Search intent
      break
    case 'web':
      sourceWeight = 5                      // Organic web visitor
      break
    case 'organic':
      sourceWeight = 5
      break
    case 'referral':
      sourceWeight = 12                     // Warm intro
      break
    case 'direct':
      sourceWeight = 3
      break
    default:
      sourceWeight = 2                      // Unknown source
  }

  // ── Budget Weight (±25) ────────────────────────────────────────────────
  let budgetWeight = 0
  if (data.budget !== undefined) {
    if (data.budget >= 50000) budgetWeight = 25    // Large project
    else if (data.budget >= 30000) budgetWeight = 20
    else if (data.budget >= 15000) budgetWeight = 15
    else if (data.budget >= 5000) budgetWeight = 10
    else if (data.budget >= 1000) budgetWeight = 5
    else budgetWeight = -10                 // Low budget, likely not serious
  }

  // ── Timeline Weight (±20) ──────────────────────────────────────────────
  let timelineWeight = 0
  switch (data.timeline?.toLowerCase()) {
    case 'asap':
    case 'immediately':
      timelineWeight = 20                   // Urgent, high intent
      break
    case '1-2-weeks':
    case '1week':
      timelineWeight = 18
      break
    case '1-month':
      timelineWeight = 12
      break
    case '2-3-months':
      timelineWeight = 5
      break
    case '3-months':
    case '3plus-months':
      timelineWeight = -5                   // Far out, likely not serious
      break
    default:
      timelineWeight = 0
  }

  // ── Service Type Weight (±15) ──────────────────────────────────────────
  let serviceWeight = 0
  switch (data.service?.toLowerCase()) {
    case 'permit':
    case 'permits':
      serviceWeight = 15                    // Permit leads = high-value
      break
    case 'estimate':
    case 'estimation':
      serviceWeight = 12                    // Estimate = strong intent
      break
    case 'concept':
    case 'design-concept':
      serviceWeight = 5                     // Concept = exploratory
      break
    case 'full-design':
    case 'full':
      serviceWeight = 18                    // Comprehensive project
      break
    default:
      serviceWeight = 0
  }

  // ── Documents Weight (±10) ─────────────────────────────────────────────
  let documentsWeight = 0
  if (data.hasDocuments) documentsWeight = 10    // Serious intent (uploaded docs)
  if (data.hasPhoto) documentsWeight = Math.min(documentsWeight + 5, 10)

  // ── Calculate final score ──────────────────────────────────────────────
  score += sourceWeight + budgetWeight + timelineWeight + serviceWeight + documentsWeight

  // Clamp to 0–100
  score = Math.max(0, Math.min(100, score))

  // ── Determine routing tag ──────────────────────────────────────────────
  let tag: RoutingTag = 'pending'
  if (score >= 75) tag = 'hot'
  else if (score >= 50) tag = 'medium'
  else if (score >= 25) tag = 'cold'
  else tag = 'nurture'

  return {
    score,
    tag,
    breakdown: {
      sourceWeight,
      budgetWeight,
      timelineWeight,
      serviceWeight,
      documentsWeight,
    },
  }
}

/**
 * Format score for display
 */
export function formatLeadScore(score: number): string {
  if (score >= 75) return '🔥 Hot'
  if (score >= 50) return '⚡ Medium'
  if (score >= 25) return '❄️ Cold'
  return '📬 Nurture'
}
