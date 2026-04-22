-- CreateTable "concept_service_leads"
CREATE TABLE "concept_service_leads" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "projectType" TEXT NOT NULL,
    "location" TEXT,
    "zipCode" TEXT,
    "description" TEXT,
    "roughDimensions" JSONB,
    "stylePreference" TEXT,
    "budgetRange" TEXT,
    "hasPhotos" BOOLEAN NOT NULL DEFAULT false,
    "photoCount" INTEGER,
    "hasRoughPlans" BOOLEAN NOT NULL DEFAULT false,
    "tier" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "source" TEXT NOT NULL DEFAULT 'WEBSITE',
    "assignedTo" TEXT,
    "leadScore" INTEGER,
    "complexity" TEXT,
    "readinessState" TEXT,
    "stripeSessionId" TEXT,
    "stripePaymentId" TEXT,
    "pricePaidCents" INTEGER,
    "paidAt" TIMESTAMP(3),
    "projectConceptPreDesignId" TEXT,
    "projectId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "concept_service_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable "concept_service_lead_notes"
CREATE TABLE "concept_service_lead_notes" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "concept_service_lead_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable "concept_service_lead_activities"
CREATE TABLE "concept_service_lead_activities" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "concept_service_lead_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable "estimation_service_leads"
CREATE TABLE "estimation_service_leads" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "projectScope" TEXT NOT NULL,
    "projectStage" TEXT NOT NULL,
    "scopeDetail" TEXT,
    "designDocumentUrl" TEXT,
    "estimatedBudget" TEXT,
    "hasDesignDocs" BOOLEAN NOT NULL DEFAULT false,
    "tier" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "source" TEXT NOT NULL DEFAULT 'WEBSITE',
    "assignedTo" TEXT,
    "leadScore" INTEGER,
    "complexity" TEXT,
    "conceptIntakeId" TEXT,
    "stripeSessionId" TEXT,
    "stripePaymentId" TEXT,
    "pricePaidCents" INTEGER,
    "paidAt" TIMESTAMP(3),
    "projectId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "estimation_service_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable "estimation_service_lead_notes"
