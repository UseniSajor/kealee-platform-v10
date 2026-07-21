import { describe, expect, it } from 'vitest'
import { normalizeContactIdentity } from '../contact-identity'
import { scoreLead } from '../lead-score-v2'
import { calculateContactWindow, evaluateOutreachPolicy } from '../outreach-policy'
import { matchRevenueProducts, REVENUE_PRODUCT_KEYS } from '../product-matcher'

describe('marketing foundation', () => {
  it('normalizes email, phone, and domain deterministically', () => {
    expect(normalizeContactIdentity({
      email: ' Tim@Example.COM ',
      phone: '(202) 555-0123',
    })).toEqual({ email: 'tim@example.com', phone: '+12025550123', domain: 'example.com' })
  })

  it('matches contractors to the contractor package', () => {
    const result = matchRevenueProducts({ customerType: 'General Contractor' })
    expect(result.recommendedProductIds).toEqual([REVENUE_PRODUCT_KEYS.CONTRACTOR_ESTIMATE_PERMIT])
    expect(result.eligibleForExpress).toBe(true)
  })

  it('blocks express eligibility for stamped documents', () => {
    const result = matchRevenueProducts({
      customerType: 'Homeowner',
      requiresStampedDocuments: true,
    })
    expect(result.eligibleForExpress).toBe(false)
    expect(result.requiresHumanReview).toBe(true)
  })

  it('returns the required authoritative lead score contract', () => {
    const result = scoreLead({
      customerType: 'Developer',
      geographyFit: true,
      source: 'referral',
      roleSeniority: 'Director of Development',
      emailQuality: 'verified',
      budget: 100_000,
      timeline: 'ASAP',
    })
    expect(result.score).toBeGreaterThanOrEqual(80)
    expect(result.grade).toBe('A')
    expect(result.recommendedProductIds).toContain(REVENUE_PRODUCT_KEYS.DEVELOPER_FEASIBILITY)
  })

  it('blocks every campaign after opt-out', () => {
    const result = evaluateOutreachPolicy({
      campaignStatus: 'active', campaignApproved: true, templateApproved: true,
      channel: 'email', suppressed: false, optedOut: true, sentToday: 0,
      mailboxDailyLimit: 20, domainSentToday: 0, domainDailyLimit: 100,
      withinSendWindow: true,
    })
    expect(result.allowed).toBe(false)
    expect(result.executionMode).toBe('blocked')
  })

  it('requires affirmative consent for SMS', () => {
    const result = evaluateOutreachPolicy({
      campaignStatus: 'active', campaignApproved: true, templateApproved: true,
      channel: 'sms', suppressed: false, optedOut: false, consentStatus: 'unknown',
      sentToday: 0, mailboxDailyLimit: 20, domainSentToday: 0, domainDailyLimit: 100,
      withinSendWindow: true,
    })
    expect(result.allowed).toBe(false)
  })

  it('requires affirmative consent for phone outreach', () => {
    const decision = evaluateOutreachPolicy({
      campaignStatus: 'active', campaignApproved: true, templateApproved: true,
      channel: 'call_task',
      suppressed: false, optedOut: false,
      consentStatus: 'unknown',
      sentToday: 0, mailboxDailyLimit: 20, domainSentToday: 0, domainDailyLimit: 100,
      withinSendWindow: true,
    })
    expect(decision.allowed).toBe(false)
    expect(decision.reasons).toContain('Phone outreach requires affirmative consent')
  })

  it('calculates a timezone-aware next contact window', () => {
    const decision = calculateContactWindow({
      now: new Date('2026-07-19T16:00:00.000Z'), // Sunday noon in New York
      timezone: 'America/New_York',
      allowedWeekdays: [1, 2, 3, 4, 5],
    })
    expect(decision.withinWindow).toBe(false)
    expect(decision.nextAllowedAt.toISOString()).toBe('2026-07-20T13:00:00.000Z')
  })
})
