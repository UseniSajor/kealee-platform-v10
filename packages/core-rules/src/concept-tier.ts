/**
 * Resolve purchased concept tier for deliverables (renders, video, PDF depth).
 */
import { INTAKE_PRICE_CENTS, TIER_IMAGE_COUNT } from './pricing'
import type { ConceptTier } from './concept-package-deliverables'

export function resolveConceptTier(
  formData: Record<string, unknown>,
  opts?: { projectPath?: string },
): ConceptTier {
  const raw = formData.tier
  if (typeof raw === 'number' && raw >= 1 && raw <= 3) {
    return (raw === 3 ? 3 : raw === 2 ? 2 : 1) as ConceptTier
  }

  // Legacy /intake/[projectPath] checkout — single SKU includes Premium deliverables (video).
  if (opts?.projectPath && INTAKE_PRICE_CENTS[opts.projectPath]) {
    return 2
  }

  return 1
}

export function conceptTierIncludesVideo(tier: ConceptTier): boolean {
  return tier >= 2
}

export function renderCountForTier(tier: ConceptTier, fallback = 3): number {
  return TIER_IMAGE_COUNT[tier] ?? fallback
}

export function shouldTriggerConceptVideo(
  tier: ConceptTier,
  conceptVideo: unknown,
): boolean {
  if (!conceptTierIncludesVideo(tier)) return false
  if (!conceptVideo || typeof conceptVideo !== 'object') return true
  const status = (conceptVideo as { status?: string }).status
  return status === 'failed' || status === 'not_started' || !status
}
