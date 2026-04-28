export type ConfidenceLevel = 'high' | 'medium' | 'low'
export type ScoreEventType = 'job_completed' | 'job_cancelled' | 'review_received' | 'dispute_raised'
export interface ContractorScoreResult { contractorId: string; score: number; confidence: ConfidenceLevel; components: Record<string, number> }
export interface ScoreEvent { type: ScoreEventType; contractorId: string; value?: number; metadata?: Record<string, unknown> }
export interface ScoreComponent { name: string; value: number; weight: number }
export interface LeaderboardFilters { region?: string; specialty?: string; limit?: number }
export interface LeaderboardEntry { contractorId: string; score: number; rank: number }
export declare class ContractorScoringService {
  getScore(contractorId: string): Promise<ContractorScoreResult>
  recordEvent(event: ScoreEvent): Promise<void>
  getLeaderboard(filters?: LeaderboardFilters): Promise<LeaderboardEntry[]>
}
