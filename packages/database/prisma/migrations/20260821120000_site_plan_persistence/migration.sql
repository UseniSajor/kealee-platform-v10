-- Site Plan Engine — persistence for survey ingestion, evidence, QC and issuance
--
-- Completes the durable record behind the engine: survey imports and their
-- provenance, reconciliation discrepancies, the evidence ledger that gates
-- issuance blocks, content-scoped professional approvals, checklist results,
-- QC findings, sheet revisions, issuance status, and one append-only audit
-- stream over all of it.
--
-- ADDITIVE AND NON-DESTRUCTIVE. Creates types and tables only. Drops nothing,
-- alters no existing column, rewrites no existing row. Every statement is
-- IF NOT EXISTS or guarded, so it is safe to re-run.

-- ── Enums ───────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "SurveyImportFormat" AS ENUM ('CSV','LANDXML','DXF','DWG','LAS','LAZ','PDF','GEOJSON','SHAPEFILE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "SurveyVerificationStatus" AS ENUM ('UNVERIFIED','CANDIDATE_CRS_PENDING_CONFIRMATION','CONFIRMED','PROFESSIONALLY_CERTIFIED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "SurveySealEvidence" AS ENUM ('DOCUMENT_REVIEWED','DECLARED_BY_UPLOADER','NONE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "DiscrepancySeverity" AS ENUM ('INFORMATIONAL','WARNING','BLOCKING');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "DiscrepancyStatus" AS ENUM ('OPEN','ACKNOWLEDGED','RESOLVED','WAIVED','SUPERSEDED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "SitePlanEvidenceKind" AS ENUM (
    'CERTIFIED_SURVEY_FILE','SURVEYOR_LICENCE_VERIFICATION','SEAL_DOCUMENT_REVIEW','BENCHMARK_RECORD',
    'VERTICAL_DATUM_STATEMENT','UNIT_CHECK','TRANSFORMATION_RECORD','TITLE_REPORT','GEOTECHNICAL_REPORT',
    'ARCHITECTURAL_FOOTPRINT','UTILITY_FIELD_LOCATION');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "SitePlanContentSubject" AS ENUM (
    'BOUNDARY_DETERMINATION','TOPOGRAPHIC_SURVEY','EASEMENT_DEPICTION','EXISTING_IMPROVEMENTS',
    'ZONING_COMPLIANCE','SITE_LAYOUT','GRADING_DESIGN','STORMWATER_DESIGN','SEDIMENT_CONTROL',
    'UTILITY_DESIGN','ROADWAY_DESIGN','DEMOLITION','PLANTING_DESIGN','TREE_CONSERVATION',
    'ARCHITECTURAL_FOOTPRINT','GEOTECHNICAL','ENTITLEMENT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "QcFindingSeverity" AS ENUM ('WARNING','BLOCKING');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "QcFindingStatus" AS ENUM ('OPEN','CLEARED_BY_EVIDENCE','WAIVED','SUPERSEDED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "SheetIssuanceStatus" AS ENUM ('PRELIMINARY','FOR_REVIEW','PERMIT_SET','NOT_FOR_CONSTRUCTION');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ChecklistItemStatus" AS ENUM ('OUTSTANDING','SATISFIED','NOT_APPLICABLE','PENDING_JURISDICTION');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Survey imports ──────────────────────────────────────────────────────────
-- One row per uploaded file. `crs` is the CONFIRMED system; `candidateCrs` is a
-- detection awaiting confirmation. They are separate columns on purpose: the
-- whole point is that a guess never silently becomes a fact.

CREATE TABLE IF NOT EXISTS "survey_imports" (
  "id"                       TEXT PRIMARY KEY,
  "organizationId"           TEXT NOT NULL,
  "workflowId"               TEXT,
  "projectId"                TEXT,
  "siteId"                   TEXT,
  "originalFilename"         TEXT NOT NULL,
  "checksum"                 TEXT NOT NULL,
  "format"                   "SurveyImportFormat" NOT NULL,
  "storageDocumentId"        TEXT,
  "uploadedAt"               TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "uploadedById"             TEXT,
  -- Date the survey was PERFORMED. Never defaulted from uploadedAt.
  "surveyDate"               DATE,
  "surveyorName"             TEXT,
  "surveyorLicenceNumber"    TEXT,
  "surveyorLicenceState"     TEXT,
  "surveyorLicenceVerifiedAt" TIMESTAMP(3),
  "sealed"                   BOOLEAN NOT NULL DEFAULT false,
  "sealEvidence"             "SurveySealEvidence" NOT NULL DEFAULT 'NONE',
  "sealSignedAt"             TIMESTAMP(3),
  "crs"                      TEXT,
  "candidateCrs"             TEXT,
  "crsConfirmedById"         TEXT,
  "crsConfirmedAt"           TIMESTAMP(3),
  "horizontalDatum"          TEXT,
  "verticalDatum"            TEXT,
  "coordinateUnit"           TEXT,
  "benchmark"                JSONB,
  "transformationPipeline"   JSONB NOT NULL DEFAULT '[]'::jsonb,
  "parserVersion"            TEXT NOT NULL,
  "sourceGeometryCount"      INTEGER NOT NULL DEFAULT 0,
  "normalizedGeometryCount"  INTEGER NOT NULL DEFAULT 0,
  "confidence"               DECIMAL(5,4) NOT NULL DEFAULT 0,
  "verificationStatus"       "SurveyVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
  "reliabilityLevel"         INTEGER NOT NULL DEFAULT 0,
  "levelRationale"           TEXT NOT NULL,
  "warnings"                 JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Raw parsed payload, retained so a reparse under a later parser version is
  -- comparable against what this version produced.
  "parsedPayload"            JSONB,
  "supersededById"           TEXT,
  "createdAt"                TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"                TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "survey_imports_checksum" ON "survey_imports"("organizationId","checksum");
CREATE INDEX IF NOT EXISTS "survey_imports_workflow_idx" ON "survey_imports"("workflowId","uploadedAt");
CREATE INDEX IF NOT EXISTS "survey_imports_status_idx" ON "survey_imports"("verificationStatus","reliabilityLevel");

-- Survey points, kept as rows rather than a JSON blob so a point can be cited,
-- queried and corrected individually.
CREATE TABLE IF NOT EXISTS "survey_points" (
  "id"             TEXT PRIMARY KEY,
  "importId"       TEXT NOT NULL,
  "pointId"        TEXT NOT NULL,
  "northing"       DOUBLE PRECISION NOT NULL,
  "easting"        DOUBLE PRECISION NOT NULL,
  "elevation"      DOUBLE PRECISION,
  -- Raw field description, preserved verbatim alongside the derived class.
  "description"    TEXT NOT NULL DEFAULT '',
  "classification" TEXT NOT NULL DEFAULT 'unclassified',
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "survey_points_import_idx" ON "survey_points"("importId","classification");
CREATE UNIQUE INDEX IF NOT EXISTS "survey_points_identity" ON "survey_points"("importId","pointId");

-- ── Reconciliation discrepancies ────────────────────────────────────────────
-- Certified geometry is never adjusted to close one of these. A discrepancy is
-- resolved by a professional, not by the engine.

CREATE TABLE IF NOT EXISTS "survey_discrepancies" (
  "id"               TEXT PRIMARY KEY,
  "workflowId"       TEXT,
  "importId"         TEXT,
  "runId"            TEXT NOT NULL,
  "code"             TEXT NOT NULL,
  "severity"         "DiscrepancySeverity" NOT NULL,
  "status"           "DiscrepancyStatus" NOT NULL DEFAULT 'OPEN',
  "subject"          TEXT NOT NULL,
  "surveyValue"      TEXT NOT NULL,
  "comparisonValue"  TEXT NOT NULL,
  "delta"            TEXT NOT NULL,
  "tolerance"        TEXT NOT NULL,
  -- Survey-coordinate location so the finding can be mapped on the sheet.
  "locationNorthing" DOUBLE PRECISION,
  "locationEasting"  DOUBLE PRECISION,
  "interpretation"   TEXT NOT NULL,
  "resolution"       TEXT NOT NULL,
  "resolvedById"     TEXT,
  "resolvedAt"       TIMESTAMP(3),
  "resolutionNote"   TEXT,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "survey_discrepancies_run_idx" ON "survey_discrepancies"("runId","severity");
CREATE INDEX IF NOT EXISTS "survey_discrepancies_open_idx" ON "survey_discrepancies"("workflowId","status","severity");

-- The reconciliation run itself, so a discrepancy set is reproducible: same
-- inputs, same tolerances, same parser and calculation versions.
CREATE TABLE IF NOT EXISTS "survey_reconciliation_runs" (
  "id"               TEXT PRIMARY KEY,
  "workflowId"       TEXT,
  "importId"         TEXT,
  "twinRevision"     INTEGER NOT NULL,
  "tolerances"       JSONB NOT NULL,
  "comparisonSources" JSONB NOT NULL,
  "blockingCount"    INTEGER NOT NULL DEFAULT 0,
  "warningCount"     INTEGER NOT NULL DEFAULT 0,
  -- Always false. Stored so the guarantee is a persisted fact, not a claim in a
  -- code comment.
  "geometryAltered"  BOOLEAN NOT NULL DEFAULT false,
  "summary"          TEXT NOT NULL,
  "engineVersion"    TEXT NOT NULL,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "survey_reconciliation_runs_workflow_idx" ON "survey_reconciliation_runs"("workflowId","createdAt");

-- ── Evidence ledger ─────────────────────────────────────────────────────────
-- What clears an issuance block. Approval alone never does.

CREATE TABLE IF NOT EXISTS "site_plan_evidence" (
  "id"                    TEXT PRIMARY KEY,
  "workflowId"            TEXT NOT NULL,
  "kind"                  "SitePlanEvidenceKind" NOT NULL,
  "reference"             TEXT NOT NULL,
  "storageDocumentId"     TEXT,
  "checksum"              TEXT,
  "attachedAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "attachedById"          TEXT NOT NULL,
  "attestedByName"        TEXT,
  "attestedByLicence"     TEXT,
  "attestedByDiscipline"  TEXT,
  "attestedByState"       TEXT,
  "notes"                 TEXT,
  "revokedAt"             TIMESTAMP(3),
  "revokedById"           TEXT,
  "revokedReason"         TEXT,
  "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "site_plan_evidence_kind_idx" ON "site_plan_evidence"("workflowId","kind","revokedAt");

-- ── Content-scoped approvals ────────────────────────────────────────────────
-- A professional signs a SUBJECT once, across every sheet it appears on. A
-- sheet is not owned by one profession; the title block divides responsibility.

CREATE TABLE IF NOT EXISTS "site_plan_scoped_approvals" (
  "id"              TEXT PRIMARY KEY,
  "workflowId"      TEXT NOT NULL,
  "subject"         "SitePlanContentSubject" NOT NULL,
  "discipline"      TEXT NOT NULL,
  "appearsOnSheets" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "objectIds"       JSONB NOT NULL DEFAULT '[]'::jsonb,
  "decision"        "ProfessionalReviewDecision" NOT NULL DEFAULT 'PENDING',
  "decidedById"     TEXT,
  "decidedByName"   TEXT,
  "licenceNumber"   TEXT,
  "licenceState"    TEXT,
  "decidedAt"       TIMESTAMP(3),
  "comment"         TEXT,
  -- Binds the decision to the exact model revision that was reviewed.
  "twinRevision"    INTEGER,
  "contentHash"     TEXT,
  "reviewRecordId"  TEXT,
  "supersededById"  TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "site_plan_scoped_approvals_subject"
  ON "site_plan_scoped_approvals"("workflowId","subject") WHERE "supersededById" IS NULL;
CREATE INDEX IF NOT EXISTS "site_plan_scoped_approvals_decision_idx"
  ON "site_plan_scoped_approvals"("workflowId","decision");

-- ── County checklist results ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "site_plan_checklist_results" (
  "id"               TEXT PRIMARY KEY,
  "workflowId"       TEXT NOT NULL,
  "itemKey"          TEXT NOT NULL,
  "label"            TEXT NOT NULL,
  "citation"         TEXT,
  "ruleVersionId"    TEXT,
  "status"           "ChecklistItemStatus" NOT NULL DEFAULT 'OUTSTANDING',
  "detail"           TEXT,
  "evidenceId"       TEXT,
  "satisfiedAt"      TIMESTAMP(3),
  "satisfiedById"    TEXT,
  "notApplicableReason" TEXT,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "site_plan_checklist_results_item" ON "site_plan_checklist_results"("workflowId","itemKey");
CREATE INDEX IF NOT EXISTS "site_plan_checklist_results_status_idx" ON "site_plan_checklist_results"("workflowId","status");

-- ── Issuance QC findings ────────────────────────────────────────────────────
-- `clearedByEvidenceId` is the whole point: a block that cleared must name the
-- evidence that cleared it, so the clearance can be audited or withdrawn.

CREATE TABLE IF NOT EXISTS "site_plan_qc_findings" (
  "id"                   TEXT PRIMARY KEY,
  "workflowId"           TEXT NOT NULL,
  "runId"                TEXT NOT NULL,
  "code"                 TEXT NOT NULL,
  "severity"             "QcFindingSeverity" NOT NULL,
  "status"               "QcFindingStatus" NOT NULL DEFAULT 'OPEN',
  "message"              TEXT NOT NULL,
  "remedy"               TEXT NOT NULL,
  "outstanding"          JSONB NOT NULL DEFAULT '[]'::jsonb,
  "retainedLevelExplanation" TEXT,
  "clearedByEvidenceId"  TEXT,
  "clearedByApprovalId"  TEXT,
  "clearedAt"            TIMESTAMP(3),
  "twinRevision"         INTEGER,
  "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "site_plan_qc_findings_run_idx" ON "site_plan_qc_findings"("runId","severity");
CREATE INDEX IF NOT EXISTS "site_plan_qc_findings_open_idx" ON "site_plan_qc_findings"("workflowId","status","severity");

-- ── Sheets, revisions and issuance ──────────────────────────────────────────
-- Sheets are composed dynamically: `sheetNumber` is the number in the issued
-- set and `covers` lists the canonical content it carries, so a two-sheet
-- infill package is a first-class outcome rather than a missing set.

CREATE TABLE IF NOT EXISTS "site_plan_sheets" (
  "id"                 TEXT PRIMARY KEY,
  "workflowId"         TEXT NOT NULL,
  "sheetNumber"        TEXT NOT NULL,
  "title"              TEXT NOT NULL,
  "covers"             JSONB NOT NULL DEFAULT '[]'::jsonb,
  "status"             "SheetIssuanceStatus" NOT NULL DEFAULT 'PRELIMINARY',
  "scaleFtPerIn"       INTEGER,
  "scaleLabel"         TEXT,
  "sheetSize"          TEXT,
  "disclosure"         TEXT,
  "responsibilityBlock" JSONB,
  "currentRevision"    INTEGER NOT NULL DEFAULT 0,
  "twinRevision"       INTEGER NOT NULL DEFAULT 0,
  "documentId"         TEXT,
  "contentHash"        TEXT,
  "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "site_plan_sheets_number" ON "site_plan_sheets"("workflowId","sheetNumber");
CREATE INDEX IF NOT EXISTS "site_plan_sheets_status_idx" ON "site_plan_sheets"("workflowId","status");

CREATE TABLE IF NOT EXISTS "site_plan_sheet_revisions" (
  "id"                 TEXT PRIMARY KEY,
  "sheetId"            TEXT NOT NULL,
  "workflowId"         TEXT NOT NULL,
  "revisionNumber"     INTEGER NOT NULL,
  "revisionDate"       DATE NOT NULL,
  "description"        TEXT NOT NULL,
  "issuedBy"           TEXT NOT NULL,
  "statusBefore"       "SheetIssuanceStatus",
  "statusAfter"        "SheetIssuanceStatus" NOT NULL,
  "twinRevisionBefore" INTEGER,
  "twinRevisionAfter"  INTEGER NOT NULL,
  -- What changed and what it means, as shown to the reviewer.
  "changes"            JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Superseded object ids, retained rather than deleted from the model.
  "supersededObjectIds" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "documentId"         TEXT,
  "contentHash"        TEXT,
  "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "site_plan_sheet_revisions_number" ON "site_plan_sheet_revisions"("sheetId","revisionNumber");
CREATE INDEX IF NOT EXISTS "site_plan_sheet_revisions_workflow_idx" ON "site_plan_sheet_revisions"("workflowId","createdAt");

CREATE TABLE IF NOT EXISTS "site_plan_issuance" (
  "id"                    TEXT PRIMARY KEY,
  "workflowId"            TEXT NOT NULL,
  "status"                "SheetIssuanceStatus" NOT NULL DEFAULT 'PRELIMINARY',
  "governingReliabilityLevel" INTEGER NOT NULL DEFAULT 0,
  "disclosure"            TEXT,
  "issuable"              BOOLEAN NOT NULL DEFAULT false,
  "blockingFindingCount"  INTEGER NOT NULL DEFAULT 0,
  "qcRunId"               TEXT,
  "sheetCount"            INTEGER NOT NULL DEFAULT 0,
  "compositionRationale"  TEXT,
  "issuedAt"              TIMESTAMP(3),
  "issuedById"            TEXT,
  -- Set only when a jurisdiction actually acts. Never inferred from internal state.
  "submittedAt"           TIMESTAMP(3),
  "jurisdictionReference" TEXT,
  "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "site_plan_issuance_workflow" ON "site_plan_issuance"("workflowId");

-- ── Audit history ───────────────────────────────────────────────────────────
-- Append-only. One stream over every table above, so "who changed what, when,
-- and on what basis" is answerable without reconstructing it from timestamps.

CREATE TABLE IF NOT EXISTS "site_plan_audit_events" (
  "id"            TEXT PRIMARY KEY,
  "workflowId"    TEXT NOT NULL,
  "sequence"      BIGSERIAL NOT NULL,
  "occurredAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "actorId"       TEXT,
  "actorType"     TEXT NOT NULL DEFAULT 'system',
  "actorLicence"  TEXT,
  "eventType"     TEXT NOT NULL,
  "entityTable"   TEXT NOT NULL,
  "entityId"      TEXT NOT NULL,
  "summary"       TEXT NOT NULL,
  "before"        JSONB,
  "after"         JSONB,
  "twinRevision"  INTEGER,
  "engineVersion" TEXT,
  "metadata"      JSONB
);
CREATE INDEX IF NOT EXISTS "site_plan_audit_events_workflow_idx" ON "site_plan_audit_events"("workflowId","sequence");
CREATE INDEX IF NOT EXISTS "site_plan_audit_events_entity_idx" ON "site_plan_audit_events"("entityTable","entityId");
CREATE INDEX IF NOT EXISTS "site_plan_audit_events_type_idx" ON "site_plan_audit_events"("workflowId","eventType","occurredAt");
