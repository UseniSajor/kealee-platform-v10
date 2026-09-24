/**
 * packages/ai/src/rag/vector-store.ts
 *
 * Stores and retrieves document embeddings using Railway PostgreSQL + FLOAT8[].
 * Cosine similarity is computed via SQL array operations (no pgvector needed).
 */

import { prismaAny } from '../utils/prisma-helper.js'
import type { IngestOptions, RagChunk, RagDocument } from './types.js'
import { resolveEmbeddingProvider } from './embedding-provider.js'
import { withTenantSession } from './tenant-session.js'

/**
 * Bumped whenever the embedding model changes. Vectors from two models are not
 * comparable, so a switch writes a NEW version rather than mutating rows —
 * the index is never half in one vector space and half in another.
 */
export const EMBEDDING_VERSION = 1

/**
 * Generate an embedding.
 *
 * Routed through `resolveEmbeddingProvider()` rather than calling OpenAI
 * directly. That defaults to the LOCAL provider, so building the corpus is
 * never blocked on a billing relationship and no platform data leaves — which
 * matters more once the corpus holds several tenants' work. Set
 * EMBEDDING_PROVIDER=openai for the metered one.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const provider = resolveEmbeddingProvider()
  const [vec] = await provider.embed([text.slice(0, 8192)])
  return vec
}

/**
 * Split text into overlapping chunks
 */
export function chunkText(
  text: string,
  chunkSize = 512,
  overlap = 64,
): string[] {
  // Approximate split by words (avoid splitting mid-sentence wildly)
  const words = text.split(/\s+/)
  const chunks: string[] = []
  let i = 0
  while (i < words.length) {
    const chunk = words.slice(i, i + chunkSize).join(' ')
    if (chunk.trim()) chunks.push(chunk)
    i += chunkSize - overlap
  }
  return chunks
}

/**
 * Ingest a document: chunk → embed → store
 */
export async function ingestDocument(opts: IngestOptions): Promise<RagDocument> {
  const {
    tenantId, sourceType, sourceId, title, content,
    jurisdiction, serviceType, phase, projectId,
    chunkSize = 512, chunkOverlap = 64,
  } = opts

  if (typeof tenantId !== 'string' || tenantId.trim() === '') {
    throw new Error(
      'ingestDocument requires a non-empty tenantId. See ' +
      'docs/decisions/white-label-and-tenancy.md.',
    )
  }

  const provider = resolveEmbeddingProvider()

  // ONE transaction for the whole ingest, with the tenant session set.
  //
  // Not just for RLS: the document row, its chunks and the chunkCount update
  // must land together. Previously each statement was its own implicit
  // transaction, so a failure partway through left a document with some of its
  // chunks and a chunkCount that disagreed with reality — and the next ingest
  // would find the row, delete the chunks and start again, which masked it.
  return withTenantSession(tenantId, async (prismaAny) => {

  // Upsert WITHIN THE TENANT.
  //
  // This lookup previously matched on (sourceType, sourceId) alone. Two
  // tenants can legitimately hold a document about the same public parcel —
  // the same sourceId — so that query would find ANOTHER tenant's row and the
  // UPDATE below would overwrite their corpus with this tenant's content. A
  // cross-tenant WRITE, which is worse than a cross-tenant read.
  const existing: any[] = await prismaAny.$queryRawUnsafe(
    `SELECT id FROM rag_documents
     WHERE "tenantId" = $1 AND "sourceType" = $2 AND "sourceId" = $3
       AND "embeddingVersion" = $4`,
    tenantId, sourceType, sourceId, EMBEDDING_VERSION
  )

  let docId: string
  if (existing.length > 0) {
    docId = existing[0].id
    await prismaAny.$executeRawUnsafe(
      `UPDATE rag_documents SET title=$1, content=$2, jurisdiction=$3,
       "serviceType"=$4, phase=$5, "projectId"=$6, "updatedAt"=NOW()
       WHERE id=$7 AND "tenantId"=$8`,
      title, content, jurisdiction ?? null, serviceType ?? null,
      phase ?? null, projectId ?? null, docId, tenantId
    )
    // Remove old chunks
    await prismaAny.$executeRawUnsafe(`DELETE FROM rag_chunks WHERE "documentId"=$1`, docId)
  } else {
    const rows: any[] = await prismaAny.$queryRawUnsafe(
      `INSERT INTO rag_documents
       (id,"tenantId","sourceType","sourceId",title,content,jurisdiction,"serviceType",
        phase,"projectId","embeddingModel","embeddingVersion","embeddingDims","updatedAt")
       VALUES(gen_random_uuid()::text,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW())
       RETURNING id`,
      tenantId, sourceType, sourceId, title, content,
      jurisdiction ?? null, serviceType ?? null, phase ?? null, projectId ?? null,
      provider.model, EMBEDDING_VERSION, provider.dimensions
    )
    docId = rows[0].id
  }

  const chunks = chunkText(content, chunkSize, chunkOverlap)

  for (let i = 0; i < chunks.length; i++) {
    const embedding = await generateEmbedding(chunks[i])
    const meta = JSON.stringify({ documentTitle: title, sourceType, sourceId, jurisdiction, serviceType, projectId, phase })
    await prismaAny.$executeRawUnsafe(
      `INSERT INTO rag_chunks
       (id, "tenantId", "documentId", "chunkIndex", content, embedding, "tokenCount", metadata)
       VALUES(gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7)`,
      tenantId, docId, i, chunks[i],
      `{${embedding.join(',')}}`,
      Math.ceil(chunks[i].split(' ').length * 1.3),
      meta
    )
  }

  await prismaAny.$executeRawUnsafe(
    `UPDATE rag_documents SET "chunkCount"=$1, "lastIndexed"=NOW() WHERE id=$2 AND "tenantId"=$3`,
    chunks.length, docId, tenantId
  )

  return {
    id: docId,
    sourceType,
    sourceId,
    title,
    content,
    jurisdiction,
    serviceType,
    phase,
    projectId,
    chunkCount: chunks.length,
    lastIndexed: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  })
}

/**
 * Cosine similarity using SQL array operations
 * Formula: dot(a,b) / (|a| * |b|)
 */
export const COSINE_SIMILARITY_SQL = `
  (
    SELECT
      COALESCE(
        (
          SELECT SUM(a_val * b_val)
          FROM unnest(rc.embedding, $QUERY_VEC::float8[]) AS t(a_val, b_val)
        ) /
        NULLIF(
          SQRT(SELECT SUM(v * v) FROM unnest(rc.embedding) AS v) *
          SQRT(SELECT SUM(v * v) FROM unnest($QUERY_VEC::float8[]) AS v),
          0
        ),
        0
      )
  )
`
