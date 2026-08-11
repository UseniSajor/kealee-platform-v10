/**
 * CANONICAL concept package deliverables — single source of truth.
 *
 * RULE (never omit): Permit + zoning guidance are included in EVERY tier (Basic,
 * Premium, Premium+). Depth increases by tier; agency filing / stamped drawings
 * are upsells — not part of the design concept SKU.
 *
 * Consumers: web-main checkout, service pages, concept/generate includes[],
 * concept-ready email, portal-owner deliverables, agents/docs.
 *
 * @see docs/system/concept-package-deliverables.md
 */

import { TIER_IMAGE_COUNT } from './pricing'

// ── Types (agent- and codegen-friendly) ─────────────────────────────────────

export type ConceptTier = 1 | 2 | 3

export type ConceptTierName = 'Basic' | 'Premium' | 'Premium+'

export type ServiceDeliverableFamily =
  | 'building'
  | 'kitchen'
  | 'bathroom'
  | 'garden'
  | 'exterior'
  | 'addition'
  | 'whole-house'
  | 'design-only'

export type DeliverableCategory =
  | 'permit'
  | 'zoning'
  | 'design'
  | 'visual'
  | 'video'
  | 'cost'
  | 'plan'
  | 'mep'
  | 'portal'
  | 'support'
  | 'upsell'

export interface ConceptPackageDeliverable {
  id: string
  label: string
  category: DeliverableCategory
}

export interface ConceptTierPackageSchema {
  tier: ConceptTier
  name: ConceptTierName
  /** Full ordered list shown at checkout and stored on conceptOutput.includes */
  deliverables: ConceptPackageDeliverable[]
  /** Explicit permit/zoning lines (subset of deliverables — for emails and QA) */
  permitAndZoning: ConceptPackageDeliverable[]
  renderCount: number
  includesVideo: boolean
  revisions: number
  supportDays: number
}

/** Immutable product rules — agents must not contradict these. */
export const CONCEPT_PACKAGE_RULES = {
  permitAndZoningIncludedInAllTiers: true as const,
  zoningIncludedInAllTiers: true as const,
  permitFilingNotIncluded:
    'Design concept packages include permit scope and zoning guidance only — not agency submission or PE-stamped drawings unless purchased separately.',
  creditTowardDrawings:
    'Design concept fee credited toward permit-ready drawings or architect handoff when you continue with Kealee.',
} as const

// ── Permit + zoning (ALL tiers — depth scales) ─────────────────────────────

function permitZoningForTier(tier: ConceptTier): ConceptPackageDeliverable[] {
  const base: ConceptPackageDeliverable[] = [
    {
      id: 'zoning-snapshot',
      label: 'Zoning & buildability snapshot (allowed use, setbacks, feasibility flag)',
      category: 'zoning',
    },
    {
      id: 'permit-scope-brief',
      label: 'Permit scope brief — disciplines flagged and likely permit types',
      category: 'permit',
    },
    {
      id: 'permit-fees-timeline',
      label: 'Estimated permit fees and review timeline (informational — DMV/AHJ ranges)',
      category: 'permit',
    },
    {
      id: 'ahj-checklist',
      label: 'AHJ submittal checklist (what reviewers typically ask for next)',
      category: 'permit',
    },
  ]

  if (tier === 1) return base

  const premium: ConceptPackageDeliverable[] = [
    ...base,
    {
      id: 'zoning-deep-dive',
      label: 'Zoning deep-dive — variance/HOA flags, overlay districts, buildability notes',
      category: 'zoning',
    },
    {
      id: 'permit-ready-pack',
      label: 'Permit-ready scope pack — AHJ / HOA / lender coordination checklist',
      category: 'permit',
    },
    {
      id: 'trade-permits',
      label: 'Likely trade permits (electrical, plumbing, mechanical) mapped to scope',
      category: 'permit',
    },
  ]

  if (tier === 2) return premium

  return [
    ...premium,
    {
      id: 'permit-credit',
      label: 'Permit package credit — applied toward stamped plans or Kealee filing add-on',
      category: 'permit',
    },
    {
      id: 'entitlement-notes',
      label: 'Entitlement & special-exception notes when scope triggers extra reviews',
      category: 'zoning',
    },
    {
      id: 'pe-flag',
      label: 'Structural / PE review requirement flagged when jurisdiction requires it',
      category: 'permit',
    },
  ]
}

