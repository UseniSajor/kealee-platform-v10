/**
 * Low-typing project description for /concept/details.
 * Users tap chips; we compose the scope string sent to intake.
 */

export const CONCEPT_GOAL_OPTIONS: Record<string, string[]> = {
  kitchen: [
    'Open layout to dining or living',
    'Larger island with seating',
    'More storage / walk-in pantry',
    'Quartz or stone countertops',
    'New appliances / better workflow',
    'Better lighting',
    'Relocate sink or range',
    'Refresh cabinets & hardware',
  ],
  bathroom: [
    'Larger walk-in shower',
    'Curbless / zero-threshold shower',
    'Double vanity',
    'Heated floors',
    'Remove tub for more shower space',
    'Better ventilation',
    'Freestanding tub',
    'Accessible / aging-in-place layout',
  ],
  garden: [
    'Outdoor entertaining',
    'Edible garden / raised beds',
    'Low-maintenance planting',
    'Privacy screening',
    'Pathways & hardscape',
    'Shade structure / pergola',
    'Water feature',
    'Pet- or kid-friendly zones',
  ],
  addition: [
    'Extra bedroom',
    'Primary suite',
    'Expanded family / living space',
    'Home office',
    'Second story',
    'In-law suite / ADU',
    'Match existing exterior',
    'Improve rear access / mudroom',
  ],
  'whole-house': [
    'Open kitchen & living',
    'Update all baths',
    'New flooring throughout',
    'Exterior refresh',
    'Basement finish',
    'Energy / HVAC upgrades',
    'Reconfigure floor plan',
    'Prepare for resale',
  ],
  interior: [
    'New flooring',
    'Updated trim & doors',
    'Built-ins / millwork',
    'Fireplace update',
    'Better lighting',
    'Open up walls',
    'Refresh paint & finishes',
    'Furniture-friendly layout',
  ],
  facade: [
    'New siding',
    'New windows',
    'Front porch / entry',
    'Curb appeal refresh',
    'New roof visible from street',
    'Foundation plantings',
    'Improved lighting',
    'Historic-appropriate materials',
  ],
  deck: [
    'Replace rotting wood deck',
    'Composite decking',
    'Covered or pergola area',
    'Wider stairs to yard',
    'Built-in seating',
    'Cable or glass rail',
    'Outdoor kitchen hook-up',
    'Multi-level deck',
  ],
  'design-services': [
    'Furniture layout',
    'Mood board / style direction',
    'Color & material palette',
    'Lighting plan',
    'Window treatment direction',
    'Art & accessory placement',
    'Open plan coordination',
    'Pre-purchase planning',
  ],
}

export const CONCEPT_CONDITION_OPTIONS: Record<string, string[]> = {
  kitchen: [
    'Galley or closed-off',
    'Cramped / poor flow',
    'Dated cabinets',
    'Not enough counter space',
    'Appliances need replacing',
    'Poor lighting',
    '1960s–80s original',
    'Recently purchased home',
  ],
  bathroom: [
    'Small footprint',
    'Tub-only, want shower',
    'Outdated tile & vanity',
    'Poor ventilation / moisture',
    '1990s builder grade',
    'Accessibility issues',
    'Only bath on floor',
    'Recently purchased home',
  ],
  garden: [
    'Mostly lawn today',
    'Overgrown / neglected',
    'Poor drainage',
    'Full sun exposure',
    'Mostly shade',
    'Sloped yard',
    'HOA restrictions',
    'Recently purchased home',
  ],
  addition: [
    'Outgrowing current layout',
    'Rear yard available',
    'Side yard available',
    'Need second story',
    'Match 1950s–80s home',
    'Historic district',
    'HOA design review',
    'Tight setback constraints',
  ],
  'whole-house': [
    'Original 1960s–80s finishes',
    'Closed-off rooms',
    'Needs all systems update',
    'Investment / flip',
    'Long-term family home',
    'Just purchased',
    'Some rooms updated, others not',
    'Planning phased work',
  ],
  interior: [
    'Carpet throughout',
    'Dark / closed-off rooms',
    'Popcorn ceilings',
    'Needs storage',
    'Rental refresh',
    'Recently purchased',
    'Some rooms done, others dated',
    'Planning phased work',
  ],
  facade: [
    'Dated siding or brick',
    'Failing trim / rot',
    'Small dated windows',
    'Weak curb appeal',
    'HOA standards',
    'Historic district',
    'Recently purchased',
    'Storm damage repair',
  ],
  deck: [
    'Wood deck is rotting',
    'Too small for furniture',
    'No shade',
    'Doesn’t meet code height',
    'Attached to kitchen slider',
    'Second-story access needed',
    'Recently purchased',
    'No deck today',
  ],
  'design-services': [
    'Empty room to furnish',
    'Awkward narrow layout',
    'Mix of inherited furniture',
    'New build shell',
    'Rental staging',
    'Open plan hard to zone',
    'Recently purchased',
    'Renovation in progress',
  ],
}

