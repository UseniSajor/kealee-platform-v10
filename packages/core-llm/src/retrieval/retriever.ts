/**
 * core-llm/retrieval/retriever.ts
 * Retrieves relevant seed chunks for a given query.
 *
 * Current implementation: keyword + metadata matching (no vector DB required).
 * This is production-ready for the seed-based use case.
 *
 * TODO_DB_TABLE: when pgvector or Qdrant is provisioned, replace scoreBm25
 * with a vector similarity search. The SeedChunk structure already supports it.
 */

import { RetrievedContextBlock, SeedChunk } from "../types";
import { getAllChunks, getChunksByType } from "./seed-ingest";
import { createId } from "../utils/ids";

// ─── Relevance scoring ────────────────────────────────────────────────────────

/**
 * BM25-inspired keyword overlap score.
 * Scores how many query keywords appear in the chunk text/keywords.
 */
function scoreBm25(query: string, chunk: SeedChunk): number {
  const queryWords = query
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 2);

  if (queryWords.length === 0) return 0;

  let hits = 0;
  for (const word of queryWords) {
    if (chunk.text.toLowerCase().includes(word)) hits++;
    if (chunk.keywords.includes(word)) hits += 0.5; // bonus for keyword index hit
  }

  return hits / queryWords.length;
}

/**
 * Metadata boost: exact jurisdiction code or workflow code match.
 */
function metadataBoost(query: string, chunk: SeedChunk): number {
  const q = query.toLowerCase();
  let boost = 0;

  if (chunk.jurisdictionCode && q.includes(chunk.jurisdictionCode.replace(/_/g, " "))) boost += 0.3;
  if (chunk.workflowCode && q.includes(chunk.workflowCode.replace(/_/g, " "))) boost += 0.2;
  if (chunk.serviceCode && q.includes(chunk.serviceCode.replace(/_/g, " "))) boost += 0.2;

  return boost;
}

// ─── Retriever ────────────────────────────────────────────────────────────────

export interface RetrieveOptions {
  /** Limit results to specific source types */
  sourceTypes?: Array<SeedChunk["sourceType"]>;
  /** Minimum relevance score to include */
  minScore?: number;
  /** Max results to return */
  topK?: number;
  /** Jurisdiction code to boost */
  jurisdictionCode?: string;
}

/**
 * Retrieve the top-K most relevant seed chunks for a query.
 */
export function retrieve(query: string, options: RetrieveOptions = {}): RetrievedContextBlock[] {
  const { sourceTypes, minScore = 0.1, topK = 8, jurisdictionCode } = options;

  let chunks = getAllChunks();

  // Filter by source type
  if (sourceTypes && sourceTypes.length > 0) {
    chunks = chunks.filter((c) => sourceTypes.includes(c.sourceType));
  }

  // Score and sort
  const scored = chunks.map((chunk) => {
    let score = scoreBm25(query, chunk);
    score += metadataBoost(query, chunk);

    // Extra boost for jurisdiction match if specified
    if (jurisdictionCode && chunk.jurisdictionCode === jurisdictionCode) {
      score += 0.4;
    }

    return { chunk, score: Math.min(score, 1.0) };
  });

  return scored
    .filter(({ score }) => score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(({ chunk, score }) => ({
      id: createId("ctx"),
      sourceType: chunk.sourceType,
      seedPack: chunk.seedPack,
      content: chunk.text,
      metadata: chunk.metadata,
      score,
      jurisdictionCode: chunk.jurisdictionCode,
      workflowCode: chunk.workflowCode,
      serviceCode: chunk.serviceCode,
    }));
}

/**
 * Retrieve all jurisdiction chunks for a specific jurisdiction code.
 * Used by permit and zoning analysis paths.
 */
export function retrieveJurisdiction(code: string): RetrievedContextBlock[] {
  return getChunksByType("jurisdiction")
    .filter((c) => c.jurisdictionCode === code)
    .map((chunk) => ({
      id: createId("ctx"),
      sourceType: "jurisdiction" as const,
      seedPack: chunk.seedPack,
      content: chunk.text,
      metadata: chunk.metadata,
      score: 1.0,
      jurisdictionCode: chunk.jurisdictionCode,
    }));
}

/**
 * Retrieve all service chunks in a category.
 */
export function retrieveServicesByCategory(category: string): RetrievedContextBlock[] {
  return getChunksByType("service")
    .filter((c) => String(c.metadata["category"] ?? "").toLowerCase() === category.toLowerCase())
    .map((chunk) => ({
      id: createId("ctx"),
      sourceType: "service" as const,
      seedPack: chunk.seedPack,
      content: chunk.text,
      metadata: chunk.metadata,
      score: 0.9,
      serviceCode: chunk.serviceCode,
    }));
}
