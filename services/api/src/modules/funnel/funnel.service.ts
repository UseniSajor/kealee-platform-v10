import { prisma } from '../../utils/prisma-helper'
// @ts-ignore - page-builder module resolution
import { buildPage, getProgress as getPageProgress } from '@kealee/page-builder'
// @ts-ignore - page-builder module resolution
import type { PageBuildResult } from '@kealee/page-builder'

const prismaTyped = prisma as any

export class FunnelService {
  async createSession(params: {
    ipAddress?: string
    userAgent?: string
    utmSource?: string
    utmMedium?: string
    utmCampaign?: string
  }) {
    const session = await prismaTyped.funnelSession.create({
      data: {
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        utmSource: params.utmSource,
        utmMedium: params.utmMedium,
        utmCampaign: params.utmCampaign,
        status: 'IN_PROGRESS',
        currentStep: 0,
      },
    })
    return session
  }

  async updateSession(
    sessionId: string,
    data: {
      userType?: string
      projectType?: string
      city?: string
      state?: string
      budget?: string
      timeline?: string
      currentStep?: number
    }
  ) {
    const updateData: Record<string, unknown> = {}

    if (data.userType) updateData.userType = data.userType
    if (data.projectType) updateData.projectType = data.projectType
    if (data.city !== undefined) updateData.city = data.city
    if (data.state !== undefined) updateData.state = data.state
    if (data.budget) updateData.budget = data.budget
    if (data.timeline) updateData.timeline = data.timeline
    if (data.currentStep !== undefined) updateData.currentStep = data.currentStep

    const session = await prismaTyped.funnelSession.update({
      where: { id: sessionId },
      data: updateData,
    })
    return session
  }

  async getSession(sessionId: string) {
    const session = await prismaTyped.funnelSession.findUnique({
      where: { id: sessionId },
    })
    return session
  }

  async generatePage(sessionId: string): Promise<PageBuildResult> {
    const session = await prismaTyped.funnelSession.findUnique({
      where: { id: sessionId },
    })

    if (!session) throw new Error('Session not found')
    if (!session.userType || !session.projectType || !session.city || !session.state || !session.budget || !session.timeline) {
      throw new Error('Session is incomplete — all funnel fields are required')
    }

    // Mark as generating
    await prismaTyped.funnelSession.update({
      where: { id: sessionId },
      data: { status: 'GENERATING' },
    })

    try {
      const result = await buildPage({
        sessionId,
        userType: session.userType,
        projectType: session.projectType,
        city: session.city,
        state: session.state,
        budget: session.budget,
        timeline: session.timeline,
      })

      // Persist generated page data as durable fallback
      await prismaTyped.funnelSession.update({
        where: { id: sessionId },
        data: {
          status: 'GENERATED',
          generatedPageData: result as any,
        },
      })

      return result
    } catch (err) {
      await prismaTyped.funnelSession.update({
        where: { id: sessionId },
        data: { status: 'FAILED' },
      })
      throw err
    }
  }

  async getPage(sessionId: string): Promise<PageBuildResult | null> {
    // Try Redis cache first (handled inside page-builder)
    // @ts-ignore - page-builder module resolution
    const { getCachedPage } = await import('@kealee/page-builder')
    const cached = await getCachedPage(sessionId)
    if (cached) return cached

    // Fall back to DB-stored data
    const session = await prismaTyped.funnelSession.findUnique({
      where: { id: sessionId },
    })

    if (!session?.generatedPageData) return null
    return session.generatedPageData as PageBuildResult
  }

  async getProgress(sessionId: string): Promise<number> {
    return getPageProgress(sessionId)
  }

  async captureLead(params: {
    name: string
    email: string
    phone?: string
    projectType?: string
    source?: string
    campaignSlug?: string
  }) {
    const lead = await prismaTyped.marketingLead.create({
      data: {
        name: params.name,
        email: params.email,
        phone: params.phone,
        projectType: params.projectType,
        source: params.source,
        campaignSlug: params.campaignSlug,
        status: 'new',
      },
    })

    // Send to n8n webhook (non-blocking)
    const webhookUrl = process.env.N8N_WEBHOOK_URL
    if (webhookUrl) {
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: params.name,
          email: params.email,
          phone: params.phone,
          projectType: params.projectType,
          source: params.source,
          leadId: lead.id,
          timestamp: new Date().toISOString(),
        }),
      }).catch((err) => {
        console.warn('[FunnelService] n8n webhook failed:', err.message)
      })
    }

    return lead
  }

  async linkLeadToSession(leadId: string, sessionId: string) {
    return prismaTyped.marketingLead.update({
      where: { id: leadId },
      data: { funnelSessionId: sessionId },
    })
  }

  async getCampaign(slug: string) {
    return prismaTyped.marketingCampaign.findUnique({
      where: { slug },
    })
  }
}
