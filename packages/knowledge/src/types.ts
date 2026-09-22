/**
 * @kealee/knowledge — the types of the Phase 1 registry.
 *
 * The string unions mirror the Prisma enums in
 * `packages/database/schema-src/knowledge/enums.prisma` exactly. They are
 * repeated here (rather than imported from the generated client) so this
 * package is usable — and testable — without a generated client or a
 * database, the same way the worker's structural copies work.
 */

export type KnowledgeArtifactType =
  | 'DRAWING' | 'PHOTO' | 'VIDEO' | 'DOCUMENT' | 'ESTIMATE' | 'SCHEDULE' | 'SITE_PLAN'
  | 'DESIGN_CONCEPT' | 'FEASIBILITY_REPORT' | 'PERMIT_PACKAGE' | 'SPECIFICATION' | 'RFI'
  | 'SUBMITTAL' | 'CHANGE_ORDER' | 'INSPECTION' | 'CONTRACT' | 'PROPOSAL' | 'COST_RECORD'
  | 'LABOR_RECORD' | 'MATERIAL_RECORD' | 'PROMPT' | 'MODEL_RESPONSE' | 'AGENT_SESSION'
  | 'CODE_CHANGE' | 'CODE_REVIEW' | 'COMMIT' | 'RULE' | 'REGULATION' | 'JURISDICTION_COMMENT'
  | 'APPROVED_PLAN' | 'AS_BUILT' | 'SURVEY' | 'PLAT' | 'RENDERING' | 'YIELD_STUDY' | 'OTHER'

export type KnowledgeArtifactStatus =
  | 'RAW' | 'EXTRACTED' | 'NORMALIZED' | 'RETRIEVABLE' | 'REVIEWED' | 'SUPERSEDED' | 'ARCHIVED' | 'QUARANTINED'

export type KnowledgeApprovalStatus =
  | 'UNREVIEWED' | 'AI_GENERATED' | 'HUMAN_REVIEWED' | 'HUMAN_APPROVED' | 'PROFESSIONAL_SEALED'
  | 'JURISDICTION_APPROVED' | 'REJECTED'

/** Ordered high → low. `authorityRank()` gives the ordinal. */
export const AUTHORITY_ORDER = [
  'APPROVED_GOVERNMENT_RECORD', 'JURISDICTION_ISSUED_DOCUMENT', 'SEALED_PROFESSIONAL_DOCUMENT',
  'APPROVED_CONSTRUCTION_DOCUMENT', 'VERIFIED_FIELD_MEASUREMENT', 'HUMAN_REVIEWED_KEALEE_FINAL',
  'PROJECT_CONTRACT', 'MANUFACTURER_DOCUMENTATION', 'VALIDATED_STRUCTURED_DATA',
  'UPLOADED_SOURCE_DOCUMENT', 'AI_DERIVED_STRUCTURED_DATA', 'AI_GENERATED_DRAFT', 'UNVERIFIED_INFERENCE',
] as const
export type KnowledgeAuthority = (typeof AUTHORITY_ORDER)[number]
/** 0 is the highest authority; a lower number outranks a higher one. */
export function authorityRank(a: KnowledgeAuthority): number { return AUTHORITY_ORDER.indexOf(a) }

export type TrainingEligibility =
  | 'UNKNOWN' | 'NOT_ELIGIBLE' | 'RETRIEVAL_ONLY' | 'EVAL_ELIGIBLE' | 'TRAINING_CANDIDATE' | 'TRAINING_APPROVED' | 'EXCLUDED'
export type RetrievalEligibility = 'UNKNOWN' | 'ELIGIBLE' | 'ORG_ONLY' | 'PROJECT_ONLY' | 'EXCLUDED'
export type KnowledgeConfidentiality = 'PUBLIC' | 'INTERNAL' | 'CUSTOMER_CONFIDENTIAL' | 'RESTRICTED'
export type KnowledgeRetentionClass = 'STANDARD' | 'PROJECT_RECORD' | 'LEGAL_HOLD' | 'EPHEMERAL'

export type KnowledgeLineageRelation =
  | 'DERIVED_FROM' | 'GENERATED_FROM' | 'VERSION_OF' | 'SUPERSEDES' | 'CORRECTS' | 'REVIEWS'
  | 'APPROVES' | 'INPUT_TO' | 'REFERENCES' | 'DEPICTS' | 'VALIDATES' | 'EXTRACTED_FROM'

