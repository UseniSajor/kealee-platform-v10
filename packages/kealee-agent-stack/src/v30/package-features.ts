import { adjustPackageFeaturesForScope, includesCadExport } from './scope-rules'
import type { V30IntakeFormAnswers } from './types'

/** Premium (tier 2) and Premium+ (tier 3) always include floorplan in concept packages. */
export function featuresForConceptTier(
  tier: 1 | 2 | 3,
  projectPath?: string,
  answers?: V30IntakeFormAnswers,
): string[] {
  const base =
    tier >= 2
      ? ['Design', 'Floorplan', 'Estimate', 'Zoning']
      : ['Design', 'Estimate', 'Zoning']

  if (tier >= 2 && answers) {
    const withPermits = adjustPackageFeaturesForScope([...base, 'Permits'], answers, projectPath)
    base.length = 0
    base.push(...withPermits)
  } else if (tier >= 2) {
    base.push('Permits')
  }

  if (tier >= 3) {
    base.push('Videos', 'CADExport')
  }

  const path = (projectPath ?? '').toLowerCase()
  if (path.includes('garden') || path.includes('landscape')) {
    if (!base.includes('Floorplan')) base.push('Floorplan')
    if (!base.includes('Estimate')) base.push('Estimate')
    if (tier >= 3) {
      if (!base.includes('Design')) base.push('Design')
    }
  }

  return [...new Set(base)]
}

/** Merge tier-mandated features into a v30 quote feature list. */
export function mergeV30PackageFeatures(
  features: string[],
  options?: { tier?: 1 | 2 | 3; projectPath?: string; answers?: V30IntakeFormAnswers },
): string[] {
  const tierFeatures = options?.tier
    ? featuresForConceptTier(options.tier, options.projectPath, options.answers)
    : []
  let merged = [...new Set([...features, ...tierFeatures])]
  if (options?.answers) {
    merged = adjustPackageFeaturesForScope(merged, options.answers, options.projectPath)
  }
  if (options?.tier === 3 && !merged.includes('CADExport')) merged.push('CADExport')
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
    answers.squareFeet >= 400
  )
}
