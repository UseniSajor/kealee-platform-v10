-- Retrieval corpus — Phase G of docs/decisions/toolchain-self-sufficiency.md
--
-- The retriever and vector store in packages/ai/src/rag have existed with no
-- tables behind them. This creates them.
--
-- Embeddings are double precision[] with cosine similarity computed in SQL.
-- No pgvector: the corpus is thousands of chunks, not millions, and depending
-- on an extension the host may not offer buys nothing here.
--
-- TENANCY: every table here is tenant-scoped. This corpus carries one job's
-- findings into the next, so an unscoped row is cross-tenant leakage working
-- as designed rather than a bug.
--
-- STATEMENT ORDER MATTERS AND IS DELIBERATE: tables, then column
-- reconciliation, then indexes. Production already carried `rag_documents`
-- and `rag_chunks` from an out-of-band `prisma db push`, in an older shape
-- with no tenantId. `CREATE TABLE IF NOT EXISTS` is a no-op against those, so
-- an index on `tenantId` written before the ALTER would fail on a column that
-- does not exist yet. Do not reorder these sections.

-- ── 1. Tables ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "rag_documents" (
    "id"                    TEXT NOT NULL,
    "tenantId"              TEXT NOT NULL,
    "sourceType"            TEXT NOT NULL,
    "sourceId"              TEXT NOT NULL,
    "title"                 TEXT NOT NULL,
    "content"               TEXT NOT NULL,
    "jurisdiction"          TEXT,
    "serviceType"           TEXT,
    "phase"                 TEXT,
    "projectId"             TEXT,
    "chunkCount"            INTEGER NOT NULL DEFAULT 0,
    "lastIndexed"           TIMESTAMP(3),
    "embeddingModel"        TEXT NOT NULL,
    "embeddingVersion"      INTEGER NOT NULL DEFAULT 1,
    "embeddingDims"         INTEGER NOT NULL,
    "authority"             TEXT,
    "knowledgeArtifactId"   TEXT,
    "personalDataScreened"  BOOLEAN NOT NULL DEFAULT false,
    "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"             TIMESTAMP(3) NOT NULL,
    CONSTRAINT "rag_documents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "rag_chunks" (
    "id"          TEXT NOT NULL,
    -- Denormalised from the parent so a similarity scan filters on the tenant
    -- WITHOUT a join. The join is the thing most likely to be left out of a
    -- hand-written similarity query, and leaving it out returns another
    -- tenant's chunks.
    "tenantId"    TEXT NOT NULL,
    "documentId"  TEXT NOT NULL,
    "chunkIndex"  INTEGER NOT NULL,
    "content"     TEXT NOT NULL,
    "embedding"   DOUBLE PRECISION[],
    "tokenCount"  INTEGER NOT NULL DEFAULT 0,
    "metadata"    JSONB,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "rag_chunks_pkey" PRIMARY KEY ("id")
);

-- A retrieval that actually happened. Without it, "the model used the corpus"
-- is an assertion nobody can check, and a grounded generation cannot name its
-- evidence.
CREATE TABLE IF NOT EXISTS "rag_retrievals" (
    "id"              TEXT NOT NULL,
    "tenantId"        TEXT NOT NULL,
    "query"           TEXT NOT NULL,
    "filters"         JSONB,
    "hits"            JSONB NOT NULL,
    "topScore"        DOUBLE PRECISION,
    "generationRunId" TEXT,
    "orderId"         TEXT,
    "workflowId"      TEXT,
    "embeddingModel"  TEXT NOT NULL,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "rag_retrievals_pkey" PRIMARY KEY ("id")
);

-- ── 2. Reconcile a partially-migrated database ──────────────────────────────
--
-- The pre-existing tables were EMPTY (0 rows, verified against production
-- 2026-09-24), so dropping and recreating would have been easy — and it is
-- deliberately not what happens. A DROP is irreversible if the row count was
-- read a moment before something wrote, and ALTER costs nothing extra.

ALTER TABLE "rag_documents" ADD COLUMN IF NOT EXISTS "tenantId"             TEXT;
ALTER TABLE "rag_documents" ADD COLUMN IF NOT EXISTS "embeddingModel"       TEXT;
ALTER TABLE "rag_documents" ADD COLUMN IF NOT EXISTS "embeddingVersion"     INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "rag_documents" ADD COLUMN IF NOT EXISTS "embeddingDims"        INTEGER;
ALTER TABLE "rag_documents" ADD COLUMN IF NOT EXISTS "authority"            TEXT;
ALTER TABLE "rag_documents" ADD COLUMN IF NOT EXISTS "knowledgeArtifactId"  TEXT;
ALTER TABLE "rag_documents" ADD COLUMN IF NOT EXISTS "personalDataScreened" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "rag_chunks" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

