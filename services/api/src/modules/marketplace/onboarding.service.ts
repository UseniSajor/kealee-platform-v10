/**
 * onboarding.service.ts
 *
 * Tracks contractor funnel stage for analytics and progressive disclosure.
 * The actual user/profile creation lives in contractor-registration.routes.ts;
 * this layer records WHERE each contractor is in the funnel so ops can
 * monitor conversion, approve/reject, and measure time-to-launch.
 */

import { prismaAny } from '../../utils/prisma-helper'

// ── Types ─────────────────────────────────────────────────────────────────────

export type OBStage =
  | 'REGISTRATION'
  | 'EMAIL_VERIFIED'
  | 'PROFILE_BASIC'
  | 'PROFILE_SERVICES'
  | 'DOCUMENTS_UPLOADED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'ACTIVE'

export const STAGE_ORDER: OBStage[] = [
  'REGISTRATION',
  'EMAIL_VERIFIED',
  'PROFILE_BASIC',
  'PROFILE_SERVICES',
  'DOCUMENTS_UPLOADED',
  'UNDER_REVIEW',
  'APPROVED',
  'ACTIVE',
]

// ── Service ───────────────────────────────────────────────────────────────────

export class OnboardingService {
  /** Get or create an onboarding record for a user. Safe to call repeatedly. */
  async getOrCreate(
    userId: string,
    email: string,
    opts?: {
      inviteSource?: string
      inviteCode?:   string
      cohortId?:     string
      assignedRegion?: string
    },
  ) {
    const existing = await prismaAny.contractorOnboarding.findUnique({
      where: { userId },
    })
    if (existing) return existing

    return prismaAny.contractorOnboarding.create({
      data: {
        userId,
        email,
        stage:           'REGISTRATION',
        completedStages: [],
        formData:        {},
        ...opts,
        lastActivityAt: new Date(),
      },
    })
  }

  /** Advance a contractor to a new stage, merging partial form data. */
  async advanceStage(
    userId:    string,
    newStage:  OBStage,
    formData?: Record<string, unknown>,
  ) {
    const ob = await prismaAny.contractorOnboarding.findUnique({ where: { userId } })
    if (!ob) throw new Error('Onboarding record not found for user ' + userId)

    // Accumulate completed stages
    const completedStages: OBStage[] = Array.from(
      new Set([...(ob.completedStages as OBStage[]), ob.stage as OBStage]),
    )

    const mergedData = { ...(ob.formData as object), ...(formData ?? {}) }

    return prismaAny.contractorOnboarding.update({
      where: { userId },
      data: {
        stage:           newStage,
        completedStages,
        formData:        mergedData,
        lastActivityAt:  new Date(),
        ...(newStage === 'APPROVED' || newStage === 'ACTIVE' ? { completedAt: new Date() } : {}),
        ...(newStage === 'APPROVED'  ? { approvedAt: new Date() } : {}),
        ...(newStage === 'REJECTED'  ? { rejectedAt: new Date() } : {}),
      },
    })
  }

  /** Link a MarketplaceProfile once it has been created. */
  async linkProfile(userId: string, profileId: string) {
    return prismaAny.contractorOnboarding.update({
      where: { userId },
      data:  { profileId },
    })
  }

  /** Admin: approve a contractor — advances to APPROVED. */
  async approve(userId: string) {
    return this.advanceStage(userId, 'APPROVED')
  }

  /** Admin: reject with a written reason. */
  async reject(userId: string, reason: string) {
    return prismaAny.contractorOnboarding.update({
      where: { userId },
      data: {
        stage:           'REJECTED',
        rejectedAt:      new Date(),
        rejectionReason: reason,
        lastActivityAt:  new Date(),
      },
    })
  }

  /** Get onboarding record for a single user. */
  async getByUser(userId: string) {
    return prismaAny.contractorOnboarding.findUnique({
      where:   { userId },
      include: { cohort: true },
    })
  }

  /** Admin: paginated list with optional filters. */
  async list(opts: {
    stage?:    OBStage
    region?:   string
    cohortId?: string
    limit?:    number
    cursor?:   string
  } = {}) {
    const { stage, region, cohortId, limit = 50, cursor } = opts
    return prismaAny.contractorOnboarding.findMany({
      where: {
        ...(stage    ? { stage }                          : {}),
        ...(region   ? { assignedRegion: region }         : {}),
        ...(cohortId ? { cohortId }                       : {}),
      },
      orderBy: { createdAt: 'desc' },
      take:    limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      include: { cohort: true },
    })
  }

  /**
   * Funnel stats: count per stage, conversion rates, total/approved/rejected.
   */
  async funnelStats() {
    const rows = await prismaAny.contractorOnboarding.groupBy({
      by:    ['stage'],
      _count: { _all: true },
    })

    const byStage: Record<OBStage, number> = {} as any
    for (const s of STAGE_ORDER)           byStage[s] = 0
    byStage['REJECTED'] = 0
    for (const r of rows as Array<{ stage: string; _count: { _all: number } }>) {
      byStage[r.stage as OBStage] = r._count._all
    }

    const conversions: Array<{ from: OBStage; to: OBStage; rate: number }> = []
    for (let i = 0; i < STAGE_ORDER.length - 1; i++) {
      const from      = STAGE_ORDER[i]
      const to        = STAGE_ORDER[i + 1]
      const fromCount = byStage[from] ?? 0
      const toCount   = byStage[to]   ?? 0
      conversions.push({
        from,
        to,
        rate: fromCount > 0 ? Math.round((toCount / fromCount) * 100) : 0,
      })
    }

    const total    = Object.values(byStage).reduce((a, b) => a + b, 0)
    const approved = (byStage['APPROVED'] ?? 0) + (byStage['ACTIVE'] ?? 0)
    const rejected = byStage['REJECTED'] ?? 0

    return { byStage, conversions, total, approved, rejected }
  }

  /** Average calendar days from REGISTRATION to APPROVED. */
  async avgTimeToApproval(): Promise<number> {
    const records = await prismaAny.contractorOnboarding.findMany({
      where:  { stage: { in: ['APPROVED', 'ACTIVE'] }, approvedAt: { not: null } },
      select: { createdAt: true, approvedAt: true },
    })
    if (!records.length) return 0
    const totalMs = (records as Array<{ createdAt: Date; approvedAt: Date }>).reduce(
      (sum, r) => sum + (r.approvedAt.getTime() - r.createdAt.getTime()),
      0,
    )
    return Math.round(totalMs / records.length / 86_400_000)
  }
}

export const onboardingService = new OnboardingService()
