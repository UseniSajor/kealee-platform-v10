export interface AgentInputPayload {
  projectId: string;
  triggerEvent: string;
  digitalTwinState: Record<string, any>;
  eventPayload: Record<string, any>;
  uploadedFiles?: any[];
  optionalKnowledgeContext?: string;
  priorLoopHistory?: any[];
}

export interface AgentOutput {
  intakeCompletenessScore?: number;
  missingCriticalFields?: string[];
  inferredProjectFacts?: Record<string, any>;
  recommendedQuestions?: string[];
  digitalTwinUpdates: Record<string, any>;
  deliverableUpdates?: Record<string, any>;
  riskFlags: any[];
  permitLikelihood?: number;
  architectEngineerLikelihood?: number;
  estimateReadiness?: number;
  nextActions: any[];
  confidenceScore: number;
  requiresHumanReview: boolean;
  summary?: string;
  agentName: string;
  loopType: string;
}
