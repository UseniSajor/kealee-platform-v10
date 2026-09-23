/**
 * Canonical Design Concept Package.
 *
 * Kealee sells one scope-priced package per project type. Video, additional
 * still views, editable CAD/DXF, consultations, and extra revisions are add-ons.
 * The numeric tier argument retained on a few exports is a read-compatibility
 * shim for historical records; it never changes the current package.
 */

export type ConceptTier = 1 | 2 | 3
export type ConceptTierName = 'Design Concept'

export type ServiceDeliverableFamily =
  | 'building' | 'kitchen' | 'bathroom' | 'garden' | 'exterior'
  | 'addition' | 'whole-house' | 'design-only'

export type DeliverableCategory =
  | 'permit' | 'zoning' | 'design' | 'visual' | 'video' | 'cost'
  | 'plan' | 'mep' | 'portal' | 'support' | 'upsell'

export interface ConceptPackageDeliverable {
  id: string
  label: string
  category: DeliverableCategory
}

export interface ConceptTierPackageSchema {
  /** Historical field. Current packages do not have a customer-facing tier. */
  tier: ConceptTier
  name: ConceptTierName
  deliverables: ConceptPackageDeliverable[]
  permitAndZoning: ConceptPackageDeliverable[]
  renderCount: number
  includesVideo: false
  revisions: 1
  supportDays: 30
}

export const CONCEPT_PACKAGE_RULES = {
  permitAndZoningIncludedInAllTiers: true as const,
  zoningIncludedInAllTiers: true as const,
  zoningIncludedInEveryPackage: true as const,
  permitFilingNotIncluded:
    'The Design Concept Package includes permit scope and zoning guidance—not agency submission or stamped drawings unless purchased separately.',
  creditTowardDrawings:
    'Design concept fee credited toward permit-ready drawings or architect handoff when you continue with Kealee.',
} as const

const PERMIT_AND_ZONING: ConceptPackageDeliverable[] = [
  { id: 'zoning-code', label: 'Zoning district/code with cited public source', category: 'zoning' },
  { id: 'zoning-allowances', label: 'Preliminary allowed-use, setback, height, lot-coverage, overlay, and feasibility notes', category: 'zoning' },
  { id: 'permit-scope', label: 'Permit scope brief—likely permit types and required disciplines', category: 'permit' },
  { id: 'permit-path', label: 'AHJ checklist with preliminary fees, timeline, and trade-permit flags', category: 'permit' },
]

function planFor(family: ServiceDeliverableFamily): ConceptPackageDeliverable[] {
  const plan = family === 'kitchen'
    ? 'Preliminary kitchen plan with clearances, work triangle, and appliance zones'
    : family === 'bathroom'
      ? 'Preliminary bathroom plan with wet zone, fixture layout, and clearances'
      : family === 'garden'
        ? 'Preliminary site layout with planting, hardscape, and irrigation zones'
        : family === 'exterior'
          ? 'Exterior elevation concept with coordinated material direction'
          : family === 'addition'
            ? 'Preliminary existing-plus-proposed addition plan and massing direction'
            : family === 'whole-house'
              ? 'Coordinated multi-room preliminary plan'
              : family === 'design-only'
                ? 'Preliminary furniture and space-planning layout'
                : 'Preliminary labelled concept plan'
  return [
    { id: 'plan', label: plan, category: 'plan' },
    { id: 'mep-scope', label: 'MEP scope brief for affected electrical, plumbing, HVAC, and lighting systems', category: 'mep' },
  ]
}

function familyExtras(family: ServiceDeliverableFamily): ConceptPackageDeliverable[] {
  if (family === 'garden') return [
    { id: 'plant-schedule', label: 'Plant species schedule with preliminary quantities', category: 'design' },
    { id: 'maintenance', label: 'Seasonal maintenance direction', category: 'design' },
  ]
  if (family === 'addition') return [
    { id: 'structural-brief', label: 'Preliminary structural and tie-in considerations', category: 'design' },
  ]
  if (family === 'whole-house') return [
    { id: 'phase-plan', label: 'Coordinated renovation phase plan when applicable', category: 'design' },
  ]
  if (family === 'design-only') return [
    { id: 'material-board', label: 'Material and finish board with product direction', category: 'design' },
  ]
  return []
}

