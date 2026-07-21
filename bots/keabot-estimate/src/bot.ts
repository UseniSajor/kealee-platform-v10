import { KeaBot, BotConfig, HandoffRequest } from '@kealee/core-bots';
import { RETRIEVE_CONTEXT_TOOL_DEF } from '@kealee/ai/tools/retrieve-relevant-context';

const API_BASE = process.env.API_BASE_URL ?? 'https://kealee-platform-v10-staging.up.railway.app'

async function apiPost(path: string, body: unknown): Promise<unknown> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return null
    return res.json()
  } catch { return null }
}

async function apiGet(path: string): Promise<unknown> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return null
    return res.json()
  } catch { return null }
}

const CONFIG: BotConfig = {
  name: 'keabot-estimate',
  description: 'Assists with cost estimation: RSMeans lookups, takeoffs, bid analysis, value engineering',
  domain: 'estimate',
  systemPrompt: `You are KeaBot Estimate, a specialized assistant for construction cost estimation on the Kealee Platform.
You assist with cost estimation: RSMeans lookups, takeoffs, bid analysis, value engineering.

Your capabilities:
- Create detailed construction cost estimates by CSI division
- Look up unit costs from RSMeans and local cost databases
- Analyze and compare bids across multiple contractors
- Generate quantity takeoffs from project specifications
- Perform value engineering analysis to optimize costs

Rules:
- ALWAYS call retrieve_relevant_context FIRST before answering any cost or estimation question
- Always call OS service APIs for data operations (never access DB directly)
- If a request falls outside your domain, hand off to the appropriate bot
- Always specify the cost basis (RSMeans year, location factor, labor rates)
- Present costs with appropriate contingency ranges
- Be concise and action-oriented`,
};

export class KeaBotEstimate extends KeaBot {
  constructor() {
    super(CONFIG);
  }

  async initialize(): Promise<void> {
    this.registerTool({
      name: RETRIEVE_CONTEXT_TOOL_DEF.name,
      description: RETRIEVE_CONTEXT_TOOL_DEF.description,
      parameters: RETRIEVE_CONTEXT_TOOL_DEF.parameters as any,
      handler: RETRIEVE_CONTEXT_TOOL_DEF.handler as any,
    });

    this.registerTool({
      name: 'create_estimate',
      description: 'Create a new construction cost estimate for a project or scope of work',
      parameters: {
        projectId: { type: 'string', description: 'The project ID', required: true },
        scope: { type: 'string', description: 'Scope description or CSI division codes', required: true },
        estimateType: { type: 'string', description: 'Type: conceptual, schematic, detailed, bid_check', required: false },
      },
      handler: async (params) => {
        const estimateType = (params.estimateType as string) || 'schematic';
        const data = await apiPost('/estimation/estimate', {
          projectId: params.projectId,
          scope: params.scope,
          estimateType,
        });
        if (data) return data;
        return {
          estimateId: null,
          projectId: params.projectId,
          type: estimateType,
          scope: params.scope,
          status: 'pending_api',
          note: 'Estimate creation queued. Use retrieve_relevant_context with serviceType="estimate" for cost guidance.',
          accuracyRange: estimateType === 'conceptual' ? '+/- 25%' : estimateType === 'schematic' ? '+/- 15%' : '+/- 5%',
        };
      },
    });

    this.registerTool({
      name: 'lookup_costs',
      description: 'Look up unit costs from RSMeans or local cost databases',
      parameters: {
        item: { type: 'string', description: 'Cost item description or RSMeans code', required: true },
        location: { type: 'string', description: 'Location for cost adjustment (city or zip)', required: false },
        quantity: { type: 'number', description: 'Quantity for total cost calculation', required: false },
      },
      handler: async (params) => {
        const data = await apiGet(
          `/estimation/data/costs?item=${encodeURIComponent(params.item as string)}&location=${encodeURIComponent((params.location as string) ?? '')}`
        );
        if (data) return data;
        return {
          item: params.item,
          location: (params.location as string) || 'DMV Metro Area',
          note: 'Use retrieve_relevant_context with serviceType="estimate" to find cost comparables from past Kealee projects.',
          source: 'RSMeans 2026 (pending API connection)',
        };
      },
    });

    this.registerTool({
      name: 'analyze_bid_comparison',
      description: 'Compare bids from multiple contractors for a scope of work',
      parameters: {
        projectId: { type: 'string', description: 'The project ID', required: true },
        scopeId: { type: 'string', description: 'The bid scope/trade package ID', required: true },
      },
      handler: async (params) => {
        const data = await apiGet(`/estimation/project/${params.projectId}?scopeId=${params.scopeId}`);
        if (data) return data;
        return {
          projectId: params.projectId,
          scopeId: params.scopeId,
          note: 'Use retrieve_relevant_context with projectId to find historical bid data for this project.',
        };
      },
    });
  }

  async handleMessage(message: string, context?: Record<string, unknown>): Promise<string> {
    return this.chat(message, context);
  }

  shouldHandoff(message: string): HandoffRequest | null {
    const lower = message.toLowerCase();
    if (/\b(bid management|subcontractor|crew scheduling)\b/.test(lower)) {
      return { fromBot: this.name, toBot: 'keabot-gc', reason: 'GC operations topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    }
    if (/\b(feasibility|proforma|scenario model)\b/.test(lower)) {
      return { fromBot: this.name, toBot: 'keabot-feasibility', reason: 'Feasibility topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    }
    if (/\b(payment|escrow|milestone payment)\b/.test(lower)) {
      return { fromBot: this.name, toBot: 'keabot-payments', reason: 'Payments topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    }
    return null;
  }
}
