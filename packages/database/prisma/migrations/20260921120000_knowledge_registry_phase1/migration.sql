-- Kealee Construction Intelligence — Phase 1: artifact registry, provenance, generation records, learning events.
-- Additive only; every statement is guarded so the file is safe to re-run.

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'KnowledgeArtifactType') THEN
  CREATE TYPE "KnowledgeArtifactType" AS ENUM ('DRAWING', 'PHOTO', 'VIDEO', 'DOCUMENT', 'ESTIMATE', 'SCHEDULE', 'SITE_PLAN', 'DESIGN_CONCEPT', 'FEASIBILITY_REPORT', 'PERMIT_PACKAGE', 'SPECIFICATION', 'RFI', 'SUBMITTAL', 'CHANGE_ORDER', 'INSPECTION', 'CONTRACT', 'PROPOSAL', 'COST_RECORD', 'LABOR_RECORD', 'MATERIAL_RECORD', 'PROMPT', 'MODEL_RESPONSE', 'AGENT_SESSION', 'CODE_CHANGE', 'CODE_REVIEW', 'COMMIT', 'RULE', 'REGULATION', 'JURISDICTION_COMMENT', 'APPROVED_PLAN', 'AS_BUILT', 'SURVEY', 'PLAT', 'RENDERING', 'YIELD_STUDY', 'OTHER');
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'KnowledgeArtifactStatus') THEN
  CREATE TYPE "KnowledgeArtifactStatus" AS ENUM ('RAW', 'EXTRACTED', 'NORMALIZED', 'RETRIEVABLE', 'REVIEWED', 'SUPERSEDED', 'ARCHIVED', 'QUARANTINED');
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'KnowledgeApprovalStatus') THEN
  CREATE TYPE "KnowledgeApprovalStatus" AS ENUM ('UNREVIEWED', 'AI_GENERATED', 'HUMAN_REVIEWED', 'HUMAN_APPROVED', 'PROFESSIONAL_SEALED', 'JURISDICTION_APPROVED', 'REJECTED');
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'KnowledgeAuthority') THEN
  CREATE TYPE "KnowledgeAuthority" AS ENUM ('APPROVED_GOVERNMENT_RECORD', 'JURISDICTION_ISSUED_DOCUMENT', 'SEALED_PROFESSIONAL_DOCUMENT', 'APPROVED_CONSTRUCTION_DOCUMENT', 'VERIFIED_FIELD_MEASUREMENT', 'HUMAN_REVIEWED_KEALEE_FINAL', 'PROJECT_CONTRACT', 'MANUFACTURER_DOCUMENTATION', 'VALIDATED_STRUCTURED_DATA', 'UPLOADED_SOURCE_DOCUMENT', 'AI_DERIVED_STRUCTURED_DATA', 'AI_GENERATED_DRAFT', 'UNVERIFIED_INFERENCE');
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TrainingEligibility') THEN
  CREATE TYPE "TrainingEligibility" AS ENUM ('UNKNOWN', 'NOT_ELIGIBLE', 'RETRIEVAL_ONLY', 'EVAL_ELIGIBLE', 'TRAINING_CANDIDATE', 'TRAINING_APPROVED', 'EXCLUDED');
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RetrievalEligibility') THEN
  CREATE TYPE "RetrievalEligibility" AS ENUM ('UNKNOWN', 'ELIGIBLE', 'ORG_ONLY', 'PROJECT_ONLY', 'EXCLUDED');
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'KnowledgeConfidentiality') THEN
  CREATE TYPE "KnowledgeConfidentiality" AS ENUM ('PUBLIC', 'INTERNAL', 'CUSTOMER_CONFIDENTIAL', 'RESTRICTED');
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'KnowledgeRetentionClass') THEN
  CREATE TYPE "KnowledgeRetentionClass" AS ENUM ('STANDARD', 'PROJECT_RECORD', 'LEGAL_HOLD', 'EPHEMERAL');
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'KnowledgeLineageRelation') THEN
  CREATE TYPE "KnowledgeLineageRelation" AS ENUM ('DERIVED_FROM', 'GENERATED_FROM', 'VERSION_OF', 'SUPERSEDES', 'CORRECTS', 'REVIEWS', 'APPROVES', 'INPUT_TO', 'REFERENCES', 'DEPICTS', 'VALIDATES', 'EXTRACTED_FROM');
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GenerationRunStatus') THEN
  CREATE TYPE "GenerationRunStatus" AS ENUM ('STARTED', 'COMPLETED', 'FAILED', 'APPROVED', 'REJECTED', 'CORRECTED', 'SUPERSEDED');
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GenerationInputRole') THEN
  CREATE TYPE "GenerationInputRole" AS ENUM ('SOURCE_ARTIFACT', 'RETRIEVED_CONTEXT', 'RULE', 'PROJECT_MEMORY', 'USER_REQUEST', 'PRIOR_GENERATION', 'TOOL_RESULT');
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LearningEventType') THEN
  CREATE TYPE "LearningEventType" AS ENUM ('ARTIFACT_INGESTED', 'ARTIFACT_VERSIONED', 'GENERATION_RECORDED', 'GENERATION_APPROVED', 'GENERATION_REJECTED', 'GENERATION_CORRECTED', 'HUMAN_FEEDBACK', 'JURISDICTION_OUTCOME', 'ACTUALS_RECEIVED', 'TRAINING_CANDIDATE_CREATED', 'TRAINING_EXAMPLE_PROMOTED', 'DATASET_PUBLISHED', 'EVALUATION_COMPLETED', 'WORKSPACE_SESSION_CAPTURED');
