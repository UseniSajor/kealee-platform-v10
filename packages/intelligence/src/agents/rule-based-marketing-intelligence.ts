import type { MarketingIntelligenceService } from '../services/interfaces.js'
import type { MarketingIntelligenceInput, MarketingIntelligenceOutput } from '../schemas/marketing-intelligence.js'
import type { ContextBuilderPayload } from '../schemas/context.js'
import type { MarketingSegmentKey } from '../constants/segments.js'
import type { KealeeProduct } from '../constants/products.js'
import type { PropertyIntelligenceOutput } from '../schemas/property-intelligence.js'

interface LeadHints {
  source?: string
  budget?: number
  timeline?: string
  service?: string
  crmStatus?: string
}

function segmentFromProperty(
  property: PropertyIntelligenceOutput,
  lead: LeadHints,
): MarketingSegmentKey {
  const service = lead.service?.toLowerCase() ?? ''
  const top = property.recommendedKealeeProducts[0] ?? ''

  if (service.includes('permit') || top === 'permit_package') return 'permit_help_candidate'
  if (top === 'adu_feasibility') return 'adu_candidate'
  if (top === 'basement_finish') return 'basement_finish_candidate'
  if (top === 'addition_feasibility') return 'addition_candidate'
  if (top === 'developer_feasibility' || property.propertyType.includes('multi')) {
    return 'developer_feasibility_candidate'
  }
  if (top === 'investor_renovation_package' || property.ownershipType.includes('investor')) {
    return 'investor_renovation_candidate'
  }
  if (top === 'commercial_tenant_improvement') return 'commercial_ti_candidate'
  return 'homeowner_remodel_candidate'
}

function channelFromSource(source?: string): MarketingIntelligenceOutput['recommendedChannel'] {
  switch (source?.toLowerCase()) {
    case 'meta':
    case 'facebook':
      return 'retargeting'
    case 'google':
      return 'paid_ads'
    case 'referral':
      return 'sales_call'
    case 'organic':
    case 'web':
      return 'email'
    default:
      return 'email'
  }
}

function salesPriority(lead: LeadHints): MarketingIntelligenceOutput['salesPriority'] {
  const urgent = lead.timeline === 'asap' || lead.timeline === 'immediately' || lead.timeline === '1-2-weeks'
  const highBudget = (lead.budget ?? 0) >= 30000
  if (urgent && highBudget) return 'immediate'
  if (highBudget || urgent) return 'high'
  if ((lead.budget ?? 0) >= 5000) return 'medium'
  if ((lead.budget ?? 0) < 2000) return 'suppress'
  return 'low'
}

export class RuleBasedMarketingIntelligenceService implements MarketingIntelligenceService {
  async recommend(input: MarketingIntelligenceInput, _context: ContextBuilderPayload): Promise<MarketingIntelligenceOutput> {
    const property = input.propertyTwin as unknown as PropertyIntelligenceOutput
    const lead = (input.leadTwin ?? {}) as LeadHints
    const segment = segmentFromProperty(property, lead)
    const priority = salesPriority(lead)
    const productRouting = (property.recommendedKealeeProducts ?? ['design_concept_validation']) as KealeeProduct[]
    const suppress = priority === 'suppress'

    return {
      audienceSegment: segment,
      recommendedCampaign: suppress ? 'nurture_low_intent' : `kealee_${segment}_2026`,
      recommendedChannel: suppress ? 'none' : channelFromSource(lead.source),
      recommendedOffer: suppress ? 'educational_content' : 'free_concept_validation',
      recommendedMessageAngle: suppress
        ? 'Learn how Kealee helps homeowners plan remodels on any budget'
        : `Kealee ${productRouting[0]?.replace(/_/g, ' ')} support for your property project`,
      productRouting: productRouting.slice(0, 3) as KealeeProduct[],
      salesPriority: priority,
      crmTags: [segment, lead.source ?? 'unknown', priority],
      nurtureSequence: suppress ? 'long_nurture_90d' : 'standard_nurture_14d',
      suppressionFlags: suppress ? ['low_budget', 'low_intent'] : [],
      complianceFlags: [],
      nextActions: suppress
        ? [{ action: 'enqueue_nurture_only', priority: 'low' }]
        : [{ action: 'route_to_crm', priority: priority === 'immediate' ? 'immediate' : 'high' }],
      confidenceScore: suppress ? 0.72 : 0.84,
      requiresHumanReview: segment.includes('developer') || segment.includes('commercial'),
    }
  }
}

export const ruleBasedMarketingIntelligence = new RuleBasedMarketingIntelligenceService()
