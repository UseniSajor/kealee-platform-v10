/**
 * Concept → build lifecycle upsells + bundled package deals.
 * Always surfaces estimation + permit; structural paths bundle in permit-ready plans.
 * All prices from INTAKE_PRICE_CENTS — never hardcode in UI.
 */

import {
  formatPriceFromCents,
  getIntakePrice,
  INTAKE_PRICE_CENTS,
  type IntakePriceEntry,
} from './pricing'

export type BuildLifecycleFamily =
  | 'kitchen_bath'
  | 'interior'
  | 'whole_home'
  | 'exterior'
  | 'commercial'
  | 'default'

export type UpsellProductKey =
  | 'cost_estimate'
  | 'permit_path_only'
  | 'professional_drawings'
  | 'certified_estimate'
  | 'contractor_match'
  | 'design_estimate_permit_bundle'
  | 'estimate_permit_bundle'

export interface LifecycleUpsellOffer {
  productKey: UpsellProductKey
  label: string
  description: string
  cents: number
  deliveryDays: string
  priceLabel: string
  href: string
  tier: 'primary' | 'standard' | 'locked' | 'bundle'
  badge?: string
}

/** All-in-one package: estimate + permit (+ plans when required). */
export interface LifecycleBundleOffer {
  productKey: 'design_estimate_permit_bundle' | 'estimate_permit_bundle'
  label: string
  description: string
  bundleCents: number
  retailCents: number
  savingsCents: number
  savingsLabel: string
  priceLabel: string
  deliveryDays: string
  href: string
  includes: string[]
  badge: string
}

export interface BuildPathUpsellResult {
  family: BuildLifecycleFamily
  sourceProjectPath: string
  needsProfessionalDesign: boolean
  creditNote: string
  /** Featured package deal when 2+ next-step services remain unpurchased. */
  bundle: LifecycleBundleOffer | null
  offers: LifecycleUpsellOffer[]
  nextSteps: string[]
}

const PATH_TO_FAMILY: Record<string, BuildLifecycleFamily> = {
  kitchen_remodel: 'kitchen_bath',
  bathroom_remodel: 'kitchen_bath',
  interior_renovation: 'interior',
  interior_reno_concept: 'interior',
  whole_home_remodel: 'whole_home',
  whole_home_concept: 'whole_home',
  addition_expansion: 'whole_home',
  home_addition: 'whole_home',
  design_build: 'whole_home',
  exterior_concept: 'exterior',
  garden_concept: 'exterior',
  capture_site_concept: 'exterior',
  multi_unit_residential: 'commercial',
  mixed_use: 'commercial',
  commercial_office: 'commercial',
  development_feasibility: 'commercial',
  townhome_subdivision: 'commercial',
  single_family_subdivision: 'commercial',
  single_lot_development: 'commercial',
  developer_concept: 'commercial',
}

const NEEDS_PROFESSIONAL_DESIGN = new Set([
  'addition_expansion',
  'whole_home_remodel',
  'whole_home_concept',
  'home_addition',
  'design_build',
  'multi_unit_residential',
  'mixed_use',
  'commercial_office',
  'development_feasibility',
  'townhome_subdivision',
  'single_family_subdivision',
  'single_lot_development',
  'design_estimate_permit_bundle',
])

const FAMILY_PRICE_MULTIPLIER: Record<
  BuildLifecycleFamily,
  { estimate: number; permit: number; drawings: number; bundle: number }
> = {
  kitchen_bath: { estimate: 1, permit: 1, drawings: 1, bundle: 1 },
  interior: { estimate: 1.05, permit: 1, drawings: 1.1, bundle: 1.05 },
  whole_home: { estimate: 1.35, permit: 1.25, drawings: 1.4, bundle: 1.3 },
  exterior: { estimate: 0.95, permit: 1, drawings: 1.05, bundle: 0.95 },
  commercial: { estimate: 1.75, permit: 1.5, drawings: 2, bundle: 1.6 },
  default: { estimate: 1, permit: 1, drawings: 1.15, bundle: 1 },
}

