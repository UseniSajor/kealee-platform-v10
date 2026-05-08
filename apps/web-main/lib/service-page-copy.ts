/**
 * Per-service marketing copy for /services/[serviceType] — avoids one-size-fits-all
 * process steps and video fallback blurbs.
 */

export interface ServiceProcessStep {
  step: string
  title: string
  desc: string
}

const FALLBACK_PROCESS_STEPS: ServiceProcessStep[] = [
  {
    step: '01',
    title: 'Choose Your Package',
    desc: 'Select Basic, Premium, or Premium+ based on depth of drawings, video, and support you need.',
  },
  {
    step: '02',
    title: 'Submit Intake',
    desc: 'Complete the guided form for this project type — most people finish in about 3 minutes.',
  },
  {
    step: '03',
    title: 'AI + Staff Review',
    desc: 'Kealee generates your package, then a specialist reviews it before anything is delivered.',
  },
  {
    step: '04',
    title: 'Delivery & Support',
    desc: 'Download from the portal, request revisions, and use the ask bar — real staff responds.',
  },
]

export const SERVICE_PROCESS_STEPS: Record<string, ServiceProcessStep[]> = {
  kitchen: [
    {
      step: '01',
      title: 'Pick a kitchen package',
      desc: 'Match the tier to how much you need: concept visuals only, or full kitchen MEP + Premium+ assets.',
    },
    {
      step: '02',
      title: 'Kitchen-specific intake',
      desc: 'Layout, appliances, finishes, and constraints — mapped to cabinet runs, venting, and electrical loads.',
    },
    {
      step: '03',
      title: 'Kitchen concept + review',
      desc: 'Renders and BOM align to your cook line, island, and code checks for mechanical and electrical changes.',
    },
    {
      step: '04',
      title: 'Take it to bid',
      desc: 'Use the portal for revisions and questions before you share the package with GCs or designers.',
    },
  ],
  bathroom: [
    {
      step: '01',
      title: 'Pick a bath package',
      desc: 'Choose depth of tile/fixture specs, wet-area detail, and whether you want the transformation video.',
    },
    {
      step: '02',
      title: 'Bath-specific intake',
      desc: 'Shower/tub goals, ventilation, waterproofing context, and accessibility — not a generic remodel form.',
    },
    {
      step: '03',
      title: 'Bath package + review',
      desc: 'Concepts and specs focus on plumbing walls, drainage, lighting, and permit triggers for wet areas.',
    },
    {
      step: '04',
      title: 'Coordinate trades',
      desc: 'Deliverables are structured so plumbers and tile setters can quote from the same brief.',
    },
  ],
  garden: [
    {
      step: '01',
      title: 'Pick a landscape package',
      desc: 'Tiers scale planting detail, irrigation overview, and hardscape depth for your lot and climate.',
    },
    {
      step: '02',
      title: 'Outdoor program intake',
      desc: 'Growing goals, sun/soil, HOA limits, and structures like beds, paths, coop, or shade — all in one flow.',
    },
    {
      step: '03',
      title: 'Landscape concept + review',
      desc: 'Layout, plant palette, and hardscape tie together before we summarize typical permit needs (fencing, sheds, etc.).',
    },
    {
      step: '04',
      title: 'Install-ready direction',
      desc: 'Use the portal to refine planting or layout before you talk to a landscape contractor or nursery.',
    },
  ],
  addition: [
    {
      step: '01',
      title: 'Pick a feasibility package',
      desc: 'Addition work needs zoning and massing clarity — tiers add structural context and documentation depth.',
    },
    {
      step: '02',
      title: 'Addition & site intake',
      desc: 'Footprint, setbacks, ADU vs primary expansion, utilities, and tie-in to the existing home.',
    },
    {
      step: '03',
      title: 'Feasibility + review',
      desc: 'Concept massing, permit scope, and MEP tie-ins focus on new square footage — not interior-only assumptions.',
    },
    {
      step: '04',
      title: 'Pre-architect confidence',
      desc: 'Bring the reviewed package to an architect or design-build team with constraints already organized.',
    },
  ],
  'whole-house': [
    {
      step: '01',
      title: 'Pick a whole-home package',
      desc: 'Coordinated interior + systems + exterior scope needs the higher tiers for consistent documentation.',
    },
    {
      step: '02',
      title: 'Master scope intake',
      desc: 'Phasing, priorities per floor, existing conditions, and which systems you plan to touch in this program.',
    },
    {
      step: '03',
      title: 'Master package + review',
      desc: 'One design direction across rooms with a consolidated estimate and permit list that spans trades.',
    },
    {
      step: '04',
      title: 'Align GCs and designers',
      desc: 'Single source of truth in the portal so bids compare apples to apples across the full property.',
    },
  ],
  interior: [
    {
      step: '01',
      title: 'Pick an interior package',
      desc: 'Choose how deep you want finishes, lighting, and room-by-room specs beyond pretty renderings.',
    },
    {
      step: '02',
      title: 'Room scope intake',
      desc: 'Flooring, trim, paint, built-ins, and lighting — scoped room by room without kitchen-only assumptions.',
    },
    {
      step: '03',
      title: 'Interior package + review',
      desc: 'Palettes and quantities roll up to a realistic estimate for the rooms you selected.',
    },
    {
      step: '04',
      title: 'Execute in phases',
      desc: 'Use revisions to sequence work (e.g., floors first, then paint) with clear specs for each trade.',
    },
  ],
  facade: [
    {
      step: '01',
      title: 'Pick an exterior package',
      desc: 'Exterior packages emphasize elevations, materials, and weather barrier logic — not interior room counts.',
    },
    {
      step: '02',
      title: 'Facade & site intake',
      desc: 'Siding, windows, roofline, entries, and HOA or historic constraints on what can change street-facing.',
    },
    {
      step: '03',
      title: 'Elevation package + review',
      desc: 'Renders and specs stay outside the building envelope with a permit brief for typical exterior scopes.',
    },
    {
      step: '04',
      title: 'Curb appeal to contract',
      desc: 'Share the package with siding, window, and roofing pros who need clear material and flashing intent.',
    },
  ],
  deck: [
    {
      step: '01',
      title: 'Pick a deck / patio package',
      desc: 'Outdoor structures need guard, stair, and ledger detail — tiers add structural and electrical depth.',
    },
    {
      step: '02',
      title: 'Outdoor structure intake',
      desc: 'Size, height, attachment, materials, and how the deck or patio ties to doors and drainage at grade.',
    },
    {
      step: '03',
      title: 'Structure concept + review',
      desc: 'Layout and loads translate into a permit-oriented brief for typical deck and patio jurisdictions.',
    },
    {
      step: '04',
      title: 'Permit and build clarity',
      desc: 'Refine handrails, stairs, and cover details in the portal before filing or requesting contractor bids.',
    },
  ],
  'design-services': [
    {
      step: '01',
      title: 'Pick a design-services tier',
      desc: 'Lighter than full construction packages — focused on palette, layout, and documentation for decisions.',
    },
    {
      step: '02',
      title: 'Design direction intake',
      desc: 'Mood, references, furniture layout goals, and which rooms need cohesion before you order finishes.',
    },
    {
      step: '03',
      title: 'Concept boards + review',
      desc: 'Staff review centers on livability and consistency — not full structural or trade construction drawings.',
    },
    {
      step: '04',
      title: 'Shop with confidence',
      desc: 'Use the portal to tighten selections so what you buy matches the documented design intent.',
    },
  ],
}

