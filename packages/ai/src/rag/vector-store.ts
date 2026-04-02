/**
 * packages/ai/src/rag/vector-store.ts
 *
 * Stores and retrieves document embeddings using Railway PostgreSQL + FLOAT8[].
 * Cosine similarity is computed via SQL array operations (no pgvector needed).
 */

import { prismaAny } from '../utils/prisma-helper.js'
import type { IngestOptions, RagChunk, RagDocument } from './types.js'

const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL ?? 'text-embedding-3-small'
const EMBEDDING_DIM   = parseInt(process.env.EMBEDDING_DIMENSION ?? '1536', 10)

function getOpenAI() {
  const OpenAI = require('openai')
  const apiKey = process.env.EMBEDDING_API_KEY ?? process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('EMBEDDING_API_KEY is required for RAG embeddings')
  return new OpenAI({ apiKey })
}

/**
 * Generate embedding vector for a text string
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const openai = getOpenAI()
  const resp = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text.slice(0, 8192), // token limit guard
  })
  return resp.data[0].embedding as number[]
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
    sourceType, sourceId, title, content,
    jurisdiction, serviceType, phase, projectId,
    chunkSize = 512, chunkOverlap = 64,
  } = opts

  // Upsert document record
  const existing: any[] = await prismaAny.$queryRawUnsafe(
    `SELECT id FROM rag_documents WHERE "sourceType" = $1 AND "sourceId" = $2`,
    sourceType, sourceId
  )

  let docId: string
  if (existing.length > 0) {
    docId = existing[0].id
    await prismaAny.$executeRawUnsafe(
      `UPDATE rag_documents SET title=$1, content=$2, jurisdiction=$3,
       "serviceType"=$4, phase=$5, "projectId"=$6, "updatedAt"=NOW()
       WHERE id=$7`,
      title, content, jurisdiction ?? null, serviceType ?? null,
      phase ?? null, projectId ?? null, docId
    )
    // Remove old chunks
    await prismaAny.$executeRawUnsafe(`DELETE FROM rag_chunks WHERE "documentId"=$1`, docId)
  } else {
    const rows: any[] = await prismaAny.$queryRawUnsafe(
      `INSERT INTO rag_documents
       ("sourceType","sourceId",title,content,jurisdiction,"serviceType",phase,"projectId")
       VALUES($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id`,
      sourceType, sourceId, title, content,
      jurisdiction ?? null, serviceType ?? null, phase ?? null, projectId ?? null
    )
    docId = rows[0].id
  }

  const chunks = chunkText(content, chunkSize, chunkOverlap)

  for (let i = 0; i < chunks.length; i++) {
    const embedding = await generateEmbedding(chunks[i])
    const meta = JSON.stringify({ documentTitle: title, sourceType, sourceId, jurisdiction, serviceType, projectId, phase })
    await prismaAny.$executeRawUnsafe(
      `INSERT INTO rag_chunks
       (id, "documentId", "chunkIndex", content, embedding, "tokenCount", metadata)
       VALUES(gen_random_uuid()::text, $1, $2, $3, $4, $5, $6)`,
      docId, i, chunks[i],
      `{${embedding.join(',')}}`,
      Math.ceil(chunks[i].split(' ').length * 1.3),
      meta
    )
  }

  await prismaAny.$executeRawUnsafe(
    `UPDATE rag_documents SET "chunkCount"=$1, "lastIndexed"=NOW() WHERE id=$2`,
    chunks.length, docId
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
