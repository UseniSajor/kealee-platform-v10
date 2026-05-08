/**
 * Professional Design Drawings — per-service pricing.
 *
 * Prices are all-in: architect fee + permit filing fee bundled.
 * Professionals earn industry-standard margins; the discount vs. a
 * standalone architect engagement reflects the pre-design work already
 * completed by the Kealee AI concept package.
 *
 * amount = 0 means "contact us" (custom-scope project).
 */

export interface DrawingsServiceConfig {
  /** Display label shown in the order summary */
  label: string
  /** Price in cents; 0 = contact us / custom quote */
  amount: number
  /** Human-readable delivery estimate */
  delivery: string
  /** Optional note displayed beneath the price */
  note?: string
}

export const DRAWINGS_BY_SERVICE: Record<string, DrawingsServiceConfig> = {
  deck: {
    label: 'Deck & Patio Permit Drawings',
    amount: 250000,
    delivery: '7–10 business days',
    note: 'Includes structural drawings + permit filing fee',
  },
  bathroom: {
    label: 'Bathroom Permit Drawings',
    amount: 250000,
    delivery: '7–10 business days',
    note: 'Includes mechanical/plumbing coordination + permit filing fee',
  },
  garden: {
    label: 'Landscape Permit Drawings',
    amount: 250000,
    delivery: '5–10 business days',
    note: 'Includes grading/drainage plan + permit filing fee',
  },
  kitchen: {
    label: 'Kitchen Permit Drawings',
    amount: 280000,
    delivery: '7–10 business days',
    note: 'Includes MEP coordination + permit filing fee',
  },
  interior: {
    label: 'Interior Renovation Permit Drawings',
    amount: 280000,
    delivery: '7–14 business days',
    note: 'Includes structural notes + permit filing fee',
  },
  facade: {
    label: 'Exterior Facade Permit Drawings',
    amount: 299900,
    delivery: '7–14 business days',
    note: 'Includes elevation drawings + DCRA/local review + permit filing fee',
  },
  addition: {
    label: 'Home Addition Permit Drawings',
    amount: 499900,
    delivery: '10–14 business days',
    note: 'Includes structural, MEP coordination + permit filing fee',
  },
  'whole-house': {
    label: 'Whole-Home Permit Drawings',
    amount: 799900,
    delivery: '14–21 business days',
    note: 'Full drawing set — structural, MEP, civil + permit filing fee',
  },
  'new-construction': {
    label: 'New Construction Drawings',
    amount: 0,
    delivery: 'Scoped per project',
    note: 'Custom scope — contact us for a quote',
  },
}

export const DEFAULT_DRAWINGS: DrawingsServiceConfig = {
  label: 'Permit-Ready Drawings',
  amount: 250000,
  delivery: '7–14 business days',
  note: 'Includes PE stamp where required + permit filing fee',
}

/**
 * Look up per-service pricing. Falls back to DEFAULT_DRAWINGS when the
 * slug is missing or unrecognised.
 */
export function getDrawingsConfig(serviceSlug?: string | null): DrawingsServiceConfig {
  if (!serviceSlug) return DEFAULT_DRAWINGS
  return DRAWINGS_BY_SERVICE[serviceSlug] ?? DEFAULT_DRAWINGS
}

/** Format cents → "$X,XXX" (no trailing .00 for whole-dollar amounts) */
export function formatDrawingsPrice(cents: number): string {
  if (cents === 0) return 'Custom quote'
  const dollars = cents / 100
  return dollars % 1 === 0
    ? `$${dollars.toLocaleString('en-US')}`
    : `$${dollars.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
}
