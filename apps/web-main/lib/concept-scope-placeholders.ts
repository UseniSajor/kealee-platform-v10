/**
 * Product-specific examples for the public concept flow (/concept/details).
 * Keeps copy out of the page component and matches SERVICE_MAP slugs in services-config.
 */

export const CONCEPT_SCOPE_PLACEHOLDERS: Record<string, string> = {
  kitchen:
    'E.g., Galley kitchen opened to the dining room, 10 ft island with seating, quartz counters, pantry wall, and relocating the sink under the window…',
  bathroom:
    'E.g., Primary bath: curbless shower with bench, heated floors, double vanity, freestanding tub removed for a larger shower, and improved exhaust…',
  garden:
    'E.g., Design my backyard with raised vegetable beds, a small chicken coop, drip irrigation, compost area, and a shaded gravel seating nook…',
  addition:
    'E.g., Two-story rear addition: new primary suite upstairs, expanded family room below, tie into existing roofline, and match brick on our colonial…',
  'whole-house':
    'E.g., Whole-home refresh: open kitchen/living, refinish both full baths, basement finish-out, new exterior trim and color, and update the HVAC zones…',
  interior:
    'E.g., First-floor refresh: replace carpet with oak LVP, new baseboards and doors, built-ins flanking the fireplace, and layered lighting in living + dining…',
  facade:
    'E.g., Re-side front and sides in fiber cement, new black windows, wider front steps, and low-maintenance foundation plantings for curb appeal…',
  deck:
    'E.g., Replace aging wood deck with composite, picture-frame border, aluminum rail, wide stairs to the yard, and a pergola off the kitchen slider…',
  'design-services':
    'E.g., Mood board + furniture layout for our combined living/dining in a narrow rowhouse; we already have paint swatches but need cohesion before ordering…',
}

export const DEFAULT_CONCEPT_SCOPE_PLACEHOLDER =
  'Describe your goals, existing conditions, timeline, and anything the design team should know for your concept package…'

export function getConceptScopePlaceholder(serviceSlug: string): string {
  return CONCEPT_SCOPE_PLACEHOLDERS[serviceSlug] ?? DEFAULT_CONCEPT_SCOPE_PLACEHOLDER
}

/** Short hint under square footage on concept details (optional context per service). */
export const CONCEPT_SQFT_HINTS: Record<string, string> = {
  kitchen: 'Kitchen footprint only (not whole home).',
  bathroom: 'Bath footprint only (e.g. 40–120 sq ft typical).',
  garden: 'Plantable / landscaped area you want designed.',
  addition: 'Approximate footprint of the new addition only.',
  'whole-house': 'Total conditioned square footage of the home.',
  interior: 'Area of rooms included in this phase.',
  facade: 'Wall area or footprint relevant to the exterior scope.',
  deck: 'Deck or patio surface area you are planning.',
  'design-services': 'Room(s) or zones covered by this design package.',
}

export function getConceptSqftHint(serviceSlug: string): string {
  return CONCEPT_SQFT_HINTS[serviceSlug] ?? 'Area of the specific space being renovated or added.'
}
