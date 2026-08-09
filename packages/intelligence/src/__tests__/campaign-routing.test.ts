import { describe, it, expect } from 'vitest'
import { PrismaCampaignRoutingService } from '../services/campaign-routing.service.js'
import type { MarketingIntelligenceOutput } from '../schemas/marketing-intelligence.js'

const marketing: MarketingIntelligenceOutput = {
  audienceSegment: 'homeowner_remodel_candidate',
  recommendedCampaign: 'spring_remodel',
  recommendedChannel: 'email',
  recommendedOffer: 'free_concept',
  recommendedMessageAngle: 'Kitchen remodel support',
  productRouting: ['kitchen_bath_remodel'],
  salesPriority: 'high',
  crmTags: ['remodel'],
  suppressionFlags: [],
  complianceFlags: [],
  nextActions: [{ action: 'route' }],
  confidenceScore: 0.8,
  requiresHumanReview: false,
}

describe('campaign routing CRM tags', () => {
  const svc = new PrismaCampaignRoutingService()

  it('builds CRM tags from marketing output', () => {
    const tags = svc.buildCrmTags(marketing)
    expect(tags).toContain('segment:homeowner_remodel_candidate')
    expect(tags).toContain('product:kitchen_bath_remodel')
  })

  it('builds custom fields for CRM sync', () => {
    const fields = svc.buildCrmCustomFields(marketing, 82)
    expect(fields.intelligence_segment).toBe('homeowner_remodel_candidate')
    expect(fields.intelligence_score).toBe('82')
  })
})