// ── Shared blocks by tier ───────────────────────────────────────────────────

function portalAndSupport(tier: ConceptTier): ConceptPackageDeliverable[] {
  const rev = tier === 1 ? 1 : 3
  const days = tier === 1 ? 0 : tier === 2 ? 30 : 90
  const items: ConceptPackageDeliverable[] = [
    {
      id: 'portal',
      label: 'Owner portal — lifetime access, sharing, and PDF download',
      category: 'portal',
    },
    {
      id: 'revisions',
      label: `${rev} design revision${rev > 1 ? 's' : ''} included`,
      category: 'support',
    },
    {
      id: 'email-support',
      label: days > 0 ? `Email support (${days} days)` : 'Email support',
      category: 'support',
    },
  ]
  if (tier >= 3) {
    items.push({
      id: 'consult-call',
      label: '15-minute expert consultation call',
      category: 'support',
    })
  }
  return items
}

function videoBlock(tier: ConceptTier): ConceptPackageDeliverable[] {
  // Basic packages do not include video. Upgrade messaging belongs outside
  // the purchased-deliverables list.
  if (tier === 1) return []
  if (tier === 2) {
    return [
      {
        id: 'video-60',
        label: '60-second AI transformation / installation process video (downloadable MP4)',
        category: 'video',
      },
    ]
  }
  return [
    {
      id: 'video-suite',
      label: '4 video formats — 60s · 30s · 15s · 10s (HOA, lenders, social)',
      category: 'video',
    },
    {
      id: 'video-hd',
      label: 'HD/4K master download + shareable portal link',
      category: 'video',
    },
  ]
}

function renderBlock(tier: ConceptTier, roomLabel: string): ConceptPackageDeliverable[] {
  const n = TIER_IMAGE_COUNT[tier]
  const res = tier === 1 ? '1920×1080' : tier === 2 ? '2560×1440' : '4K'
  return [
    {
      id: 'renders',
      label: `${n} photorealistic ${roomLabel} renderings (${res})`,
      category: 'visual',
    },
  ]
}

function costAndBom(tier: ConceptTier): ConceptPackageDeliverable[] {
  if (tier === 1) {
    return [
      {
        id: 'bom',
        label: 'Bill of Materials (BOM) with line-item costs',
        category: 'cost',
      },
      {
        id: 'budget-tiers',
        label: 'Budget comparison — Basic · Standard · Luxury scenarios',
        category: 'cost',
      },
    ]
  }
  return [
    {
      id: 'bom-editable',
      label: 'Editable Bill of Materials with trade-level cost breakdown',
      category: 'cost',
    },
    {
      id: 'rsmeans-note',
      label: 'DMV-market cost ranges aligned to scope (RSMeans-informed where available)',
      category: 'cost',
    },
  ]
}

function designConceptBlock(): ConceptPackageDeliverable[] {
  return [
    {
      id: 'design-summary',
      label: 'Design concept summary — style, palette, and key features',
      category: 'design',
    },
    {
      id: 'pdf-report',
      label: 'PDF design report (print-ready)',
      category: 'design',
    },
  ]
}

// ── Family-specific plan / MEP lines ────────────────────────────────────────

