/**
 * Intelligence-enhanced lead scoring for web-main intake leads.
 * Blends legacy lead-scorer with v30 intelligence agents when persistence is available.
 */

import {
  scoreIntakeLead,
  isIntelligencePersistenceAvailable,
  priorityToRoutingTag,
  blendLeadScores,
  prismaCampaignRoutingService,
  type IntakeLeadInput,
  type IntelligenceLeadResult,
  type OpportunityPriority,
} from '@kealee/intelligence'
import {
  calculateLeadScore,
  type LeadData,
  type LeadScore,
  type RoutingTag,
} from './lead-scorer'

export { priorityToRoutingTag, blendLeadScores }
export type { OpportunityPriority }

export interface BlendedLeadScore {
  score: number
  tag: RoutingTag
  legacy: LeadScore
  intelligence?: IntelligenceLeadResult
  mode: 'intelligence' | 'legacy'
  breakdown: LeadScore['breakdown'] & {
    intelligenceScore?: number
    intelligencePriority?: string
    audienceSegment?: string
    topProduct?: string
  }
}

export function mapIntakeRowToLeadInput(
  lead: Record<string, unknown>,
  formData: Record<string, unknown>,
): IntakeLeadInput {
  return {
    leadId: String(lead.id),
    address: String(
      lead.project_address || formData.address || formData.projectAddress || 'Address pending',
    ),
    email: String(lead.contact_email || lead.email || formData.email || ''),
    phone: String(lead.contact_phone || lead.phone_number || formData.phone || ''),
    name: String(lead.client_name || lead.name || formData.name || ''),
    source: String(lead.source || formData.source || 'web'),
    budget: formData.budget ? parseBudget(formData.budget) : undefined,
    timeline: formData.timeline ? String(formData.timeline) : undefined,
    service: String(
      lead.service_type || formData.serviceType || formData.service || lead.project_path || '',
    ),
    hasPhoto: Boolean(lead.area_photo_url),
    hasDocuments: Array.isArray(formData.attachment_urls) && formData.attachment_urls.length > 0,
    propertyType: formData.propertyType ? String(formData.propertyType) : undefined,
    parcelId: formData.parcelId ? String(formData.parcelId) : undefined,
    jurisdiction: formData.jurisdiction ? String(formData.jurisdiction) : undefined,
    crmContactId: lead.ghl_contact_id ? String(lead.ghl_contact_id) : undefined,
  }
}

function parseBudget(budget: unknown): number | undefined {
  if (typeof budget === 'number') return budget
  const s = String(budget)
  const nums = s.match(/\d+/g)
  if (!nums?.length) return undefined
  return parseInt(nums[0], 10)
}

export async function scoreLeadWithIntelligence(
  leadData: LeadData,
  intake: IntakeLeadInput,
): Promise<BlendedLeadScore> {
  const legacy = calculateLeadScore(leadData)
  const enabled =
    process.env.INTELLIGENCE_SCORING_ENABLED !== 'false' && isIntelligencePersistenceAvailable()

  if (!enabled) {
    return {
      score: legacy.score,
      tag: legacy.tag,
      legacy,
      mode: 'legacy',
      breakdown: { ...legacy.breakdown },
    }
  }

  try {
    const intelligence = await scoreIntakeLead(intake)
    const tag = priorityToRoutingTag(intelligence.recommendedPriority)
    const score = blendLeadScores(legacy.score, intelligence.intelligenceScore)

    return {
      score,
      tag,
      legacy,
      intelligence,
      mode: 'intelligence',
      breakdown: {
        ...legacy.breakdown,
        intelligenceScore: intelligence.intelligenceScore,
        intelligencePriority: intelligence.recommendedPriority,
        audienceSegment: intelligence.audienceSegment,
        topProduct: intelligence.topProduct,
      },
    }
  } catch (err) {
    console.error('[intelligence-scorer] fallback to legacy:', err)
    return {
      score: legacy.score,
      tag: legacy.tag,
      legacy,
      mode: 'legacy',
      breakdown: { ...legacy.breakdown },
    }
  }
}

export function intelligenceMetadataUpdate(result: BlendedLeadScore): Record<string, unknown> | null {
  if (!result.intelligence) return null
  const i = result.intelligence
  const pa = i.productAssignment
  return {
    property_twin_id: i.propertyTwinId,
    lead_twin_id: i.leadTwinId,
    intelligence_segment: i.audienceSegment,
    intelligence_priority: i.recommendedPriority,
    intelligence_metadata: {
      loopRunId: i.loopRunId,
      topProduct: i.topProduct,
      recommendedChannel: i.recommendedChannel,
      humanReviewRequired: i.humanReviewRequired,
      reviewReasons: i.reviewReasons,
      routed: i.routed,
      autoAssigned: pa?.autoAssigned ?? false,
      mode: result.mode,
      crmTags: prismaCampaignRoutingService.buildCrmTags(i.marketing),
      productAssignment: pa
        ? {
            assignedProduct: pa.assignedProduct,
            campaign: pa.campaign,
            landingPage: pa.landingPage,
            offer: pa.offer,
            bot: pa.bot,
            nurtureSequence: pa.nurtureSequence,
            autoAssigned: pa.autoAssigned,
            requiresHumanReview: pa.requiresHumanReview,
          }
        : undefined,
    },
  }
}

export function intelligenceCrmExtras(result: BlendedLeadScore): {
  customFields?: Record<string, string>
  tags?: string[]
} {
  if (!result.intelligence) return {}
  const i = result.intelligence
  return {
    tags: prismaCampaignRoutingService.buildCrmTags(i.marketing),
    customFields: prismaCampaignRoutingService.buildCrmCustomFields(
      i.marketing,
      i.intelligenceScore,
    ),
  }
}
