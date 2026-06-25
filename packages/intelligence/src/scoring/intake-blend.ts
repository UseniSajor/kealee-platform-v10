import type { OpportunityPriority } from '../constants/scoring-bands.js'

export type RoutingTag = 'hot' | 'medium' | 'cold' | 'nurture' | 'pending'

export function priorityToRoutingTag(priority: OpportunityPriority): RoutingTag {
  switch (priority) {
    case 'immediate':
    case 'high':
      return 'hot'
    case 'nurture':
      return 'medium'
    case 'low':
      return 'cold'
    case 'suppress':
      return 'nurture'
    default:
      return 'pending'
  }
}

export function blendLeadScores(legacyScore: number, intelligenceScore: number): number {
  const blended = Math.round(legacyScore * 0.35 + intelligenceScore * 0.65)
  return Math.max(0, Math.min(100, blended))
}