/** Minimum discount vs à la carte sum for bundle to show. */
const BUNDLE_MIN_SAVINGS_RATE = 0.1

const BUNDLE_PRODUCT_KEYS = new Set<UpsellProductKey>([
  'design_estimate_permit_bundle',
  'estimate_permit_bundle',
])

function scaledCents(baseKey: string, multiplier: number): number {
  const base = INTAKE_PRICE_CENTS[baseKey]?.cents ?? 0
  return Math.round((base * multiplier) / 100) * 100
}

function intakeHref(
  productKey: UpsellProductKey,
  opts: { fromIntakeId?: string; sourceProjectPath?: string },
): string {
  const params = new URLSearchParams()
  if (opts.fromIntakeId) params.set('fromIntake', opts.fromIntakeId)
  if (opts.sourceProjectPath) params.set('sourcePath', opts.sourceProjectPath)
  const q = params.toString()
  return `https://kealee.com/intake/${productKey}${q ? `?${q}` : ''}`
}

function offerFrom(
  productKey: UpsellProductKey,
  cents: number,
  entry: IntakePriceEntry | null,
  opts: {
    fromIntakeId?: string
    sourceProjectPath?: string
    tier: LifecycleUpsellOffer['tier']
    description: string
    badge?: string
  },
): LifecycleUpsellOffer {
  const price = entry ?? getIntakePrice(productKey)
  return {
    productKey,
    label: price?.label ?? productKey.replace(/_/g, ' '),
    description: opts.description,
    cents,
    deliveryDays: price?.deliveryDays ?? '3–5 days',
    priceLabel: formatPriceFromCents(cents),
    href: intakeHref(productKey, {
      fromIntakeId: opts.fromIntakeId,
      sourceProjectPath: opts.sourceProjectPath,
    }),
    tier: opts.tier,
    badge: opts.badge,
  }
}

export function resolveBuildLifecycleFamily(projectPath: string): BuildLifecycleFamily {
  return PATH_TO_FAMILY[projectPath] ?? 'default'
}

export function projectNeedsProfessionalDesign(projectPath: string): boolean {
  return NEEDS_PROFESSIONAL_DESIGN.has(projectPath)
}

export function isBundleProductKey(key: string): key is UpsellProductKey {
  return BUNDLE_PRODUCT_KEYS.has(key as UpsellProductKey)
}

/** Server-trusted bundle checkout price (checkout route). */
export function getBundleCheckoutCents(
  bundleKey: 'design_estimate_permit_bundle' | 'estimate_permit_bundle',
  sourceProjectPath: string,
): { cents: number; label: string; deliveryDays: string } {
  const family = resolveBuildLifecycleFamily(sourceProjectPath)
  const mult = FAMILY_PRICE_MULTIPLIER[family].bundle
  const entry = getIntakePrice(bundleKey)
  if (!entry) {
    return { cents: 0, label: bundleKey, deliveryDays: '7–14 days' }
  }
  const bundle = getBuildPathBundle({
    sourceProjectPath,
    fromIntakeId: undefined,
    ownedProducts: [],
  })
  if (bundle) {
    return {
      cents: bundle.bundleCents,
      label: bundle.label,
      deliveryDays: bundle.deliveryDays,
    }
  }
  return {
    cents: scaledCents(bundleKey, mult),
    label: entry.label,
    deliveryDays: entry.deliveryDays,
  }
}

interface BundleComponent {
  key: UpsellProductKey
  cents: number
  includeLabel: string
}

