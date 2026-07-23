-- Manually curated subset of `prisma migrate diff --from-url <supabase> --to-schema-datamodel
-- prisma/schema.prisma --script`, run after baselining `_prisma_migrations` against Supabase
-- (production's actual DATABASE_URL target — see docs/audits/2026-07-17-supabase-schema-drift-handoff.md).
--
-- The raw diff also contained 155 DropTable + 143 DropForeignKey statements — Supabase had a large
-- number of legacy/orphaned Prisma-shaped tables not in the current schema.prisma, and applying the
-- diff verbatim would have destroyed them. Every statement below was individually verified as either
-- (a) creating something genuinely missing (the autonomous_* tables — this is what was causing
-- `relation "public.AutonomousRun" does not exist` etc. in production logs), or (b) an ALTER TABLE
-- against a table confirmed to have zero rows, or confirmed to only hold null/empty/default values in
-- the specific columns being dropped (checked "User" — 9 rows — and "Project" — 2 rows — directly).
--
-- NOT fixed here (separate, code-level issues — the referenced models don't exist in schema.prisma
-- at all, so no migration can restore them; these are stale application-code references to
-- removed/renamed models, need a code fix instead):
--   - relation "public.ProjectOutput" does not exist
--   - relation "public.PermitDocument" does not exist
--   - relation "api_request_logs" does not exist

-- CreateEnum
CREATE TYPE "ConstructionReadinessStatus" AS ENUM ('NOT_READY', 'DESIGN_READY', 'PERMITS_SUBMITTED', 'CONSTRUCTION_READY');


-- CreateEnum
CREATE TYPE "LeadSourceType" AS ENUM ('SPONSORED_AD', 'PLATFORM_SERVICE', 'OWNER_INVITED');


-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'FORFEITED');


-- CreateEnum
CREATE TYPE "EstimationServiceLeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUOTE_PROVIDED', 'PAYMENT_PENDING', 'PAID', 'ESTIMATION_IN_PROGRESS', 'ESTIMATION_COMPLETED', 'DOWNLOADED', 'ARCHIVED');


-- CreateEnum
CREATE TYPE "AutonomousGoalStatus" AS ENUM ('DRAFT', 'READY', 'ACTIVE', 'PAUSED', 'BLOCKED', 'COMPLETE', 'CANCELLED', 'FAILED');


-- CreateEnum
CREATE TYPE "AutonomousRunStatus" AS ENUM ('QUEUED', 'PLANNING', 'RUNNING', 'AWAITING_INPUT', 'AWAITING_APPROVAL', 'RETRYING', 'BLOCKED', 'COMPLETE', 'PARTIAL', 'FAILED', 'CANCELLED');


-- CreateEnum
CREATE TYPE "AutonomousStepStatus" AS ENUM ('PENDING', 'READY', 'RUNNING', 'AWAITING_INPUT', 'AWAITING_APPROVAL', 'RETRYING', 'COMPLETE', 'SKIPPED', 'BLOCKED', 'FAILED', 'CANCELLED');


-- CreateEnum
CREATE TYPE "AutonomousInvocationStatus" AS ENUM ('REQUESTED', 'RUNNING', 'SUCCEEDED', 'RETRYABLE_FAILURE', 'FATAL_FAILURE', 'CANCELLED');


-- CreateEnum
CREATE TYPE "AutonomousApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'CANCELLED');


-- AlterTable
ALTER TABLE "ContractorProfile" DROP COLUMN "commercialFocus",
DROP COLUMN "emergencyServices",
DROP COLUMN "listingTier",
DROP COLUMN "preferredProjectSizes",
DROP COLUMN "profileVisibility",
DROP COLUMN "residentialFocus",
DROP COLUMN "serviceCategories",
DROP COLUMN "serviceCities",
DROP COLUMN "serviceRadius",
DROP COLUMN "serviceStates",
DROP COLUMN "slug",
DROP COLUMN "teamSize",
DROP COLUMN "website";


-- AlterTable
ALTER TABLE "DeliverableCorrection" ALTER COLUMN "id" DROP DEFAULT;


-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "invitedProfileId" TEXT,
ADD COLUMN     "professionalType" "ProfessionalType",
ADD COLUMN     "sourceType" "LeadSourceType" NOT NULL DEFAULT 'PLATFORM_SERVICE';


-- AlterTable
ALTER TABLE "MarketplaceProfile" DROP COLUMN "listingTier",
ADD COLUMN     "professionalType" "ProfessionalType";


