import type { CapitalIntelligenceInput, CapitalIntelligenceOutput } from '../schemas/capital-intelligence.js'
import type { ContextBuilderPayload } from '../schemas/context.js'
import type { LoanProduct } from '../constants/events.js'

export class RuleBasedCapitalIntelligenceAgent {
  async analyze(input: CapitalIntelligenceInput, _ctx: ContextBuilderPayload): Promise<CapitalIntelligenceOutput> {
    if (!input.consentFinancing) {
      return {
        capitalFitScore: 0,
        recommendedLoanProducts: [],
        requiredDocuments: [],
        riskFlags: ['financing_consent_required'],
        complianceFlags: ['consent_required_before_lender_routing'],
        capitalTwinUpdates: [],
        nextActions: [{ action: 'request_financing_consent', priority: 'high' }],
        confidenceScore: 0.95,
        requiresHumanReview: true,
        scoreExplanation: 'Customer has not opted in to financing review. No lender routing performed.',
      }
    }

    const value = input.estimatedPropertyValue ?? 400_000
    const mortgage = input.estimatedMortgageBalance ?? value * 0.6
    const equity = input.estimatedEquity ?? Math.max(0, value - mortgage)
    const ltv = input.estimatedLTV ?? (mortgage / value) * 100
    const budget = input.projectBudget ?? 75_000

    const products: LoanProduct[] = []
    if (equity > 50_000 && ltv < 80) products.push('heloc', 'home_equity_loan')
    if (budget > 100_000) products.push('renovation_loan', 'construction_loan')
    if (input.ownerType?.includes('investor')) products.push('dscr_loan', 'bridge_loan')
    if (input.ownerType?.includes('developer')) products.push('developer_capital_stack', 'draw_schedule')
    if (products.length === 0) products.push('renovation_loan')

    const fundingGap = Math.max(0, budget - equity * 0.8)
    let fitScore = 50
    if (equity > budget) fitScore += 25
    if (ltv < 70) fitScore += 15
    if (input.documents?.length) fitScore += 10
    fitScore = Math.min(100, fitScore)

    return {
      capitalFitScore: fitScore,
      estimatedEquity: equity,
      estimatedLTV: Math.round(ltv * 10) / 10,
      recommendedLoanProducts: products,
      fundingGap,
      requiredDocuments: ['income_verification', 'property_details', 'project_scope'],
      lenderRoutingRecommendation: fitScore >= 70 ? 'partner_lender_queue' : 'internal_prequalification',
      riskFlags: ltv > 85 ? ['high_ltv'] : [],
      complianceFlags: ['not_credit_approval', 'requires_lender_consent'],
      capitalTwinUpdates: [
        { field: 'capitalFitScore', value: fitScore },
        { field: 'estimatedEquity', value: equity },
      ],
      nextActions: [{ action: 'route_lender_package', priority: fitScore >= 70 ? 'high' : 'medium' }],
      confidenceScore: 0.78,
      requiresHumanReview: true,
      scoreExplanation: `Capital fit ${fitScore}/100. Equity ~$${Math.round(equity)}, LTV ${ltv.toFixed(1)}%. Not a credit approval — fit assessment only.`,
    }
  }
}

export const ruleBasedCapitalIntelligence = new RuleBasedCapitalIntelligenceAgent()
