export type OpportunityPriority =
  | 'immediate'
  | 'high'
  | 'nurture'
  | 'low'
  | 'suppress'

export interface ScoringBand {
  min: number
  max: number
  priority: OpportunityPriority
  label: string
}

/** Opportunity score bands per spec */
export const SCORING_BANDS: ScoringBand[] = [
  { min: 90, max: 100, priority: 'immediate', label: 'immediate priority' },
  { min: 75, max: 89, priority: 'high', label: 'high priority' },
  { min: 60, max: 74, priority: 'nurture', label: 'nurture' },
  { min: 40, max: 59, priority: 'low', label: 'low priority' },
  { min: 0, max: 39, priority: 'suppress', label: 'suppress or archive' },
]

export function scoreToPriority(score: number): OpportunityPriority {
  const band = SCORING_BANDS.find((b) => score >= b.min && score <= b.max)
  return band?.priority ?? 'suppress'
}