-- AlterTable
ALTER TABLE "ProductCreditLedger" ALTER COLUMN "id" DROP DEFAULT;


-- AlterTable
ALTER TABLE "Project" DROP COLUMN "budgetEstimated",
DROP COLUMN "dcsScore",
DROP COLUMN "designRoute",
DROP COLUMN "packageFeatures",
DROP COLUMN "packageType",
DROP COLUMN "portfolioOrgId",
DROP COLUMN "v30Status",
DROP COLUMN "whitelabelId",
ADD COLUMN     "constructionReadiness" "ConstructionReadinessStatus" NOT NULL DEFAULT 'NOT_READY',
ADD COLUMN     "constructionReadinessConfirmedBy" TEXT,
ADD COLUMN     "constructionReadinessUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "digitalTwinState" JSONB,
ADD COLUMN     "riskSnapshot" JSONB;


-- AlterTable
ALTER TABLE "RevenueProduct" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;


-- AlterTable
ALTER TABLE "RevenueTransaction" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;


-- AlterTable
ALTER TABLE "User" DROP COLUMN "companyName",
DROP COLUMN "subscriptionEndsAt",
DROP COLUMN "subscriptionTier",
DROP COLUMN "v30Permissions",
DROP COLUMN "v30Roles",
DROP COLUMN "verificationStatus";


-- AlterTable
ALTER TABLE "agent_sessions" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "mode" DROP DEFAULT,
ALTER COLUMN "status" DROP DEFAULT,
ALTER COLUMN "memory" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;


-- AlterTable
ALTER TABLE "automation_events" ADD COLUMN     "processed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "processedAt" TIMESTAMP(3);


-- AlterTable
ALTER TABLE "estimation_service_leads" ADD COLUMN     "assignedTo" TEXT,
ADD COLUMN     "costDatabaseId" TEXT,
ADD COLUMN     "estimateId" TEXT,
ADD COLUMN     "pricePaidCents" INTEGER,
ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "projectId" TEXT,
ADD COLUMN     "relatedConceptIntakeId" TEXT,
ADD COLUMN     "stripePaymentId" TEXT,
ADD COLUMN     "stripeSessionId" TEXT,
ALTER COLUMN "projectScope" SET NOT NULL,
ALTER COLUMN "projectStage" SET NOT NULL,
ALTER COLUMN "estimatedBudget" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "tier" SET NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "EstimationServiceLeadStatus" NOT NULL DEFAULT 'NEW';


-- AlterTable
ALTER TABLE "file_uploads" ADD COLUMN     "conceptServiceLeadId" TEXT,
ADD COLUMN     "estimationServiceLeadId" TEXT,
ADD COLUMN     "permitServiceLeadId" TEXT;


-- AlterTable
ALTER TABLE "professional_assignments" DROP COLUMN "acceptedAt",
DROP COLUMN "assignmentStatus",
DROP COLUMN "completedAt",
DROP COLUMN "invitedAt",
DROP COLUMN "matchScore",
DROP COLUMN "metadata",
DROP COLUMN "notes",
DROP COLUMN "professionalId",
DROP COLUMN "projectId",
ADD COLUMN     "acceptDeadline" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "adminNote" TEXT,
ADD COLUMN     "adminOverride" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "declineReason" TEXT,
ADD COLUMN     "forwardedAt" TIMESTAMP(3),
ADD COLUMN     "leadId" TEXT NOT NULL,
ADD COLUMN     "profileId" TEXT NOT NULL,
ADD COLUMN     "respondedAt" TIMESTAMP(3),
ADD COLUMN     "rotationPosition" INTEGER,
ADD COLUMN     "sourceType" "LeadSourceType" NOT NULL,
ADD COLUMN     "status" "AssignmentStatus" NOT NULL DEFAULT 'PENDING',
DROP COLUMN "professionalType",
ADD COLUMN     "professionalType" "ProfessionalType" NOT NULL;