const DEFAULT_GOALS = [
  'Improve layout & function',
  'Update finishes',
  'Increase home value',
  'Better storage',
  'Modernize look',
]

const DEFAULT_CONDITIONS = [
  'Dated finishes',
  'Layout doesn’t work',
  'Recently purchased',
  'Planning phased work',
]

export function getConceptGoalOptions(serviceSlug: string): string[] {
  return CONCEPT_GOAL_OPTIONS[serviceSlug] ?? DEFAULT_GOALS
}

export function getConceptConditionOptions(serviceSlug: string): string[] {
  return CONCEPT_CONDITION_OPTIONS[serviceSlug] ?? DEFAULT_CONDITIONS
}

export interface BuildConceptScopeInput {
  serviceSlug: string
  serviceLabel?: string
  goals: string[]
  conditions: string[]
  extraNote?: string
  style?: string
  priority?: string
  timeline?: string
  sqft?: string
  gardenSpace?: string
  gardenFeatures?: string[]
  gardenIrrigation?: string
  gardenMaintenance?: string
}

export function buildConceptScope(input: BuildConceptScopeInput): string {
  const lines: string[] = []
  const label = input.serviceLabel ?? input.serviceSlug
  if (label) lines.push(`Project type: ${label}.`)

  if (input.conditions.length) {
    lines.push(`Current situation: ${input.conditions.join('; ')}.`)
  }
  if (input.goals.length) {
    lines.push(`Updates sought: ${input.goals.join('; ')}.`)
  }

  if (input.serviceSlug === 'garden') {
    if (input.gardenSpace) lines.push(`Outdoor area: ${input.gardenSpace}.`)
    if (input.gardenFeatures?.length) {
      lines.push(`Includes: ${input.gardenFeatures.join('; ')}.`)
    }
    if (input.gardenIrrigation) lines.push(`Irrigation: ${input.gardenIrrigation}.`)
    if (input.gardenMaintenance) lines.push(`Maintenance: ${input.gardenMaintenance}.`)
  }

  const meta: string[] = []
  if (input.style) meta.push(`Style: ${input.style}`)
  if (input.priority) meta.push(`Priority: ${input.priority}`)
  if (input.timeline) meta.push(`Timeline: ${input.timeline}`)
  if (input.sqft) meta.push(`Approx. ${input.sqft} sq ft`)
  if (meta.length) lines.push(meta.join(' · ') + '.')

  const note = input.extraNote?.trim()
  if (note) lines.push(`Additional notes: ${note}`)

  return lines.join('\n')
}

export function isConceptScopeComplete(
  goals: string[],
  extraNote: string,
  isGarden: boolean,
  gardenFeatures: string[]
): boolean {
  if (isGarden && gardenFeatures.length >= 1) return true
  if (goals.length >= 1) return true
  return extraNote.trim().length >= 12
}