export type GenerationRunStatus = 'STARTED' | 'COMPLETED' | 'FAILED' | 'APPROVED' | 'REJECTED' | 'CORRECTED' | 'SUPERSEDED'
export type GenerationInputRole =
  | 'SOURCE_ARTIFACT' | 'RETRIEVED_CONTEXT' | 'RULE' | 'PROJECT_MEMORY' | 'USER_REQUEST' | 'PRIOR_GENERATION' | 'TOOL_RESULT'

export type LearningEventType =
  | 'ARTIFACT_INGESTED' | 'ARTIFACT_VERSIONED' | 'GENERATION_RECORDED' | 'GENERATION_APPROVED'
  | 'GENERATION_REJECTED' | 'GENERATION_CORRECTED' | 'HUMAN_FEEDBACK' | 'JURISDICTION_OUTCOME'
  | 'ACTUALS_RECEIVED' | 'TRAINING_CANDIDATE_CREATED' | 'TRAINING_EXAMPLE_PROMOTED' | 'DATASET_PUBLISHED'
  | 'EVALUATION_COMPLETED' | 'WORKSPACE_SESSION_CAPTURED'

// ── Records as the service returns them ──────────────────────────────────────

export interface KnowledgeArtifactRecord {
  id: string
  organizationId: string | null
  projectId: string | null
  orderId: string | null
  artifactType: KnowledgeArtifactType
  artifactSubtype: string | null
  discipline: string | null
  sourceId: string | null
  sourceSystem: string | null
  sourceRecordId: string | null
  sourceUri: string | null
  storageUri: string | null
  mimeType: string | null
  filename: string | null
  checksum: string | null
  fileSize: number | null
  title: string
  summary: string | null
  capturedAt: Date | null
  uploadedById: string | null
  generatedByAgent: string | null
  generatedByModel: string | null
  generationRunId: string | null
  version: number
  parentArtifactId: string | null
  supersedesArtifactId: string | null
  status: KnowledgeArtifactStatus
  approvalStatus: KnowledgeApprovalStatus
  authority: KnowledgeAuthority
  jurisdiction: string | null
  projectPhase: string | null
  constructionPhase: string | null
  confidentiality: KnowledgeConfidentiality
  retentionClass: KnowledgeRetentionClass
  trainingEligibility: TrainingEligibility
  retrievalEligibility: RetrievalEligibility
  qualityScore: number | null
  confidenceScore: number | null
  metadata: Record<string, unknown> | null
  createdAt: Date
  updatedAt: Date
}

export interface LineageEdgeRecord {
  id: string
  subjectId: string
  objectId: string
  relation: KnowledgeLineageRelation
  actorType: string | null
  actorId: string | null
  generationRunId: string | null
  note: string | null
  createdAt: Date
}

export interface GenerationRunRecord {
  id: string
  organizationId: string | null
  projectId: string | null
  orderId: string | null
  productType: string
  agent: string
  agentVersion: string | null
  model: string | null
  modelParameters: Record<string, unknown> | null
  promptId: string | null
  promptVersion: string | null
  promptHash: string | null
  requestSummary: string | null
  request: Record<string, unknown> | null
  rulesUsed: unknown
  toolsExecuted: unknown
  status: GenerationRunStatus
  confidence: number | null
  startedAt: Date
  completedAt: Date | null
  durationMs: number | null
  errorMessage: string | null
  finalDisposition: string | null
  dispositionById: string | null
  dispositionAt: Date | null
  workflowId: string | null
  jobKey: string | null
  metadata: Record<string, unknown> | null
}

// ── Inputs ───────────────────────────────────────────────────────────────────