-- AlterTable
ALTER TABLE "property_twins" DROP COLUMN "created_at",
DROP COLUMN "creation_path",
DROP COLUMN "floor_area_sqft",
DROP COLUMN "intake_id",
DROP COLUMN "project_id",
DROP COLUMN "property_type",
DROP COLUMN "source_capture_session_ids",
DROP COLUMN "status",
DROP COLUMN "updated_at",
DROP COLUMN "year_built",
ADD COLUMN     "assessedValue" DECIMAL(14,2),
ADD COLUMN     "buildingSize" DOUBLE PRECISION,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "dataQualityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "dataSources" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "jurisdiction" TEXT,
ADD COLUMN     "lastSaleDate" TIMESTAMP(3),
ADD COLUMN     "latestScores" JSONB,
ADD COLUMN     "lotSize" DOUBLE PRECISION,
ADD COLUMN     "opportunityFlags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "orgId" TEXT,
ADD COLUMN     "ownershipType" TEXT,
ADD COLUMN     "parcelId" TEXT,
ADD COLUMN     "permitHistory" JSONB,
ADD COLUMN     "propertySummary" TEXT,
ADD COLUMN     "propertyType" TEXT,
ADD COLUMN     "recommendedProducts" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "riskFlags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "yearBuilt" INTEGER,
ADD COLUMN     "zoning" JSONB,
ALTER COLUMN "metadata" DROP NOT NULL,
ALTER COLUMN "metadata" DROP DEFAULT;


-- AlterTable
ALTER TABLE "v30_bot_executions" DROP COLUMN "botVersion",
DROP COLUMN "cacheHitRate",
DROP COLUMN "keaBotRunId",
DROP COLUMN "retryCount",
DROP COLUMN "startedAt",
ALTER COLUMN "inputData" DROP NOT NULL,
ALTER COLUMN "inputData" DROP DEFAULT,
ALTER COLUMN "tokensUsed" DROP NOT NULL,
ALTER COLUMN "tokensUsed" DROP DEFAULT,
ALTER COLUMN "costUSD" DROP NOT NULL,
ALTER COLUMN "costUSD" DROP DEFAULT,
ALTER COLUMN "costUSD" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "durationMs" DROP NOT NULL,
ALTER COLUMN "durationMs" DROP DEFAULT;


-- AlterTable
ALTER TABLE "v30_bot_results" DROP COLUMN "mediaUrls",
DROP COLUMN "qualityScore",
DROP COLUMN "validationNotes",
ALTER COLUMN "resultType" SET DEFAULT 'json',
ALTER COLUMN "contentJson" DROP DEFAULT,
ALTER COLUMN "deliveredAt" SET NOT NULL,
ALTER COLUMN "deliveredAt" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "deliveryMethod" SET NOT NULL,
ALTER COLUMN "deliveryMethod" SET DEFAULT 'api';


-- AlterTable
ALTER TABLE "v30_pricing_formulas" ALTER COLUMN "baseAmount" DROP DEFAULT,
ALTER COLUMN "baseAmount" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "sqftMultiplier" DROP DEFAULT,
ALTER COLUMN "sqftMultiplier" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "urgencyMultiplier" DROP DEFAULT,
ALTER COLUMN "urgencyMultiplier" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "locationMultiplier" DROP DEFAULT,
ALTER COLUMN "locationMultiplier" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "minPrice" DROP DEFAULT,
ALTER COLUMN "minPrice" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "maxPrice" DROP DEFAULT,
ALTER COLUMN "maxPrice" SET DATA TYPE DOUBLE PRECISION;


