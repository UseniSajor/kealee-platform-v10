import { describe, expect, it } from 'vitest'
import { getOwnerPortalStatusLabel, resolveOwnerDeliveryState } from '../owner-portal-presentation'

describe('owner portal presentation', () => {
  it('keeps internal or malformed states out of the homeowner projection', () => {
    expect(resolveOwnerDeliveryState({ fulfillmentStatus: 'RUNNING_INTERNAL' })).toBeUndefined()
    expect(resolveOwnerDeliveryState({ fulfillmentStatus: { raw: true } })).toBeUndefined()
  })

  it('projects all supported fulfillment states', () => {
    for (const state of ['queued', 'processing', 'completed', 'partially_completed', 'failed', 'retryable'] as const) {
      expect(resolveOwnerDeliveryState({ fulfillmentStatus: state })).toBe(state)
    }
  })

  it('gives professional review precedence over generated completion metadata', () => {
    expect(resolveOwnerDeliveryState({
      fulfillmentStatus: 'completed', professionalReviewStatus: 'required',
    })).toBe('professional_review')
  })

  it.each([
    ['professional_review', 'A qualified professional review is required'],
    ['partially_completed', 'Your report is available; some items are still under review'],
    ['retryable', 'We’re retrying part of your report'],
    ['failed', 'We need to review part of your report'],
    ['completed', 'Your homeowner report is ready'],
    ['processing', 'We’re preparing your homeowner report'],
  ] as const)('uses homeowner language for %s', (deliveryState, label) => {
    expect(getOwnerPortalStatusLabel({ deliveryState, status: 'processing' })).toBe(label)
  })

  it('falls back safely when older records have no delivery state', () => {
    expect(getOwnerPortalStatusLabel({ status: 'completed' })).toBe('Your homeowner report is ready')
    expect(getOwnerPortalStatusLabel({ status: 'error' })).toBe('We need to review part of your report')
    expect(getOwnerPortalStatusLabel({ status: 'processing' })).toBe('We’re preparing your homeowner report')
  })
})