function roomLabel(family: ServiceDeliverableFamily): string {
  return family === 'whole-house' ? 'whole-home' : family === 'design-only' ? 'interior design' : family.replace('-', ' ')
}

export function buildConceptPackage(family: ServiceDeliverableFamily): ConceptTierPackageSchema {
  return {
    tier: 2,
    name: 'Design Concept',
    permitAndZoning: [...PERMIT_AND_ZONING],
    deliverables: [
      ...PERMIT_AND_ZONING,
      { id: 'directions', label: 'Three concept directions with one clear recommendation', category: 'design' },
      ...planFor(family),
      { id: 'renders', label: `Six project-specific ${roomLabel(family)} concept views`, category: 'visual' },
      { id: 'materials', label: 'Materials and finish direction with planning-level bill of materials', category: 'design' },
      { id: 'cost', label: 'Trade-level scope and preliminary construction cost range', category: 'cost' },
      ...familyExtras(family),
      { id: 'pdf', label: 'Six-page decision-focused PDF package', category: 'design' },
      { id: 'portal', label: 'Owner portal workspace with project files and sharing', category: 'portal' },
      { id: 'revision', label: 'One included revision round', category: 'support' },
      { id: 'support', label: 'Email and portal support for 30 days', category: 'support' },
      { id: 'credit', label: CONCEPT_PACKAGE_RULES.creditTowardDrawings, category: 'upsell' },
    ],
    renderCount: 6,
    includesVideo: false,
    revisions: 1,
    supportDays: 30,
  }
}

/** @deprecated Historical compatibility only; all inputs return the current package. */
export function buildConceptTierPackage(family: ServiceDeliverableFamily, tier: ConceptTier): ConceptTierPackageSchema {
  return { ...buildConceptPackage(family), tier }
}

export function getConceptPackageDeliverables(family: ServiceDeliverableFamily, _tier?: ConceptTier): ConceptPackageDeliverable[] {
  return buildConceptPackage(family).deliverables
}
export function getConceptPackageDeliverableLabels(family: ServiceDeliverableFamily, _tier?: ConceptTier): string[] {
  return buildConceptPackage(family).deliverables.map(item => item.label)
}
export function getPermitZoningLabels(family: ServiceDeliverableFamily, _tier?: ConceptTier): string[] {
  return buildConceptPackage(family).permitAndZoning.map(item => item.label)
}

const SLUG_TO_FAMILY: Record<string, ServiceDeliverableFamily> = {
  kitchen: 'kitchen', bathroom: 'bathroom', garden: 'garden', facade: 'exterior', deck: 'exterior',
  addition: 'addition', 'whole-house': 'whole-house', 'design-services': 'design-only',
  interior: 'building', 'new-construction': 'building',
}
const INTAKE_TO_FAMILY: Record<string, ServiceDeliverableFamily> = {
  kitchen_remodel: 'kitchen', bathroom_remodel: 'bathroom', garden_concept: 'garden',
  exterior_concept: 'exterior', addition_expansion: 'addition', whole_home_concept: 'whole-house',
  whole_home_remodel: 'whole-house', interior_reno_concept: 'building', interior_renovation: 'building',
  design_build: 'building', capture_site_concept: 'building', design_estimate_permit_bundle: 'building',
}
export function serviceSlugToFamily(slug: string): ServiceDeliverableFamily { return SLUG_TO_FAMILY[slug] ?? 'building' }
export function intakePathToFamily(path: string): ServiceDeliverableFamily { return INTAKE_TO_FAMILY[path] ?? 'building' }
export function getConceptPackageDeliverablesForSlug(slug: string, _tier?: ConceptTier): ConceptPackageDeliverable[] {
  return buildConceptPackage(serviceSlugToFamily(slug)).deliverables
}
export function getConceptPackageDeliverableLabelsForSlug(slug: string, _tier?: ConceptTier): string[] {
  return getConceptPackageDeliverablesForSlug(slug).map(item => item.label)
}
export function getConceptPackageDeliverableLabelsForIntake(path: string, _tier?: ConceptTier): string[] {
  return buildConceptPackage(intakePathToFamily(path)).deliverables.map(item => item.label)
}
