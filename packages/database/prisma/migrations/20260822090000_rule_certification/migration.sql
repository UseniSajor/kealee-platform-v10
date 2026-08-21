-- Site Plan Engine — Phase 3C: rule certification, provenance and change detection
--
-- Extends the Phase 3B persistence layer. The existing `jurisdiction_rule_versions`
-- table is left exactly as it is and keeps its role as the extracted rule-pack
-- payload; these tables add the lifecycle, provenance, certification and
-- source-change machinery on top of it, keyed by jurisdiction + ruleKey + version.
--
-- ADDITIVE AND NON-DESTRUCTIVE. Creates types and tables only. It drops nothing,
-- alters no existing column, and rewrites no existing row, so no Phase 3B data is
-- at risk. Every statement is IF NOT EXISTS or exception-guarded and is safe to
-- re-run.

-- ── Enums ───────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "RuleLifecycleState" AS ENUM ('EXTRACTED','PROVISIONAL','VERIFIED','CERTIFIED','SUPERSEDED','REVOKED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "RuleSourceAuthority" AS ENUM (
    'OFFICIAL_CODE','OFFICIAL_AGENCY_REGULATION','OFFICIAL_AGENCY_MANUAL','OFFICIAL_GIS',
    'OFFICIAL_PDF','ADOPTED_ORDINANCE','SECONDARY_SOURCE','UNKNOWN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "RuleExtractionMethod" AS ENUM (
    'html_table_parser','pdf_text_extraction','pdf_ocr','gis_query','manual_entry','api_response','llm_assisted');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "RuleReconciliationStatus" AS ENUM ('MATCH','MISMATCH','SINGLE_SOURCE_ONLY','NOT_REQUIRED','PENDING');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "RulePackStatus" AS ENUM ('DRAFT','PARTIALLY_CERTIFIED','CERTIFIED','STALE','SUPERSEDED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "RulePackTier" AS ENUM ('core','supporting');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "RuleAuditAction" AS ENUM (
    'extracted','validated','verified','certified','rejected','revoked','superseded',
    'source_changed','reconciled','clarification_requested','interpretation_noted','certification_reused');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "SourceChangeKind" AS ENUM (
    'UNCHANGED','REGION_CHANGED','REGION_ADDED','REGION_REMOVED','DOCUMENT_CHANGED_SCOPE_UNKNOWN','SOURCE_UNAVAILABLE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Authoritative sources ───────────────────────────────────────────────────
-- One row per source document. `documentHash` is over NORMALISED content, so a
-- CMS reflowing whitespace does not read as an amendment.

CREATE TABLE IF NOT EXISTS "rule_sources" (
  "id"               TEXT PRIMARY KEY,
  "jurisdictionCode" TEXT NOT NULL,
  "title"            TEXT NOT NULL,
  "authority"        "RuleSourceAuthority" NOT NULL DEFAULT 'UNKNOWN',
  "url"              TEXT,
  "documentId"       TEXT,
  "documentHash"     TEXT NOT NULL,
  "version"          TEXT NOT NULL,
  "publicationDate"  DATE,
  "effectiveDate"    DATE,
  "retrievedAt"      TIMESTAMP(3) NOT NULL,
  -- Set when a fetch fails. An outage is recorded, never treated as an amendment.
  "lastFetchError"   TEXT,
  "lastFetchAttempt" TIMESTAMP(3),
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "rule_sources_identity" ON "rule_sources"("jurisdictionCode","id");
CREATE INDEX IF NOT EXISTS "rule_sources_hash_idx" ON "rule_sources"("documentHash");

-- Prior versions. Append-only: a superseded hash is how "did this change since
-- certification" stays answerable years later.
CREATE TABLE IF NOT EXISTS "rule_source_versions" (
  "id"           TEXT PRIMARY KEY,
  "sourceId"     TEXT NOT NULL,
  "version"      TEXT NOT NULL,
  "documentHash" TEXT NOT NULL,
  "retrievedAt"  TIMESTAMP(3) NOT NULL,
  "supersededAt" TIMESTAMP(3) NOT NULL,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "rule_source_versions_identity" ON "rule_source_versions"("sourceId","documentHash");
CREATE INDEX IF NOT EXISTS "rule_source_versions_source_idx" ON "rule_source_versions"("sourceId","supersededAt");

-- Regions within a source. Rules bind to a REGION, which is what makes
-- invalidation surgical instead of jurisdiction-wide.
CREATE TABLE IF NOT EXISTS "rule_source_regions" (
  "id"          TEXT PRIMARY KEY,
  "sourceId"    TEXT NOT NULL,
  "regionId"    TEXT NOT NULL,
  "label"       TEXT NOT NULL,
  "hash"        TEXT NOT NULL,
  "ruleIdentities" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "retrievedAt" TIMESTAMP(3) NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "rule_source_regions_identity" ON "rule_source_regions"("sourceId","regionId");
CREATE INDEX IF NOT EXISTS "rule_source_regions_hash_idx" ON "rule_source_regions"("hash");

-- ── Certifiable rules ───────────────────────────────────────────────────────
-- `identity` is the stable, project-independent scope key. Two projects in the
-- same zone resolve to the SAME identity and therefore the same certification —
-- that reuse is the entire point of Phase 3C.

CREATE TABLE IF NOT EXISTS "certifiable_rules" (
  "id"                       TEXT PRIMARY KEY,
  "identity"                 TEXT NOT NULL,
  "jurisdictionCode"         TEXT NOT NULL,
  "ruleKey"                  TEXT NOT NULL,
  "version"                  INTEGER NOT NULL,
  "state"                    "RuleLifecycleState" NOT NULL DEFAULT 'EXTRACTED',
  "codeSection"              TEXT NOT NULL,
  "ruleType"                 TEXT NOT NULL,
  "scopeKey"                 JSONB NOT NULL DEFAULT '{}'::jsonb,
  "effectiveVersion"         TEXT NOT NULL,
  "value"                    TEXT,
  "payload"                  JSONB,
  -- Confidence dimensions are separate columns on purpose. Collapsing them into
  -- one score lets a cleanly-parsed blog post outrank a messy official table.
  "extractionConfidence"     DECIMAL(5,4) NOT NULL DEFAULT 0,
  "authorityConfidence"      DECIMAL(5,4) NOT NULL DEFAULT 0,
  "applicabilityConfidence"  DECIMAL(5,4) NOT NULL DEFAULT 0,
  "consistencyConfidence"    DECIMAL(5,4),
  "sourceFreshnessConfidence" DECIMAL(5,4),
  "sourceId"                 TEXT,
  "sourceRegionId"           TEXT,
  "supersededByIdentity"     TEXT,
  "sourceIssues"             JSONB NOT NULL DEFAULT '[]'::jsonb,
  "humanReviewRequired"      BOOLEAN NOT NULL DEFAULT true,
  "humanReviewReasons"       JSONB NOT NULL DEFAULT '[]'::jsonb,
  "createdAt"                TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"                TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "certifiable_rules_identity" ON "certifiable_rules"("identity");
CREATE UNIQUE INDEX IF NOT EXISTS "certifiable_rules_key" ON "certifiable_rules"("jurisdictionCode","ruleKey","version");
CREATE INDEX IF NOT EXISTS "certifiable_rules_state_idx" ON "certifiable_rules"("jurisdictionCode","state");
CREATE INDEX IF NOT EXISTS "certifiable_rules_review_idx" ON "certifiable_rules"("jurisdictionCode","humanReviewRequired");
CREATE INDEX IF NOT EXISTS "certifiable_rules_type_idx" ON "certifiable_rules"("jurisdictionCode","ruleType","state");

-- Provenance, one row per rule. Detailed enough that a reviewer can open the
-- ordinance and find the governing sentence without asking anyone.
CREATE TABLE IF NOT EXISTS "rule_provenance" (
  "id"                TEXT PRIMARY KEY,
  "ruleIdentity"      TEXT NOT NULL,
  "jurisdiction"      TEXT NOT NULL,
  "agency"            TEXT NOT NULL,
  "sourceType"        "RuleSourceAuthority" NOT NULL,
  "sourceTitle"       TEXT NOT NULL,
  "sourceUrl"         TEXT,
  "sourceDocumentId"  TEXT,
  "codeTitle"         TEXT,
  "codeSection"       TEXT,
  "subsection"        TEXT,
  "table"             TEXT,
  "row"               TEXT,
  "column"            TEXT,
  "footnote"          TEXT,
  "appendix"          TEXT,
  "publicationDate"   DATE,
  "effectiveDate"     DATE,
  "retrievedAt"       TIMESTAMP(3) NOT NULL,
  "sourceHash"        TEXT,
  "sourceVersion"     TEXT,
  "extractionMethod"  "RuleExtractionMethod" NOT NULL,
  "pageNumber"        INTEGER,
  "textLocation"      JSONB,
  "parserVersion"     TEXT NOT NULL,
  -- Why any field above is legitimately absent.
  "gaps"              JSONB NOT NULL DEFAULT '[]'::jsonb,
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "rule_provenance_rule" ON "rule_provenance"("ruleIdentity");
CREATE INDEX IF NOT EXISTS "rule_provenance_hash_idx" ON "rule_provenance"("sourceHash");

-- Applicability conditions and footnotes, kept structured rather than flattened.
-- "45 (4)" is not the number 45; it is 45 subject to footnote 4.
CREATE TABLE IF NOT EXISTS "rule_applicability_conditions" (
  "id"               TEXT PRIMARY KEY,
  "ruleIdentity"     TEXT NOT NULL,
  "condition"        JSONB NOT NULL,
  "overriddenBy"     JSONB NOT NULL DEFAULT '[]'::jsonb,
  "footnotes"        JSONB NOT NULL DEFAULT '[]'::jsonb,
  "incompleteReason" TEXT,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "rule_applicability_conditions_rule" ON "rule_applicability_conditions"("ruleIdentity");

-- Independent-source reconciliation for high-risk rules.
CREATE TABLE IF NOT EXISTS "rule_source_reconciliations" (
  "id"              TEXT PRIMARY KEY,
  "ruleIdentity"    TEXT NOT NULL,
  "status"          "RuleReconciliationStatus" NOT NULL,
  "sourceALabel"    TEXT,
  "sourceAAuthority" "RuleSourceAuthority",
  "sourceAUrl"      TEXT,
  "sourceAHash"     TEXT,
  "sourceARawValue" TEXT,
  "sourceANormalized" TEXT,
  "sourceBLabel"    TEXT,
  "sourceBAuthority" "RuleSourceAuthority",
  "sourceBUrl"      TEXT,
  "sourceBHash"     TEXT,
  "sourceBRawValue" TEXT,
  "sourceBNormalized" TEXT,
  "matched"         BOOLEAN,
  "discrepancy"     TEXT,
  "note"            TEXT NOT NULL,
  "reconciledAt"    TIMESTAMP(3) NOT NULL,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "rule_source_reconciliations_rule_idx" ON "rule_source_reconciliations"("ruleIdentity","reconciledAt");
CREATE INDEX IF NOT EXISTS "rule_source_reconciliations_status_idx" ON "rule_source_reconciliations"("status");

-- ── Certifications ──────────────────────────────────────────────────────────
-- A certification is bound to the exact source hash and version reviewed. That
-- binding is what makes reuse safe and what makes a source change detach it.

CREATE TABLE IF NOT EXISTS "rule_certifications" (
  "id"                    TEXT PRIMARY KEY,
  "ruleIdentity"          TEXT NOT NULL,
  "jurisdiction"          TEXT NOT NULL,
  "ruleKey"               TEXT NOT NULL,
  "ruleVersion"           INTEGER NOT NULL,
  "reviewerId"            TEXT NOT NULL,
  "reviewerName"          TEXT NOT NULL,
  "reviewerRole"          TEXT NOT NULL,
  "reviewerLicenceNumber" TEXT,
  "certifiedAt"           TIMESTAMP(3) NOT NULL,
  "sourceHash"            TEXT NOT NULL,
  "sourceVersion"         TEXT NOT NULL,
  "note"                  TEXT NOT NULL,
  "certificationScope"    JSONB NOT NULL DEFAULT '{}'::jsonb,
  "expiresAt"             TIMESTAMP(3),
  "active"                BOOLEAN NOT NULL DEFAULT true,
  "revokedAt"             TIMESTAMP(3),
  "revokedReason"         TEXT,
  "rulePackVersion"       TEXT,
  "reviewItemId"          TEXT,
  "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- At most one ACTIVE certification per rule identity; withdrawn ones are kept.
CREATE UNIQUE INDEX IF NOT EXISTS "rule_certifications_active"
  ON "rule_certifications"("ruleIdentity") WHERE "active" = true;
CREATE INDEX IF NOT EXISTS "rule_certifications_rule_idx" ON "rule_certifications"("ruleIdentity","certifiedAt");
CREATE INDEX IF NOT EXISTS "rule_certifications_hash_idx" ON "rule_certifications"("ruleIdentity","sourceHash");
CREATE INDEX IF NOT EXISTS "rule_certifications_reviewer_idx" ON "rule_certifications"("reviewerId","certifiedAt");

-- ── Rule packs ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "rule_pack_versions" (
  "id"                        TEXT PRIMARY KEY,
  "jurisdictionCode"          TEXT NOT NULL,
  "packVersion"               TEXT NOT NULL,
  "status"                    "RulePackStatus" NOT NULL DEFAULT 'DRAFT',
  "effectiveDate"             DATE NOT NULL,
  "sources"                   JSONB NOT NULL DEFAULT '[]'::jsonb,
  "certifiedCount"            INTEGER NOT NULL DEFAULT 0,
  "verifiedCount"             INTEGER NOT NULL DEFAULT 0,
  "provisionalCount"          INTEGER NOT NULL DEFAULT 0,
  "extractedCount"            INTEGER NOT NULL DEFAULT 0,
  "supersededCount"           INTEGER NOT NULL DEFAULT 0,
  "revokedCount"              INTEGER NOT NULL DEFAULT 0,
  "humanReviewRequiredCount"  INTEGER NOT NULL DEFAULT 0,
  "coreCount"                 INTEGER NOT NULL DEFAULT 0,
  "coreCertifiedCount"        INTEGER NOT NULL DEFAULT 0,
  "unresolvedSourceIssues"    JSONB NOT NULL DEFAULT '[]'::jsonb,
  "certificationCoverage"     DECIMAL(5,4) NOT NULL DEFAULT 0,
  "coreCertificationCoverage" DECIMAL(5,4) NOT NULL DEFAULT 0,
  "statusRationale"           TEXT NOT NULL,
  "lastRefreshedAt"           TIMESTAMP(3),
  "lastCertifiedAt"           TIMESTAMP(3),
  "supersededByVersion"       TEXT,
  "createdAt"                 TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"                 TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "rule_pack_versions_identity" ON "rule_pack_versions"("jurisdictionCode","packVersion");
CREATE INDEX IF NOT EXISTS "rule_pack_versions_status_idx" ON "rule_pack_versions"("jurisdictionCode","status");

CREATE TABLE IF NOT EXISTS "rule_pack_members" (
  "id"                  TEXT PRIMARY KEY,
  "rulePackId"          TEXT NOT NULL,
  "ruleIdentity"        TEXT NOT NULL,
  "ruleKey"             TEXT NOT NULL,
  "tier"                "RulePackTier" NOT NULL DEFAULT 'supporting',
  "state"               "RuleLifecycleState" NOT NULL,
  "humanReviewRequired" BOOLEAN NOT NULL DEFAULT true,
  "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "rule_pack_members_identity" ON "rule_pack_members"("rulePackId","ruleIdentity");
CREATE INDEX IF NOT EXISTS "rule_pack_members_tier_idx" ON "rule_pack_members"("rulePackId","tier","state");

-- ── Audit and change events ─────────────────────────────────────────────────
-- Append-only. Certification history is never overwritten.

CREATE TABLE IF NOT EXISTS "rule_certification_audit_events" (
  "id"              TEXT PRIMARY KEY,
  "sequence"        BIGSERIAL NOT NULL,
  "ruleIdentity"    TEXT NOT NULL,
  "jurisdiction"    TEXT NOT NULL,
  "ruleKey"         TEXT NOT NULL,
  "ruleVersion"     INTEGER NOT NULL,
  "previousState"   "RuleLifecycleState",
  "newState"        "RuleLifecycleState",
  "action"          "RuleAuditAction" NOT NULL,
  "actorId"         TEXT NOT NULL,
  "actorName"       TEXT NOT NULL,
  "actorRole"       TEXT NOT NULL,
  "occurredAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reason"          TEXT NOT NULL,
  "sourceHash"      TEXT,
  "sourceVersion"   TEXT,
  "reviewItemId"    TEXT,
  "rulePackVersion" TEXT,
  "affectedProjectIds" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "metadata"        JSONB
);
CREATE INDEX IF NOT EXISTS "rule_certification_audit_rule_idx" ON "rule_certification_audit_events"("ruleIdentity","sequence");
CREATE INDEX IF NOT EXISTS "rule_certification_audit_action_idx" ON "rule_certification_audit_events"("jurisdiction","action","occurredAt");
CREATE INDEX IF NOT EXISTS "rule_certification_audit_actor_idx" ON "rule_certification_audit_events"("actorId","occurredAt");

CREATE TABLE IF NOT EXISTS "rule_source_change_events" (
  "id"                       TEXT PRIMARY KEY,
  "sourceId"                 TEXT NOT NULL,
  "jurisdictionCode"         TEXT NOT NULL,
  "changed"                  BOOLEAN NOT NULL,
  "previousVersion"          TEXT NOT NULL,
  "currentVersion"           TEXT NOT NULL,
  "documentHashBefore"       TEXT NOT NULL,
  "documentHashAfter"        TEXT NOT NULL,
  "changes"                  JSONB NOT NULL DEFAULT '[]'::jsonb,
  "affectedRuleIdentities"   JSONB NOT NULL DEFAULT '[]'::jsonb,
  "unaffectedRuleIdentities" JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- False means the change could not be narrowed to regions; only then is a
  -- jurisdiction-wide reopen correct.
  "scopeIsolated"            BOOLEAN NOT NULL DEFAULT true,
  "summary"                  TEXT NOT NULL,
  "detectedAt"               TIMESTAMP(3) NOT NULL,
  "createdAt"                TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "rule_source_change_source_idx" ON "rule_source_change_events"("sourceId","detectedAt");
CREATE INDEX IF NOT EXISTS "rule_source_change_jurisdiction_idx" ON "rule_source_change_events"("jurisdictionCode","changed","detectedAt");
