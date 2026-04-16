/**
 * FUNNEL ANALYTICS SERVICE
 * Tracks user progression through concept → estimation → permits → checkout
 */

import { prismaAny } from '../utils/prisma-helper'

// ============================================================================
// TYPES
// ============================================================================

export enum FunnelEvent {
  // Concept events
  CONCEPT_PAGE_VIEWED = 'CONCEPT_PAGE_VIEWED',
  CONCEPT_INTAKE_STARTED = 'CONCEPT_INTAKE_STARTED',
  CONCEPT_INTAKE_COMPLETED = 'CONCEPT_INTAKE_COMPLETED',
  CONCEPT_GENERATED = 'CONCEPT_GENERATED',
  CONCEPT_ROUTED_TO_ESTIMATE = 'CONCEPT_ROUTED_TO_ESTIMATE',
  CONCEPT_ROUTED_TO_ARCHITECT = 'CONCEPT_ROUTED_TO_ARCHITECT',
  CONCEPT_ROUTED_TO_PERMIT = 'CONCEPT_ROUTED_TO_PERMIT',
  CONCEPT_CHECKOUT_INITIATED = 'CONCEPT_CHECKOUT_INITIATED',
  CONCEPT_CHECKOUT_COMPLETED = 'CONCEPT_CHECKOUT_COMPLETED',

  // Estimation events
  ESTIMATION_PAGE_VIEWED = 'ESTIMATION_PAGE_VIEWED',
  ESTIMATION_INTAKE_STARTED = 'ESTIMATION_INTAKE_STARTED',
  ESTIMATION_INTAKE_COMPLETED = 'ESTIMATION_INTAKE_COMPLETED',
  ESTIMATION_GENERATED = 'ESTIMATION_GENERATED',
  ESTIMATION_ROUTED_TO_PERMIT = 'ESTIMATION_ROUTED_TO_PERMIT',
  ESTIMATION_ROUTED_TO_ARCHITECT = 'ESTIMATION_ROUTED_TO_ARCHITECT',
  ESTIMATION_CHECKOUT_INITIATED = 'ESTIMATION_CHECKOUT_INITIATED',
  ESTIMATION_CHECKOUT_COMPLETED = 'ESTIMATION_CHECKOUT_COMPLETED',

  // Permit events
  PERMIT_PAGE_VIEWED = 'PERMIT_PAGE_VIEWED',
  PERMIT_JURISDICTION_SELECTED = 'PERMIT_JURISDICTION_SELECTED',
  PERMIT_INTAKE_STARTED = 'PERMIT_INTAKE_STARTED',
  PERMIT_INTAKE_COMPLETED = 'PERMIT_INTAKE_COMPLETED',
  PERMIT_REVIEW_GENERATED = 'PERMIT_REVIEW_GENERATED',
  PERMIT_MANAGED_SUBMISSION_SELECTED = 'PERMIT_MANAGED_SUBMISSION_SELECTED',
  PERMIT_AUTHORIZATION_STARTED = 'PERMIT_AUTHORIZATION_STARTED',
  PERMIT_AUTHORIZATION_COMPLETED = 'PERMIT_AUTHORIZATION_COMPLETED',
  PERMIT_CHECKOUT_INITIATED = 'PERMIT_CHECKOUT_INITIATED',
  PERMIT_CHECKOUT_COMPLETED = 'PERMIT_CHECKOUT_COMPLETED',

  // Pricing events
  CHECKOUT_CALCULATION_REQUESTED = 'CHECKOUT_CALCULATION_REQUESTED',
  CHECKOUT_FINAL_PRICE_SHOWN = 'CHECKOUT_FINAL_PRICE_SHOWN',
  CHECKOUT_SESSION_CREATED = 'CHECKOUT_SESSION_CREATED',
  CHECKOUT_ABANDONED = 'CHECKOUT_ABANDONED',
  CHECKOUT_COMPLETED = 'CHECKOUT_COMPLETED',
}

export interface FunnelEventInput {
  eventType: FunnelEvent
  sessionId: string
  intakeId?: string
  email?: string
  serviceType?: 'concept' | 'estimation' | 'permits'
  tier?: string
  jurisdiction?: string
  finalPrice?: number
  metadata?: Record<string, any>
}

// ============================================================================
// SERVICE
// ============================================================================

class FunnelAnalyticsService {
  /**
   * Track a funnel event
   */
  async trackEvent(input: FunnelEventInput) {
    try {
      // Log to console (in production, use structured logging service)
      console.log(`📊 Funnel Event: ${input.eventType}`, {
        sessionId: input.sessionId,
        intakeId: input.intakeId,
        email: input.email,
        serviceType: input.serviceType,
        timestamp: new Date().toISOString(),
      })

      // Store in ConversionFunnel if it's a checkout event
      if (input.finalPrice !== undefined) {
        await this.trackConversionFunnel(input)
      }

      return { success: true, eventType: input.eventType }
    } catch (error) {
      console.error('Error tracking funnel event:', error)
      // Don't throw - analytics should never break the main flow
      return { success: false, error }
    }
  }

