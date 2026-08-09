import type { LeadIntelligenceInput, LeadIntelligenceOutput } from '../schemas/lead-intelligence.js'
import type { ContextBuilderPayload } from '../schemas/context.js'

export class RuleBasedLeadIntelligenceAgent {
  async analyze(input: LeadIntelligenceInput, _ctx: ContextBuilderPayload): Promise<LeadIntelligenceOutput> {
    const form = input.formData ?? {}
    const budget = input.budget ?? (typeof form.budget === 'number' ? form.budget : undefined)
    const timeline = input.timeline ?? String(form.timeline ?? '')
    const service = input.projectInterest ?? String(form.service ?? form.serviceType ?? '')
    const source = input.campaignSource ?? String(form.source ?? 'web')

    let intentScore = 40
    let engagementScore = 30
    if (input.uploadedPhotos) engagementScore += 15
    if (input.conversationHistory?.length) engagementScore += 20
    if (input.websiteBehavior?.pageViews) engagementScore += 10
    if (timeline === 'asap') intentScore += 25
    if ((budget ?? 0) >= 30000) intentScore += 20
    if (service.includes('permit')) intentScore += 15
    if (service.includes('estimate')) intentScore += 12
    if (input.purchaseHistory?.length) engagementScore += 25

    intentScore = Math.min(100, intentScore)
    engagementScore = Math.min(100, engagementScore)

    let salesPriority: LeadIntelligenceOutput['salesPriority'] = 'medium'
    if (intentScore >= 80 && engagementScore >= 60) salesPriority = 'immediate'
    else if (intentScore >= 65) salesPriority = 'high'
    else if (intentScore < 35) salesPriority = 'suppress'

    const segment = service.includes('permit')
      ? 'permit_help_candidate'
      : service.includes('adu')
        ? 'adu_candidate'
        : 'homeowner_remodel_candidate'

    const recommendedProduct = service.includes('permit')
      ? 'permit_package'
      : service.includes('estimate')
        ? 'estimate_detailed'
        : 'design_concept_validation'

    return {
      leadSegment: segment,
      intentScore,
      engagementScore,
      salesPriority,
      recommendedProduct,
      recommendedNurtureSequence: salesPriority === 'suppress' ? 'long_nurture_90d' : 'standard_nurture_14d',
      recommendedSalesAction:
        salesPriority === 'immediate' ? 'sales_call_within_24h' : 'enqueue_nurture_sequence',
      crmTags: [segment, source, salesPriority, recommendedProduct],
      suppressionFlags: salesPriority === 'suppress' ? ['low_intent'] : [],
      complianceFlags: [],
      leadTwinUpdates: [
        { field: 'segment', value: segment },
        { field: 'intentScore', value: intentScore },
      ],
      nextActions: [{ action: 'update_lead_twin', priority: 'high' }],
      confidenceScore: 0.82,
      requiresHumanReview: salesPriority === 'immediate' && (budget ?? 0) > 250_000,
      scoreExplanation: `Intent ${intentScore}, engagement ${engagementScore} from form/service=${service}, source=${source}.`,
    }
  }
}

export const ruleBasedLeadIntelligence = new RuleBasedLeadIntelligenceAgent()
