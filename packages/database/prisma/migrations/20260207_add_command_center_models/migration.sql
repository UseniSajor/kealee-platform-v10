-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELED');

-- AlterTable: Add missing fields to automation_tasks
ALTER TABLE "automation_tasks" ADD COLUMN "clientId" TEXT;
ALTER TABLE "automation_tasks" ADD COLUMN "sourceApp" TEXT;
ALTER TABLE "automation_tasks" ALTER COLUMN "error" SET DATA TYPE TEXT;

-- AddForeignKey: AutomationTask -> Project
ALTER TABLE "automation_tasks" ADD CONSTRAINT "automation_tasks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: automation_events
CREATE TABLE "automation_events" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "sourceApp" TEXT NOT NULL,
    "projectId" TEXT,
    "payload" JSONB NOT NULL,
    "processedBy" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "automation_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable: bid_evaluations
CREATE TABLE "bid_evaluations" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "trade" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'collecting',
    "weightPrice" DECIMAL(3,2) NOT NULL DEFAULT 0.30,
    "weightTimeline" DECIMAL(3,2) NOT NULL DEFAULT 0.25,
    "weightQuality" DECIMAL(3,2) NOT NULL DEFAULT 0.25,
    "weightProximity" DECIMAL(3,2) NOT NULL DEFAULT 0.10,
    "weightAvailability" DECIMAL(3,2) NOT NULL DEFAULT 0.10,
    "dueDate" TIMESTAMP(3),
    "selectedBidId" TEXT,
    "aiRecommendation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bid_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable: bids
CREATE TABLE "bids" (
    "id" TEXT NOT NULL,
    "evaluationId" TEXT NOT NULL,
    "contractorId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "timeline" INTEGER NOT NULL,
    "qualityScore" DECIMAL(5,2),
    "proximityScore" DECIMAL(5,2),
    "availabilityScore" DECIMAL(5,2),
    "totalScore" DECIMAL(5,2),
    "rank" INTEGER,
    "notes" TEXT,
    "scope" TEXT,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bids_pkey" PRIMARY KEY ("id")
);

-- CreateTable: weekly_reports
CREATE TABLE "weekly_reports" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "weekEnd" TIMESTAMP(3) NOT NULL,
    "summary" TEXT NOT NULL,
    "metrics" JSONB NOT NULL,
    "risks" JSONB,
    "photos" TEXT[],
    "fileUrl" TEXT,
    "sentToClient" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weekly_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable: qa_inspection_results
CREATE TABLE "qa_inspection_results" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "siteVisitId" TEXT,
    "photoUrl" TEXT NOT NULL,
    "analysisResult" JSONB NOT NULL,
    "issuesFound" JSONB,
    "overallScore" DECIMAL(5,2),
    "reviewedByPm" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "qa_inspection_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable: decision_queue
CREATE TABLE "decision_queue" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "pmId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "context" JSONB NOT NULL,
    "aiRecommendation" TEXT,
    "aiConfidence" DECIMAL(5,4),
    "options" JSONB NOT NULL,
    "decision" TEXT,
    "decidedAt" TIMESTAMP(3),
    "decidedBy" TEXT,
    "reasoning" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "decision_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable: app_health_metrics
CREATE TABLE "app_health_metrics" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jobsTotal" INTEGER NOT NULL,
    "jobsSuccess" INTEGER NOT NULL,
    "jobsFailed" INTEGER NOT NULL,
    "avgDuration" DECIMAL(10,2) NOT NULL,
    "queueDepth" INTEGER NOT NULL,
    "errorRate" DECIMAL(5,4) NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "app_health_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: automation_events
CREATE INDEX "automation_events_eventType_idx" ON "automation_events"("eventType");
CREATE INDEX "automation_events_sourceApp_idx" ON "automation_events"("sourceApp");
CREATE INDEX "automation_events_projectId_idx" ON "automation_events"("projectId");
CREATE INDEX "automation_events_createdAt_idx" ON "automation_events"("createdAt");

-- CreateIndex: bid_evaluations
CREATE INDEX "bid_evaluations_projectId_idx" ON "bid_evaluations"("projectId");
CREATE INDEX "bid_evaluations_status_idx" ON "bid_evaluations"("status");

-- CreateIndex: bids
CREATE INDEX "bids_evaluationId_idx" ON "bids"("evaluationId");
CREATE INDEX "bids_contractorId_idx" ON "bids"("contractorId");
CREATE INDEX "bids_totalScore_idx" ON "bids"("totalScore");

-- CreateIndex: weekly_reports
CREATE INDEX "weekly_reports_projectId_idx" ON "weekly_reports"("projectId");
CREATE INDEX "weekly_reports_weekEnd_idx" ON "weekly_reports"("weekEnd");

-- CreateIndex: qa_inspection_results
CREATE INDEX "qa_inspection_results_projectId_idx" ON "qa_inspection_results"("projectId");
CREATE INDEX "qa_inspection_results_siteVisitId_idx" ON "qa_inspection_results"("siteVisitId");

-- CreateIndex: decision_queue
CREATE INDEX "decision_queue_pmId_idx" ON "decision_queue"("pmId");
CREATE INDEX "decision_queue_projectId_idx" ON "decision_queue"("projectId");
CREATE INDEX "decision_queue_type_idx" ON "decision_queue"("type");
CREATE INDEX "decision_queue_decision_idx" ON "decision_queue"("decision");

-- CreateIndex: app_health_metrics
CREATE INDEX "app_health_metrics_appId_idx" ON "app_health_metrics"("appId");
CREATE INDEX "app_health_metrics_timestamp_idx" ON "app_health_metrics"("timestamp");

-- CreateIndex: automation_tasks (new indexes)
CREATE INDEX "automation_tasks_sourceApp_idx" ON "automation_tasks"("sourceApp");
CREATE INDEX "automation_tasks_assignedPmId_idx" ON "automation_tasks"("assignedPmId");

-- AddForeignKey: BidEvaluation -> Project
ALTER TABLE "bid_evaluations" ADD CONSTRAINT "bid_evaluations_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Bid -> BidEvaluation
ALTER TABLE "bids" ADD CONSTRAINT "bids_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "bid_evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: WeeklyReport -> Project
ALTER TABLE "weekly_reports" ADD CONSTRAINT "weekly_reports_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