-- CreateTable
CREATE TABLE "autonomous_goals" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "projectId" TEXT,
    "intakeId" TEXT,
    "parentGoalId" TEXT,
    "objective" TEXT NOT NULL,
    "successCriteria" JSONB NOT NULL,
    "constraints" JSONB,
    "priority" INTEGER NOT NULL DEFAULT 50,
    "status" "AutonomousGoalStatus" NOT NULL DEFAULT 'DRAFT',
    "requestedBy" TEXT,
    "dueAt" TIMESTAMP(3),
    "tokenBudget" INTEGER,
    "costBudgetCents" INTEGER,
    "timeBudgetMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "autonomous_goals_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "autonomous_agent_definitions" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "displayName" TEXT NOT NULL,
    "runtimeKind" TEXT NOT NULL,
    "description" TEXT,
    "systemPrompt" TEXT,
    "capabilities" TEXT[],
    "allowedTools" TEXT[],
    "modelPolicy" JSONB,
    "authorityPolicy" JSONB,
    "budgetPolicy" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "autonomous_agent_definitions_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "autonomous_runs" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "runtimeKind" TEXT NOT NULL DEFAULT 'supervisor',
    "status" "AutonomousRunStatus" NOT NULL DEFAULT 'QUEUED',
    "plan" JSONB,
    "context" JSONB,
    "result" JSONB,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "currentStepKey" TEXT,
    "attempt" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "tokensUsed" INTEGER NOT NULL DEFAULT 0,
    "costCents" INTEGER NOT NULL DEFAULT 0,
    "elapsedMs" INTEGER NOT NULL DEFAULT 0,
    "leaseOwner" TEXT,
    "leaseExpiresAt" TIMESTAMP(3),
    "heartbeatAt" TIMESTAMP(3),
    "externalWorkflowId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "autonomous_runs_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "autonomous_steps" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "stepKey" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "agentDefinitionId" TEXT,
    "capability" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "AutonomousStepStatus" NOT NULL DEFAULT 'PENDING',
    "dependsOn" TEXT[],
    "input" JSONB,
    "output" JSONB,
    "completionCriteria" JSONB,
    "retryPolicy" JSONB,
    "approvalPolicy" JSONB,
    "attempt" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "tokensUsed" INTEGER NOT NULL DEFAULT 0,
    "costCents" INTEGER NOT NULL DEFAULT 0,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "autonomous_steps_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "autonomous_tool_invocations" (
    "id" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "toolName" TEXT NOT NULL,
    "status" "AutonomousInvocationStatus" NOT NULL DEFAULT 'REQUESTED',
    "input" JSONB,
    "output" JSONB,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "attempt" INTEGER NOT NULL DEFAULT 0,
    "durationMs" INTEGER,
    "tokensUsed" INTEGER NOT NULL DEFAULT 0,
    "costCents" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "autonomous_tool_invocations_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "autonomous_approvals" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "stepId" TEXT,
    "approvalType" TEXT NOT NULL,
    "status" "AutonomousApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "requestedRole" TEXT,
    "requestedUserId" TEXT,
    "tokenHash" TEXT NOT NULL,
    "request" JSONB,
    "response" JSONB,
    "expiresAt" TIMESTAMP(3),
    "decidedBy" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "autonomous_approvals_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "autonomous_memories" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "projectId" TEXT,
    "intakeId" TEXT,
    "agentSlug" TEXT,
    "scope" TEXT NOT NULL,
    "memoryKey" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "importance" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "sourceRunId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "autonomous_memories_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "autonomous_evidence" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "stepId" TEXT,
    "evidenceType" TEXT NOT NULL,
    "sourceUri" TEXT,
    "sourceTitle" TEXT,
    "contentHash" TEXT,
    "excerpt" TEXT,
    "payload" JSONB,
    "confidence" DOUBLE PRECISION,
    "verifiedAt" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "autonomous_evidence_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "autonomous_events" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "idempotencyKey" TEXT,
    "eventType" TEXT NOT NULL,
    "actorType" TEXT NOT NULL,
    "actorId" TEXT,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "autonomous_events_pkey" PRIMARY KEY ("id")
);


-- CreateIndex
CREATE INDEX "autonomous_goals_tenantId_status_priority_idx" ON "autonomous_goals"("tenantId", "status", "priority");


-- CreateIndex
CREATE INDEX "autonomous_goals_projectId_status_idx" ON "autonomous_goals"("projectId", "status");


-- CreateIndex
CREATE INDEX "autonomous_goals_intakeId_status_idx" ON "autonomous_goals"("intakeId", "status");


-- CreateIndex
CREATE INDEX "autonomous_goals_parentGoalId_idx" ON "autonomous_goals"("parentGoalId");


-- CreateIndex
CREATE INDEX "autonomous_agent_definitions_active_slug_idx" ON "autonomous_agent_definitions"("active", "slug");


-- CreateIndex
CREATE UNIQUE INDEX "autonomous_agent_definitions_slug_version_key" ON "autonomous_agent_definitions"("slug", "version");


-- CreateIndex
CREATE UNIQUE INDEX "autonomous_runs_idempotencyKey_key" ON "autonomous_runs"("idempotencyKey");


-- CreateIndex
CREATE INDEX "autonomous_runs_goalId_status_idx" ON "autonomous_runs"("goalId", "status");


-- CreateIndex
CREATE INDEX "autonomous_runs_status_leaseExpiresAt_idx" ON "autonomous_runs"("status", "leaseExpiresAt");


-- CreateIndex
CREATE INDEX "autonomous_runs_externalWorkflowId_idx" ON "autonomous_runs"("externalWorkflowId");


-- CreateIndex
CREATE INDEX "autonomous_steps_runId_status_availableAt_idx" ON "autonomous_steps"("runId", "status", "availableAt");


