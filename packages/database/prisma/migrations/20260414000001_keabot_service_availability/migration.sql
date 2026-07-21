-- =============================================================================
-- Migration: 20260414000001_keabot_service_availability
-- =============================================================================
-- Adds:
--   Enums:  LeadStage, RagDocumentType, ServiceRequestType, ServiceRequestStatus,
--           AvailabilityDecision, KealeeServiceCategory, KealeeServiceTierType,
--           ServiceDeliveryMode, CTCPricingBasis
--   Tables: orchestration_gates, orchestration_action_log
--           lead_profiles
--           rag_documents, rag_chunks
--           service_requests, service_capacity_profiles, service_assignments,
--           availability_rules, availability_snapshots, work_queue_metrics,
--           business_calendar
--           kealee_services, kealee_service_tiers, ctc_pricing_snapshots,
--           kealee_service_orders
--           keabot_runs, bot_design_concepts, bot_estimate_line_items, permit_cases
-- =============================================================================

-- ── Enums ─────────────────────────────────────────────────────────────────────

CREATE TYPE "lead_stage" AS ENUM (
  'UNKNOWN', 'AWARENESS', 'CONCEPT', 'DESIGN', 'PERMIT', 'ESTIMATION', 'CHECKOUT', 'HOT'
);

CREATE TYPE "rag_document_type" AS ENUM (
  'PROJECT_DESCRIPTION', 'PERMIT_APPLICATION', 'ESTIMATE', 'INSPECTION_REPORT',
  'JURISDICTION_GUIDE', 'SERVICE_CATALOG', 'CONCEPT_REPORT', 'ZONING_DATA',
  'CONTRACTOR_PROFILE', 'PHASE_NOTE'
);

CREATE TYPE "service_request_type" AS ENUM (
  'AI_CONCEPT', 'PERMIT_SIMPLE', 'PERMIT_PACKAGE', 'PERMIT_COORDINATION',
  'PERMIT_EXPEDITING', 'ESTIMATE_DETAILED', 'ESTIMATE_CERTIFIED',
  'PRE_DESIGN_STARTER', 'PRE_DESIGN_VISUALIZATION', 'PRE_DESIGN_FULL'
);

CREATE TYPE "service_request_status" AS ENUM (
  'PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
);

CREATE TYPE "availability_decision" AS ENUM (
  'GUARANTEED', 'TARGET', 'CONDITIONAL', 'UNAVAILABLE'
);

CREATE TYPE "kealee_service_category" AS ENUM (
  'AI_DESIGN', 'PERMITS', 'ESTIMATION', 'CONSTRUCTION_MGMT', 'SPECIALTY', 'BUNDLE'
);

CREATE TYPE "kealee_service_tier_type" AS ENUM (
  'STARTER', 'STANDARD', 'ADVANCED', 'PREMIUM', 'ENTERPRISE'
);

CREATE TYPE "service_delivery_mode" AS ENUM (
  'DIGITAL', 'STAFF_REVIEW', 'PROFESSIONAL', 'ON_SITE', 'HYBRID'
);

CREATE TYPE "ctc_pricing_basis" AS ENUM (
  'FLAT_FEE', 'PER_SQFT', 'PCT_OF_CTC', 'HOURLY', 'MONTHLY_RETAINER', 'CUSTOM'
);

-- ── Orchestration ─────────────────────────────────────────────────────────────

