/**
 * packages/ai/src/rag/retriever.ts
 *
 * Retrieves the most semantically relevant chunks from the RAG store,
 * filtered by metadata. Uses SQL cosine similarity on FLOAT8[] embeddings.
 */

import { prismaAny } from '../utils/prisma-helper.js'
import { generateEmbedding } from './vector-store.js'
import type { RetrievalOptions, RetrievalResult } from './types.js'

/**
 * Core retrieval function — returns ranked chunks above threshold.
 */
export async function retrieveContext(opts: RetrievalOptions): Promise<RetrievalResult[]> {
  const { query, filters = {}, topK = 5, threshold = 0.70 } = opts

  const queryEmbedding = await generateEmbedding(query)
  const embeddingLiteral = `{${queryEmbedding.join(',')}}`

  // Build WHERE clauses for metadata filters
  const conditions: string[] = []
  const params: unknown[] = [embeddingLiteral, topK]

  if (filters.jurisdiction) {
    params.push(filters.jurisdiction)
    conditions.push(`rd.jurisdiction = $${params.length}`)
  }
  if (filters.serviceType) {
    params.push(filters.serviceType)
    conditions.push(`rd."serviceType" = $${params.length}`)
  }
  if (filters.projectId) {
    params.push(filters.projectId)
    conditions.push(`rd."projectId" = $${params.length}`)
  }
  if (filters.phase) {
    params.push(filters.phase)
    conditions.push(`rd.phase = $${params.length}`)
  }
  if (filters.sourceType) {
    const types = Array.isArray(filters.sourceType) ? filters.sourceType : [filters.sourceType]
    params.push(types)
    conditions.push(`rd."sourceType" = ANY($${params.length}::text[])`)
  }

  const whereClause = conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : ''

  // Cosine similarity via dot product / magnitude product using SQL
  const rows: any[] = await prismaAny.$queryRawUnsafe(`
    WITH query_vec AS (
      SELECT $1::float8[] AS qv
    ),
    scored AS (
      SELECT
        rc.id AS "chunkId",
        rc."documentId",
        rc.content,
        rc.metadata,
        rd.title AS "documentTitle",
        (
          SELECT
            COALESCE(
              (
                SELECT SUM(a * b)
                FROM unnest(rc.embedding, qv.qv) AS t(a, b)
              ) / NULLIF(
                SQRT((SELECT SUM(v * v) FROM unnest(rc.embedding) AS v)) *
                SQRT((SELECT SUM(v * v) FROM unnest(qv.qv) AS v)),
                0
              ),
              0
            )
          FROM query_vec qv
        ) AS similarity
      FROM rag_chunks rc
      JOIN rag_documents rd ON rc."documentId" = rd.id
      WHERE array_length(rc.embedding, 1) > 0
      ${whereClause}
    )
    SELECT * FROM scored
    WHERE similarity >= ${threshold}
    ORDER BY similarity DESC
    LIMIT $2
  `, ...params)

  return rows.map((r: any) => ({
    chunkId: r.chunkId,
    documentId: r.documentId,
    content: r.content,
    similarity: Number(r.similarity),
    metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata ?? {},
    documentTitle: r.documentTitle,
  }))
}

/**
 * Format retrieval results into a context string for LLM prompts
 */
export function formatContext(results: RetrievalResult[]): string {
  if (results.length === 0) return ''
  return results
    .map((r, i) =>
      `[Context ${i + 1} — ${r.documentTitle} (similarity: ${(r.similarity * 100).toFixed(0)}%)]\n${r.content}`
    )
    .join('\n\n---\n\n')
}
