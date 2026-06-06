/**
 * bots.rag-tool.ts
 *
 * Factory for the `retrieve_relevant_context` agentic tool.
 *
 * Kept in a separate module so that bots.router.ts (the core model-calling
 * layer) does not depend on the RAG retriever.  Only bots that use RAG need
 * to import this file.
 *
 * The tool name matches the System A RETRIEVE_CONTEXT_TOOL_DEF contract:
 *   owner, gc, estimate, and permit bots (4 RAG-enabled bots) call this tool.
 *
 * Project type is inferred from the query using the same keyword priority as
 * EstimateBot.getTypeKey() — ensuring permit and cost lookups are consistent.
 */

import type { AgenticTool } from './bots.router'
import {
  loadRAGData,
  isRAGLoaded,
  retrievePermitContext,
  retrieveCostContext,
  retrieveZoningContext,
} from '../../lib/orchestrator/retrieval/rag-retriever'

// ── Internal helper ───────────────────────────────────────────────────────────

function ensureRAGLoaded(): void {
  if (!isRAGLoaded()) loadRAGData()
}

// ── Factory ───────────────────────────────────────────────────────────────────

/**
 * Build the `retrieve_relevant_context` agentic tool wired to the System C
 * RAG retriever.  Pass the returned tool into `callModelAgentic({ tools: [...] })`.
 */
export function buildRAGTool(): AgenticTool {
  ensureRAGLoaded()
  return {
    name:        'retrieve_relevant_context',
    description: 'Retrieve relevant context from the Kealee knowledge base including permit data, cost benchmarks, zoning rules, and workflow guides for DMV construction projects.',
    input_schema: {
      type:       'object',
      properties: {
        query:        { type: 'string', description: 'Natural language query describing the context needed' },
        category:     { type: 'string', description: 'Category filter: permit | cost | zoning | workflow | all (default: all)' },
        projectId:    { type: 'string', description: 'Optional project ID for project-specific context' },
        jurisdiction: { type: 'string', description: 'Jurisdiction string (e.g. "Arlington County, VA")' },
      },
      required: ['query'],
    },
    async handler(input: Record<string, unknown>): Promise<unknown> {
      ensureRAGLoaded()
      const category     = (input.category     as string | undefined) ?? 'all'
      const jurisdiction = (input.jurisdiction as string | undefined) ?? ''
      const query        = (input.query        as string | undefined) ?? ''

      // Infer project type from query — matches getTypeKey() priority order in estimate.bot.ts
      const q = query.toLowerCase()
      const projectType = (q.includes('renov') || q.includes('remodel')) ? 'renovation'
        : q.includes('addition') ? 'addition'
        : (q.includes('new build') || q.includes('new_build') || q.includes('ground.up')) ? 'new_build'
        : (q.includes('multi') || q.includes('apartment')) ? 'multifamily'
        : (q.includes('commercial') || q.includes('office') || q.includes('retail')) ? 'commercial'
        : 'renovation'  // safe default — matches getTypeKey() fallback

      const results: Record<string, unknown[]> = {}

      if (category === 'all' || category === 'permit') {
        results.permits = retrievePermitContext(jurisdiction, projectType)
      }
      if (category === 'all' || category === 'cost') {
        results.costs = retrieveCostContext(projectType, jurisdiction)
      }
      if (category === 'all' || category === 'zoning') {
        results.zoning = retrieveZoningContext(jurisdiction)
      }

      return {
        query,
        category,
        jurisdiction: jurisdiction || '(all DMV)',
        projectType,
        results,
        recordCount: Object.values(results).reduce((sum, arr) => sum + arr.length, 0),
      }
    },
  }
}
