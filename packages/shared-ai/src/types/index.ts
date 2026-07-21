// ============================================================
// SHARED AI ENGINE - TYPE DEFINITIONS
// ============================================================

// ============================================================
// CORE TYPES
// ============================================================

export interface AIEngineConfig {
  provider: 'openai' | 'custom' | 'hybrid';
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  jurisdictionId?: string;
  customModelUrl?: string;
}

export interface AIResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  confidence?: number; // 0-1
  processingTimeMs?: number;
  modelVersion?: string;
  fallbackUsed?: boolean;
}

export interface PerformanceMetrics {
  requestId: string;
  engine: string;
  jurisdictionId?: string;
  processingTimeMs: number;
  confidence: number;
  success: boolean;
  errorType?: string;
  timestamp: Date;
}

// ============================================================
// PLAN ANALYSIS TYPES
// ============================================================

export interface PlanImage {
  url: string;
  type: 'floor_plan' | 'elevation' | 'section' | 'detail' | 'site_plan' | 'other';
  pageNumber?: number;
  sheetNumber?: string;
}

export interface Dimension {
  value: number;
  unit: 'feet' | 'inches' | 'meters' | 'millimeters';
  element: string; // e.g., "bedroom_width", "ceiling_height"
  confidence: number;
  location?: {
    x: number;
    y: number;
    page: number;
  };
}

export interface DetectedElement {
  type: 'wall' | 'door' | 'window' | 'room' | 'stair' | 'fixture' | 'annotation' | 'other';
  label?: string;
  dimensions?: Dimension[];
  location: {
    x: number;
    y: number;
    width: number;
    height: number;
    page: number;
  };
  confidence: number;
  metadata?: Record<string, any>;
}

export interface PlanAnalysisResult {
  dimensions: Dimension[];
  elements: DetectedElement[];
  rooms?: Array<{
    name: string;
    area: number;
    dimensions: Dimension[];
  }>;
  annotations?: string[];
  codeReferences?: string[];
  issues?: PlanIssue[];
}

export interface PlanIssue {
  severity: 'critical' | 'major' | 'minor' | 'info';
  type: 'missing_dimension' | 'code_violation' | 'inconsistency' | 'missing_element';
  description: string;
  location?: {
    page: number;
    coordinates?: { x: number; y: number };
  };
  suggestedFix?: string;
  codeReference?: string;
}

// ============================================================
// DOCUMENT INTELLIGENCE TYPES
// ============================================================

export interface DocumentMetadata {
  title?: string;
  author?: string;
  creationDate?: Date;
  modificationDate?: Date;
  pageCount: number;
  fileSize: number;
  mimeType: string;
  extractedText?: string;
  ocrConfidence?: number;
  language?: string;
}

export interface ExtractedField {
  name: string;
  value: string | number | boolean | Date;
  confidence: number;
  page?: number;
  location?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface DocumentIntelligenceResult {
  metadata: DocumentMetadata;
  fields: ExtractedField[];
  tables?: Array<{
    rows: string[][];
    page: number;
  }>;
  textBlocks?: Array<{
    text: string;
    page: number;
    type: 'paragraph' | 'heading' | 'list' | 'table';
  }>;
}

// ============================================================
// CODE COMPLIANCE TYPES
// ============================================================

export interface CodeRule {
  id: string;
  code: string; // e.g., "IBC 2021", "IRC 2021"
  section: string; // e.g., "R301.1"
  title: string;
  description: string;
  category: 'structural' | 'fire' | 'accessibility' | 'energy' | 'plumbing' | 'electrical' | 'mechanical';
  requirements: string[];
  applicableTo?: string[]; // Permit types this applies to
}

export interface ComplianceCheck {
  ruleId: string;
  rule: CodeRule;
  status: 'pass' | 'fail' | 'warning' | 'not_applicable' | 'needs_review';
  message: string;
  evidence?: string; // Reference to plan element or document
  confidence: number;
  suggestedFix?: string;
}

export interface ComplianceResult {
  checks: ComplianceCheck[];
  overallStatus: 'compliant' | 'non_compliant' | 'needs_review';
  criticalIssues: number;
  majorIssues: number;
  minorIssues: number;
  applicableRules: number;
  checkedRules: number;
}

// ============================================================
// NLP TYPES
// ============================================================

export interface ParsedCorrection {
  originalText: string;
  issues: Array<{
    description: string;
    severity: 'critical' | 'major' | 'minor';
    discipline?: 'building' | 'electrical' | 'plumbing' | 'mechanical' | 'fire' | 'zoning';
    affectedSheets?: string[];
    suggestedAction?: string;
  }>;
  dueDate?: Date;
  assignedTo?: string;
  confidence: number;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'file';
  required: boolean;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    options?: string[];
  };
  mapping?: string; // Maps to Kealee field
}

export interface FormSchema {
  formName: string;
  jurisdictionId: string;
  permitType: string;
  fields: FormField[];
  sections?: Array<{
    name: string;
    fields: string[]; // Field names
  }>;
}

// ============================================================
// AI REVIEW TYPES
// ============================================================

export interface ReviewRequest {
  permitId: string;
  jurisdictionId: string;
  permitType: string;
  plans?: PlanImage[];
  documents?: Array<{
    url: string;
    type: string;
  }>;
  projectData?: Record<string, any>;
  reviewSource: 'client_side_pre_review' | 'jurisdiction_side_assist' | 'remote_inspection_analysis' | 'document_compliance_check';
}

export interface ReviewResult {
  permitId: string;
  overallScore: number; // 0-100
  readyToSubmit: boolean;
  planIssues: PlanIssue[];
  codeViolations: ComplianceCheck[];
  missingDocuments: string[];
  suggestedFixes: Array<{
    issue: string;
    fix: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  confidence: number;
  processingTimeMs: number;
  modelVersion: string;
  reviewedAt: Date;
}

// ============================================================
// FEEDBACK & LEARNING TYPES
// ============================================================

export interface FeedbackData {
  reviewId: string;
  permitId: string;
  jurisdictionId: string;
  source: 'client_correction' | 'jurisdiction_correction' | 'human_reviewer';
  feedback: {
    issueId?: string;
    wasCorrect: boolean;
    actualOutcome: string;
    notes?: string;
  };
  timestamp: Date;
}

export interface ModelTrainingData {
  jurisdictionId: string;
  permitType: string;
  input: any;
  expectedOutput: any;
  actualOutput?: any;
  feedback?: FeedbackData;
}

// ============================================================
// JURISDICTION-SPECIFIC TYPES
// ============================================================

export interface JurisdictionAIConfig {
  jurisdictionId: string;
  enabledEngines: string[];
  customRules?: CodeRule[];
  formSchemas?: FormSchema[];
  modelPreferences?: {
    planAnalysis?: string;
    documentIntelligence?: string;
    codeCompliance?: string;
    nlp?: string;
  };
  accuracyThresholds?: {
    planAnalysis: number;
    documentIntelligence: number;
    codeCompliance: number;
  };
}
