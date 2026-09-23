/**
 * Estimation is bundled — not sold standalone in the customer journey.
 * Included with design concept, professional design drawings, and permit packages.
 */

export const ESTIMATE_INCLUDED_WITH = [
  'design_concept_validation',
  'kitchen_bath_remodel',
  'adu_feasibility',
  'addition_feasibility',
  'basement_finish',
  'preliminary_site_plan',
  'verified_site_feasibility',
  'professional_drawings',
  'permit_site_plan',
] as const

export const ESTIMATE_INCLUDED_COPY =
  'A basic planning estimate is included with every design concept and preliminary site plan. A detailed construction estimate is included with permit-set building plans and full detailed site plans — no separate estimate purchase required.'

export const POST_CONCEPT_NEXT_STEP_COPY =
  'Your next step is permit-set professional drawings. Your concept already includes a basic planning estimate, and the permit-set plan package includes its detailed construction estimate.'

export function isEstimateBundled(serviceKey: string): boolean {
  return (ESTIMATE_INCLUDED_WITH as readonly string[]).includes(serviceKey)
}