function planMepForFamily(
  family: ServiceDeliverableFamily,
  tier: ConceptTier,
): ConceptPackageDeliverable[] {
  if (family === 'design-only') {
    return tier >= 2
      ? [
          {
            id: 'furniture-plan',
            label: 'Furniture layout plan (to-scale)',
            category: 'plan',
          },
        ]
      : [
          {
            id: 'layout-direction',
            label: 'Layout direction + mood board',
            category: 'plan',
          },
        ]
  }

  if (family === 'garden') {
    return [
      {
        id: 'site-layout',
        label: tier >= 2 ? '2D site layout + planting zones' : 'Garden layout concept + site overview',
        category: 'plan',
      },
      ...(tier >= 2
        ? [
            {
              id: 'irrigation',
              label: 'Irrigation overview + smart controller spec',
              category: 'mep',
            } as ConceptPackageDeliverable,
          ]
        : [
            {
              id: 'irrigation-basic',
              label: 'Irrigation concept + plant list',
              category: 'mep',
            } as ConceptPackageDeliverable,
          ]),
    ]
  }

  if (family === 'exterior') {
    return [
      {
        id: 'elevation',
        label:
          tier >= 2
            ? 'Elevation concept + material palette (siding, roof, trim)'
            : 'Elevation sketch + material palette',
        category: 'plan',
      },
      {
        id: 'mep-exterior',
        label: 'Exterior systems scope (electrical/service, drainage)',
        category: 'mep',
      },
    ]
  }

  const planLabel =
    family === 'kitchen'
      ? tier === 1
        ? 'Kitchen layout direction + work triangle notes'
        : tier === 2
          ? '2D kitchen floor plan (clearances, work triangle, appliance zones)'
          : 'Kitchen plan sheet + CAD export (DXF)'
      : family === 'bathroom'
        ? tier === 1
          ? 'Bath layout concept + fixture zones'
          : tier === 2
            ? '2D bath floor plan (wet zone, clearances, fixtures)'
            : 'Bath plan sheet + CAD export (DXF)'
        : family === 'addition'
          ? tier === 1
            ? 'Site overview + addition massing concept'
            : tier === 2
              ? 'Site plan: existing home + proposed addition'
              : 'Addition site plan + CAD (DXF) + satellite/GIS lot context'
          : family === 'whole-house'
            ? tier === 1
              ? 'Whole-home layout direction (key rooms)'
              : tier === 2
                ? 'Multi-room 2D floor plan (scales with sq ft)'
                : 'Whole-home plan sheet + CAD export + lot GIS context'
            : tier === 1
              ? 'Floor plan / layout direction'
              : tier === 2
                ? '2D architectural floor plan with MEP layers'
                : 'Multi-layer 3D floor plan + CAD files (DWG/DXF)'

  return [
    { id: 'plan', label: planLabel, category: 'plan' },
    {
      id: 'mep',
      label:
        family === 'kitchen' || family === 'bathroom'
          ? 'MEP scope brief (electrical, plumbing, HVAC, lighting zones)'
          : 'MEP specification overview for scoped trades',
      category: 'mep',
    },
  ]
}

function familyExtras(family: ServiceDeliverableFamily, tier: ConceptTier): ConceptPackageDeliverable[] {
  const credit: ConceptPackageDeliverable = {
    id: 'permit-credit-marketing',
    label: CONCEPT_PACKAGE_RULES.creditTowardDrawings,
    category: 'upsell',
  }

  switch (family) {
    case 'garden':
      return [
        {
          id: 'plants',
          label: tier >= 2 ? 'Plant species schedule with quantities' : 'Plant list with seasonal selection',
          category: 'design',
        },
        {
          id: 'maintenance',
          label: 'Seasonal maintenance calendar',
          category: 'design',
        },
        ...(tier >= 3
          ? [
              {
                id: 'landscape-cad',
                label: 'CAD export (DXF) + Google Earth–ready coordinates',
                category: 'plan',
              } as ConceptPackageDeliverable,
            ]
          : []),
      ]
    case 'addition':
      return tier >= 2
        ? [{ id: 'structural', label: 'Structural considerations brief', category: 'design' }]
        : [{ id: 'zoning-feasibility', label: 'Zoning & feasibility brief for addition footprint', category: 'zoning' }]
    case 'whole-house':
      return tier >= 2
        ? [{ id: 'phase-plan', label: 'Remodel phase plan (when applicable)', category: 'design' }]
        : []
    case 'design-only':
      return [
        {
          id: 'material-board',
          label: tier >= 2 ? 'Editable material board with product links' : 'Material & finish palette',
          category: 'design',
        },
      ]
    default:
      return [credit]
  }
}

function roomLabelForFamily(family: ServiceDeliverableFamily): string {
  switch (family) {
    case 'kitchen':
      return 'kitchen'
    case 'bathroom':
      return 'bathroom'
    case 'garden':
      return 'garden / landscape'
    case 'exterior':
      return 'exterior'
    case 'addition':
      return 'addition (interior + exterior)'
    case 'whole-house':
      return 'whole-home'
    case 'design-only':
      return 'interior design'
    default:
      return 'concept'
  }
}