-- CreateIndex
CREATE INDEX "autonomous_steps_agentDefinitionId_idx" ON "autonomous_steps"("agentDefinitionId");


-- CreateIndex
CREATE INDEX "autonomous_steps_capability_status_idx" ON "autonomous_steps"("capability", "status");


-- CreateIndex
CREATE UNIQUE INDEX "autonomous_steps_runId_stepKey_key" ON "autonomous_steps"("runId", "stepKey");


-- CreateIndex
CREATE UNIQUE INDEX "autonomous_steps_runId_sequence_key" ON "autonomous_steps"("runId", "sequence");


-- CreateIndex
CREATE UNIQUE INDEX "autonomous_tool_invocations_idempotencyKey_key" ON "autonomous_tool_invocations"("idempotencyKey");


-- CreateIndex
CREATE INDEX "autonomous_tool_invocations_stepId_status_idx" ON "autonomous_tool_invocations"("stepId", "status");


-- CreateIndex
CREATE INDEX "autonomous_tool_invocations_toolName_status_idx" ON "autonomous_tool_invocations"("toolName", "status");


-- CreateIndex
CREATE UNIQUE INDEX "autonomous_approvals_tokenHash_key" ON "autonomous_approvals"("tokenHash");


-- CreateIndex
CREATE INDEX "autonomous_approvals_runId_status_idx" ON "autonomous_approvals"("runId", "status");


-- CreateIndex
CREATE INDEX "autonomous_approvals_stepId_status_idx" ON "autonomous_approvals"("stepId", "status");


-- CreateIndex
CREATE INDEX "autonomous_approvals_requestedUserId_status_idx" ON "autonomous_approvals"("requestedUserId", "status");


-- CreateIndex
CREATE INDEX "autonomous_memories_tenantId_scope_idx" ON "autonomous_memories"("tenantId", "scope");


-- CreateIndex
CREATE INDEX "autonomous_memories_projectId_scope_idx" ON "autonomous_memories"("projectId", "scope");


-- CreateIndex
CREATE INDEX "autonomous_memories_intakeId_scope_idx" ON "autonomous_memories"("intakeId", "scope");


-- CreateIndex
CREATE INDEX "autonomous_memories_agentSlug_scope_idx" ON "autonomous_memories"("agentSlug", "scope");


-- CreateIndex
CREATE INDEX "autonomous_memories_expiresAt_idx" ON "autonomous_memories"("expiresAt");


-- CreateIndex
CREATE UNIQUE INDEX "autonomous_memories_scope_memoryKey_projectId_intakeId_agen_key" ON "autonomous_memories"("scope", "memoryKey", "projectId", "intakeId", "agentSlug");


-- CreateIndex
CREATE INDEX "autonomous_evidence_runId_evidenceType_idx" ON "autonomous_evidence"("runId", "evidenceType");


-- CreateIndex
CREATE INDEX "autonomous_evidence_stepId_idx" ON "autonomous_evidence"("stepId");


-- CreateIndex
CREATE INDEX "autonomous_evidence_contentHash_idx" ON "autonomous_evidence"("contentHash");


-- CreateIndex
CREATE INDEX "autonomous_evidence_validUntil_idx" ON "autonomous_evidence"("validUntil");


-- CreateIndex
CREATE UNIQUE INDEX "autonomous_events_idempotencyKey_key" ON "autonomous_events"("idempotencyKey");


-- CreateIndex
CREATE INDEX "autonomous_events_runId_createdAt_idx" ON "autonomous_events"("runId", "createdAt");


-- CreateIndex
CREATE INDEX "autonomous_events_eventType_createdAt_idx" ON "autonomous_events"("eventType", "createdAt");


-- CreateIndex
CREATE UNIQUE INDEX "autonomous_events_runId_sequence_key" ON "autonomous_events"("runId", "sequence");


-- CreateIndex
CREATE INDEX "Lead_sourceType_idx" ON "Lead"("sourceType");


-- CreateIndex
CREATE INDEX "Lead_professionalType_stage_idx" ON "Lead"("professionalType", "stage");


-- CreateIndex
CREATE INDEX "MarketplaceProfile_professionalType_idx" ON "MarketplaceProfile"("professionalType");


-- CreateIndex
CREATE INDEX "agent_sessions_orgId_idx" ON "agent_sessions"("orgId");


