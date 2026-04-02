export { AIProvider } from './ai-provider';
export {
  ACQUISITION_PROMPT,
  CONTRACT_PROMPT,
  SCHEDULE_PROMPT,
  BUDGET_PROMPT,
  PERMIT_PROMPT,
  DOCS_PROMPT,
  RISK_PROMPT,
  COMMAND_PROMPT,
} from './construction-prompts';

// RAG
export { generateEmbedding, chunkText, ingestDocument } from './rag/vector-store';
export { retrieveContext, formatContext } from './rag/retriever';
export { retrieveRelevantContext, RETRIEVE_CONTEXT_TOOL_DEF } from './tools/retrieve-relevant-context';
export type { IngestOptions, RetrievalOptions, RetrievalResult, RetrievalFilter, RagDocumentType } from './rag/types';
