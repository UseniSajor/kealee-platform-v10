import { prismaAny } from '../../utils/prisma-helper'

export interface CreateEngagementInput {
  type: string            // EngagementType enum value
  status?: string         // EngagementStatus enum value (default: LEAD_CAPTURED)
  deliveryModel: string   // DeliveryModel enum value
  assignmentMode?: string // AssignmentMode enum value (default: ROTATING_QUEUE)
  initiatorUserId?: string
  initiatorOrgId?: string
  projectId?: string
  servicePlanId?: string
  totalValue?: number
  sourceLeadId?: string
  sourceCampaignSlug?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  metadata?: Record<string, unknown>
}

export const engagementService = {
  /**
   * Create a canonical Engagement record.
   * Returns the new engagement id only — callers handle additional linking.
   */
  async createEngagement(input: CreateEngagementInput): Promise<string> {
    const now = new Date()
    const status = input.status ?? 'LEAD_CAPTURED'

    const data: any = {
      type: input.type,
      status,
      deliveryModel: input.deliveryModel,
      assignmentMode: input.assignmentMode ?? 'ROTATING_QUEUE',
      initiatorUserId: input.initiatorUserId ?? null,
      initiatorOrgId: input.initiatorOrgId ?? null,
      projectId: input.projectId ?? null,
      servicePlanId: input.servicePlanId ?? null,
      totalValue: input.totalValue !== undefined ? (input.totalValue as any) : null,
      sourceLeadId: input.sourceLeadId ?? null,
      sourceCampaignSlug: input.sourceCampaignSlug ?? null,
      utmSource: input.utmSource ?? null,
      utmMedium: input.utmMedium ?? null,
      utmCampaign: input.utmCampaign ?? null,
      metadata: input.metadata ?? null,
    }

    // Set lifecycle timestamp for the initial status
    if (status === 'LEAD_CAPTURED') data.leadCapturedAt = now
    if (status === 'LEAD_QUALIFIED') data.leadQualifiedAt = now
    if (status === 'PROPOSAL_SENT') data.proposalSentAt = now
    if (status === 'SUBSCRIPTION_ACTIVE') data.contractSignedAt = now

    const engagement = await prismaAny.engagement.create({
      data,
      select: { id: true },
    })

    return engagement.id
  },

  /**
   * Advance the Engagement status and optionally set related fields.
   * No-ops gracefully if engagementId is null/undefined.
   */
  async advanceEngagement(
    engagementId: string | null | undefined,
    status: string,
    extra?: {
      awardedToUserId?: string
      projectId?: string
    }
  ): Promise<void> {
    if (!engagementId) return

    const now = new Date()
    const data: any = { status }

    if (status === 'LEAD_QUALIFIED') data.leadQualifiedAt = now
    if (status === 'PROPOSAL_SENT') data.proposalSentAt = now
    if (status === 'AWARDED') {
      data.awardedAt = now
      if (extra?.awardedToUserId) data.awardedToUserId = extra.awardedToUserId
    }
    if (status === 'CONTRACT_PENDING') data.contractSignedAt = now
    if (status === 'CONTRACT_ACTIVE') data.contractSignedAt = now
    if (status === 'LOST') data.cancelledAt = now
    if (status === 'SUBSCRIPTION_CANCELLED') data.cancelledAt = now
    if (status === 'COMPLETED') data.completedAt = now

    if (extra?.projectId) data.projectId = extra.projectId

    await prismaAny.engagement.update({
      where: { id: engagementId },
      data,
    })
  },
}