-- CreateIndex
CREATE INDEX "agent_sessions_createdAt_idx" ON "agent_sessions"("createdAt");


-- estimation_service_leads_status_idx omitted — already exists.


-- CreateIndex
CREATE INDEX "estimation_service_leads_tier_idx" ON "estimation_service_leads"("tier");


-- CreateIndex
CREATE INDEX "estimation_service_leads_createdAt_idx" ON "estimation_service_leads"("createdAt");


-- CreateIndex
CREATE INDEX "estimation_service_leads_leadScore_idx" ON "estimation_service_leads"("leadScore");


-- CreateIndex
CREATE INDEX "file_uploads_conceptServiceLeadId_idx" ON "file_uploads"("conceptServiceLeadId");


-- CreateIndex
CREATE INDEX "file_uploads_estimationServiceLeadId_idx" ON "file_uploads"("estimationServiceLeadId");


-- CreateIndex
CREATE INDEX "file_uploads_permitServiceLeadId_idx" ON "file_uploads"("permitServiceLeadId");


-- CreateIndex
CREATE INDEX "professional_assignments_leadId_idx" ON "professional_assignments"("leadId");


-- CreateIndex
CREATE INDEX "professional_assignments_profileId_idx" ON "professional_assignments"("profileId");


-- CreateIndex
CREATE INDEX "professional_assignments_status_acceptDeadline_idx" ON "professional_assignments"("status", "acceptDeadline");


-- CreateIndex
CREATE INDEX "professional_assignments_leadId_status_idx" ON "professional_assignments"("leadId", "status");


-- CreateIndex
CREATE INDEX "property_twins_orgId_idx" ON "property_twins"("orgId");


-- CreateIndex
CREATE INDEX "property_twins_parcelId_idx" ON "property_twins"("parcelId");


-- CreateIndex
CREATE INDEX "property_twins_jurisdiction_idx" ON "property_twins"("jurisdiction");


-- CreateIndex
CREATE INDEX "property_twins_dataQualityScore_idx" ON "property_twins"("dataQualityScore");


-- ProductCreditLedger_productId_fkey and DeliverableCorrection_productId_fkey are
-- intentionally omitted here — both already exist, created by the earlier
-- add_revenue_product_catalog migration applied directly against Supabase.

-- AddForeignKey
ALTER TABLE "professional_assignments" ADD CONSTRAINT "professional_assignments_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "professional_assignments" ADD CONSTRAINT "professional_assignments_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "MarketplaceProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "file_uploads" ADD CONSTRAINT "file_uploads_conceptServiceLeadId_fkey" FOREIGN KEY ("conceptServiceLeadId") REFERENCES "concept_service_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "file_uploads" ADD CONSTRAINT "file_uploads_estimationServiceLeadId_fkey" FOREIGN KEY ("estimationServiceLeadId") REFERENCES "estimation_service_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "file_uploads" ADD CONSTRAINT "file_uploads_permitServiceLeadId_fkey" FOREIGN KEY ("permitServiceLeadId") REFERENCES "permit_service_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "autonomous_goals" ADD CONSTRAINT "autonomous_goals_parentGoalId_fkey" FOREIGN KEY ("parentGoalId") REFERENCES "autonomous_goals"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "autonomous_runs" ADD CONSTRAINT "autonomous_runs_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "autonomous_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "autonomous_steps" ADD CONSTRAINT "autonomous_steps_runId_fkey" FOREIGN KEY ("runId") REFERENCES "autonomous_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "autonomous_steps" ADD CONSTRAINT "autonomous_steps_agentDefinitionId_fkey" FOREIGN KEY ("agentDefinitionId") REFERENCES "autonomous_agent_definitions"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "autonomous_tool_invocations" ADD CONSTRAINT "autonomous_tool_invocations_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "autonomous_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "autonomous_approvals" ADD CONSTRAINT "autonomous_approvals_runId_fkey" FOREIGN KEY ("runId") REFERENCES "autonomous_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "autonomous_approvals" ADD CONSTRAINT "autonomous_approvals_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "autonomous_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "autonomous_evidence" ADD CONSTRAINT "autonomous_evidence_runId_fkey" FOREIGN KEY ("runId") REFERENCES "autonomous_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "autonomous_evidence" ADD CONSTRAINT "autonomous_evidence_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "autonomous_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "autonomous_events" ADD CONSTRAINT "autonomous_events_runId_fkey" FOREIGN KEY ("runId") REFERENCES "autonomous_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
