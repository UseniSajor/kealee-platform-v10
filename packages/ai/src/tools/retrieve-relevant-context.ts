/**
 * packages/ai/src/tools/retrieve-relevant-context.ts
 *
 * Claude tool definition + handler for RAG retrieval.
 * Used by all KeaBots as a registered tool.
 */

import { retrieveContext, formatContext } from '../rag/retriever.js'
import type { RetrievalFilter, RetrievalResult } from '../rag/types.js'

export interface RetrieveContextParams {
  /**
   * REQUIRED, and deliberately NOT a field the model can choose.
   *
   * This is a Claude tool handler, so `params` is partly model-controlled. The
   * tenant must therefore come from the SERVER's session, never from the tool
   * call — a model that could name a tenant could be talked into naming
   * someone else's. The caller supplies it; the tool schema does not expose it.
   */
  tenantId: string
  query: string
  jurisdiction?: string
  serviceType?: string
  projectId?: string
  sourceType?: string
  topK?: number
  threshold?: number
}

export interface RetrieveContextOutput {
  context: string
  resultCount: number
  results: RetrievalResult[]
}

/**
 * Tool handler — call from bot tool registration
 */
export async function retrieveRelevantContext(
  params: RetrieveContextParams
): Promise<RetrieveContextOutput> {
  const filters: RetrievalFilter = {}
  if (params.jurisdiction) filters.jurisdiction = params.jurisdiction
  if (params.serviceType)  filters.serviceType = params.serviceType
  if (params.projectId)    filters.projectId = params.projectId
  if (params.sourceType)   filters.sourceType = params.sourceType as any

  const results = await retrieveContext({
    tenantId: params.tenantId,
    query: params.query,
    filters,
    topK: params.topK ?? 5,
    threshold: params.threshold ?? 0.70,
  })

  return {
    context: formatContext(results),
    resultCount: results.length,
    results,
  }
}

/**
 * Claude tool definition — register this in any KeaBot.
 *
 * NOTE the absence of `tenantId` from `parameters`, which is deliberate and
 * must stay that way. Everything listed here is model-controlled. The tenant
 * is supplied by the server from the authenticated session and injected by the
 * caller, because a parameter the model can set is a parameter the model can
 * be talked into setting to someone else's tenant.
 */
export const RETRIEVE_CONTEXT_TOOL_DEF = {
  name: 'retrieve_relevant_context',
  description: 'Retrieve relevant context from the Kealee knowledge base (RAG) for permits, estimates, projects, jurisdictions, and service catalog. Always call this before answering domain-specific questions.',
  parameters: {
    query: {
      type: 'string',
      description: 'Natural language search query describing what context to find',
      required: true,
    },
    jurisdiction: {
      type: 'string',
      description: 'Filter by jurisdiction (e.g. "montgomery-county", "dc", "fairfax")',
      required: false,
    },
    serviceType: {
      type: 'string',
      description: 'Filter by service type (e.g. "permit", "estimate", "concept")',
      required: false,
    },
    projectId: {
      type: 'string',
      description: 'Filter to a specific project',
      required: false,
    },
    sourceType: {
      type: 'string',
      description: 'Filter by document type: PERMIT_APPLICATION, ESTIMATE, JURISDICTION_GUIDE, CONCEPT_REPORT, etc.',
      required: false,
    },
    topK: {
      type: 'number',
      description: 'Max results to return (default 5)',
      required: false,
    },
    threshold: {
      type: 'number',
      description: 'Minimum similarity score 0–1 (default 0.70)',
      required: false,
    },
  },
  handler: retrieveRelevantContext,
}
