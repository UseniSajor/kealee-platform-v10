import { KeaBot, BotConfig, HandoffRequest } from '@kealee/core-bots';
import { RETRIEVE_CONTEXT_TOOL_DEF } from '@kealee/ai/tools/retrieve-relevant-context.js';

const API_BASE = process.env.API_BASE_URL ?? 'https://kealee-platform-v10-staging.up.railway.app'

async function apiGet(path: string): Promise<unknown> {
  try {
    const res = await fetch(`${API_BASE}${path}`, { headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(10000) })
    if (!res.ok) return null
    return res.json()
  } catch { return null }
}

async function apiPost(path: string, body: unknown): Promise<unknown> {
  try {
    const res = await fetch(`${API_BASE}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(10000) })
    if (!res.ok) return null
    return res.json()
  } catch { return null }
}

const CONFIG: BotConfig = {
  name: 'keabot-feasibility',
  description: 'Assists with feasibility analysis: scenario modeling, proformas, go/no-go decisions',
  domain: 'feasibility',
  systemPrompt: `You are KeaBot Feasibility, a specialized assistant for feasibility analysis on the Kealee Platform.
You assist with feasibility analysis: scenario modeling, proformas, go/no-go decisions.

Your capabilities:
- Create and manage feasibility studies for development projects
- Run scenario models with variable assumptions (rents, costs, cap rates)
- Generate development proformas with full capital stack analysis
- Compare development options side-by-side
- Assess project viability with go/no-go recommendations

Rules:
- ALWAYS call retrieve_relevant_context FIRST to find comparable projects and estimates
- Always call OS service APIs for data operations (never access DB directly)
- If a request falls outside your domain, hand off to the appropriate bot
- Present financial scenarios with clear assumptions and sensitivity analysis
- Be concise and action-oriented`,
};

export class KeaBotFeasibility extends KeaBot {
  constructor() { super(CONFIG); }

  async initialize(): Promise<void> {
    this.registerTool({
      name: RETRIEVE_CONTEXT_TOOL_DEF.name,
      description: RETRIEVE_CONTEXT_TOOL_DEF.description,
      parameters: RETRIEVE_CONTEXT_TOOL_DEF.parameters as any,
      handler: RETRIEVE_CONTEXT_TOOL_DEF.handler as any,
    });

    this.registerTool({
      name: 'create_study',
      description: 'Create a new feasibility study for a project or parcel',
      parameters: {
        parcelId: { type: 'string', description: 'The parcel ID to study', required: true },
        developmentType: { type: 'string', description: 'Development type: residential, commercial, mixed-use, industrial', required: true },
        assumptions: { type: 'string', description: 'JSON string of key assumptions (optional overrides)', required: false },
      },
      handler: async (params) => {
        const data = await apiPost('/api/v1/feasibility/study', {
          parcelId: params.parcelId,
          developmentType: params.developmentType,
          assumptions: params.assumptions ? JSON.parse(params.assumptions as string) : undefined,
        });
        if (data) return data;
        return {
          studyId: null,
          parcelId: params.parcelId,
          developmentType: params.developmentType,
          status: 'pending',
          note: 'Study creation queued. Use retrieve_relevant_context to find comparable projects for cost basis.',
        };
      },
    });

    this.registerTool({
      name: 'run_scenarios',
      description: 'Run multiple scenario models varying key assumptions',
      parameters: {
        studyId: { type: 'string', description: 'The feasibility study ID', required: true },
        variable: { type: 'string', description: 'Variable to test: rent, cost, cap_rate, occupancy', required: true },
      },
      handler: async (params) => {
        const data = await apiGet(`/api/v1/feasibility/${params.studyId}/scenarios?variable=${params.variable}`);
        if (data) return data;
        return {
          studyId: params.studyId,
          variable: params.variable,
          note: 'Use retrieve_relevant_context with serviceType="estimate" to find comparable project costs for scenario modeling.',
        };
      },
    });

    this.registerTool({
      name: 'generate_proforma',
      description: 'Generate a full development proforma with sources and uses, revenue projections, and returns',
      parameters: {
        studyId: { type: 'string', description: 'The feasibility study ID', required: true },
        scenario: { type: 'string', description: 'Scenario to use: bear, base, bull', required: false },
      },
      handler: async (params) => {
        const data = await apiGet(`/api/v1/feasibility/${params.studyId}/proforma?scenario=${params.scenario ?? 'base'}`);
        if (data) return data;
        return {
          studyId: params.studyId,
          scenario: (params.scenario as string) || 'base',
          note: 'Proforma generation requires study data. Use retrieve_relevant_context for comparable project financials.',
        };
      },
    });
  }

  async handleMessage(message: string, context?: Record<string, unknown>): Promise<string> {
    return this.chat(message, context);
  }

  shouldHandoff(message: string): HandoffRequest | null {
    const lower = message.toLowerCase();
    if (/\b(parcel|zoning|land search|lot size)\b/.test(lower)) return { fromBot: this.name, toBot: 'keabot-land', reason: 'Land intelligence topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    if (/\b(capital stack|draw request|investor report|lending)\b/.test(lower)) return { fromBot: this.name, toBot: 'keabot-finance', reason: 'Finance topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    if (/\b(estimate|takeoff|rsmeans|bid comparison)\b/.test(lower)) return { fromBot: this.name, toBot: 'keabot-estimate', reason: 'Estimation topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    return null;
  }
}
