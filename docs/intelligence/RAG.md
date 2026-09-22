# Retrieval-augmented generation

RAG is the default learning mechanism; fine-tuning never substitutes for current project context.

**Existing:** `packages/ai/src/rag` (OpenAI `text-embedding-3-small`, `rag_documents`/`rag_chunks`,
cosine in SQL, `retrieveContext()` with jurisdiction/service/project/sourceType filters).

**Phase 2 plan:** chunks reference `knowledge_artifacts` (id + version + region); hybrid ranking =
semantic × metadata × **authority** (`KnowledgeAuthority` ordinal — approved government record first,
unverified inference last) × approval status × human validation × recency × project similarity;
permission filter (`organizationId`, `projectId`, `retrievalEligibility`) applied **before** ranking;
keyword (tsvector) alongside vectors. pgvector when the Supabase instance enables it; the FLOAT8[] path
stays as the fallback.

Agent execution (Phase 3/4): request → project → task → Project Intelligence Profile → project evidence →
organizational knowledge → jurisdiction rules → similar approved examples → rank → context → agent →
output with sources → feedback → learning event.
