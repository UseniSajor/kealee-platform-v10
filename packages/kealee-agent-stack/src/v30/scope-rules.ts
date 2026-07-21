import type { V30IntakeFormAnswers } from './types'

export function isGardenLandscapeScope(
  projectPath?: string,
  answers?: Pick<V30IntakeFormAnswers, 'primaryScope'>,
): boolean {
  const scope = `${projectPath ?? ''} ${answers?.primaryScope ?? ''}`.toLowerCase()
  return (
    scope.includes('garden') ||
    scope.includes('landscape') ||
    scope.includes('garden_concept')
  )
}

/** Irrigation (or permanent water feature) triggers permit path for landscape. */
export function landscapeHasIrrigation(
  answers: V30IntakeFormAnswers,
): boolean {
  const scope = answers.primaryScope.toLowerCase()
  const codes = (answers.codeConsiderations ?? []).map(c => c.toLowerCase())
  const utils = answers.utilities ?? {}
  if (scope.includes('irrigation')) return true
  if (codes.some(c => c.includes('irrigation'))) return true
  return false
}

/**
 * Garden / landscape: no permits unless irrigation is involved.
 * Building scopes always may include permits when feature is selected.
 */
export function requiresPermitsForScope(
  answers: V30IntakeFormAnswers,
  projectPath?: string,
): boolean {
  if (!isGardenLandscapeScope(projectPath, answers)) return true
  return landscapeHasIrrigation(answers)
}

/** Strip or add Permits feature based on scope rules. */
export function adjustPackageFeaturesForScope(
  features: string[],
  answers: V30IntakeFormAnswers,
  projectPath?: string,
): string[] {
  const out = [...features]
  const needsPermits = requiresPermitsForScope(answers, projectPath)

  if (!needsPermits) {
    return out.filter(f => f.toLowerCase() !== 'permits' && f.toLowerCase() !== 'permit')
  }
  if (!out.some(f => f.toLowerCase() === 'permits')) {
    out.push('Permits')
  }
  return [...new Set(out)]
}

/** Premium+ CAD export upsell — DXF + layout JSON for AutoCAD / SketchUp / Vectorworks. */
export function includesCadExport(
  features: string[],
  tier?: 1 | 2 | 3,
): boolean {
  if (features.some(f => /^cadexport$/i.test(f.replace(/\s+/g, '')))) return true
  return tier === 3
}