export function getServiceProcessSteps(serviceSlug: string): ServiceProcessStep[] {
  return SERVICE_PROCESS_STEPS[serviceSlug] ?? FALLBACK_PROCESS_STEPS
}

export interface ServiceVideoFallbackCopy {
  headline: string
  body: string
}

const SERVICE_VIDEO_FALLBACK: Record<string, ServiceVideoFallbackCopy> = {
  kitchen: {
    headline: 'From dated cook space to a planned kitchen',
    body: 'See how a kitchen-specific brief becomes reviewed renders, a BOM aligned to appliances and casework, and a permit scope for mechanical and electrical changes.',
  },
  bathroom: {
    headline: 'From leaky layout to a defined bath program',
    body: 'Walk through how wet-area goals, ventilation, and fixture intent turn into a package contractors can quote without guessing at waterproofing or drain moves.',
  },
  garden: {
    headline: 'From blank lawn to a structured outdoor program',
    body: 'Example flow: raised beds, paths, irrigation intent, and structures like a coop or pergola — captured so planting and hardscape stay coordinated.',
  },
  addition: {
    headline: 'From “we need more space” to a feasibility story',
    body: 'Watch how setbacks, massing, and use-case (suite vs ADU) roll into an addition-focused permit brief instead of a generic remodel checklist.',
  },
  'whole-house': {
    headline: 'One coordinated direction for the whole property',
    body: 'See how phasing, systems, and room priorities stay in a single master package so estimates and permits do not contradict each other by room.',
  },
  interior: {
    headline: 'Room-by-room interior clarity',
    body: 'Flooring, trim, lighting, and palette roll up per room so interior trades see scope without kitchen or exterior noise in the brief.',
  },
  facade: {
    headline: 'Curb-facing decisions, documented',
    body: 'Siding, windows, entries, and low landscape tie to elevations and a permit brief aimed at exterior scopes — not whole-home interior coverage.',
  },
  deck: {
    headline: 'Outdoor structure intent, build-ready',
    body: 'Attachment, stairs, guards, and materials are framed for typical deck and patio permitting — separate from a full interior renovation narrative.',
  },
  'design-services': {
    headline: 'Design direction before you over-order samples',
    body: 'Focused on layout, palette, and cohesion so you can align furniture and finishes — without implying full construction documentation in every tier.',
  },
}

