/**
 * AI Review Configuration
 */
export interface AIReviewConfig {
  openaiApiKey: string;
  jurisdictionConfigs: JurisdictionConfig[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Jurisdiction-specific configuration for AI review
 */
export interface JurisdictionConfig {
  jurisdictionId: string;
  jurisdictionName: string;
  codeReferences: string[];
  specialRequirements: string[];
}

/**
 * Review source type
 */
export type ReviewSource = 
  | 'client_side_pre_review'
  | 'staff_review'
  | 'final_review'
  | 'reinspection_review';

/**
 * Finding severity levels
 */
export type FindingSeverity = 'critical' | 'major' | 'minor' | 'informational';

/**
 * Individual AI finding
 */
export interface AIFinding {
  id: string;
  category: string;
  severity: FindingSeverity;
  title: string;
  description: string;
  codeReference?: string;
  suggestedFix?: string;
  location?: {
    page?: number;
    section?: string;
    coordinates?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  };
}

/**
 * AI Review Result
 */
export interface AIReviewResult {
  success: boolean;
  data?: {
    reviewId: string;
    findings: AIFinding[];
    summary: {
      totalFindings: number;
      criticalCount: number;
      majorCount: number;
      minorCount: number;
      informationalCount: number;
    };
    overallScore: number; // 0-100
    recommendations: string[];
    estimatedReviewTime?: number; // minutes
  };
  error?: string;
}

/**
 * Document for review
 */
export interface ReviewDocument {
  url: string;
  type: 'floor_plan' | 'calculations' | 'reports' | 'site_plan' | 'elevation';
}

/**
 * Plan for review
 */
export interface ReviewPlan {
  url: string;
  type: 'floor_plan' | 'site_plan' | 'elevation' | 'section';
}

/**
 * Permit review request
 */
export interface PermitReviewRequest {
  permitId: string;
  jurisdictionId: string;
  permitType: string;
  plans: ReviewPlan[];
  documents: ReviewDocument[];
  reviewSource: ReviewSource;
  additionalContext?: string;
}
