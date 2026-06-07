/**
 * RAG Tool for KeaBots — retrieve knowledge from seed packs
 * Provides bots with access to jurisdiction, service, rule, and workflow knowledge
 */

import type { BotTool } from './keabot-base';
import { retrieve, retrieveJurisdiction, retrieveServicesByCategory } from '@kealee/core-llm';
import type { RetrievedContextBlock } from '@kealee/core-llm';

export interface RagToolInput {
  query: string;
  sourceTypes?: Array<'intent' | 'workflow' | 'tool' | 'jurisdiction' | 'service' | 'role' | 'rule' | 'prompt' | 'zoning'>;
  jurisdictionCode?: string;
  serviceCategory?: string;
  topK?: number;
}

export interface RagToolOutput {
  blocks: RetrievedContextBlock[];
  summary: string;
  hitCount: number;
  avgScore: number;
}

export function createRagTool(): BotTool {
  return {
    name: 'retrieve_context',
    description: 'Retrieve relevant knowledge from seed packs (jurisdiction rules, services, workflows, zoning). Use when you need authoritative guidance on regulations, costs, timelines, or platform patterns.',
    parameters: {
      query: {
        type: 'string',
        description: 'Search query (e.g., "DC zoning setback requirements" or "kitchen remodel timeline")',
        required: true,
      },
      sourceTypes: {
        type: 'array',
        description: 'Filter by source type: intent, workflow, tool, jurisdiction, service, role, rule, prompt, zoning',
        required: false,
      },
      jurisdictionCode: {
        type: 'string',
        description: 'Boost results for specific jurisdiction (e.g., "DC", "MD_MONTGOMERY")',
        required: false,
      },
      serviceCategory: {
        type: 'string',
        description: 'Filter by service (e.g., "kitchen", "bathroom", "permit")',
        required: false,
      },
      topK: {
        type: 'number',
        description: 'Max results (default: 8)',
        required: false,
      },
    },
    handler: async (params: Record<string, unknown>): Promise<RagToolOutput> => {
      const input = params as unknown as RagToolInput;

      // Jurisdiction-specific retrieval
      if (input.jurisdictionCode && !input.serviceCategory) {
        const blocks = retrieveJurisdiction(input.jurisdictionCode);
        return {
          blocks,
          summary: `Found ${blocks.length} jurisdiction rules for ${input.jurisdictionCode}`,
          hitCount: blocks.length,
          avgScore: blocks.length > 0 ? blocks.reduce((sum, b) => sum + b.score, 0) / blocks.length : 0,
        };
      }

      // Service-specific retrieval
      if (input.serviceCategory) {
        const blocks = retrieveServicesByCategory(input.serviceCategory);
        return {
          blocks,
          summary: `Found ${blocks.length} resources for ${input.serviceCategory} service`,
          hitCount: blocks.length,
          avgScore: blocks.length > 0 ? blocks.reduce((sum, b) => sum + b.score, 0) / blocks.length : 0,
        };
      }

      // General query-based retrieval
      const blocks = retrieve(input.query, {
        sourceTypes: input.sourceTypes,
        topK: input.topK ?? 8,
        jurisdictionCode: input.jurisdictionCode,
      });

      return {
        blocks,
        summary: `Retrieved ${blocks.length} relevant knowledge blocks for: "${input.query}"`,
        hitCount: blocks.length,
        avgScore: blocks.length > 0 ? blocks.reduce((sum, b) => sum + b.score, 0) / blocks.length : 0,
      };
    },
  };
}
