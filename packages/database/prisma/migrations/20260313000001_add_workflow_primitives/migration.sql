-- CreateEnum
CREATE TYPE "WorkflowSubjectType" AS ENUM ('PROJECT', 'ENGAGEMENT', 'PROFESSIONAL_ASSIGNMENT', 'ORGANIZATION', 'VERIFICATION_PROFILE');

-- CreateEnum
CREATE TYPE "WorkflowStageName" AS ENUM ('LEAD_CREATED', 'LEAD_ASSIGNED', 'AWAITING_PRO_ACCEPTANCE', 'ASSIGNMENT_ACCEPTED', 'ASSIGNMENT_DECLINED', 'ASSIGNMENT_EXPIRED', 'VERIFICATION_PENDING', 'VERIFICATION_UNDER_REVIEW', 'VERIFICATION_APPROVED', 'VERIFICATION_REJECTED', 'DESIGN_READY', 'PERMITS_SUBMITTED', 'CONSTRUCTION_READY', 'CONTRACT_DRAFTED', 'CONTRACT_PENDING_SIGNATURE', 'ESCROW_DRAFTED', 'ESCROW_FUNDED', 'MILESTONES_INITIALIZED');

-- CreateEnum
CREATE TYPE "WorkItemStatus" AS ENUM ('OPEN', 'COMPLETED', 'DECLINED', 'EXPIRED', 'CANCELED');

-- CreateEnum
CREATE TYPE "WorkItemType" AS ENUM ('ASSIGNMENT_ACCEPTANCE', 'LICENSE_UPLOAD', 'INSURANCE_UPLOAD', 'VERIFICATION_REVIEW', 'CONTRACT_REVIEW', 'CONTRACT_SIGNATURE', 'ESCROW_SETUP', 'ESCROW_FUNDING', 'MILESTONE_CONFIRMATION', 'PROFILE_COMPLETION', 'PERMIT_PACKET_REVIEW');

-- CreateTable
CREATE TABLE "workflow_stages" (
    "id" TEXT NOT NULL,
    "subjectType" "WorkflowSubjectType" NOT NULL,
    "subjectId" TEXT NOT NULL,
    "stage" "WorkflowStageName" NOT NULL,
    "enteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enteredById" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_items" (
    "id" TEXT NOT NULL,
    "type" "WorkItemType" NOT NULL,
    "subjectType" "WorkflowSubjectType" NOT NULL,
    "subjectId" TEXT NOT NULL,
    "organizationId" TEXT,
    "assignedToUserId" TEXT,
    "assignedToOrgId" TEXT,
    "status" "WorkItemStatus" NOT NULL DEFAULT 'OPEN',
    "title" TEXT,
    "description" TEXT,
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "completedById" TEXT,
    "metadata" JSONB,
    "createdBySystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_events" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "subjectType" "WorkflowSubjectType" NOT NULL,
    "subjectId" TEXT NOT NULL,
    "payload" JSONB,
    "idempotencyKey" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "workflow_stages_subjectType_subjectId_enteredAt_idx" ON "workflow_stages"("subjectType", "subjectId", "enteredAt");

-- CreateIndex
CREATE INDEX "workflow_stages_subjectType_subjectId_stage_idx" ON "workflow_stages"("subjectType", "subjectId", "stage");

-- CreateIndex
CREATE INDEX "work_items_subjectType_subjectId_idx" ON "work_items"("subjectType", "subjectId");

-- CreateIndex
CREATE INDEX "work_items_assignedToUserId_status_idx" ON "work_items"("assignedToUserId", "status");

-- CreateIndex
CREATE INDEX "work_items_assignedToOrgId_status_idx" ON "work_items"("assignedToOrgId", "status");

-- CreateIndex
CREATE INDEX "work_items_organizationId_status_idx" ON "work_items"("organizationId", "status");

-- CreateIndex
CREATE INDEX "work_items_status_dueAt_idx" ON "work_items"("status", "dueAt");

-- CreateIndex
CREATE INDEX "work_items_type_status_idx" ON "work_items"("type", "status");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_events_idempotencyKey_key" ON "workflow_events"("idempotencyKey");

-- CreateIndex
CREATE INDEX "workflow_events_subjectType_subjectId_createdAt_idx" ON "workflow_events"("subjectType", "subjectId", "createdAt");

-- CreateIndex
CREATE INDEX "workflow_events_eventType_createdAt_idx" ON "workflow_events"("eventType", "createdAt");