export interface IngestArtifactInput {
  organizationId?: string | null
  projectId?: string | null
  orderId?: string | null
  artifactType: KnowledgeArtifactType
  artifactSubtype?: string | null
  discipline?: string | null
  /** A registered source key ('site-plan-engine', 'concept-generator', …) — resolved to KnowledgeSource. */
  sourceKey?: string
  sourceSystem?: string | null
  sourceRecordId?: string | null
  sourceUri?: string | null
  storageUri?: string | null
  mimeType?: string | null
  filename?: string | null
  /** Provided, or computed from `content`/`bytes` if given. */
  checksum?: string | null
  content?: unknown
  bytes?: Uint8Array
  fileSize?: number | null
  title: string
  summary?: string | null
  capturedAt?: Date | null
  uploadedById?: string | null
  generatedByAgent?: string | null
  generatedByModel?: string | null
  generationRunId?: string | null
  parentArtifactId?: string | null
  supersedesArtifactId?: string | null
  status?: KnowledgeArtifactStatus
  approvalStatus?: KnowledgeApprovalStatus
  authority?: KnowledgeAuthority
  jurisdiction?: string | null
  projectPhase?: string | null
  constructionPhase?: string | null
  confidentiality?: KnowledgeConfidentiality
  retentionClass?: KnowledgeRetentionClass
  trainingEligibility?: TrainingEligibility
  retrievalEligibility?: RetrievalEligibility
  qualityScore?: number | null
  confidenceScore?: number | null
  metadata?: Record<string, unknown> | null
  files?: { role: string; filename: string; mimeType?: string | null; storageUri?: string | null; checksum?: string | null; fileSize?: number | null; pageCount?: number | null; metadata?: Record<string, unknown> | null }[]
  links?: { projectId?: string | null; orderId?: string | null; parcelId?: string | null; role?: string }[]
  /** Lineage this artifact carries on arrival (this artifact is the subject). */
  lineage?: { objectId: string; relation: KnowledgeLineageRelation; note?: string | null }[]
  actor?: { type: 'agent' | 'user' | 'system' | 'jurisdiction'; id: string }
}

export interface VersionArtifactInput {
  artifactId: string
  checksum?: string | null
  content?: unknown
  storageUri?: string | null
  changeSummary: string
  changedById?: string | null
  changedByAgent?: string | null
  approvalStatus?: KnowledgeApprovalStatus
  metadata?: Record<string, unknown> | null
  /** Patch applied to the artifact's own columns (status, approvalStatus, summary, metadata merge). */
  patch?: Partial<Pick<KnowledgeArtifactRecord, 'status' | 'approvalStatus' | 'authority' | 'summary' | 'trainingEligibility' | 'retrievalEligibility' | 'qualityScore' | 'confidenceScore'>> & { metadata?: Record<string, unknown> }
}

export interface RecordGenerationInput {
  organizationId?: string | null
  projectId?: string | null
  orderId?: string | null
  productType: string
  agent: string
  agentVersion?: string | null
  model?: string | null
  modelParameters?: Record<string, unknown> | null
  promptId?: string | null
  promptVersion?: string | null
  /** The literal prompt template or system prompt — hashed, never stored raw here. */
  promptText?: string | null
  requestSummary?: string | null
  request?: Record<string, unknown> | null
  rulesUsed?: unknown
  toolsExecuted?: unknown
  status?: GenerationRunStatus
  confidence?: number | null
  startedAt?: Date
  completedAt?: Date | null
  errorMessage?: string | null
  workflowId?: string | null
  jobKey?: string | null
  metadata?: Record<string, unknown> | null
  inputs?: { role: GenerationInputRole; artifactId?: string | null; reference?: string | null; content?: unknown }[]
  /** Outputs are ingested as artifacts (GENERATED_FROM every SOURCE_ARTIFACT input) and linked to the run. */
  outputs?: (Omit<IngestArtifactInput, 'generationRunId'> & { role?: string })[]
}

export interface LineageTrace {
  artifactId: string
  /** What produced this — subject → object, transitively, depth-first with depth. */
  upstream: { artifact: KnowledgeArtifactRecord; edge: LineageEdgeRecord; depth: number }[]
  /** What depended on it. */
  downstream: { artifact: KnowledgeArtifactRecord; edge: LineageEdgeRecord; depth: number }[]
  /** The generation runs on the upstream path, with their inputs. */
  generations: GenerationRunRecord[]
  /** Answers, in words, to the questions the lineage graph exists for. */
  answers: {
    sources: string[]
    generatedBy: string[]
    prompts: string[]
    tools: unknown[]
    reviewed: boolean
    approved: boolean
    dependents: number
  }
}