function buildBundleComponents(
  needsDesign: boolean,
  owned: Set<UpsellProductKey>,
  estimateCents: number,
  permitCents: number,
  drawingsCents: number,
): BundleComponent[] {
  const parts: BundleComponent[] = []
  if (needsDesign && !owned.has('professional_drawings')) {
    parts.push({
      key: 'professional_drawings',
      cents: drawingsCents,
      includeLabel: 'Permit-ready design plans (architect + PE stamp where required)',
    })
  }
  if (!owned.has('cost_estimate')) {
    parts.push({
      key: 'cost_estimate',
      cents: estimateCents,
      includeLabel: 'RSMeans-validated cost estimate aligned to your concept',
    })
  }
  if (!owned.has('permit_path_only')) {
    parts.push({
      key: 'permit_path_only',
      cents: permitCents,
      includeLabel: 'Permit package — application prep & agency filing',
    })
  }
  return parts
}

export function getBuildPathBundle(opts: {
  sourceProjectPath: string
  fromIntakeId?: string
  ownedProducts?: UpsellProductKey[]
}): LifecycleBundleOffer | null {
  const family = resolveBuildLifecycleFamily(opts.sourceProjectPath)
  const mult = FAMILY_PRICE_MULTIPLIER[family]
  const owned = new Set(opts.ownedProducts ?? [])
  const needsDesign = projectNeedsProfessionalDesign(opts.sourceProjectPath)

  const estimateCents = scaledCents('cost_estimate', mult.estimate)
  const permitCents = scaledCents('permit_path_only', mult.permit)
  const drawingsCents = scaledCents('professional_drawings', mult.drawings)

  const parts = buildBundleComponents(needsDesign, owned, estimateCents, permitCents, drawingsCents)
  if (parts.length < 2) return null
  if (owned.has('design_estimate_permit_bundle') || owned.has('estimate_permit_bundle')) {
    return null
  }

  const retailCents = parts.reduce((s, p) => s + p.cents, 0)
  const bundleKey: LifecycleBundleOffer['productKey'] = needsDesign
    ? 'design_estimate_permit_bundle'
    : 'estimate_permit_bundle'

  const catalogBundleCents = scaledCents(bundleKey, mult.bundle)
  const discountedCents = Math.round(retailCents * (1 - BUNDLE_MIN_SAVINGS_RATE))
  const bundleCents = Math.min(catalogBundleCents, discountedCents)
  const savingsCents = Math.max(0, retailCents - bundleCents)

  if (savingsCents < 5000) return null

  const entry = getIntakePrice(bundleKey)
  const label = needsDesign
    ? 'Concept to Build Package'
    : 'Estimate + Permit Package'

  return {
    productKey: bundleKey,
    label: entry?.label ?? label,
    description: needsDesign
      ? 'Everything you need after your concept: validated estimate, permit filing, and stamped plans — one checkout, one project team.'
      : 'Lock in your budget and permit path together — priced for your project type.',
    bundleCents,
    retailCents,
    savingsCents,
    savingsLabel: `Save ${formatPriceFromCents(savingsCents)} vs à la carte`,
    priceLabel: formatPriceFromCents(bundleCents),
    deliveryDays: entry?.deliveryDays ?? '7–14 days',
    href: intakeHref(bundleKey, {
      fromIntakeId: opts.fromIntakeId,
      sourceProjectPath: opts.sourceProjectPath,
    }),
    includes: parts.map((p) => p.includeLabel),
    badge: 'Best value · All next steps',
  }
}

function buildNextStepsCopy(
  needsDesign: boolean,
  bundle: LifecycleBundleOffer | null,
): string[] {
  if (bundle) {
    return [
      `Add the ${bundle.label} (${bundle.priceLabel})`,
      ...bundle.includes.slice(0, 3),
      'Concept fee credited toward design plans when you bundle',
    ]
  }
  const steps = ['Review your concept package and PDF']
  if (needsDesign) {
    steps.push('Order permit-ready design plans')
  }
  steps.push('Get RSMeans cost estimate', 'File permit package with Kealee')
  return steps
}

