-- Civil site-plan and jurisdiction persistence owned by os-engineering.
-- Scalar references support staged adoption without coupling to voice providers.

CREATE TYPE "SitePlanStageCode" AS ENUM ('PARCEL_RESOLUTION','DOCUMENT_COLLECTION','FEASIBILITY','PLAN_GENERATION','COMPLIANCE_AUDIT','PROFESSIONAL_REVIEW','SUBMISSION_CORRECTIONS');
CREATE TYPE "SitePlanStageStatus" AS ENUM ('NOT_STARTED','READY','IN_PROGRESS','BLOCKED','AWAITING_REVIEW','APPROVED','REJECTED','COMPLETED');
CREATE TYPE "ComplianceOutcome" AS ENUM ('PASS','WARNING','FAIL','NOT_APPLICABLE','MISSING_DATA','PROFESSIONAL_DETERMINATION_REQUIRED');
CREATE TYPE "ProfessionalReviewDecision" AS ENUM ('PENDING','CHANGES_REQUESTED','APPROVED','REJECTED','SUPERSEDED');

CREATE TABLE "jurisdiction_rule_versions" (
  "id" TEXT PRIMARY KEY, "jurisdictionCode" TEXT NOT NULL, "agency" TEXT NOT NULL, "ruleKey" TEXT NOT NULL,
  "version" INTEGER NOT NULL, "projectTypes" TEXT[] DEFAULT ARRAY[]::TEXT[], "permitTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "applicability" JSONB NOT NULL, "requirements" JSONB NOT NULL, "sourceUrl" TEXT NOT NULL, "sourceTitle" TEXT NOT NULL,
  "effectiveDate" TIMESTAMP(3), "lastVerifiedAt" TIMESTAMP(3) NOT NULL, "supersededAt" TIMESTAMP(3),
  "confidence" DECIMAL(5,4) NOT NULL, "humanReviewRequired" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "jurisdiction_rule_versions_jurisdictionCode_ruleKey_version_key" ON "jurisdiction_rule_versions"("jurisdictionCode","ruleKey","version");
CREATE INDEX "jurisdiction_rule_versions_jurisdictionCode_supersededAt_idx" ON "jurisdiction_rule_versions"("jurisdictionCode","supersededAt");
CREATE INDEX "jurisdiction_rule_versions_agency_idx" ON "jurisdiction_rule_versions"("agency");

CREATE TABLE "site_plan_workflows" (
  "id" TEXT PRIMARY KEY, "organizationId" TEXT NOT NULL, "projectId" TEXT NOT NULL, "propertyId" TEXT, "parcelId" TEXT,
  "productId" TEXT, "currentStage" "SitePlanStageCode" NOT NULL DEFAULT 'PARCEL_RESOLUTION', "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "version" INTEGER NOT NULL DEFAULT 0, "professionalReviewRequired" BOOLEAN NOT NULL DEFAULT true,
  "releasedAt" TIMESTAMP(3), "metadata" JSONB, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "site_plan_workflows_organizationId_projectId_key" ON "site_plan_workflows"("organizationId","projectId");
CREATE INDEX "site_plan_workflows_organizationId_status_updatedAt_idx" ON "site_plan_workflows"("organizationId","status","updatedAt");

CREATE TABLE "site_plan_stage_executions" (
  "id" TEXT PRIMARY KEY, "workflowId" TEXT NOT NULL, "stage" "SitePlanStageCode" NOT NULL,
  "status" "SitePlanStageStatus" NOT NULL DEFAULT 'NOT_STARTED', "attempt" INTEGER NOT NULL DEFAULT 1,
  "prerequisites" JSONB NOT NULL, "inputs" JSONB, "outputs" JSONB, "blockers" JSONB,
  "assignedPartyId" TEXT, "startedAt" TIMESTAMP(3), "completedAt" TIMESTAMP(3), "reviewedById" TEXT,
  "reviewedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "site_plan_stage_executions_workflowId_stage_attempt_key" ON "site_plan_stage_executions"("workflowId","stage","attempt");
CREATE INDEX "site_plan_stage_executions_workflowId_stage_status_idx" ON "site_plan_stage_executions"("workflowId","stage","status");
CREATE INDEX "site_plan_stage_executions_status_updatedAt_idx" ON "site_plan_stage_executions"("status","updatedAt");

CREATE TABLE "site_plan_compliance_results" (
  "id" TEXT PRIMARY KEY, "workflowId" TEXT NOT NULL, "stageExecutionId" TEXT NOT NULL, "ruleVersionId" TEXT NOT NULL,
  "outcome" "ComplianceOutcome" NOT NULL, "inputs" JSONB NOT NULL, "result" JSONB NOT NULL, "remediation" TEXT,
  "responsibleDiscipline" TEXT, "blocksSubmission" BOOLEAN NOT NULL DEFAULT false, "calculationVersion" TEXT,
  "confidence" DECIMAL(5,4) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "site_plan_compliance_results_stageExecutionId_ruleVersionId_key" ON "site_plan_compliance_results"("stageExecutionId","ruleVersionId");
CREATE INDEX "site_plan_compliance_results_workflowId_outcome_idx" ON "site_plan_compliance_results"("workflowId","outcome");
CREATE INDEX "site_plan_compliance_results_blocksSubmission_createdAt_idx" ON "site_plan_compliance_results"("blocksSubmission","createdAt");

CREATE TABLE "professional_review_records" (
  "id" TEXT PRIMARY KEY, "workflowId" TEXT NOT NULL, "professionalAssignmentId" TEXT NOT NULL,
  "jurisdictionCode" TEXT NOT NULL, "discipline" TEXT NOT NULL, "licenseNumber" TEXT NOT NULL,
  "licenseVerifiedAt" TIMESTAMP(3), "decision" "ProfessionalReviewDecision" NOT NULL DEFAULT 'PENDING',
  "sourceDocumentId" TEXT, "sealedDocumentId" TEXT, "sourceContentHash" TEXT, "sealedContentHash" TEXT,
  "declaration" TEXT, "decidedAt" TIMESTAMP(3), "expiresAt" TIMESTAMP(3), "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "professional_review_records_workflowId_decision_idx" ON "professional_review_records"("workflowId","decision");
CREATE INDEX "professional_review_records_professionalAssignmentId_idx" ON "professional_review_records"("professionalAssignmentId");

CREATE TABLE "permit_correction_cycles" (
  "id" TEXT PRIMARY KEY, "workflowId" TEXT NOT NULL, "permitId" TEXT, "submissionId" TEXT, "cycleNumber" INTEGER NOT NULL,
  "agencyReference" TEXT, "commentsDocumentId" TEXT, "comments" JSONB NOT NULL, "assignments" JSONB NOT NULL,
  "responseLetterId" TEXT, "resubmissionEvidence" JSONB, "status" TEXT NOT NULL DEFAULT 'OPEN',
  "submittedAt" TIMESTAMP(3), "closedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "permit_correction_cycles_workflowId_cycleNumber_key" ON "permit_correction_cycles"("workflowId","cycleNumber");
CREATE INDEX "permit_correction_cycles_workflowId_status_idx" ON "permit_correction_cycles"("workflowId","status");
