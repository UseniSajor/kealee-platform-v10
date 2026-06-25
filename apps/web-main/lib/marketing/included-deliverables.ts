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
  'design_estimate_permit_bundle',
  'professional_drawings',
  'permit_package',
  'permit_path_only',
] as const

export const ESTIMATE_INCLUDED_COPY =
  'RSMeans-validated cost estimate is included with your design concept, professional design drawings, and permit packages — no separate estimate purchase required.'

export const POST_CONCEPT_NEXT_STEP_COPY =
  'Your next step is permit-ready professional drawings — estimate is already included in your concept package.'

export function isEstimateBundled(serviceKey: string): boolean {
  return (ESTIMATE_INCLUDED_WITH as readonly string[]).includes(serviceKey)
}
