import { matchRevenueProducts, type ProductMatchInput } from './product-matcher'

export interface AuthoritativeLeadScore {
  score: number
  grade: 'A' | 'B' | 'C' | 'D'
  reasons: string[]
  recommendedProductIds: string[]
  recommendedNextAction: string
  requiresHumanReview: boolean
}

export interface LeadScoreInput extends ProductMatchInput {
  source?: string
  geographyFit?: boolean
  roleSeniority?: string
  existingRelationship?: boolean
  referred?: boolean
  emailQuality?: 'verified' | 'valid' | 'risky' | 'unknown'
  priorReply?: boolean
  meetingActivity?: boolean
  checkoutActivity?: boolean
  purchaseHistory?: boolean
}

export function scoreLead(input: LeadScoreInput): AuthoritativeLeadScore {
  let score = 25
  const reasons: string[] = []
  const add = (points: number, reason: string) => {
    score += points
    reasons.push(`${points >= 0 ? '+' : ''}${points}: ${reason}`)
  }

  if (input.geographyFit === true) add(10, 'Within supported geography')
  if (input.geographyFit === false) add(-20, 'Outside supported geography')
  if (input.referred || input.source?.toLowerCase().includes('referr')) add(15, 'Trusted referral source')
  if (input.existingRelationship) add(10, 'Existing Kealee relationship')
  if (/owner|founder|president|chief|director|manager/.test(input.roleSeniority?.toLowerCase() ?? '')) {
    add(10, 'Relevant decision-making seniority')
  }
  if (input.emailQuality === 'verified') add(10, 'Verified email')
  if (input.emailQuality === 'risky') add(-20, 'Risky email quality')
  if (input.priorReply) add(15, 'Prior reply')
  if (input.meetingActivity) add(15, 'Meeting activity')
  if (input.checkoutActivity) add(15, 'Checkout activity')
  if (input.purchaseHistory) add(10, 'Prior purchase')
  if (typeof input.budget === 'number' && input.budget >= 10_000) add(10, 'Budget indicates project readiness')
  if (/asap|immediate|30 days|1 month/.test(input.timeline?.toLowerCase() ?? '')) add(10, 'Near-term timing')

  const productMatch = matchRevenueProducts(input)
  if (!productMatch.eligibleForExpress) add(-15, 'Request is outside standard express scope')

  score = Math.max(0, Math.min(100, score))
  const grade: AuthoritativeLeadScore['grade'] = score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'D'
  const requiresHumanReview = productMatch.requiresHumanReview || input.emailQuality === 'risky'

  return {
    score,
    grade,
    reasons: [...reasons, ...productMatch.reasons, ...productMatch.exclusionReasons],
    recommendedProductIds: productMatch.recommendedProductIds,
    recommendedNextAction: requiresHumanReview
      ? 'Route to staff for scope and compliance review'
      : score >= 60
        ? 'Enroll in an approved product-specific follow-up workflow'
        : 'Continue low-frequency nurture after eligibility checks',
    requiresHumanReview,
  }
}

