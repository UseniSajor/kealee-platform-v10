export type WorkflowStatus =
  | "NEW"
  | "COLLECTING_INFO"
  | "WAITING_FOR_CLIENT"
  | "ANALYZING_SITE"
  | "GENERATING_BRIEF"
  | "GENERATING_VISUALS"
  | "READY_FOR_PM_REVIEW"
  | "NEEDS_REVISION"
  | "ESCALATED_MANUAL"
  | "APPROVED_FOR_DELIVERY"
  | "DELIVERED"
  | "CLOSED"
  | "FAILED";

export type Complexity = "low" | "medium" | "high";

export interface IntakeData {
  clientName?: string;
  contactEmail?: string;
  contactPhone?: string;
  projectAddress?: string;
  jurisdiction?: string;
  projectType?: string;
  propertyUse?: string;
  goals?: string[];
  stylePreferences?: string[];
  budgetRange?: string;
  timelineGoal?: string;
  knownConstraints?: string[];
  desiredMaterials?: string[];
  preferredColorPalette?: string[];
  uploadedPhotos?: string[];
  existingPlansUploaded?: string[];
  surveyUploaded?: boolean;
}

export interface SiteContext {
  streetViewAvailable: boolean;
  satelliteViewAvailable: boolean;
  visibleBuildingFootprintNotes: string;
  topographyNotes: string;
  neighborhoodContextNotes: string;
}

export interface VisionAnalysis {
  buildingType: string;
  estimatedStories: string;
  roofForm: string;
  facadeMaterials: string[];
  siteFeatures: string[];
  landscapeConditions: string[];
  confidence: number;
}

export interface PermitPathSummary {
  likelyPermitNeeded: boolean;
  likelyDesignReviewNeeded: boolean;
  likelyTradePermits: string[];
  notes: string[];
}

export interface DesignBrief {
  id: string;
  summary: string;
  facadeStrategy: string;
  landscapeStrategy: string;
  materials: string[];
  palette: string[];
  budgetDirection: string;
}

export interface HumanDecision {
  action:
    | "approve"
    | "request_info"
    | "manual"
    | "revise"
    | "regenerate_exterior"
    | "regenerate_landscape"
    | "reject";
  note?: string;
}

export interface ExteriorConceptState {
  intakeId?: string;
  userMessageHistory: Array<{ role: "user" | "assistant"; content: string }>;
  intakeData: IntakeData;
  missingFields: string[];
  siteContext?: SiteContext;
  visionAnalysis?: VisionAnalysis;
  projectComplexity?: Complexity;
  humanReviewRequired?: boolean;
  designBrief?: DesignBrief;
  exteriorConceptImages?: string[];
  landscapeConceptImages?: string[];
  permitPathSummary?: PermitPathSummary;
  packageDraftId?: string;
  status: WorkflowStatus;
  humanDecision?: HumanDecision;
  errors?: string[];
}
