import { adjustPackageFeaturesForScope, includesCadExport } from './scope-rules'
import type { V30IntakeFormAnswers } from './types'

/**
 * The features every concept package includes.
 *
 * There are no tiers. One package per product, so every order gets the same
 * core set; scope rules still drop what does not apply (no Permits on a
 * cosmetic scope, for example).
 *
 * Videos and CAD are NOT here. They are priced add-ons in ADD_ONS
 * (`video_presentation` at $449, `editable_cad` scoped), and the tier function
 * this replaced granted them free at tier 3 — the platform ran and paid for a
 * VideoBot the customer had not bought.
 */
export function featuresForConcept(
  projectPath?: string,
  answers?: V30IntakeFormAnswers,
): string[] {
  const base = ['Design', 'Floorplan', 'Estimate', 'Zoning', 'Permits']
  const scoped = answers
    ? adjustPackageFeaturesForScope([...base], answers, projectPath)
    : base
  return [...new Set(scoped)]
}

/**
 * Back-compat shim for callers still passing a tier. The tier is ignored —
 * every order gets the same package.
 *
 * @deprecated Call featuresForConcept. Tiers were removed.
 */
export function featuresForConceptTier(
  _tier: 1 | 2 | 3,
  projectPath?: string,
  answers?: V30IntakeFormAnswers,
): string[] {
  return featuresForConcept(projectPath, answers)
}

/**
 * Merge the package features into a v30 quote feature list.
 *
 * `tier` is accepted only so existing callers keep compiling; it has no effect.
 */
export function mergeV30PackageFeatures(
  features: string[],
  options?: { tier?: 1 | 2 | 3; projectPath?: string; answers?: V30IntakeFormAnswers },
): string[] {
  // Every order gets the same package; a tier in options is ignored.
  const packageFeatures = featuresForConcept(options?.projectPath, options?.answers)
  let merged = [...new Set([...features, ...packageFeatures])]
  if (options?.answers) {
    merged = adjustPackageFeaturesForScope(merged, options.answers, options.projectPath)
  }
  // CADExport is the `editable_cad` add-on, not a tier grant. It reaches this
  // list only when the customer bought it and it arrives in `features`.
  return merged
}

/** Intake quote: suggest floorplan for layout-heavy scopes (garden, kitchen, whole home). */
export function suggestFloorplanFeature(
  answers: V30IntakeFormAnswers,
  projectPath?: string,
): boolean {
  const scope = `${answers.primaryScope} ${projectPath ?? ''}`.toLowerCase()
  return (
    scope.includes('kitchen') ||
    scope.includes('garden') ||
    scope.includes('landscape') ||
    scope.includes('whole') ||
    scope.includes('addition') ||
    scope.includes('bath') ||
    scope.includes('bathroom') ||
    scope.includes('interior') ||
    scope.includes('basement') ||
    scope.includes('facade') ||
    scope.includes('deck') ||
    scope.includes('remodel') ||
    answers.squareFeet >= 400
  )
}
