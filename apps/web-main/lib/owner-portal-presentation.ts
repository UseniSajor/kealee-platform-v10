import type { Concept } from './types'

const DELIVERY_STATES = new Set<NonNullable<Concept['deliveryState']>>([
  'queued', 'processing', 'completed', 'partially_completed', 'failed', 'retryable', 'professional_review',
])

/** Convert internal fulfillment metadata into the small, safe state vocabulary exposed to homeowners. */
export function resolveOwnerDeliveryState(formData: Record<string, unknown>): Concept['deliveryState'] {
  if (formData.professionalReviewStatus === 'required') return 'professional_review'
  const state = formData.fulfillmentStatus
  return typeof state === 'string' && DELIVERY_STATES.has(state as NonNullable<Concept['deliveryState']>)
    ? state as Concept['deliveryState']
    : undefined
}

export function getOwnerPortalStatusLabel(concept: Pick<Concept, 'deliveryState' | 'status'>): string {
  switch (concept.deliveryState) {
    case 'professional_review': return 'A qualified professional review is required'
    case 'partially_completed': return 'Your report is available; some items are still under review'
    case 'retryable': return 'We’re retrying part of your report'
    case 'failed': return 'We need to review part of your report'
    case 'completed': return 'Your homeowner report is ready'
    case 'queued':
    case 'processing': return 'We’re preparing your homeowner report'
  }
  return concept.status === 'completed'
    ? 'Your homeowner report is ready'
    : concept.status === 'error'
      ? 'We need to review part of your report'
      : 'We’re preparing your homeowner report'
}
