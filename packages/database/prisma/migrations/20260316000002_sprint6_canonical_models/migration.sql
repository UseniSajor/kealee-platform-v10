-- Sprint 6: Canonical Engagement + ProfessionalAssignment models
-- Sprint 4A: GuestOrder
-- Sprint 4B: PlatformFeeRecord
-- Sprint 5B: FailedSync
-- Migration: 20260316000002_sprint6_canonical_models

-- CreateEnum: engagement_status
DO $$ BEGIN CREATE TYPE "engagement_status" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- CreateEnum: engagement_phase
DO $$ BEGIN CREATE TYPE "engagement_phase" AS ENUM ('PRECONSTRUCTION', 'DESIGN', 'PERMITS', 'CONSTRUCTION', 'CLOSEOUT', 'ONGOING');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- CreateEnum: professional_type
DO $$ BEGIN CREATE TYPE "professional_type" AS ENUM ('GENERAL_CONTRACTOR', 'ARCHITECT', 'ENGINEER', 'PROJECT_MANAGER', 'LEGAL_COUNSEL', 'FINANCIAL_ADVISOR', 'INSPECTOR', 'CONSULTANT', 'SPECIALIST');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- CreateEnum: assignment_status
DO $$ BEGIN CREATE TYPE "assignment_status" AS ENUM ('INVITED', 'PENDING_ACCEPTANCE', 'ACTIVE', 'SUSPENDED', 'COMPLETED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- CreateEnum: guest_order_status
DO $$ BEGIN CREATE TYPE "guest_order_status" AS ENUM ('PENDING', 'FULFILLED', 'REFUNDED', 'FAILED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- CreateEnum: failed_sync_status
DO $$ BEGIN CREATE TYPE "failed_sync_status" AS ENUM ('PENDING', 'RETRYING', 'RECOVERED', 'ABANDONED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- CreateTable: engagements
CREATE TABLE IF NOT EXISTS "engagements" (
    "id"                  TEXT NOT NULL,
    "projectId"           TEXT NOT NULL,
    "contractorId"        TEXT,
    "ownerId"             TEXT NOT NULL,
    "status"              "engagement_status" NOT NULL DEFAULT 'DRAFT',
    "phase"               "engagement_phase"  NOT NULL DEFAULT 'PRECONSTRUCTION',
    "scopeNotes"          TEXT,
    "startDate"           TIMESTAMP(3),
    "endDate"             TIMESTAMP(3),
    "contractValue"       DECIMAL(14,2),
    "currency"            TEXT NOT NULL DEFAULT 'USD',
    "contractAgreementId" TEXT,
    "escrowAgreementId"   TEXT,
    "metadata"            JSONB NOT NULL DEFAULT '{}',
    "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "engagements_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "engagements_projectId_status_idx"  ON "engagements"("projectId", "status");
CREATE INDEX IF NOT EXISTS "engagements_contractorId_idx"       ON "engagements"("contractorId");
CREATE INDEX IF NOT EXISTS "engagements_ownerId_idx"            ON "engagements"("ownerId");

-- CreateTable: professional_assignments
CREATE TABLE IF NOT EXISTS "professional_assignments" (
    "id"               TEXT NOT NULL,
    "projectId"        TEXT NOT NULL,
    "professionalId"   TEXT NOT NULL,
    "professionalType" "professional_type"  NOT NULL,
    "assignmentStatus" "assignment_status"  NOT NULL DEFAULT 'INVITED',
    "matchScore"       INTEGER,
    "invitedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt"       TIMESTAMP(3),
    "completedAt"      TIMESTAMP(3),
    "notes"            TEXT,
    "metadata"         JSONB NOT NULL DEFAULT '{}',
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "professional_assignments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "professional_assignments_projectId_professionalId_professionalType_key"
    ON "professional_assignments"("projectId", "professionalId", "professionalType");
CREATE INDEX IF NOT EXISTS "professional_assignments_projectId_assignmentStatus_idx" ON "professional_assignments"("projectId", "assignmentStatus");
CREATE INDEX IF NOT EXISTS "professional_assignments_professionalId_idx"              ON "professional_assignments"("professionalId");

-- CreateTable: guest_orders
CREATE TABLE IF NOT EXISTS "guest_orders" (
    "id"              TEXT NOT NULL,
    "stripeSessionId" TEXT NOT NULL,
    "guestToken"      TEXT NOT NULL,
    "guestEmail"      TEXT NOT NULL,
    "guestName"       TEXT NOT NULL,
    "itemType"        TEXT NOT NULL,
    "itemId"          TEXT,
    "projectId"       TEXT,
    "amountPaid"      INTEGER NOT NULL,
    "currency"        TEXT NOT NULL DEFAULT 'usd',
    "status"          "guest_order_status" NOT NULL DEFAULT 'PENDING',
    "utmSource"       TEXT,
    "fulfilledAt"     TIMESTAMP(3),
    "claimedByUserId" TEXT,
    "claimedAt"       TIMESTAMP(3),
    "metadata"        JSONB NOT NULL DEFAULT '{}',
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guest_orders_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "guest_orders_stripeSessionId_key" ON "guest_orders"("stripeSessionId");
CREATE UNIQUE INDEX IF NOT EXISTS "guest_orders_guestToken_key"      ON "guest_orders"("guestToken");
CREATE INDEX IF NOT EXISTS "guest_orders_guestEmail_idx"        ON "guest_orders"("guestEmail");
CREATE INDEX IF NOT EXISTS "guest_orders_claimedByUserId_idx"   ON "guest_orders"("claimedByUserId");

-- CreateTable: platform_fee_records
CREATE TABLE IF NOT EXISTS "platform_fee_records" (
    "id"              TEXT NOT NULL,
    "stripeSessionId" TEXT NOT NULL,
    "projectId"       TEXT NOT NULL,
    "contractorId"    TEXT,
    "milestoneId"     TEXT,
    "grossAmount"     INTEGER NOT NULL,
    "feePct"          DECIMAL(6,4) NOT NULL,
    "feeAmount"       INTEGER NOT NULL,
    "currency"        TEXT NOT NULL DEFAULT 'usd',
    "status"          TEXT NOT NULL DEFAULT 'COLLECTED',
    "collectedAt"     TIMESTAMP(3) NOT NULL,
    "metadata"        JSONB NOT NULL DEFAULT '{}',
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_fee_records_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "platform_fee_records_stripeSessionId_key" ON "platform_fee_records"("stripeSessionId");
CREATE INDEX IF NOT EXISTS "platform_fee_records_projectId_idx"    ON "platform_fee_records"("projectId");
CREATE INDEX IF NOT EXISTS "platform_fee_records_contractorId_idx" ON "platform_fee_records"("contractorId");

-- CreateTable: failed_syncs
CREATE TABLE IF NOT EXISTS "failed_syncs" (
    "id"          TEXT NOT NULL,
    "service"     TEXT NOT NULL,
    "operation"   TEXT NOT NULL,
    "errorMsg"    TEXT NOT NULL,
    "payload"     JSONB NOT NULL DEFAULT '{}',
    "retryCount"  INTEGER NOT NULL DEFAULT 0,
    "status"      "failed_sync_status" NOT NULL DEFAULT 'PENDING',
    "lastRetryAt" TIMESTAMP(3),
    "recoveredAt" TIMESTAMP(3),
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "failed_syncs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "failed_syncs_status_service_idx" ON "failed_syncs"("status", "service");
CREATE INDEX IF NOT EXISTS "failed_syncs_createdAt_idx"       ON "failed_syncs"("createdAt");
