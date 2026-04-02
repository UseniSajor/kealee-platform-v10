/**
 * packages/ai/src/rag/types.ts
 * Canonical types for the Kealee RAG system
 */

export type RagDocumentType =
  | 'PROJECT_DESCRIPTION'
  | 'PERMIT_APPLICATION'
  | 'ESTIMATE'
  | 'INSPECTION_REPORT'
  | 'JURISDICTION_GUIDE'
  | 'SERVICE_CATALOG'
  | 'CONCEPT_REPORT'
  | 'ZONING_DATA'
  | 'CONTRACTOR_PROFILE'
  | 'PHASE_NOTE'

export interface RagDocument {
  id: string
  sourceType: RagDocumentType
  sourceId: string
  title: string
  content: string
  jurisdiction?: string
  serviceType?: string
  phase?: string
  projectId?: string
  chunkCount: number
  lastIndexed?: Date
  createdAt: Date
  updatedAt: Date
}

export interface RagChunk {
  id: string
  documentId: string
  chunkIndex: number
  content: string
  embedding: number[]
  tokenCount: number
  metadata: RagChunkMetadata
  createdAt: Date
}

export interface RagChunkMetadata {
  documentTitle?: string
  sourceType?: RagDocumentType
  sourceId?: string
  jurisdiction?: string
  serviceType?: string
  projectId?: string
  phase?: string
  [key: string]: unknown
}

export interface RetrievalFilter {
  jurisdiction?: string
  serviceType?: string
  projectId?: string
  sourceType?: RagDocumentType | RagDocumentType[]
  phase?: string
}

export interface RetrievalResult {
  chunkId: string
  documentId: string
  content: string
  similarity: number
  metadata: RagChunkMetadata
  documentTitle: string
}

export interface RetrievalOptions {
  query: string
  filters?: RetrievalFilter
  topK?: number         // default 5
  threshold?: number    // minimum cosine similarity 0–1, default 0.7
}

export interface IngestOptions {
  sourceType: RagDocumentType
  sourceId: string
  title: string
  content: string
  jurisdiction?: string
  serviceType?: string
  phase?: string
  projectId?: string
  chunkSize?: number    // tokens per chunk, default 512
  chunkOverlap?: number // overlap tokens, default 64
}
