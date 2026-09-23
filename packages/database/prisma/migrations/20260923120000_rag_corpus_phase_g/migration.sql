-- Retrieval corpus — Phase G of docs/decisions/toolchain-self-sufficiency.md
--
-- The retriever and vector store in packages/ai/src/rag have existed with no
-- tables behind them. This creates them.
--
-- Embeddings are double precision[] with cosine similarity computed in SQL.
-- No pgvector: the corpus is thousands of chunks, not millions, and depending
-- on an extension the host may not offer buys nothing here.
--
-- Idempotent: safe to run against a database where an earlier attempt landed.

CREATE TABLE IF NOT EXISTS "rag_documents" (
    "id"                    TEXT NOT NULL,
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

-- One row per (source, embedding version). A re-embed under a new model writes
-- a NEW version rather than mutating rows, so the index is never half in one
-- vector space and half in another.
CREATE UNIQUE INDEX IF NOT EXISTS "rag_documents_sourceType_sourceId_embeddingVersion_key"
    ON "rag_documents"("sourceType", "sourceId", "embeddingVersion");
CREATE INDEX IF NOT EXISTS "rag_documents_jurisdiction_serviceType_idx"
    ON "rag_documents"("jurisdiction", "serviceType");
CREATE INDEX IF NOT EXISTS "rag_documents_projectId_idx"
    ON "rag_documents"("projectId");
CREATE INDEX IF NOT EXISTS "rag_documents_embeddingModel_embeddingVersion_idx"
    ON "rag_documents"("embeddingModel", "embeddingVersion");

CREATE TABLE IF NOT EXISTS "rag_chunks" (
    "id"          TEXT NOT NULL,
    "documentId"  TEXT NOT NULL,
    "chunkIndex"  INTEGER NOT NULL,
    "content"     TEXT NOT NULL,
    "embedding"   DOUBLE PRECISION[],
    "tokenCount"  INTEGER NOT NULL DEFAULT 0,
    "metadata"    JSONB,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "rag_chunks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "rag_chunks_documentId_chunkIndex_key"
    ON "rag_chunks"("documentId", "chunkIndex");
CREATE INDEX IF NOT EXISTS "rag_chunks_documentId_idx"
    ON "rag_chunks"("documentId");

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

-- A retrieval that actually happened. Without it, "the model used the corpus"
-- is an assertion nobody can check, and a grounded generation cannot name its
-- evidence.
CREATE TABLE IF NOT EXISTS "rag_retrievals" (
    "id"              TEXT NOT NULL,
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

CREATE INDEX IF NOT EXISTS "rag_retrievals_generationRunId_idx" ON "rag_retrievals"("generationRunId");
CREATE INDEX IF NOT EXISTS "rag_retrievals_workflowId_idx"      ON "rag_retrievals"("workflowId");
CREATE INDEX IF NOT EXISTS "rag_retrievals_createdAt_idx"       ON "rag_retrievals"("createdAt");