CREATE TABLE "orchestration_gates" (
    "id"              TEXT NOT NULL,
    "projectId"       TEXT NOT NULL,
    "sessionId"       TEXT,
    "gateType"        TEXT NOT NULL,
    "status"          TEXT NOT NULL DEFAULT 'PENDING',
    "workflowType"    TEXT NOT NULL,
    "decisionPayload" JSONB,
    "reasonCodes"     JSONB,
    "confidenceScore" DOUBLE PRECISION,
    "riskScore"       DOUBLE PRECISION,
    "resolvedBy"      TEXT,
    "resolvedAt"      TIMESTAMP(3),
    "expiresAt"       TIMESTAMP(3),
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "orchestration_gates_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "orchestration_gates_projectId_idx"    ON "orchestration_gates"("projectId");
CREATE INDEX "orchestration_gates_status_idx"       ON "orchestration_gates"("status");
CREATE INDEX "orchestration_gates_gateType_idx"     ON "orchestration_gates"("gateType");
CREATE INDEX "orchestration_gates_workflowType_idx" ON "orchestration_gates"("workflowType");
CREATE INDEX "orchestration_gates_createdAt_idx"    ON "orchestration_gates"("createdAt");

CREATE TABLE "orchestration_action_log" (
    "id"              TEXT NOT NULL,
    "projectId"       TEXT NOT NULL,
    "sessionId"       TEXT,
    "workflowType"    TEXT NOT NULL,
    "actionType"      TEXT NOT NULL,
    "inputPayload"    JSONB,
    "outputPayload"   JSONB,
    "confidenceScore" DOUBLE PRECISION,
    "riskScore"       DOUBLE PRECISION,
    "decision"        TEXT,
    "reasonCodes"     JSONB,
    "approvalGateId"  TEXT,
    "overriddenBy"    TEXT,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "orchestration_action_log_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "orchestration_action_log_projectId_idx"    ON "orchestration_action_log"("projectId");
CREATE INDEX "orchestration_action_log_workflowType_idx" ON "orchestration_action_log"("workflowType");
CREATE INDEX "orchestration_action_log_decision_idx"     ON "orchestration_action_log"("decision");
CREATE INDEX "orchestration_action_log_createdAt_idx"    ON "orchestration_action_log"("createdAt");

-- ── Lead Intelligence ─────────────────────────────────────────────────────────

CREATE TABLE "lead_profiles" (
    "id"                      TEXT NOT NULL,
    "email"                   TEXT,
    "phone"                   TEXT,
    "firstName"               TEXT,
    "lastName"                TEXT,
    "projectType"             TEXT,
    "location"                TEXT,
    "budgetRange"             TEXT,
    "hasPlans"                BOOLEAN,
    "needsPermit"             BOOLEAN,
    "urgencyLevel"            TEXT DEFAULT 'normal',
    "stage"                   "lead_stage" NOT NULL DEFAULT 'UNKNOWN',
    "leadScore"               INTEGER NOT NULL DEFAULT 0,
    "source"                  TEXT,
    "contractorMatchCandidate" BOOLEAN NOT NULL DEFAULT false,
    "lastActivityAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt"               TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"               TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lead_profiles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "lead_profiles_email_key" ON "lead_profiles"("email");
CREATE INDEX "lead_profiles_email_idx"     ON "lead_profiles"("email");
CREATE INDEX "lead_profiles_stage_idx"     ON "lead_profiles"("stage");
CREATE INDEX "lead_profiles_leadScore_idx" ON "lead_profiles"("leadScore");
CREATE INDEX "lead_profiles_createdAt_idx" ON "lead_profiles"("createdAt");

-- ── RAG Document Store ────────────────────────────────────────────────────────

CREATE TABLE "rag_documents" (
    "id"          TEXT NOT NULL,
    "sourceType"  "rag_document_type" NOT NULL,
    "sourceId"    TEXT NOT NULL,
    "title"       TEXT NOT NULL,
    "content"     TEXT NOT NULL,
    "jurisdiction" TEXT,
    "serviceType" TEXT,
    "phase"       TEXT,
    "projectId"   TEXT,
    "chunkCount"  INTEGER NOT NULL DEFAULT 0,
    "lastIndexed" TIMESTAMP(3),
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "rag_documents_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "rag_documents_sourceType_sourceId_idx" ON "rag_documents"("sourceType", "sourceId");
CREATE INDEX "rag_documents_jurisdiction_idx"        ON "rag_documents"("jurisdiction");
CREATE INDEX "rag_documents_serviceType_idx"         ON "rag_documents"("serviceType");
CREATE INDEX "rag_documents_projectId_idx"           ON "rag_documents"("projectId");

CREATE TABLE "rag_chunks" (
    "id"         TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "content"    TEXT NOT NULL,
    "embedding"  DOUBLE PRECISION[],
    "tokenCount" INTEGER NOT NULL DEFAULT 0,
    "metadata"   JSONB NOT NULL DEFAULT '{}',
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "rag_chunks_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "rag_chunks_documentId_idx" ON "rag_chunks"("documentId");
ALTER TABLE "rag_chunks" ADD CONSTRAINT "rag_chunks_documentId_fkey"
    FOREIGN KEY ("documentId") REFERENCES "rag_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── Service Availability Engine ───────────────────────────────────────────────

CREATE TABLE "service_requests" (
    "id"             TEXT NOT NULL,
    "serviceType"    "service_request_type" NOT NULL,
    "status"         "service_request_status" NOT NULL DEFAULT 'PENDING',
    "submittedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt"    TIMESTAMP(3),
    "jurisdiction"   TEXT,
    "projectType"    TEXT,
    "hasDocuments"   BOOLEAN NOT NULL DEFAULT false,
    "documentCount"  INTEGER NOT NULL DEFAULT 0,
    "difficultyScore" INTEGER NOT NULL DEFAULT 0,
    "priorityScore"  INTEGER NOT NULL DEFAULT 0,
    "intakeId"       TEXT,
    "permitLeadId"   TEXT,
    "userId"         TEXT,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "service_requests_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "service_requests_serviceType_status_idx" ON "service_requests"("serviceType", "status");
CREATE INDEX "service_requests_submittedAt_idx"        ON "service_requests"("submittedAt");
CREATE INDEX "service_requests_jurisdiction_idx"       ON "service_requests"("jurisdiction");

CREATE TABLE "service_capacity_profiles" (
    "id"              TEXT NOT NULL,
    "serviceType"     "service_request_type" NOT NULL,
    "dailyCapacity"   INTEGER NOT NULL,
    "currentQueue"    INTEGER NOT NULL DEFAULT 0,
    "avgHours"        DOUBLE PRECISION NOT NULL,
    "guaranteedHours" DOUBLE PRECISION,
    "sameDayEligible" BOOLEAN NOT NULL DEFAULT false,
    "cutoffHour"      INTEGER NOT NULL DEFAULT 14,
    "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "service_capacity_profiles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "service_capacity_profiles_serviceType_key" ON "service_capacity_profiles"("serviceType");

CREATE TABLE "service_assignments" (
    "id"          TEXT NOT NULL,
    "requestId"   TEXT NOT NULL,
    "assigneeId"  TEXT,
    "assigneeType" TEXT NOT NULL DEFAULT 'staff',
    "assignedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt"   TIMESTAMP(3),
    "dueAt"       TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "notes"       TEXT,
    CONSTRAINT "service_assignments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "service_assignments_requestId_key" ON "service_assignments"("requestId");
ALTER TABLE "service_assignments" ADD CONSTRAINT "service_assignments_requestId_fkey"
    FOREIGN KEY ("requestId") REFERENCES "service_requests"("id") ON UPDATE CASCADE;

CREATE TABLE "availability_rules" (
    "id"            TEXT NOT NULL,
    "serviceType"   "service_request_type" NOT NULL,
    "name"          TEXT NOT NULL,
    "priority"      INTEGER NOT NULL DEFAULT 0,
    "condition"     JSONB NOT NULL,
    "outcome"       "availability_decision" NOT NULL,
    "hoursOverride" DOUBLE PRECISION,
    "rationale"     TEXT NOT NULL,
    "isActive"      BOOLEAN NOT NULL DEFAULT true,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "availability_rules_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "availability_rules_serviceType_isActive_idx" ON "availability_rules"("serviceType", "isActive");

CREATE TABLE "availability_snapshots" (
    "id"              TEXT NOT NULL,
    "requestId"       TEXT,
    "serviceType"     "service_request_type" NOT NULL,
    "decision"        "availability_decision" NOT NULL,
    "promisedStartAt" TIMESTAMP(3) NOT NULL,
    "promisedEndAt"   TIMESTAMP(3) NOT NULL,
    "sameDayEligible" BOOLEAN NOT NULL DEFAULT false,
    "confidenceScore" INTEGER NOT NULL,
    "rationale"       TEXT NOT NULL,
    "explanation"     TEXT NOT NULL,
    "conditions"      JSONB NOT NULL DEFAULT '[]',
    "calculatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "availability_snapshots_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "availability_snapshots_serviceType_idx"  ON "availability_snapshots"("serviceType");
CREATE INDEX "availability_snapshots_requestId_idx"    ON "availability_snapshots"("requestId");
CREATE INDEX "availability_snapshots_calculatedAt_idx" ON "availability_snapshots"("calculatedAt");
ALTER TABLE "availability_snapshots" ADD CONSTRAINT "availability_snapshots_requestId_fkey"
    FOREIGN KEY ("requestId") REFERENCES "service_requests"("id") ON UPDATE CASCADE;

CREATE TABLE "work_queue_metrics" (
    "id"             TEXT NOT NULL,
    "serviceType"    "service_request_type" NOT NULL,
    "queueDepth"     INTEGER NOT NULL,
    "avgWaitHours"   DOUBLE PRECISION NOT NULL,
    "completedToday" INTEGER NOT NULL DEFAULT 0,
    "slaBreaches"    INTEGER NOT NULL DEFAULT 0,
    "recordedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "work_queue_metrics_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "work_queue_metrics_serviceType_recordedAt_idx" ON "work_queue_metrics"("serviceType", "recordedAt");

CREATE TABLE "business_calendar" (
    "id"          TEXT NOT NULL,
    "date"        DATE NOT NULL,
    "isWorkday"   BOOLEAN NOT NULL DEFAULT true,
    "isHoliday"   BOOLEAN NOT NULL DEFAULT false,
    "holidayName" TEXT,
    "timezone"    TEXT NOT NULL DEFAULT 'America/New_York',
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "business_calendar_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "business_calendar_date_timezone_key" ON "business_calendar"("date", "timezone");
CREATE INDEX "business_calendar_date_idx" ON "business_calendar"("date");

-- ── Kealee Service Catalog ────────────────────────────────────────────────────

CREATE TABLE "kealee_services" (
    "id"                   TEXT NOT NULL,
    "slug"                 TEXT NOT NULL,
    "name"                 TEXT NOT NULL,
    "tagline"              TEXT NOT NULL,
    "category"             "kealee_service_category" NOT NULL,
    "deliveryMode"         "service_delivery_mode" NOT NULL,
    "pricingBasis"         "ctc_pricing_basis" NOT NULL,
    "basePriceCents"       INTEGER,
    "maxPriceCents"        INTEGER,
    "ctcBasisProjectType"  TEXT,
    "ctcBasisSqft"         INTEGER,
    "ctcTotalMinCents"     INTEGER,
    "ctcTotalMaxCents"     INTEGER,
    "deliveryHoursMin"     DOUBLE PRECISION,
    "deliveryHoursMax"     DOUBLE PRECISION,
    "staffRateUsd"         DOUBLE PRECISION,
    "cogsMinCents"         INTEGER,
    "cogsMaxCents"         INTEGER,
    "ragAgents"            TEXT[],
    "conversionProduct"    TEXT,
    "turnaroundDaysMin"    INTEGER,
    "turnaroundDaysMax"    INTEGER,
    "isBundle"             BOOLEAN NOT NULL DEFAULT false,
    "isMostPopular"        BOOLEAN NOT NULL DEFAULT false,
    "isActive"             BOOLEAN NOT NULL DEFAULT true,
    "isVisible"            BOOLEAN NOT NULL DEFAULT true,
    "stripeEnvVar"         TEXT,
    "permitRequired"       TEXT,
    "forWho"               TEXT,
    "notes"                TEXT,
    "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "kealee_services_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "kealee_services_slug_key"          ON "kealee_services"("slug");
CREATE INDEX "kealee_services_category_idx"             ON "kealee_services"("category");
CREATE INDEX "kealee_services_slug_idx"                 ON "kealee_services"("slug");
CREATE INDEX "kealee_services_isActive_isVisible_idx"   ON "kealee_services"("isActive", "isVisible");

CREATE TABLE "kealee_service_tiers" (
    "id"                  TEXT NOT NULL,
    "serviceId"           TEXT NOT NULL,
    "tierType"            "kealee_service_tier_type" NOT NULL,
    "name"                TEXT NOT NULL,
    "description"         TEXT,
    "priceCents"          INTEGER,
    "priceMinCents"       INTEGER,
    "priceMaxCents"       INTEGER,
    "cogsLaborHours"      DOUBLE PRECISION,
    "cogsLaborRateUsd"    DOUBLE PRECISION,
    "cogsLaborCents"      INTEGER,
    "cogsOverheadCents"   INTEGER,
    "cogsTotalCents"      INTEGER,
    "grossMarginPct"      DOUBLE PRECISION,
    "projectCtcMinCents"  INTEGER,
    "projectCtcMaxCents"  INTEGER,
    "kealeeAsPctOfCtc"    DOUBLE PRECISION,
    "turnaroundDays"      INTEGER,
    "roundsIncluded"      INTEGER,
    "isPopular"           BOOLEAN NOT NULL DEFAULT false,
    "isActive"            BOOLEAN NOT NULL DEFAULT true,
    "stripeEnvVar"        TEXT,
    "ctaLabel"            TEXT,
    "intakeHref"          TEXT,
    "includes"            JSONB,
    "sortOrder"           INTEGER NOT NULL DEFAULT 0,
    "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "kealee_service_tiers_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "kealee_service_tiers_serviceId_idx" ON "kealee_service_tiers"("serviceId");
CREATE INDEX "kealee_service_tiers_tierType_idx"  ON "kealee_service_tiers"("tierType");
CREATE INDEX "kealee_service_tiers_isActive_idx"  ON "kealee_service_tiers"("isActive");
ALTER TABLE "kealee_service_tiers" ADD CONSTRAINT "kealee_service_tiers_serviceId_fkey"
    FOREIGN KEY ("serviceId") REFERENCES "kealee_services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ctc_pricing_snapshots" (
    "id"                 TEXT NOT NULL,
    "serviceId"          TEXT NOT NULL,
    "tierId"             TEXT,
    "projectType"        TEXT NOT NULL,
    "jurisdiction"       TEXT NOT NULL DEFAULT 'Montgomery County, MD',
    "representativeSqft" INTEGER NOT NULL,
    "hardCostBase"       DOUBLE PRECISION NOT NULL,
    "inflationFactor"    DOUBLE PRECISION NOT NULL DEFAULT 1.13,
    "hardCost2026"       DOUBLE PRECISION NOT NULL,
    "costPerSqft2026"    DOUBLE PRECISION NOT NULL,
    "softCost"           DOUBLE PRECISION NOT NULL,
    "riskCost"           DOUBLE PRECISION NOT NULL,
    "executionCost"      DOUBLE PRECISION NOT NULL,
    "totalCTC"           DOUBLE PRECISION NOT NULL,
    "ctcRangeLow"        DOUBLE PRECISION NOT NULL,
    "ctcRangeHigh"       DOUBLE PRECISION NOT NULL,
    "deliveryHours"      DOUBLE PRECISION,
    "deliveryRateUsd"    DOUBLE PRECISION,
    "cogsTotalUsd"       DOUBLE PRECISION,
    "kaleePriceUsd"      DOUBLE PRECISION,
    "grossMarginPct"     DOUBLE PRECISION,
    "kaleePctOfCtc"      DOUBLE PRECISION,
    "inflationNote"      TEXT,
    "dataSource"         TEXT NOT NULL DEFAULT 'RAG-DMV-2026',
    "computedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ctc_pricing_snapshots_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ctc_pricing_snapshots_tierId_key" ON "ctc_pricing_snapshots"("tierId");
CREATE INDEX "ctc_pricing_snapshots_serviceId_idx"    ON "ctc_pricing_snapshots"("serviceId");
CREATE INDEX "ctc_pricing_snapshots_projectType_idx"  ON "ctc_pricing_snapshots"("projectType");
ALTER TABLE "ctc_pricing_snapshots" ADD CONSTRAINT "ctc_pricing_snapshots_serviceId_fkey"
    FOREIGN KEY ("serviceId") REFERENCES "kealee_services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ctc_pricing_snapshots" ADD CONSTRAINT "ctc_pricing_snapshots_tierId_fkey"
    FOREIGN KEY ("tierId") REFERENCES "kealee_service_tiers"("id") ON UPDATE CASCADE;

CREATE TABLE "kealee_service_orders" (
    "id"                      TEXT NOT NULL,
    "serviceId"               TEXT NOT NULL,
    "tierId"                  TEXT,
    "userId"                  TEXT,
    "projectId"               TEXT,
    "orderNumber"             TEXT NOT NULL,
    "status"                  TEXT NOT NULL DEFAULT 'PENDING',
    "priceCents"              INTEGER NOT NULL,
    "currency"                TEXT NOT NULL DEFAULT 'USD',
    "stripePaymentIntentId"   TEXT,
    "stripeSessionId"         TEXT,
    "paidAt"                  TIMESTAMP(3),
    "deliveredAt"             TIMESTAMP(3),
    "deliveryUrl"             TEXT,
    "assignedTo"              TEXT,
    "jurisdiction"            TEXT,
    "projectType"             TEXT,
    "sqft"                    INTEGER,
    "address"                 TEXT,
    "ctcSnapshot"             JSONB,
    "clientNotes"             TEXT,
    "internalNotes"           TEXT,
    "createdAt"               TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"               TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "kealee_service_orders_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "kealee_service_orders_orderNumber_key" ON "kealee_service_orders"("orderNumber");
CREATE INDEX "kealee_service_orders_serviceId_idx"    ON "kealee_service_orders"("serviceId");
CREATE INDEX "kealee_service_orders_tierId_idx"       ON "kealee_service_orders"("tierId");
CREATE INDEX "kealee_service_orders_userId_idx"       ON "kealee_service_orders"("userId");
CREATE INDEX "kealee_service_orders_projectId_idx"    ON "kealee_service_orders"("projectId");
CREATE INDEX "kealee_service_orders_status_idx"       ON "kealee_service_orders"("status");
CREATE INDEX "kealee_service_orders_orderNumber_idx"  ON "kealee_service_orders"("orderNumber");
ALTER TABLE "kealee_service_orders" ADD CONSTRAINT "kealee_service_orders_serviceId_fkey"
    FOREIGN KEY ("serviceId") REFERENCES "kealee_services"("id") ON UPDATE CASCADE;
ALTER TABLE "kealee_service_orders" ADD CONSTRAINT "kealee_service_orders_tierId_fkey"
    FOREIGN KEY ("tierId") REFERENCES "kealee_service_tiers"("id") ON UPDATE CASCADE;

-- ── KeaBot Chain Models ───────────────────────────────────────────────────────

CREATE TABLE "keabot_runs" (
    "id"               TEXT NOT NULL,
    "projectId"        TEXT NOT NULL,
    "botType"          TEXT NOT NULL,
    "status"           TEXT NOT NULL DEFAULT 'PENDING',
    "chainOrder"       INTEGER NOT NULL DEFAULT 1,
    "parentRunId"      TEXT,
    "inputData"        JSONB NOT NULL,
    "outputData"       JSONB,
    "modelUsed"        TEXT,
    "inputTokens"      INTEGER,
    "outputTokens"     INTEGER,
    "cacheMetrics"     JSONB,
    "estimatedCostUsd" DOUBLE PRECISION,
    "startedAt"        TIMESTAMP(3),
    "completedAt"      TIMESTAMP(3),
    "durationMs"       INTEGER,
    "errorMessage"     TEXT,
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "keabot_runs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "keabot_runs_projectId_idx"   ON "keabot_runs"("projectId");
CREATE INDEX "keabot_runs_botType_idx"     ON "keabot_runs"("botType");
CREATE INDEX "keabot_runs_status_idx"      ON "keabot_runs"("status");
CREATE INDEX "keabot_runs_parentRunId_idx" ON "keabot_runs"("parentRunId");

CREATE TABLE "bot_design_concepts" (
    "id"                      TEXT NOT NULL,
    "projectId"               TEXT NOT NULL,
    "botRunId"                TEXT NOT NULL,
    "projectType"             TEXT NOT NULL,
    "scope"                   TEXT,
    "location"                TEXT,
    "sqft"                    INTEGER,
    "budgetUsd"               DOUBLE PRECISION,
    "mepSystem"               JSONB NOT NULL,
    "bom"                     JSONB NOT NULL,
    "aiConceptCostUsd"        DOUBLE PRECISION NOT NULL,
    "estimatedTotalCostUsd"   DOUBLE PRECISION NOT NULL,
    "ctcBreakdown"            JSONB,
    "bomItemCount"            INTEGER NOT NULL DEFAULT 0,
    "createdAt"               TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bot_design_concepts_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "bot_design_concepts_botRunId_key" ON "bot_design_concepts"("botRunId");
CREATE INDEX "bot_design_concepts_projectId_idx" ON "bot_design_concepts"("projectId");
ALTER TABLE "bot_design_concepts" ADD CONSTRAINT "bot_design_concepts_botRunId_fkey"
    FOREIGN KEY ("botRunId") REFERENCES "keabot_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "bot_estimate_line_items" (
    "id"              TEXT NOT NULL,
    "projectId"       TEXT NOT NULL,
    "botRunId"        TEXT NOT NULL,
    "category"        TEXT NOT NULL,
    "description"     TEXT NOT NULL,
    "csiCode"         TEXT,
    "ctcTaskNumber"   TEXT,
    "quantity"        DOUBLE PRECISION NOT NULL,
    "unit"            TEXT NOT NULL,
    "unitCost"        DOUBLE PRECISION NOT NULL,
    "inflationFactor" DOUBLE PRECISION NOT NULL DEFAULT 1.13,
    "subtotal"        DOUBLE PRECISION NOT NULL,
    "laborHours"      DOUBLE PRECISION,
    "laborRate"       DOUBLE PRECISION,
    "sortOrder"       INTEGER NOT NULL DEFAULT 0,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bot_estimate_line_items_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "bot_estimate_line_items_projectId_idx" ON "bot_estimate_line_items"("projectId");
CREATE INDEX "bot_estimate_line_items_botRunId_idx"  ON "bot_estimate_line_items"("botRunId");
CREATE INDEX "bot_estimate_line_items_category_idx"  ON "bot_estimate_line_items"("category");
ALTER TABLE "bot_estimate_line_items" ADD CONSTRAINT "bot_estimate_line_items_botRunId_fkey"
    FOREIGN KEY ("botRunId") REFERENCES "keabot_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "permit_cases" (
    "id"                    TEXT NOT NULL,
    "projectId"             TEXT NOT NULL,
    "botRunId"              TEXT NOT NULL,
    "zipCode"               TEXT NOT NULL,
    "jurisdiction"          TEXT NOT NULL,
    "state"                 TEXT NOT NULL,
    "county"                TEXT,
    "city"                  TEXT,
    "permits"               JSONB NOT NULL,
    "totalPermitCostUsd"    DOUBLE PRECISION NOT NULL,
    "totalProcessingDays"   INTEGER NOT NULL,
    "status"                TEXT NOT NULL DEFAULT 'IDENTIFIED',
    "jurisdictionCacheHit"  BOOLEAN NOT NULL DEFAULT false,
    "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "permit_cases_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "permit_cases_botRunId_key"      ON "permit_cases"("botRunId");
CREATE INDEX "permit_cases_projectId_idx"             ON "permit_cases"("projectId");
CREATE INDEX "permit_cases_jurisdiction_idx"          ON "permit_cases"("jurisdiction");
CREATE INDEX "permit_cases_zipCode_idx"               ON "permit_cases"("zipCode");
ALTER TABLE "permit_cases" ADD CONSTRAINT "permit_cases_botRunId_fkey"
    FOREIGN KEY ("botRunId") REFERENCES "keabot_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