END IF; END $$;

CREATE TABLE IF NOT EXISTS "knowledge_sources" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "defaultAuthority" "KnowledgeAuthority" NOT NULL DEFAULT 'AI_GENERATED_DRAFT',
    "defaultTrainingEligibility" "TrainingEligibility" NOT NULL DEFAULT 'UNKNOWN',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_sources_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "knowledge_artifacts" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "projectId" TEXT,
    "orderId" TEXT,
    "artifactType" "KnowledgeArtifactType" NOT NULL,
    "artifactSubtype" TEXT,
    "discipline" TEXT,
    "sourceId" TEXT,
    "sourceSystem" TEXT,
    "sourceRecordId" TEXT,
    "sourceUri" TEXT,
    "storageUri" TEXT,
    "mimeType" TEXT,
    "filename" TEXT,
    "checksum" TEXT,
    "fileSize" INTEGER,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "capturedAt" TIMESTAMP(3),
    "uploadedById" TEXT,
    "generatedByAgent" TEXT,
    "generatedByModel" TEXT,
    "generationRunId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "parentArtifactId" TEXT,
    "supersedesArtifactId" TEXT,
    "status" "KnowledgeArtifactStatus" NOT NULL DEFAULT 'RAW',
    "approvalStatus" "KnowledgeApprovalStatus" NOT NULL DEFAULT 'UNREVIEWED',
    "authority" "KnowledgeAuthority" NOT NULL DEFAULT 'UPLOADED_SOURCE_DOCUMENT',
    "jurisdiction" TEXT,
    "projectPhase" TEXT,
    "constructionPhase" TEXT,
    "confidentiality" "KnowledgeConfidentiality" NOT NULL DEFAULT 'CUSTOMER_CONFIDENTIAL',
    "retentionClass" "KnowledgeRetentionClass" NOT NULL DEFAULT 'PROJECT_RECORD',
    "trainingEligibility" "TrainingEligibility" NOT NULL DEFAULT 'UNKNOWN',
    "retrievalEligibility" "RetrievalEligibility" NOT NULL DEFAULT 'UNKNOWN',
    "qualityScore" DOUBLE PRECISION,
    "confidenceScore" DOUBLE PRECISION,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_artifacts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "knowledge_artifact_versions" (
    "id" TEXT NOT NULL,
    "artifactId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "checksum" TEXT,
    "storageUri" TEXT,
    "changeSummary" TEXT,
    "changedById" TEXT,
    "changedByAgent" TEXT,
    "approvalStatus" "KnowledgeApprovalStatus" NOT NULL DEFAULT 'UNREVIEWED',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_artifact_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "knowledge_artifact_files" (
    "id" TEXT NOT NULL,
    "artifactId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT,
    "storageUri" TEXT,
    "checksum" TEXT,
    "fileSize" INTEGER,
    "pageCount" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_artifact_files_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "knowledge_project_links" (
    "id" TEXT NOT NULL,
    "artifactId" TEXT NOT NULL,
    "projectId" TEXT,
    "orderId" TEXT,
    "parcelId" TEXT,
    "role" TEXT NOT NULL DEFAULT 'evidence',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_project_links_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "knowledge_lineage_edges" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "objectId" TEXT NOT NULL,
    "relation" "KnowledgeLineageRelation" NOT NULL,
    "actorType" TEXT,
    "actorId" TEXT,
    "generationRunId" TEXT,
    "note" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_lineage_edges_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "generation_runs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "projectId" TEXT,
    "orderId" TEXT,
    "productType" TEXT NOT NULL,
    "agent" TEXT NOT NULL,
    "agentVersion" TEXT,
    "model" TEXT,
    "modelParameters" JSONB,
    "promptId" TEXT,
    "promptVersion" TEXT,
    "promptHash" TEXT,
    "requestSummary" TEXT,
    "request" JSONB,
    "rulesUsed" JSONB,
    "toolsExecuted" JSONB,
    "status" "GenerationRunStatus" NOT NULL DEFAULT 'STARTED',
    "confidence" DOUBLE PRECISION,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "errorMessage" TEXT,
    "finalDisposition" TEXT,
    "dispositionById" TEXT,
    "dispositionAt" TIMESTAMP(3),
    "workflowId" TEXT,
    "jobKey" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "generation_runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "generation_inputs" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "role" "GenerationInputRole" NOT NULL,
    "artifactId" TEXT,
    "reference" TEXT,
    "content" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "generation_inputs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "generation_outputs" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "artifactId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'primary',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "generation_outputs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "learning_events" (
    "id" TEXT NOT NULL,
    "eventType" "LearningEventType" NOT NULL,
    "organizationId" TEXT,
    "projectId" TEXT,
    "orderId" TEXT,
    "artifactId" TEXT,
    "generationRunId" TEXT,
    "actorType" TEXT,
    "actorId" TEXT,
    "summary" TEXT NOT NULL,
    "payload" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learning_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "knowledge_sources_key_key" ON "knowledge_sources"("key");

CREATE INDEX IF NOT EXISTS "knowledge_artifacts_organizationId_projectId_idx" ON "knowledge_artifacts"("organizationId", "projectId");

CREATE INDEX IF NOT EXISTS "knowledge_artifacts_orderId_idx" ON "knowledge_artifacts"("orderId");

CREATE INDEX IF NOT EXISTS "knowledge_artifacts_artifactType_approvalStatus_idx" ON "knowledge_artifacts"("artifactType", "approvalStatus");

CREATE INDEX IF NOT EXISTS "knowledge_artifacts_jurisdiction_artifactType_idx" ON "knowledge_artifacts"("jurisdiction", "artifactType");

CREATE INDEX IF NOT EXISTS "knowledge_artifacts_trainingEligibility_idx" ON "knowledge_artifacts"("trainingEligibility");

CREATE INDEX IF NOT EXISTS "knowledge_artifacts_checksum_idx" ON "knowledge_artifacts"("checksum");

CREATE INDEX IF NOT EXISTS "knowledge_artifacts_generationRunId_idx" ON "knowledge_artifacts"("generationRunId");

CREATE UNIQUE INDEX IF NOT EXISTS "knowledge_artifacts_sourceSystem_sourceRecordId_version_key" ON "knowledge_artifacts"("sourceSystem", "sourceRecordId", "version");

CREATE UNIQUE INDEX IF NOT EXISTS "knowledge_artifact_versions_artifactId_version_key" ON "knowledge_artifact_versions"("artifactId", "version");

CREATE INDEX IF NOT EXISTS "knowledge_artifact_files_artifactId_role_idx" ON "knowledge_artifact_files"("artifactId", "role");

CREATE INDEX IF NOT EXISTS "knowledge_project_links_projectId_idx" ON "knowledge_project_links"("projectId");

CREATE INDEX IF NOT EXISTS "knowledge_project_links_orderId_idx" ON "knowledge_project_links"("orderId");

CREATE INDEX IF NOT EXISTS "knowledge_project_links_parcelId_idx" ON "knowledge_project_links"("parcelId");

CREATE UNIQUE INDEX IF NOT EXISTS "knowledge_project_links_artifactId_projectId_orderId_parcel_key" ON "knowledge_project_links"("artifactId", "projectId", "orderId", "parcelId", "role");

CREATE INDEX IF NOT EXISTS "knowledge_lineage_edges_objectId_relation_idx" ON "knowledge_lineage_edges"("objectId", "relation");

CREATE INDEX IF NOT EXISTS "knowledge_lineage_edges_generationRunId_idx" ON "knowledge_lineage_edges"("generationRunId");

CREATE UNIQUE INDEX IF NOT EXISTS "knowledge_lineage_edges_subjectId_objectId_relation_key" ON "knowledge_lineage_edges"("subjectId", "objectId", "relation");

CREATE INDEX IF NOT EXISTS "generation_runs_productType_status_idx" ON "generation_runs"("productType", "status");

CREATE INDEX IF NOT EXISTS "generation_runs_orderId_idx" ON "generation_runs"("orderId");

CREATE INDEX IF NOT EXISTS "generation_runs_projectId_idx" ON "generation_runs"("projectId");

CREATE INDEX IF NOT EXISTS "generation_runs_workflowId_idx" ON "generation_runs"("workflowId");

CREATE INDEX IF NOT EXISTS "generation_runs_startedAt_idx" ON "generation_runs"("startedAt");

CREATE INDEX IF NOT EXISTS "generation_inputs_runId_idx" ON "generation_inputs"("runId");

CREATE INDEX IF NOT EXISTS "generation_inputs_artifactId_idx" ON "generation_inputs"("artifactId");

CREATE UNIQUE INDEX IF NOT EXISTS "generation_outputs_runId_artifactId_role_key" ON "generation_outputs"("runId", "artifactId", "role");

CREATE INDEX IF NOT EXISTS "learning_events_eventType_occurredAt_idx" ON "learning_events"("eventType", "occurredAt");

CREATE INDEX IF NOT EXISTS "learning_events_artifactId_idx" ON "learning_events"("artifactId");

CREATE INDEX IF NOT EXISTS "learning_events_generationRunId_idx" ON "learning_events"("generationRunId");

CREATE INDEX IF NOT EXISTS "learning_events_orderId_idx" ON "learning_events"("orderId");

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'knowledge_artifacts_sourceId_fkey') THEN
  ALTER TABLE "knowledge_artifacts" ADD CONSTRAINT "knowledge_artifacts_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "knowledge_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'knowledge_artifacts_generationRunId_fkey') THEN
  ALTER TABLE "knowledge_artifacts" ADD CONSTRAINT "knowledge_artifacts_generationRunId_fkey" FOREIGN KEY ("generationRunId") REFERENCES "generation_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'knowledge_artifacts_parentArtifactId_fkey') THEN
  ALTER TABLE "knowledge_artifacts" ADD CONSTRAINT "knowledge_artifacts_parentArtifactId_fkey" FOREIGN KEY ("parentArtifactId") REFERENCES "knowledge_artifacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'knowledge_artifacts_supersedesArtifactId_fkey') THEN
  ALTER TABLE "knowledge_artifacts" ADD CONSTRAINT "knowledge_artifacts_supersedesArtifactId_fkey" FOREIGN KEY ("supersedesArtifactId") REFERENCES "knowledge_artifacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'knowledge_artifact_versions_artifactId_fkey') THEN
  ALTER TABLE "knowledge_artifact_versions" ADD CONSTRAINT "knowledge_artifact_versions_artifactId_fkey" FOREIGN KEY ("artifactId") REFERENCES "knowledge_artifacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'knowledge_artifact_files_artifactId_fkey') THEN
  ALTER TABLE "knowledge_artifact_files" ADD CONSTRAINT "knowledge_artifact_files_artifactId_fkey" FOREIGN KEY ("artifactId") REFERENCES "knowledge_artifacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'knowledge_project_links_artifactId_fkey') THEN
  ALTER TABLE "knowledge_project_links" ADD CONSTRAINT "knowledge_project_links_artifactId_fkey" FOREIGN KEY ("artifactId") REFERENCES "knowledge_artifacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'knowledge_lineage_edges_subjectId_fkey') THEN
  ALTER TABLE "knowledge_lineage_edges" ADD CONSTRAINT "knowledge_lineage_edges_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "knowledge_artifacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'knowledge_lineage_edges_objectId_fkey') THEN
  ALTER TABLE "knowledge_lineage_edges" ADD CONSTRAINT "knowledge_lineage_edges_objectId_fkey" FOREIGN KEY ("objectId") REFERENCES "knowledge_artifacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'generation_inputs_runId_fkey') THEN
  ALTER TABLE "generation_inputs" ADD CONSTRAINT "generation_inputs_runId_fkey" FOREIGN KEY ("runId") REFERENCES "generation_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'generation_inputs_artifactId_fkey') THEN
  ALTER TABLE "generation_inputs" ADD CONSTRAINT "generation_inputs_artifactId_fkey" FOREIGN KEY ("artifactId") REFERENCES "knowledge_artifacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'generation_outputs_runId_fkey') THEN
  ALTER TABLE "generation_outputs" ADD CONSTRAINT "generation_outputs_runId_fkey" FOREIGN KEY ("runId") REFERENCES "generation_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'generation_outputs_artifactId_fkey') THEN
  ALTER TABLE "generation_outputs" ADD CONSTRAINT "generation_outputs_artifactId_fkey" FOREIGN KEY ("artifactId") REFERENCES "knowledge_artifacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'learning_events_artifactId_fkey') THEN
  ALTER TABLE "learning_events" ADD CONSTRAINT "learning_events_artifactId_fkey" FOREIGN KEY ("artifactId") REFERENCES "knowledge_artifacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
END IF; END $$;