/** Assemble full tier package for a service family. */
export function buildConceptTierPackage(
  family: ServiceDeliverableFamily,
  tier: ConceptTier,
): ConceptTierPackageSchema {
  const permitAndZoning = permitZoningForTier(tier)
  const deliverables: ConceptPackageDeliverable[] = [
    ...permitAndZoning,
    ...designConceptBlock(),
    ...planMepForFamily(family, tier),
    ...renderBlock(tier, roomLabelForFamily(family)),
    ...costAndBom(tier),
    ...familyExtras(family, tier),
    ...videoBlock(tier),
    ...portalAndSupport(tier),
  ]

  const names: Record<ConceptTier, ConceptTierName> = {
    1: 'Basic',
    2: 'Premium',
    3: 'Premium+',
  }

  return {
    tier,
    name: names[tier],
    deliverables,
    permitAndZoning,
    renderCount: TIER_IMAGE_COUNT[tier],
    includesVideo: tier >= 2,
    revisions: tier === 1 ? 1 : 3,
    supportDays: tier === 1 ? 0 : tier === 2 ? 30 : 90,
  }
}

export function getConceptPackageDeliverables(
  family: ServiceDeliverableFamily,
  tier: ConceptTier,
): ConceptPackageDeliverable[] {
  return buildConceptTierPackage(family, tier).deliverables
}

export function getConceptPackageDeliverableLabels(
  family: ServiceDeliverableFamily,
  tier: ConceptTier,
): string[] {
  return getConceptPackageDeliverables(family, tier).map((d) => d.label)
}

export function getPermitZoningLabels(family: ServiceDeliverableFamily, tier: ConceptTier): string[] {
  return buildConceptTierPackage(family, tier).permitAndZoning.map((d) => d.label)
}

// ── Slug / intake path mapping ──────────────────────────────────────────────

const SLUG_TO_FAMILY: Record<string, ServiceDeliverableFamily> = {
  kitchen: 'kitchen',
  bathroom: 'bathroom',
  garden: 'garden',
  facade: 'exterior',
  deck: 'exterior',
  addition: 'addition',
  'whole-house': 'whole-house',
  'design-services': 'design-only',
  interior: 'building',
  'new-construction': 'building',
}

const INTAKE_PATH_TO_FAMILY: Record<string, ServiceDeliverableFamily> = {
  kitchen_remodel: 'kitchen',
  bathroom_remodel: 'bathroom',
  garden_concept: 'garden',
  exterior_concept: 'exterior',
  addition_expansion: 'addition',
  whole_home_concept: 'whole-house',
  whole_home_remodel: 'whole-house',
  interior_reno_concept: 'building',
  interior_renovation: 'building',
  design_build: 'building',
  capture_site_concept: 'building',
  design_estimate_permit_bundle: 'building',
}

export function serviceSlugToFamily(slug: string): ServiceDeliverableFamily {
  return SLUG_TO_FAMILY[slug] ?? 'building'
}

export function intakePathToFamily(projectPath: string): ServiceDeliverableFamily {
  return INTAKE_PATH_TO_FAMILY[projectPath] ?? 'building'
}

export function getConceptPackageDeliverablesForSlug(
  serviceSlug: string,
  tier: ConceptTier,
): ConceptPackageDeliverable[] {
  return getConceptPackageDeliverables(serviceSlugToFamily(serviceSlug), tier)
}

export function getConceptPackageDeliverableLabelsForSlug(
  serviceSlug: string,
  tier: ConceptTier,
): string[] {
  return getConceptPackageDeliverableLabels(serviceSlugToFamily(serviceSlug), tier)
}

export function getConceptPackageDeliverableLabelsForIntake(
  projectPath: string,
  tier: ConceptTier,
): string[] {
  return getConceptPackageDeliverableLabels(intakePathToFamily(projectPath), tier)
}

/** All three tiers — for docs, agents, and service page tables. */
export function getFullTierMatrix(
  family: ServiceDeliverableFamily,
): Record<ConceptTier, ConceptTierPackageSchema> {
  return {
    1: buildConceptTierPackage(family, 1),
    2: buildConceptTierPackage(family, 2),
    3: buildConceptTierPackage(family, 3),
  }
}
