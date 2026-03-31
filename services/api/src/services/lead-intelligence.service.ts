/**
 * Lead Intelligence Service
 * Handles lead profile creation, scoring, stage detection, and hot-lead triggers.
 */

import { prisma } from '@kealee/database'

// ── Event scoring table ───────────────────────────────────────────────────────

const EVENT_SCORES: Record<string, number> = {
  ask_anything:          10,
  intake_start:          15,
  intake_complete:       30,
  concept_purchase:      40,
  permit_start:          15,
  permit_complete:       30,
  design_start:          20,
  estimate_purchase:     25,
  checkout_initiated:    35,
  checkout_complete:     50,
}

// ── Stage detection ───────────────────────────────────────────────────────────

type LeadStage =
  | 'UNKNOWN'
  | 'AWARENESS'
  | 'CONCEPT'
  | 'DESIGN'
  | 'PERMIT'
  | 'ESTIMATION'
  | 'CHECKOUT'
  | 'HOT'

function detectStage(score: number, source?: string): LeadStage {
  if (score > 70) return 'HOT'
  if (score >= 50) return 'CHECKOUT'
  if (source?.includes('permit')) return 'PERMIT'
  if (source?.includes('design') || source?.includes('pre-design')) return 'DESIGN'
  if (source?.includes('estimate')) return 'ESTIMATION'
  if (score >= 30) return 'CONCEPT'
  if (score >= 10) return 'AWARENESS'
  return 'UNKNOWN'
}

// ── Hot lead trigger ──────────────────────────────────────────────────────────

async function triggerHotLead(email: string, phone?: string): Promise<void> {
  try {
    // Fire-and-forget GHL tag push
    const { ghlSyncService } = await import('../modules/integrations/ghl/ghl-sync.service.js')
    await ghlSyncService.tagContact(email, ['HOT Lead', 'Kealee - High Intent'])
  } catch {
    // GHL not critical — log and continue
    console.warn('[LeadIntelligence] GHL hot-lead tag failed (non-critical)')
  }

  // Twilio SMS — only if phone provided
  if (phone) {
    try {
      const twilio = (await import('twilio')).default
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID!,
        process.env.TWILIO_AUTH_TOKEN!
      )
      await client.messages.create({
        body: `🔥 Hot lead alert: ${email} scored 70+ — assign immediately.`,
        from: process.env.TWILIO_FROM_NUMBER!,
        to: process.env.INTERNAL_ALERT_PHONE ?? process.env.TWILIO_FROM_NUMBER!,
      })
    } catch {
      console.warn('[LeadIntelligence] Twilio SMS failed (non-critical)')
    }
  }
}

// ── Public service interface ──────────────────────────────────────────────────

export const LeadIntelligenceService = {
  /**
   * Create or update a lead profile by email or phone.
   */
  async upsertLeadProfile(data: {
    email?: string
    phone?: string
    firstName?: string
    lastName?: string
    projectType?: string
    location?: string
    budgetRange?: string
    hasPlans?: boolean
    needsPermit?: boolean
    urgencyLevel?: string
    source?: string
    stage?: LeadStage
  }): Promise<{ id: string; leadScore: number; stage: string }> {
    if (!data.email && !data.phone) {
      throw new Error('email or phone required for lead upsert')
    }

    const where = data.email
      ? { email: data.email }
      : { phone: data.phone! }

    const existing = await prisma.leadProfile.findFirst({ where })

    if (existing) {
      const updated = await prisma.leadProfile.update({
        where: { id: existing.id },
        data: {
          ...(data.firstName && { firstName: data.firstName }),
          ...(data.lastName && { lastName: data.lastName }),
          ...(data.projectType && { projectType: data.projectType }),
          ...(data.location && { location: data.location }),
          ...(data.budgetRange && { budgetRange: data.budgetRange }),
          ...(data.hasPlans !== undefined && { hasPlans: data.hasPlans }),
          ...(data.needsPermit !== undefined && { needsPermit: data.needsPermit }),
          ...(data.urgencyLevel && { urgencyLevel: data.urgencyLevel }),
          ...(data.source && { source: data.source }),
          ...(data.stage && { stage: data.stage }),
          lastActivityAt: new Date(),
        },
      })
      return { id: updated.id, leadScore: updated.leadScore, stage: updated.stage }
    }

    const stage = data.stage ?? detectStage(0, data.source)
    const created = await prisma.leadProfile.create({
      data: {
        email: data.email,
        phone: data.phone,
        firstName: data.firstName,
        lastName: data.lastName,
        projectType: data.projectType,
        location: data.location,
        budgetRange: data.budgetRange,
        hasPlans: data.hasPlans,
        needsPermit: data.needsPermit,
        urgencyLevel: data.urgencyLevel ?? 'normal',
        source: data.source,
        stage,
        leadScore: 0,
      },
    })
    return { id: created.id, leadScore: 0, stage: created.stage }
  },

  /**
   * Add score points to a lead by email. Creates profile if not found.
   */
  async scoreLeadByEmail(
    email: string,
    eventType: string,
    points?: number
  ): Promise<{ id: string; newScore: number; stage: string; isHot: boolean }> {
    const delta = points ?? EVENT_SCORES[eventType] ?? 5
    const existing = await prisma.leadProfile.findFirst({ where: { email } })

    let profile = existing
    if (!profile) {
      profile = await prisma.leadProfile.create({
        data: { email, leadScore: 0, stage: 'AWARENESS', source: eventType },
      })
    }

    const newScore = profile.leadScore + delta
    const newStage = detectStage(newScore, profile.source ?? undefined)
    const isHot = newScore > 70 && profile.leadScore <= 70

    const updated = await prisma.leadProfile.update({
      where: { id: profile.id },
      data: {
        leadScore: newScore,
        stage: newStage,
        lastActivityAt: new Date(),
      },
    })

    if (isHot) {
      void triggerHotLead(email, profile.phone ?? undefined)
    }

    return { id: updated.id, newScore, stage: updated.stage, isHot }
  },

  /**
   * Get a lead profile by email.
   */
  async getLeadByEmail(email: string) {
    return prisma.leadProfile.findFirst({ where: { email } })
  },

  /**
   * Get a lead profile by ID.
   */
  async getLeadById(id: string) {
    return prisma.leadProfile.findUnique({ where: { id } })
  },

  isHotLead(score: number): boolean {
    return score > 70
  },
}
