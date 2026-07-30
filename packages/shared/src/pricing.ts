/**
 * Compatibility pricing exports.
 *
 * Canonical amounts live in @kealee/core-rules. This module preserves the
 * established @kealee/shared/pricing API for existing consumers.
 */
import { SERVICE_PRICING as CORE_SERVICE_PRICING } from '@kealee/core-rules'

function withUsd<T extends { amount: number }>(entry: T): T & { amountUsd: number } {
  return { ...entry, amountUsd: entry.amount / 100 }
}

export const SERVICE_PRICING = {
  estimation: {
    cost_estimate: withUsd(CORE_SERVICE_PRICING.estimation.cost_estimate),
    certified_estimate: withUsd(CORE_SERVICE_PRICING.estimation.certified_estimate),
    bundle: withUsd(CORE_SERVICE_PRICING.estimation.bundle),
  },
  permits: {
    document_assembly: withUsd(CORE_SERVICE_PRICING.permits.document_assembly),
    simple_permit: withUsd(CORE_SERVICE_PRICING.permits.simple_permit),
    complex_permit: withUsd(CORE_SERVICE_PRICING.permits.complex_permit),
    expedited: withUsd(CORE_SERVICE_PRICING.permits.expedited),
  },
  preDesign: {
    starter: withUsd(CORE_SERVICE_PRICING.preDesign.starter),
    visualization: withUsd(CORE_SERVICE_PRICING.preDesign.visualization),
    preDesign: withUsd(CORE_SERVICE_PRICING.preDesign.preDesign),
  },
  contractorMatch: withUsd(CORE_SERVICE_PRICING.contractorMatch),
  architectConsultation: withUsd(CORE_SERVICE_PRICING.architectConsultation),
} as const

export function formatPrice(cents: number, format: 'usd' | 'display' = 'display'): string {
  const dollars = cents / 100
  if (format === 'usd') return dollars.toFixed(2)
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(dollars)
}

export function getStartingPrice(service: keyof typeof SERVICE_PRICING): number {
  const category = SERVICE_PRICING[service]
  if ('amount' in category) return category.amount
  const prices = Object.values(category)
    .filter((entry): entry is { amount: number } => typeof entry === 'object' && entry !== null && 'amount' in entry)
    .map(entry => entry.amount)
  return Math.min(...prices)
}

export const getDisplayPrice = (cents: number): string => formatPrice(cents)

export const PERMIT_SUBMISSION_MULTIPLIERS = {
  SELF: 0.8,
  ASSISTED: 1,
  KEALEE_MANAGED: 1.3,
} as const

export type ServiceCategory = keyof typeof SERVICE_PRICING
export type SubmissionMethod = keyof typeof PERMIT_SUBMISSION_MULTIPLIERS
