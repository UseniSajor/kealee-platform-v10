/**
 * Product entitlements derived from linked intakes (Phase 3 app access).
 */

export type KealeeAppId =
  | 'owner'
  | 'estimation'
  | 'permits'
  | 'contractor'
  | 'pm'
  | 'admin'

export type EntitlementProduct =
  | 'concept'
  | 'estimate'
  | 'permit'
  | 'design_plans'
  | 'contractor_match'
  | 'pm'

const CONCEPT_PATHS = new Set([
  'exterior_concept', 'garden_concept', 'whole_home_concept', 'interior_reno_concept',
  'developer_concept', 'kitchen_remodel', 'bathroom_remodel', 'interior_renovation',
  'whole_home_remodel', 'addition_expansion', 'capture_site_concept', 'design_build',
  'multi_unit_residential', 'mixed_use', 'commercial_office', 'development_feasibility',
  'townhome_subdivision', 'single_family_subdivision', 'single_lot_development',
  'design_estimate_permit_bundle',
])

const ESTIMATE_PATHS = new Set(['cost_estimate', 'certified_estimate'])
const PERMIT_PATHS = new Set(['permit_path_only', 'professional_drawings'])
const MATCH_PATHS = new Set(['contractor_match'])

export interface UserEntitlements {
  intakeIds: string[]
  products: EntitlementProduct[]
  apps: KealeeAppId[]
  persona: 'homeowner' | 'contractor' | 'pro' | 'internal'
}

export function entitlementsFromIntakePaths(
  intakes: Array<{ id: string; project_path: string; status?: string | null }>,
  role?: string | null,
): UserEntitlements {
  const paidStatuses = new Set(['paid', 'concept_ready', 'processing', 'delivered'])
  const intakeIds: string[] = []
  const products = new Set<EntitlementProduct>()

  for (const row of intakes) {
    if (row.status && !paidStatuses.has(row.status)) continue
    intakeIds.push(row.id)
    const p = row.project_path
    if (CONCEPT_PATHS.has(p)) products.add('concept')
    if (ESTIMATE_PATHS.has(p)) products.add('estimate')
    if (PERMIT_PATHS.has(p)) products.add('design_plans')
    if (PERMIT_PATHS.has(p) || p === 'permit_path_only') products.add('permit')
    if (MATCH_PATHS.has(p)) products.add('contractor_match')
  }

  const normalizedRole = (role ?? 'homeowner').toLowerCase()
  const apps = new Set<KealeeAppId>(['owner'])

  if (products.has('estimate')) apps.add('estimation')
  if (products.has('permit') || products.has('design_plans')) apps.add('permits')
  if (normalizedRole === 'contractor' || normalizedRole === 'gc') apps.add('contractor')
  if (['pm', 'pm_supervisor', 'admin', 'super_admin'].includes(normalizedRole)) {
    apps.add('pm')
    apps.add('estimation')
    apps.add('permits')
  }
  if (['admin', 'super_admin'].includes(normalizedRole)) apps.add('admin')

  let persona: UserEntitlements['persona'] = 'homeowner'
  if (['admin', 'super_admin', 'pm', 'pm_supervisor', 'inspector'].includes(normalizedRole)) {
    persona = 'internal'
  } else if (['contractor', 'gc', 'vendor'].includes(normalizedRole)) {
    persona = 'contractor'
  } else if (['architect', 'engineer', 'estimator'].includes(normalizedRole)) {
    persona = 'pro'
  }

  return {
    intakeIds,
    products: [...products],
    apps: [...apps],
    persona,
  }
}

export function canAccessApp(entitlements: UserEntitlements, appId: KealeeAppId, role?: string): boolean {
  if (entitlements.apps.includes(appId)) return true
  const r = (role ?? '').toLowerCase()
  if (appId === 'owner') return true
  if (appId === 'admin' && ['admin', 'super_admin'].includes(r)) return true
  if (appId === 'pm' && ['pm', 'pm_supervisor', 'admin', 'super_admin'].includes(r)) return true
  return false
}
