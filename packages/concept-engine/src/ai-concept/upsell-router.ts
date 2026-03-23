/**
 * Upsell Router
 * After concept delivery, route the homeowner to the next Kealee service.
 */

import type { ProjectPath } from './journey-config'

export type UpsellService =
  | 'schematic_design'
  | 'design_development'
  | 'full_architecture'
  | 'permit_expediting'
  | 'build_ops'
  | 'contractor_matching'
  | 'another_concept'

export interface UpsellOption {
  service: UpsellService
  label: string
  tagline: string
  ctaText: string
  price: string
  highlight: boolean
}

export interface UpsellRoute {
  intakeId: string
  projectPath: ProjectPath
  primaryUpsell: UpsellService
  secondaryUpsells: UpsellService[]
  options: UpsellOption[]
  handoffMessage: string
}

const UPSELL_DEFINITIONS: Record<UpsellService, Omit<UpsellOption, 'highlight'>> = {
  schematic_design: {
    service: 'schematic_design',
    label: 'Schematic Design',
    tagline: 'Architect-drawn plans ready for permit',
    ctaText: 'Get Schematic Design',
    price: 'From $1,200',
  },
  design_development: {
    service: 'design_development',
    label: 'Design Development',
    tagline: 'Detailed drawings, specs, and material schedules',
    ctaText: 'Start Design Development',
    price: 'From $2,500',
  },
  full_architecture: {
    service: 'full_architecture',
    label: 'Full Architectural Services',
    tagline: 'End-to-end architect from concept to construction',
    ctaText: 'Engage an Architect',
    price: 'Custom quote',
  },
  permit_expediting: {
    service: 'permit_expediting',
    label: 'Permit Expediting',
    tagline: 'We handle the permit process start to finish',
    ctaText: 'Start Permit Process',
    price: 'From $499',
  },
  build_ops: {
    service: 'build_ops',
    label: 'Build & Ops',
    tagline: 'Find and manage your contractor through Kealee',
    ctaText: 'Activate Build & Ops',
    price: 'Fee on contract',
  },
  contractor_matching: {
    service: 'contractor_matching',
    label: 'Contractor Matching',
    tagline: 'Get matched with verified contractors in your area',
    ctaText: 'Find a Contractor',
    price: 'Free to match',
  },
  another_concept: {
    service: 'another_concept',
    label: 'Another Concept Package',
    tagline: 'Explore a different design direction',
    ctaText: 'Start Another Concept',
    price: 'From $149',
  },
}

const PRIMARY_UPSELL_BY_PATH: Record<ProjectPath, UpsellService> = {
  kitchen_remodel:           'permit_expediting',
  bathroom_remodel:          'contractor_matching',
  interior_renovation:       'permit_expediting',
  whole_home_remodel:        'full_architecture',
  addition_expansion:        'full_architecture',
  exterior_concept:          'contractor_matching',
  capture_site_concept:      'schematic_design',
  // Commercial paths — architect review is the primary next step
  multi_unit_residential:    'full_architecture',
  mixed_use:                 'full_architecture',
  commercial_office:         'full_architecture',
  development_feasibility:   'full_architecture',
  townhome_subdivision:      'full_architecture',
  single_family_subdivision: 'full_architecture',
  single_lot_development:    'schematic_design',
}

const SECONDARY_UPSELLS_BY_PATH: Record<ProjectPath, UpsellService[]> = {
  kitchen_remodel:           ['schematic_design', 'contractor_matching', 'build_ops'],
  bathroom_remodel:          ['permit_expediting', 'build_ops'],
  interior_renovation:       ['schematic_design', 'contractor_matching', 'build_ops'],
  whole_home_remodel:        ['design_development', 'permit_expediting', 'build_ops'],
  addition_expansion:        ['design_development', 'permit_expediting', 'build_ops'],
  exterior_concept:          ['schematic_design', 'another_concept'],
  capture_site_concept:      ['design_development', 'permit_expediting'],
  multi_unit_residential:    ['permit_expediting', 'build_ops', 'design_development'],
  mixed_use:                 ['permit_expediting', 'build_ops'],
  commercial_office:         ['permit_expediting', 'contractor_matching'],
  development_feasibility:   ['full_architecture', 'permit_expediting', 'build_ops'],
  townhome_subdivision:      ['permit_expediting', 'build_ops'],
  single_family_subdivision: ['permit_expediting', 'build_ops', 'design_development'],
  single_lot_development:    ['permit_expediting', 'contractor_matching'],
}

const HANDOFF_MESSAGES: Record<ProjectPath, string> = {
  kitchen_remodel:
    'Your concept is ready. The next step is locking in your permits — we can handle that for you so your contractor can start as soon as possible.',
  bathroom_remodel:
    'Your concept is ready. Get matched with a verified contractor to bring your bathroom vision to life.',
  interior_renovation:
    'Your interior concept is complete. Ready to move to permits? We can expedite the process.',
  whole_home_remodel:
    'This project scope warrants full architectural services. Our team can connect you with a licensed architect to take your concept through to construction documents.',
  addition_expansion:
    'Additions and ADUs require full architectural drawings and engineering. Let us connect you with the right team.',
  exterior_concept:
    'Your exterior concept is ready. Get matched with a contractor to get started on your curb appeal.',
  capture_site_concept:
    'Your site has been captured. Upgrade to a full concept package to unlock your floor plan, narrative, and permit path.',
  multi_unit_residential:
    'Your multi-unit concept and pro forma are ready. The next step is full architectural services to move from concept to construction documents.',
  mixed_use:
    'Your mixed-use development concept is complete. Engage an architect to advance to schematic design and entitlement.',
  commercial_office:
    'Your office layout concept is ready. We can connect you with a commercial architect and permit expeditor.',
  development_feasibility:
    'Your feasibility analysis is complete. Use this to engage an architect and land use attorney for formal entitlement.',
  townhome_subdivision:
    'Your subdivision concept and phased pro forma are ready. Next: engage a civil engineer and land use attorney.',
  single_family_subdivision:
    'Your subdivision site plan and sellout analysis are ready. Engage a civil engineer for your tentative map.',
  single_lot_development:
    'Your single-lot concept is ready. We can connect you with a licensed architect or contractor to get your permit filed.',
}

export function routeUpsell(intakeId: string, projectPath: ProjectPath): UpsellRoute {
  const primary = PRIMARY_UPSELL_BY_PATH[projectPath]
  const secondary = SECONDARY_UPSELLS_BY_PATH[projectPath]

  const options: UpsellOption[] = [
    { ...UPSELL_DEFINITIONS[primary], highlight: true },
    ...secondary.map((s) => ({ ...UPSELL_DEFINITIONS[s], highlight: false })),
  ]

  return {
    intakeId,
    projectPath,
    primaryUpsell: primary,
    secondaryUpsells: secondary,
    options,
    handoffMessage: HANDOFF_MESSAGES[projectPath],
  }
}

export function getUpsellOption(service: UpsellService): UpsellOption {
  return { ...UPSELL_DEFINITIONS[service], highlight: false }
}
