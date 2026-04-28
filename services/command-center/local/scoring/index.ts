/**
 * Local stub for @kealee/scoring
 * ContractorScoringService — lightweight stub for Railway deployment.
 */

export interface ContractorScoreResult {
  contractorId: string
  score: number
  confidence: 'high' | 'medium' | 'low'
  components: Record<string, number>
}

export type ConfidenceLevel = 'high' | 'medium' | 'low'
export type ScoreEventType = 'job_completed' | 'job_cancelled' | 'review_received' | 'dispute_raised'

export interface ScoreEvent {
  type: ScoreEventType
  contractorId: string
  value?: number
  metadata?: Record<string, unknown>
}

export interface ScoreComponent {
  name: string
  value: number
  weight: number
}

export interface LeaderboardFilters {
  region?: string
  specialty?: string
  limit?: number
}

export interface LeaderboardEntry {
  contractorId: string
  score: number
  rank: number
}

export class ContractorScoringService {
  async getScore(contractorId: string): Promise<ContractorScoreResult> {
    return { contractorId, score: 75, confidence: 'medium', components: {} }
  }

  async recordEvent(event: ScoreEvent): Promise<void> {
    // no-op in stub
  }

  async getLeaderboard(filters?: LeaderboardFilters): Promise<LeaderboardEntry[]> {
    return []
  }
}
