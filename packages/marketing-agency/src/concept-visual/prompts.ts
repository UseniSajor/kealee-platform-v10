import type { ConceptVisualInput, PropertyStyle, ServiceType } from '../types'

const QUALITY_SUFFIX =
  'photorealistic, professional real-estate photography, no people, no logos, no watermarks, no text, 8k detail'

const SERVICE_DESCRIPTIONS: Record<ServiceType, string> = {
  ADU: 'detached accessory dwelling unit backyard studio with modern entry',
  kitchen_remodel: 'renovated kitchen with quartz counters and custom cabinetry',
  bathroom_remodel: 'spa-like bathroom with walk-in shower and floating vanity',
  basement: 'finished basement family room with recessed lighting',
  exterior_redesign: 'updated home exterior with new siding and landscaping',
  deck: 'composite deck with railing overlooking backyard',
  yard_design: 'curated front yard landscape with native plantings',
  water_mitigation: 'professional water damage restoration and dry-out setup',
  multifamily_turnover: 'refreshed apartment unit ready for new tenants',
  commercial_renovation: 'modernized commercial interior retail space',
}

const PROPERTY_LABELS: Record<string, string> = {
  single_family: 'single-family home',
  townhouse: 'townhouse',
  condo: 'condominium unit',
  multifamily: 'multifamily building',
  commercial: 'commercial property',
}

export function buildConceptVisualPrompt(input: ConceptVisualInput): string {
  const serviceDesc = SERVICE_DESCRIPTIONS[input.service_type]
  const property = PROPERTY_LABELS[input.property_type] ?? input.property_type
  const style = input.property_style.replace(/_/g, ' ')
  const location = [input.city, input.county].filter(Boolean).join(', ')

  const variantPrefix =
    input.variant === 'before'
      ? 'Before renovation: dated worn space needing upgrade,'
      : input.variant === 'hero'
        ? 'Hero marketing showcase:'
        : 'After renovation: beautifully completed'

  const locationSuffix = location ? ` in ${location} area` : ''

  return [
    variantPrefix,
    serviceDesc,
    `at a ${property}`,
    `with ${style} architectural style${locationSuffix}.`,
    'Representative concept visual for marketing only — not a real customer project.',
    QUALITY_SUFFIX,
  ].join(' ')
}

export function serviceTypeLabel(service: ServiceType): string {
  return service.replace(/_/g, ' ')
}

export function propertyStyleLabel(style: PropertyStyle): string {
  return style.replace(/_/g, ' ')
}

export interface ConceptVisualResult {
  imageUrl: string
  promptUsed: string
  provider: string
  model: string
}
