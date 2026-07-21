/**
 * APP-01: CONTRACTOR BID ENGINE - TYPE DEFINITIONS
 * Automation Level: 85%
 */

// ============================================================================
// CONTRACTOR MATCHING
// ============================================================================

export interface MatchCriteria {
  projectId: string;
  trades: string[];
  location: { lat: number; lng: number };
  budgetRange: { min: number; max: number };
  timeline: { start: Date; end: Date };
  minRating?: number;
  requiredCredentials?: string[];
  preferredContractors?: string[];
  excludedContractors?: string[];
}

export interface ContractorProfile {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  rating: number;
  reviewCount: number;
  trades: string[];
  latitude: number;
  longitude: number;
  credentials: Credential[];
  completedProjects: number;
  yearsInBusiness: number;
  insuranceCoverage: number;
  bondCapacity: number;
}

export interface Credential {
  type: string;
  number?: string;
  issuedBy?: string;
  issuedAt?: Date;
  expiresAt?: Date;
  verified: boolean;
}

export interface MatchResult {
  contractorId: string;
  contractor: {
    id: string;
    name: string;
    company: string;
    email: string;
    phone: string;
    rating: number;
    trades: string[];
  };
  score: number;
  matchReasons: string[];
  distance: number;
  availability: boolean;
  estimatedResponseRate: number;
}

// ============================================================================
// BID REQUESTS
// ============================================================================

export interface BidRequestScope {
  [key: string]: unknown;
  description: string;
  lineItems: Array<{
    item: string;
    quantity?: number;
    unit?: string;
    estimatedCost?: number;
  }>;
  inclusions: string[];
  exclusions: string[];
  specialRequirements?: string[];
}

export interface BidRequestRequirements {
  [key: string]: unknown;
  insuranceMinimum: number;
  bondRequired: boolean;
  bondAmount?: number;
  prevailingWage?: boolean;
  certifications?: string[];
  experienceYears?: number;
  minProjectsCompleted?: number;
}

export interface BidRequest {
  id: string;
  projectId: string;
  scope: BidRequestScope;
  requirements: BidRequestRequirements;
  trades: string[];
  estimatedBudget?: number;
  deadline: Date;
  status: BidRequestStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type BidRequestStatus =
  | 'DRAFT'
  | 'OPEN'
  | 'CLOSED'
  | 'EVALUATING'
  | 'AWARDED'
  | 'CANCELLED';

// ============================================================================
// BID INVITATIONS & SUBMISSIONS
// ============================================================================

export interface BidInvitation {
  id: string;
  bidRequestId: string;
  contractorId: string;
  status: BidInvitationStatus;
  sentAt: Date;
  viewedAt?: Date;
  respondedAt?: Date;
}

export type BidInvitationStatus =
  | 'PENDING'
  | 'SENT'
  | 'VIEWED'
  | 'SUBMITTED'
  | 'DECLINED'
  | 'EXPIRED';

export interface BidSubmission {
  id: string;
  bidRequestId: string;
  invitationId: string;
  contractorId: string;
  amount: number;
  timeline: BidTimeline;
  scope: BidScope;
  alternates?: BidAlternate[];
  exclusions?: string[];
  assumptions?: string[];
  validUntil: Date;
  status: BidSubmissionStatus;
  submittedAt: Date;
}

export type BidSubmissionStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'SHORTLISTED'
  | 'SELECTED'
  | 'REJECTED'
  | 'WITHDRAWN';

export interface BidTimeline {
  startDate?: Date;
  endDate?: Date;
  totalDays?: number;
  milestones?: Array<{
    name: string;
    date: Date;
    description?: string;
  }>;
}

export interface BidScope {
  inclusions: string[];
  exclusions: string[];
  clarifications?: string[];
  assumptions?: string[];
}

export interface BidAlternate {
  id: string;
  description: string;
  addAmount?: number;
  deductAmount?: number;
  timelineImpact?: number;
}

// ============================================================================
// BID ANALYSIS
// ============================================================================

export interface BidAnalysis {
  submissionId: string;
  contractorName: string;
  amount: number;
  priceScore: number;
  timelineScore: number;
  scopeScore: number;
  qualificationScore: number;
  overallScore: number;
  strengths: string[];
  concerns: string[];
  recommendation: BidRecommendation;
  rank: number;
}

export type BidRecommendation =
  | 'HIGHLY_RECOMMENDED'
  | 'RECOMMENDED'
  | 'ACCEPTABLE'
  | 'NOT_RECOMMENDED';

export interface BidComparison {
  projectId: string;
  bidRequestId: string;
  analyses: BidAnalysis[];
  summary: {
    totalBids: number;
    averagePrice: number;
    medianPrice: number;
    priceRange: { min: number; max: number };
    recommendedContractor: string;
    recommendedContractorId: string;
    aiNarrative: string;
  };
  generatedAt: Date;
}

// ============================================================================
// JOB TYPES
// ============================================================================

export interface CreateBidRequestJob {
  type: 'CREATE_BID_REQUEST';
  projectId: string;
  trades: string[];
  scope: BidRequestScope;
  requirements: BidRequestRequirements;
  deadline: string;
  estimatedBudget?: number;
}

export interface FindContractorsJob {
  type: 'FIND_CONTRACTORS';
  bidRequestId: string;
  criteria: MatchCriteria;
}

export interface SendInvitationsJob {
  type: 'SEND_INVITATIONS';
  bidRequestId: string;
  contractorIds: string[];
}

export interface AnalyzeBidsJob {
  type: 'ANALYZE_BIDS';
  bidRequestId: string;
}

export interface SendRemindersJob {
  type: 'SEND_REMINDERS';
  bidRequestId: string;
}

export interface AwardBidJob {
  type: 'AWARD_BID';
  bidRequestId: string;
  submissionId: string;
  notifyOthers: boolean;
}

export interface VerifyCredentialsJob {
  type: 'VERIFY_CREDENTIALS';
  contractorId: string;
}

export type BidEngineJob =
  | CreateBidRequestJob
  | FindContractorsJob
  | SendInvitationsJob
  | AnalyzeBidsJob
  | SendRemindersJob
  | AwardBidJob
  | VerifyCredentialsJob;