export function getBuildPathUpsells(opts: {
  sourceProjectPath: string
  fromIntakeId?: string
  ownedProducts?: UpsellProductKey[]
  contractorMatchingUnlocked?: boolean
  webMainBaseUrl?: string
}): BuildPathUpsellResult {
  const family = resolveBuildLifecycleFamily(opts.sourceProjectPath)
  const mult = FAMILY_PRICE_MULTIPLIER[family]
  const owned = new Set(opts.ownedProducts ?? [])
  const needsDesign = projectNeedsProfessionalDesign(opts.sourceProjectPath)

  const estimateCents = scaledCents('cost_estimate', mult.estimate)
  const permitCents = scaledCents('permit_path_only', mult.permit)
  const drawingsCents = scaledCents('professional_drawings', mult.drawings)

  const bundle = getBuildPathBundle(opts)
  const bundleComponentKeys = new Set<UpsellProductKey>(
    needsDesign
      ? ['cost_estimate', 'permit_path_only', 'professional_drawings']
      : ['cost_estimate', 'permit_path_only'],
  )

  const offers: LifecycleUpsellOffer[] = []

  if (needsDesign && !owned.has('professional_drawings') && !bundle) {
    offers.push(
      offerFrom('professional_drawings', drawingsCents, getIntakePrice('professional_drawings'), {
        fromIntakeId: opts.fromIntakeId,
        sourceProjectPath: opts.sourceProjectPath,
        tier: 'primary',
        badge: 'Permit-ready plans',
        description:
          'Licensed architect converts your concept into permit-ready drawings with PE stamp where required.',
      }),
    )
  }

  if (!owned.has('cost_estimate') && !(bundle && bundleComponentKeys.has('cost_estimate'))) {
    offers.push(
      offerFrom('cost_estimate', estimateCents, getIntakePrice('cost_estimate'), {
        fromIntakeId: opts.fromIntakeId,
        sourceProjectPath: opts.sourceProjectPath,
        tier: needsDesign && !bundle ? 'standard' : 'primary',
        badge: needsDesign ? undefined : 'Plan your budget',
        description:
          'RSMeans-validated trade-by-trade estimate aligned to your concept scope — lender-ready PDF.',
      }),
    )
  }

  if (!owned.has('permit_path_only') && !(bundle && bundleComponentKeys.has('permit_path_only'))) {
    offers.push(
      offerFrom('permit_path_only', permitCents, getIntakePrice('permit_path_only'), {
        fromIntakeId: opts.fromIntakeId,
        sourceProjectPath: opts.sourceProjectPath,
        tier: 'standard',
        description:
          'Jurisdiction checklist, application prep, and filing support for DC / MD / VA agencies.',
      }),
    )
  }

  if (!owned.has('certified_estimate') && family !== 'exterior' && !bundle) {
    const certCents = scaledCents('certified_estimate', mult.estimate * 1.2)
    offers.push(
      offerFrom('certified_estimate', certCents, getIntakePrice('certified_estimate'), {
        fromIntakeId: opts.fromIntakeId,
        sourceProjectPath: opts.sourceProjectPath,
        tier: 'standard',
        description: 'Notarized RSMeans estimate for construction loans and investor packages.',
      }),
    )
  }

  if (opts.contractorMatchingUnlocked !== false && !owned.has('contractor_match')) {
    offers.push(
      offerFrom('contractor_match', 0, getIntakePrice('contractor_match'), {
        fromIntakeId: opts.fromIntakeId,
        sourceProjectPath: opts.sourceProjectPath,
        tier: needsDesign && !owned.has('professional_drawings') && !bundle ? 'locked' : 'standard',
        description: 'Three vetted DMV contractors matched to your scope and budget.',
      }),
    )
  }

  const order = { primary: 0, standard: 1, locked: 2, bundle: -1 }
  offers.sort((a, b) => order[a.tier] - order[b.tier])

  return {
    family,
    sourceProjectPath: opts.sourceProjectPath,
    needsProfessionalDesign: needsDesign,
    creditNote: 'Your concept fee is credited toward permit-ready design plans when you move forward.',
    bundle,
    offers,
    nextSteps: buildNextStepsCopy(needsDesign, bundle),
  }
}
