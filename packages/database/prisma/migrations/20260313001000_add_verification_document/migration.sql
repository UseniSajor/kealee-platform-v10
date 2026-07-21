-- P5: Add VerificationDocument model
-- Additive-only migration: new table + enums, no existing tables altered.
--
-- Apply:
--   cd packages/database
--   npx prisma db execute --file ./prisma/migrations/20260313001000_add_verification_document/migration.sql --schema ./prisma/schema.prisma
--   npx prisma migrate resolve --applied 20260313001000_add_verification_document
--
-- Rollback:
--   DROP TABLE verification_documents;
--   DROP TYPE "VerificationDocumentType";
--   DROP TYPE "VerificationDocumentStatus";

-- ─── Enums ────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "VerificationDocumentType" AS ENUM (
    'LICENSE',
    'INSURANCE',
    'BOND',
    'CERTIFICATION',
    'OTHER'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "VerificationDocumentStatus" AS ENUM (
    'UPLOADED',
    'UNDER_REVIEW',
    'APPROVED',
    'REJECTED',
    'EXPIRED',
    'ARCHIVED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ─── Table ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "verification_documents" (
  "id"                    TEXT            NOT NULL,
  "marketplaceProfileId"  TEXT            NOT NULL,
  "documentType"          "VerificationDocumentType"   NOT NULL,
  "status"                "VerificationDocumentStatus" NOT NULL DEFAULT 'UPLOADED',
  "version"               INTEGER         NOT NULL DEFAULT 1,
  "fileKey"               TEXT            NOT NULL,
  "fileName"              TEXT            NOT NULL,
  "mimeType"              TEXT            NOT NULL,
  "fileSize"              INTEGER         NOT NULL,
  "description"           TEXT,
  "issuerName"            TEXT,
  "documentNumber"        TEXT,
  "expiresAt"             TIMESTAMP(3),
  "reviewedBy"            TEXT,
  "reviewedAt"            TIMESTAMP(3),
  "reviewNote"            TEXT,
  "rejectionReason"       TEXT,
  "createdAt"             TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"             TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "verification_documents_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "verification_documents_marketplaceProfileId_fkey"
    FOREIGN KEY ("marketplaceProfileId")
    REFERENCES "MarketplaceProfile"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS "verification_documents_marketplaceProfileId_idx"
  ON "verification_documents"("marketplaceProfileId");

CREATE INDEX IF NOT EXISTS "verification_documents_documentType_idx"
  ON "verification_documents"("documentType");

CREATE INDEX IF NOT EXISTS "verification_documents_status_idx"
  ON "verification_documents"("status");

CREATE INDEX IF NOT EXISTS "verification_documents_marketplaceProfileId_documentType_idx"
  ON "verification_documents"("marketplaceProfileId", "documentType");

-- Cron uses this to sweep expired approved documents
CREATE INDEX IF NOT EXISTS "verification_documents_expiresAt_idx"
  ON "verification_documents"("expiresAt")
  WHERE "expiresAt" IS NOT NULL;

-- ─── Auto-update updatedAt ─────────────────────────────────────────────────────
-- Postgres trigger so updatedAt stays current without ORM intervention.

CREATE OR REPLACE FUNCTION update_verification_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS verification_documents_updated_at_trigger ON "verification_documents";
CREATE TRIGGER verification_documents_updated_at_trigger
  BEFORE UPDATE ON "verification_documents"
  FOR EACH ROW EXECUTE FUNCTION update_verification_documents_updated_at();