-- Backfill. A no-op on the current database, which is empty. It is here
-- because the migration must also be correct against one that has since been
-- written to: a migration that is only right against the database you happened
-- to inspect is not a migration.
--
-- 'unassigned' rather than the homeowner org, deliberately. Any row that
-- somehow predates tenancy has an owner nobody has established, and quietly
-- filing it under the homeowner business would be a guess wearing the costume
-- of a fact. `unassigned` matches no real tenant, so such a row is invisible
-- to every scoped query until a human assigns it.
UPDATE "rag_documents" SET "tenantId" = 'unassigned' WHERE "tenantId" IS NULL;
UPDATE "rag_chunks"    SET "tenantId" = 'unassigned' WHERE "tenantId" IS NULL;
UPDATE "rag_documents" SET "embeddingModel" = 'unknown' WHERE "embeddingModel" IS NULL;
UPDATE "rag_documents" SET "embeddingDims" = 0 WHERE "embeddingDims" IS NULL;

ALTER TABLE "rag_documents" ALTER COLUMN "tenantId"       SET NOT NULL;
ALTER TABLE "rag_documents" ALTER COLUMN "embeddingModel" SET NOT NULL;
ALTER TABLE "rag_documents" ALTER COLUMN "embeddingDims"  SET NOT NULL;
ALTER TABLE "rag_chunks"    ALTER COLUMN "tenantId"       SET NOT NULL;

-- The old shape carried a unique index on (sourceType, sourceId) with no
-- tenant. That is the cross-tenant write bug in index form: it forbids two
-- tenants from holding a document about the same public parcel and forces one
-- to overwrite the other. Replaced by the tenant-qualified index below.
DROP INDEX IF EXISTS "rag_documents_sourceType_sourceId_key";
DROP INDEX IF EXISTS "rag_documents_sourceType_sourceId_embeddingVersion_key";

-- ── 3. Indexes and constraints ──────────────────────────────────────────────

-- One row per (tenant, source, embedding version). A re-embed under a new
-- model writes a NEW version rather than mutating rows, so the index is never
-- half in one vector space and half in another. Uniqueness is PER TENANT: two
-- tenants may hold a document about the same public parcel, and neither may
-- see the other's.
CREATE UNIQUE INDEX IF NOT EXISTS "rag_documents_tenantId_sourceType_sourceId_embeddingVersion_key"
    ON "rag_documents"("tenantId", "sourceType", "sourceId", "embeddingVersion");
CREATE INDEX IF NOT EXISTS "rag_documents_tenantId_jurisdiction_serviceType_idx"
    ON "rag_documents"("tenantId", "jurisdiction", "serviceType");
CREATE INDEX IF NOT EXISTS "rag_documents_tenantId_projectId_idx"
    ON "rag_documents"("tenantId", "projectId");
CREATE INDEX IF NOT EXISTS "rag_documents_embeddingModel_embeddingVersion_idx"
    ON "rag_documents"("embeddingModel", "embeddingVersion");

CREATE UNIQUE INDEX IF NOT EXISTS "rag_chunks_documentId_chunkIndex_key"
    ON "rag_chunks"("documentId", "chunkIndex");
CREATE INDEX IF NOT EXISTS "rag_chunks_documentId_idx"
    ON "rag_chunks"("documentId");
CREATE INDEX IF NOT EXISTS "rag_chunks_tenantId_idx"
    ON "rag_chunks"("tenantId");

CREATE INDEX IF NOT EXISTS "rag_retrievals_generationRunId_idx"    ON "rag_retrievals"("generationRunId");
CREATE INDEX IF NOT EXISTS "rag_retrievals_workflowId_idx"         ON "rag_retrievals"("workflowId");
CREATE INDEX IF NOT EXISTS "rag_retrievals_tenantId_createdAt_idx" ON "rag_retrievals"("tenantId", "createdAt");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'rag_chunks_documentId_fkey'
    ) THEN
        ALTER TABLE "rag_chunks"
            ADD CONSTRAINT "rag_chunks_documentId_fkey"
            FOREIGN KEY ("documentId") REFERENCES "rag_documents"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