CREATE TABLE "estimation_service_lead_notes" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "estimation_service_lead_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable "estimation_service_lead_activities"
CREATE TABLE "estimation_service_lead_activities" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "estimation_service_lead_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable "bot_runs"
CREATE TABLE "bot_runs" (
    "id" TEXT NOT NULL,
    "botName" TEXT NOT NULL,
    "botVersion" TEXT,
    "agentType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'STARTED',
    "inputId" TEXT,
    "outputId" TEXT,
    "errorId" TEXT,
    "source" TEXT,
    "sourceId" TEXT,
    "tokensCost" DECIMAL(10,6),
    "apiCallsCost" DECIMAL(10,6),
    "totalCost" DECIMAL(10,6),
    "executionTimeMs" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "bot_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable "bot_run_inputs"
CREATE TABLE "bot_run_inputs" (
    "id" TEXT NOT NULL,
    "botRunId" TEXT NOT NULL,
    "inputJson" JSONB NOT NULL,
    "isValidated" BOOLEAN NOT NULL DEFAULT false,
    "validationErrors" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bot_run_inputs_pkey" PRIMARY KEY ("id")
);

-- CreateTable "bot_run_outputs"
CREATE TABLE "bot_run_outputs" (
    "id" TEXT NOT NULL,
    "botRunId" TEXT NOT NULL,
    "outputJson" JSONB NOT NULL,
    "processedOutput" JSONB,
    "confidenceScore" DECIMAL(5,4),
    "qualityScore" DECIMAL(5,4),
    "requiresReview" BOOLEAN NOT NULL DEFAULT false,
    "outputFileUrls" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bot_run_outputs_pkey" PRIMARY KEY ("id")
);

-- CreateTable "bot_run_errors"
CREATE TABLE "bot_run_errors" (
    "id" TEXT NOT NULL,
    "botRunId" TEXT NOT NULL,
    "errorType" TEXT NOT NULL,
    "errorCode" TEXT,
    "errorMessage" TEXT NOT NULL,
    "errorStack" TEXT,
    "isRetryable" BOOLEAN NOT NULL DEFAULT false,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "nextRetryAt" TIMESTAMP(3),
    "wasRecovered" BOOLEAN NOT NULL DEFAULT false,
    "recoveryMethod" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bot_run_errors_pkey" PRIMARY KEY ("id")
);

-- AlterTable "file_uploads"
ALTER TABLE "file_uploads" ADD COLUMN "conceptServiceLeadId" TEXT,
ADD COLUMN "estimationServiceLeadId" TEXT,
ADD COLUMN "permitServiceLeadId" TEXT;

-- CreateIndex "concept_service_leads_email_idx" ON "concept_service_leads"("email");
CREATE INDEX "concept_service_leads_email_idx" ON "concept_service_leads"("email");

-- CreateIndex "concept_service_leads_status_idx" ON "concept_service_leads"("status");
CREATE INDEX "concept_service_leads_status_idx" ON "concept_service_leads"("status");

-- CreateIndex "concept_service_leads_tier_idx" ON "concept_service_leads"("tier");
CREATE INDEX "concept_service_leads_tier_idx" ON "concept_service_leads"("tier");

-- CreateIndex "concept_service_leads_createdAt_idx" ON "concept_service_leads"("createdAt");
CREATE INDEX "concept_service_leads_createdAt_idx" ON "concept_service_leads"("createdAt");

-- CreateIndex "concept_service_leads_leadScore_idx" ON "concept_service_leads"("leadScore");
CREATE INDEX "concept_service_leads_leadScore_idx" ON "concept_service_leads"("leadScore");

-- CreateIndex "concept_service_lead_notes_leadId_idx" ON "concept_service_lead_notes"("leadId");
CREATE INDEX "concept_service_lead_notes_leadId_idx" ON "concept_service_lead_notes"("leadId");

-- CreateIndex "concept_service_lead_notes_createdBy_idx" ON "concept_service_lead_notes"("createdBy");
CREATE INDEX "concept_service_lead_notes_createdBy_idx" ON "concept_service_lead_notes"("createdBy");

-- CreateIndex "concept_service_lead_notes_createdAt_idx" ON "concept_service_lead_notes"("createdAt");
CREATE INDEX "concept_service_lead_notes_createdAt_idx" ON "concept_service_lead_notes"("createdAt");

-- CreateIndex "concept_service_lead_activities_leadId_idx" ON "concept_service_lead_activities"("leadId");
CREATE INDEX "concept_service_lead_activities_leadId_idx" ON "concept_service_lead_activities"("leadId");

-- CreateIndex "concept_service_lead_activities_activityType_idx" ON "concept_service_lead_activities"("activityType");
CREATE INDEX "concept_service_lead_activities_activityType_idx" ON "concept_service_lead_activities"("activityType");

-- CreateIndex "concept_service_lead_activities_createdAt_idx" ON "concept_service_lead_activities"("createdAt");
CREATE INDEX "concept_service_lead_activities_createdAt_idx" ON "concept_service_lead_activities"("createdAt");

-- CreateIndex "estimation_service_leads_email_idx" ON "estimation_service_leads"("email");
CREATE INDEX "estimation_service_leads_email_idx" ON "estimation_service_leads"("email");

-- CreateIndex "estimation_service_leads_status_idx" ON "estimation_service_leads"("status");
CREATE INDEX "estimation_service_leads_status_idx" ON "estimation_service_leads"("status");

-- CreateIndex "estimation_service_leads_tier_idx" ON "estimation_service_leads"("tier");
CREATE INDEX "estimation_service_leads_tier_idx" ON "estimation_service_leads"("tier");

-- CreateIndex "estimation_service_leads_createdAt_idx" ON "estimation_service_leads"("createdAt");
CREATE INDEX "estimation_service_leads_createdAt_idx" ON "estimation_service_leads"("createdAt");

-- CreateIndex "estimation_service_leads_leadScore_idx" ON "estimation_service_leads"("leadScore");
CREATE INDEX "estimation_service_leads_leadScore_idx" ON "estimation_service_leads"("leadScore");

-- CreateIndex "estimation_service_lead_notes_leadId_idx" ON "estimation_service_lead_notes"("leadId");
CREATE INDEX "estimation_service_lead_notes_leadId_idx" ON "estimation_service_lead_notes"("leadId");

-- CreateIndex "estimation_service_lead_notes_createdBy_idx" ON "estimation_service_lead_notes"("createdBy");
CREATE INDEX "estimation_service_lead_notes_createdBy_idx" ON "estimation_service_lead_notes"("createdBy");

-- CreateIndex "estimation_service_lead_notes_createdAt_idx" ON "estimation_service_lead_notes"("createdAt");
CREATE INDEX "estimation_service_lead_notes_createdAt_idx" ON "estimation_service_lead_notes"("createdAt");

-- CreateIndex "estimation_service_lead_activities_leadId_idx" ON "estimation_service_lead_activities"("leadId");
CREATE INDEX "estimation_service_lead_activities_leadId_idx" ON "estimation_service_lead_activities"("leadId");

-- CreateIndex "estimation_service_lead_activities_activityType_idx" ON "estimation_service_lead_activities"("activityType");
CREATE INDEX "estimation_service_lead_activities_activityType_idx" ON "estimation_service_lead_activities"("activityType");

-- CreateIndex "estimation_service_lead_activities_createdAt_idx" ON "estimation_service_lead_activities"("createdAt");
CREATE INDEX "estimation_service_lead_activities_createdAt_idx" ON "estimation_service_lead_activities"("createdAt");

-- CreateIndex "bot_runs_botName_idx" ON "bot_runs"("botName");
CREATE INDEX "bot_runs_botName_idx" ON "bot_runs"("botName");

-- CreateIndex "bot_runs_status_idx" ON "bot_runs"("status");
CREATE INDEX "bot_runs_status_idx" ON "bot_runs"("status");

-- CreateIndex "bot_runs_createdAt_idx" ON "bot_runs"("createdAt");
CREATE INDEX "bot_runs_createdAt_idx" ON "bot_runs"("createdAt");

-- CreateIndex "bot_run_inputs_botRunId_idx" ON "bot_run_inputs"("botRunId");
CREATE INDEX "bot_run_inputs_botRunId_idx" ON "bot_run_inputs"("botRunId");

-- CreateIndex "bot_run_outputs_botRunId_idx" ON "bot_run_outputs"("botRunId");
CREATE INDEX "bot_run_outputs_botRunId_idx" ON "bot_run_outputs"("botRunId");

-- CreateIndex "bot_run_errors_botRunId_idx" ON "bot_run_errors"("botRunId");
CREATE INDEX "bot_run_errors_botRunId_idx" ON "bot_run_errors"("botRunId");

-- CreateIndex "file_uploads_conceptServiceLeadId_idx" ON "file_uploads"("conceptServiceLeadId");
CREATE INDEX "file_uploads_conceptServiceLeadId_idx" ON "file_uploads"("conceptServiceLeadId");

-- CreateIndex "file_uploads_estimationServiceLeadId_idx" ON "file_uploads"("estimationServiceLeadId");
CREATE INDEX "file_uploads_estimationServiceLeadId_idx" ON "file_uploads"("estimationServiceLeadId");

-- CreateIndex "file_uploads_permitServiceLeadId_idx" ON "file_uploads"("permitServiceLeadId");
CREATE INDEX "file_uploads_permitServiceLeadId_idx" ON "file_uploads"("permitServiceLeadId");

-- AddForeignKey
ALTER TABLE "concept_service_lead_notes" ADD CONSTRAINT "concept_service_lead_notes_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "concept_service_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concept_service_lead_activities" ADD CONSTRAINT "concept_service_lead_activities_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "concept_service_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimation_service_lead_notes" ADD CONSTRAINT "estimation_service_lead_notes_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "estimation_service_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimation_service_lead_activities" ADD CONSTRAINT "estimation_service_lead_activities_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "estimation_service_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bot_run_inputs" ADD CONSTRAINT "bot_run_inputs_botRunId_fkey" FOREIGN KEY ("botRunId") REFERENCES "bot_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bot_run_outputs" ADD CONSTRAINT "bot_run_outputs_botRunId_fkey" FOREIGN KEY ("botRunId") REFERENCES "bot_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bot_run_errors" ADD CONSTRAINT "bot_run_errors_botRunId_fkey" FOREIGN KEY ("botRunId") REFERENCES "bot_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_uploads" ADD CONSTRAINT "file_uploads_conceptServiceLeadId_fkey" FOREIGN KEY ("conceptServiceLeadId") REFERENCES "concept_service_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_uploads" ADD CONSTRAINT "file_uploads_estimationServiceLeadId_fkey" FOREIGN KEY ("estimationServiceLeadId") REFERENCES "estimation_service_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_uploads" ADD CONSTRAINT "file_uploads_permitServiceLeadId_fkey" FOREIGN KEY ("permitServiceLeadId") REFERENCES "permit_service_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Note: Foreign keys to ProjectConceptPreDesign and Project will be added in a follow-up migration
-- when those tables are fully integrated into the schema generation pipeline
