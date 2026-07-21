/**
 * Contractor Reliability Scoring — Type Definitions
 */

export type ConfidenceLevel = 'low' | 'medium' | 'high';

export type ScoreEventType =
  | 'bid_submitted'
  | 'milestone_completed'
  | 'qa_result'
  | 'review_received'
  | 'photo_uploaded'
  | 'message_replied';

export interface ScoreEvent {
  type: ScoreEventType;
  contractorId: string;
  data: Record<string, unknown>;
}

export interface ScoreComponent {
  name: string;
  score: number; // 0-100
  weight: number; // 0-1
  dataPoints: number;
}

export interface ContractorScoreResult {
  contractorId: string;
  overallScore: number;
  confidence: ConfidenceLevel;
  components: {
    responsiveness: ScoreComponent;
    uploadCompliance: ScoreComponent;
    bidAccuracy: ScoreComponent;
    scheduleAdherence: ScoreComponent;
    quality: ScoreComponent;
    clientSatisfaction: ScoreComponent;
    safety: ScoreComponent;
  };
  metadata: {
    projectsCompleted: number;
    totalBidsSubmitted: number;
    avgBidResponseTime: number | null;
    dataPoints: number;
    lastCalculated: Date;
  };
}

export interface LeaderboardEntry {
  contractorId: string;
  companyName: string;
  trades: string[];
  overallScore: number;
  confidence: ConfidenceLevel;
  projectsCompleted: number;
  topComponents: Array<{ name: string; score: number }>;
}

export interface LeaderboardFilters {
  trade?: string;
  region?: string; // state
  minScore?: number;
  confidence?: ConfidenceLevel;
  limit?: number;
  offset?: number;
}