  /**
   * Track conversion funnel milestone (checkout + completion)
   */
  private async trackConversionFunnel(input: FunnelEventInput) {
    const now = new Date()

    const funnelData = {
      sessionId: input.sessionId,
      email: input.email || 'unknown',
      serviceType: input.serviceType || 'unknown',
      tier: input.tier,
      status: this.getConversionStatus(input.eventType),
      stage: this.getConversionStage(input.eventType),
      amount: input.finalPrice || 0,
      currency: 'USD',
      source: input.metadata?.source || 'organic',
      // Timestamps
      viewedAt: input.eventType?.includes('PAGE_VIEWED') ? now : undefined,
      intakeStartedAt: input.eventType?.includes('INTAKE_STARTED') ? now : undefined,
      intakeCompletedAt: input.eventType?.includes('INTAKE_COMPLETED') ? now : undefined,
      checkoutInitiatedAt: input.eventType?.includes('CHECKOUT_INITIATED') ? now : undefined,
      checkoutCompletedAt: input.eventType?.includes('CHECKOUT_COMPLETED') ? now : undefined,
      metadata: input.metadata,
    }

    // Try to create ConversionFunnel record
    try {
      await prismaAny.conversionFunnel.create({
        data: funnelData as any,
      })
    } catch (error) {
      // Model might not exist, just log the error
      console.warn('Could not create ConversionFunnel record:', error)
    }
  }

  /**
   * Get conversion status from event type
   */
  private getConversionStatus(eventType: FunnelEvent): string {
    if (eventType === FunnelEvent.CHECKOUT_COMPLETED) return 'CONVERTED'
    if (eventType === FunnelEvent.CHECKOUT_ABANDONED) return 'ABANDONED'
    if (eventType?.includes('CHECKOUT')) return 'IN_CHECKOUT'
    if (eventType?.includes('INTAKE_COMPLETED')) return 'INTAKE_COMPLETE'
    if (eventType?.includes('INTAKE_STARTED')) return 'INTAKE_STARTED'
    return 'VIEWED'
  }

  /**
   * Get conversion stage from event type
   */
  private getConversionStage(eventType: FunnelEvent): string {
    if (eventType?.includes('CONCEPT')) return 'CONCEPT'
    if (eventType?.includes('ESTIMATION')) return 'ESTIMATION'
    if (eventType?.includes('PERMIT')) return 'PERMIT'
    if (eventType?.includes('CHECKOUT')) return 'CHECKOUT'
    return 'UNKNOWN'
  }

  /**
   * Get funnel summary for a service
   */
  async getFunnelSummary(serviceType: 'concept' | 'estimation' | 'permits', days: number = 30) {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

      // Query ConversionFunnel if it exists
      try {
        const funnelRecords = await prismaAny.conversionFunnel.findMany({
          where: {
            serviceType,
            createdAt: { gte: startDate },
          },
        })

        const views = funnelRecords.filter(r => r.status === 'VIEWED').length
        const conversions = funnelRecords.filter(r => r.status === 'CONVERTED').length
        const abandoned = funnelRecords.filter(r => r.status === 'ABANDONED').length
        const totalRevenue = funnelRecords
          .filter(r => r.status === 'CONVERTED')
          .reduce((sum, r) => sum + (r.amount || 0), 0)

        return {
          serviceType,
          period: `${days} days`,
          metrics: {
            views,
            conversions,
            abandonedCheckouts: abandoned,
            conversionRate: views > 0 ? ((conversions / views) * 100).toFixed(2) + '%' : '0%',
            totalRevenue,
            averageOrderValue: conversions > 0 ? (totalRevenue / conversions).toFixed(2) : '0',
          },
        }
      } catch (error) {
        console.warn('ConversionFunnel table not available, returning empty summary')
        return {
          serviceType,
          period: `${days} days`,
          metrics: {
            views: 0,
            conversions: 0,
            abandonedCheckouts: 0,
            conversionRate: '0%',
            totalRevenue: 0,
            averageOrderValue: '0',
          },
        }
      }
    } catch (error) {
      console.error('Error getting funnel summary:', error)
      return null
    }
  }

  /**
   * Track user properties for segmentation
   */
  async trackUserProperties(sessionId: string, properties: Record<string, any>) {
    console.log(`👤 User Properties: ${sessionId}`, properties)
    // In production, would store in analytics service (Amplitude, Mixpanel, etc.)
    return { success: true }
  }

  /**
   * Identify user for segmentation and personalization
   */
  async identifyUser(sessionId: string, email: string, properties?: Record<string, any>) {
    console.log(`🆔 User Identified: ${sessionId} → ${email}`, properties || {})
    // In production, would sync to analytics service
    return { success: true }
  }
}

export const funnelAnalyticsService = new FunnelAnalyticsService()
