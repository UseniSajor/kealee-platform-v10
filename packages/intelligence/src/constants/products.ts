/** Canonical Kealee product recommendations for intelligence agents */
export const KEALEE_PRODUCTS = [
  'design_concept_validation',
  'estimate_detailed',
  'permit_package',
  'contractor_match',
  'pm_advisory',
  'owner_rep',
  'adu_feasibility',
  'addition_feasibility',
  'basement_finish',
  'kitchen_bath_remodel',
  'developer_feasibility',
  'finance_draw_schedule',
  'investor_renovation_package',
  'commercial_tenant_improvement',
] as const

export type KealeeProduct = (typeof KEALEE_PRODUCTS)[number]

export const KEALEE_PRODUCT_LABELS: Record<KealeeProduct, string> = {
  design_concept_validation: 'Design Concept Validation',
  estimate_detailed: 'Estimate Detailed',
  permit_package: 'Permit Package',
  contractor_match: 'Contractor Match',
  pm_advisory: 'PM Advisory',
  owner_rep: 'Owner Rep',
  adu_feasibility: 'ADU Feasibility',
  addition_feasibility: 'Addition Feasibility',
  basement_finish: 'Basement Finish',
  kitchen_bath_remodel: 'Kitchen/Bath Remodel',
  developer_feasibility: 'Developer Feasibility',
  finance_draw_schedule: 'Finance/Draw Schedule',
  investor_renovation_package: 'Investor Renovation Package',
  commercial_tenant_improvement: 'Commercial Tenant Improvement',
}
