import type { UpsellProductKey } from '@kealee/core-rules'

export const PAID_INTAKE_STATUSES = new Set([
  'paid',
  'concept_ready',
  'processing',
  'delivered',
])

/** Intake project_path values that are upsell targets, not concept sources. */
export const UPSELL_TARGET_PATHS = new Set([
  'cost_estimate',
  'certified_estimate',
  'permit_path_only',
  'professional_drawings',
  'contractor_match',
  'design_estimate_permit_bundle',
  'estimate_permit_bundle',
])

export const PATH_TO_UPSELL_PRODUCT: Record<string, UpsellProductKey> = {
  cost_estimate: 'cost_estimate',
  certified_estimate: 'certified_estimate',
  permit_path_only: 'permit_path_only',
  professional_drawings: 'professional_drawings',
  contractor_match: 'contractor_match',
  design_estimate_permit_bundle: 'design_estimate_permit_bundle',
  estimate_permit_bundle: 'estimate_permit_bundle',
}

export function isConceptSourcePath(projectPath: string): boolean {
  return !UPSELL_TARGET_PATHS.has(projectPath)
}

export function ownedProductsFromRows(
  rows: { project_path: string; status: string }[],
): UpsellProductKey[] {
  return rows
    .filter((r) => PAID_INTAKE_STATUSES.has(String(r.status)))
    .map((r) => PATH_TO_UPSELL_PRODUCT[r.project_path as string])
    .filter(Boolean) as UpsellProductKey[]
}
