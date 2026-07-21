import { KeaBot, BotConfig, HandoffRequest } from '@kealee/core-bots';
import { RETRIEVE_CONTEXT_TOOL_DEF } from '@kealee/ai/tools/retrieve-relevant-context';

const API_BASE = process.env.API_BASE_URL ?? 'https://kealee-platform-v10-staging.up.railway.app'

async function apiGet(path: string): Promise<unknown> {
  try {
    const res = await fetch(`${API_BASE}${path}`, { headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(10000) })
    if (!res.ok) return null
    return res.json()
  } catch { return null }
}

const CONFIG: BotConfig = {
  name: 'keabot-gc',
  description: 'Handles GC business operations: bid management, sub coordination, compliance, crew scheduling',
  domain: 'gc',
  systemPrompt: `You are KeaBot GC, a specialized assistant for general contractor business operations on the Kealee Platform.
You handle GC business operations: bid management, sub coordination, compliance, crew scheduling.

Your capabilities:
- Manage bid packages and bid comparisons
- Coordinate subcontractor communications and scheduling
- Check regulatory and insurance compliance status
- Schedule and manage crew assignments
- Prepare payment applications and draw requests

Rules:
- ALWAYS call retrieve_relevant_context first to find project-specific context and comparable bids
- Always call OS service APIs for data operations (never access DB directly)
- If a request falls outside your domain, hand off to the appropriate bot
- Distinguish between GC operations (your domain) and construction execution (keabot-construction)
- Be concise and action-oriented`,
};

export class KeaBotGC extends KeaBot {
  constructor() { super(CONFIG); }

  async initialize(): Promise<void> {
    this.registerTool({
      name: RETRIEVE_CONTEXT_TOOL_DEF.name,
      description: RETRIEVE_CONTEXT_TOOL_DEF.description,
      parameters: RETRIEVE_CONTEXT_TOOL_DEF.parameters as any,
      handler: RETRIEVE_CONTEXT_TOOL_DEF.handler as any,
    });

    this.registerTool({
      name: 'manage_bids',
      description: 'Manage bid packages: list, create, compare, or award bids for a project scope',
      parameters: {
        projectId: { type: 'string', description: 'The project ID', required: true },
        action: { type: 'string', description: 'Action: list, create, compare, award', required: true },
        scopeId: { type: 'string', description: 'Scope/trade package ID', required: false },
      },
      handler: async (params) => {
        const action = params.action as string;
        if (action === 'list') {
          const data = await apiGet(`/projects/${params.projectId}/bids`);
          if (data) return data;
        } else if (action === 'compare' && params.scopeId) {
          const data = await apiGet(`/projects/${params.projectId}/bids/compare?scopeId=${params.scopeId}`);
          if (data) return data;
        }
        return { projectId: params.projectId, action, note: 'Use retrieve_relevant_context with projectId for bid history.' };
      },
    });

    this.registerTool({
      name: 'coordinate_subs',
      description: 'Coordinate subcontractor activities: status, communications, and scheduling',
      parameters: {
        projectId: { type: 'string', description: 'The project ID', required: true },
        subId: { type: 'string', description: 'Specific subcontractor ID (optional, lists all if omitted)', required: false },
      },
      handler: async (params) => {
        const path = params.subId
          ? `/projects/${params.projectId}/subs/${params.subId}`
          : `/projects/${params.projectId}/subs`;
        const data = await apiGet(path);
        if (data) return data;
        return { projectId: params.projectId, subcontractors: [], note: 'Subcontractor data unavailable via API.' };
      },
    });

    this.registerTool({
      name: 'check_compliance',
      description: 'Check compliance status for insurance, licensing, and safety requirements',
      parameters: {
        projectId: { type: 'string', description: 'The project ID', required: true },
        type: { type: 'string', description: 'Compliance type: insurance, licensing, safety, all', required: false },
      },
      handler: async (params) => {
        const data = await apiGet(`/projects/${params.projectId}/compliance${params.type ? `?type=${params.type}` : ''}`);
        if (data) return data;
        return {
          projectId: params.projectId,
          overall: 'unknown',
          items: [],
          note: 'Compliance data unavailable via API. Check contractor credentials in marketplace.',
        };
      },
    });
  }

  async handleMessage(message: string, context?: Record<string, unknown>): Promise<string> {
    return this.chat(message, context);
  }

  shouldHandoff(message: string): HandoffRequest | null {
    const lower = message.toLowerCase();
    if (/\b(daily log|progress track|inspection readiness|weather impact)\b/.test(lower)) return { fromBot: this.name, toBot: 'keabot-construction', reason: 'Construction execution topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    if (/\b(payment|escrow|lien waiver|draw request)\b/.test(lower)) return { fromBot: this.name, toBot: 'keabot-payments', reason: 'Payments topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    if (/\b(estimate|takeoff|rsmeans|cost lookup)\b/.test(lower)) return { fromBot: this.name, toBot: 'keabot-estimate', reason: 'Estimation topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    if (/\b(find contractor|marketplace|match skills)\b/.test(lower)) return { fromBot: this.name, toBot: 'keabot-marketplace', reason: 'Marketplace topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    return null;
  }
}