export function getServiceVideoFallbackCopy(
  serviceSlug: string,
  label: string,
): ServiceVideoFallbackCopy {
  return (
    SERVICE_VIDEO_FALLBACK[serviceSlug] ?? {
      headline: `See a ${label} project come to life`,
      body: `How Kealee turns your ${label.toLowerCase()} intake into a reviewed design package you can share with pros.`,
    }
  )
}

export function getServicePricingBlurb(serviceSlug: string): string {
  const map: Record<string, string> = {
    kitchen:
      'Tiers add depth on appliance circuits, ventilation, lighting, and kitchen-specific permit triggers.',
    bathroom:
      'Tiers scale wet-area detail, fixture specs, and ventilation — scoped to baths, not whole-home noise.',
    garden:
      'Pricing reflects planting layout, irrigation overview, and hardscape — tuned to outdoor programs, not interior rooms.',
    addition:
      'Feasibility tiers emphasize zoning, massing, and new square footage — before you commit to full architectural fees.',
    'whole-house':
      'Whole-home tiers bundle coordinated rooms and systems so estimates and permit lists stay aligned across trades.',
    interior:
      'Interior tiers emphasize finish palettes, lighting, and room-by-room specs — without assuming a full kitchen gut.',
    facade:
      'Exterior tiers focus on elevations and envelope materials — not a generic “any remodel” checklist.',
    deck:
      'Deck and patio tiers emphasize structure, attachment, and code-oriented outdoor scope.',
    'design-services':
      'Design-services tiers stay lighter: direction, palette, and layout support — not full construction CDs in every package.',
  }
  return (
    map[serviceSlug] ??
    'All packages include staff review. Premium+ includes a 15-minute expert call when available.'
  )
}

export function getIncludedSectionBlurb(serviceSlug: string): string {
  const map: Record<string, string> = {
    kitchen: 'Deliverables are reviewed with kitchen MEP, layout, and typical permit triggers in mind.',
    bathroom: 'Review focuses on wet areas, fixtures, ventilation, and bath-specific permit context.',
    garden: 'Review ties planting, hardscape, and irrigation notes to your lot constraints and HOA rules.',
    addition: 'Review checks feasibility signals: setbacks, massing, and addition use-case vs zoning assumptions.',
    'whole-house': 'Review ensures cross-room and systems scope reads as one program — not disconnected room cards.',
    interior: 'Review validates interior scope per room and keeps finishes and lighting coherent.',
    facade: 'Review stays on curb-facing materials, openings, and exterior permit patterns.',
    deck: 'Review emphasizes guard heights, stairs, attachment, and outdoor electrical where relevant.',
    'design-services': 'Review prioritizes livability and visual cohesion — design direction, not full trade CDs.',
  }
  return map[serviceSlug] ?? 'Every deliverable is checked by a Kealee specialist before delivery.'
}
