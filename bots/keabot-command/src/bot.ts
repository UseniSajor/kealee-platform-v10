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

const DOMAIN_KEYWORDS: Record<string, string[]> = {
  owner: ['my project', 'my budget', 'my timeline', 'project status', 'owner dashboard'],
  gc: ['bid management', 'subcontractor', 'crew scheduling', 'compliance check', 'gc ops'],
  construction: ['daily log', 'progress tracking', 'inspection readiness', 'schedule delay', 'weather impact'],
  land: ['parcel', 'zoning', 'land acquisition', 'assessment', 'development potential'],
  feasibility: ['feasibility study', 'proforma', 'scenario', 'viability', 'go no-go'],
  finance: ['capital stack', 'draw request', 'investor report', 'lending', 'returns'],
  developer: ['portfolio', 'entitlements', 'investor', 'development pipeline'],
  permit: ['permit', 'inspection schedule', 'code compliance', 'building department'],
  estimate: ['estimate', 'takeoff', 'rsmeans', 'cost lookup', 'bid comparison', 'value engineering'],
  payments: ['payment', 'escrow', 'lien waiver', 'retainage', 'milestone payment'],
  marketplace: ['find contractor', 'match skills', 'verify credentials', 'contractor search'],
  operations: ['warranty', 'maintenance', 'work order', 'turnover', 'building monitor'],
};

const CONFIG: BotConfig = {
  name: 'keabot-command',
  description: 'Master orchestrator that routes requests to specialized bots and provides project overview',
  domain: 'command',
  systemPrompt: `You are KeaBot Command, the master orchestrator for the Kealee Platform.
You route user requests to the appropriate specialized bot and provide high-level project overview.

Your capabilities:
- Route messages to the correct specialized bot based on domain
- Provide overall project status and project dashboard health metrics
- List available bots and their capabilities
- Aggregate cross-domain information for executive summaries

Rules:
- ALWAYS call retrieve_relevant_context first to understand the user's context and history
- Always call OS service APIs for data operations (never access DB directly)
- Analyze the user's intent and route to the most appropriate bot
- If the request spans multiple domains, coordinate across bots
- Be concise and action-oriented
- You are the default entry point — only hand off when a specialized bot is clearly better suited`,
};

export class KeaBotCommand extends KeaBot {
  constructor() { super(CONFIG); }

  async initialize(): Promise<void> {
    this.registerTool({
      name: RETRIEVE_CONTEXT_TOOL_DEF.name,
      description: RETRIEVE_CONTEXT_TOOL_DEF.description,
      parameters: RETRIEVE_CONTEXT_TOOL_DEF.parameters as any,
      handler: RETRIEVE_CONTEXT_TOOL_DEF.handler as any,
    });

    this.registerTool({
      name: 'route_to_bot',
      description: 'Route a user message to a specialized bot by domain name',
      parameters: {
        domain: { type: 'string', description: 'Target bot domain (e.g. "land", "finance", "construction")', required: true },
        message: { type: 'string', description: 'The message to forward to the target bot', required: true },
        context: { type: 'string', description: 'Additional context for the handoff', required: false },
      },
      handler: async (params) => ({
        routed: true,
        targetBot: `keabot-${params.domain as string}`,
        message: (params.message as string).slice(0, 200),
        status: 'pending_handoff',
      }),
    });

    this.registerTool({
      name: 'get_project_status',
      description: 'Get high-level status summary of a project across all domains',
      parameters: {
        projectId: { type: 'string', description: 'The project ID to get status for', required: true },
      },
      handler: async (params) => {
        const data = await apiGet(`/projects/${params.projectId}`) as any;
        if (data) return { projectId: params.projectId, ...data };
        return {
          projectId: params.projectId,
          note: 'Project data unavailable via API. Use retrieve_relevant_context with projectId for project history.',
        };
      },
    });

    this.registerTool({
      name: 'get_twin_health',
      description: 'Get the project dashboard health score and component status',
      parameters: {
        projectId: { type: 'string', description: 'The project ID', required: true },
      },
      handler: async (params) => {
        const data = await apiGet(`/api/v1/twins/${params.projectId}/health`);
        if (data) return data;
        return {
          projectId: params.projectId,
          note: 'Project dashboard health unavailable. Use retrieve_relevant_context for recent project updates.',
        };
      },
    });

    this.registerTool({
      name: 'list_bots',
      description: 'List all available specialized bots and their capabilities',
      parameters: {},
      handler: async () => ({
        bots: [
          { name: 'keabot-command', domain: 'command', description: 'Master orchestrator' },
          { name: 'keabot-owner', domain: 'owner', description: 'Project owner assistant' },
          { name: 'keabot-gc', domain: 'gc', description: 'GC operations' },
          { name: 'keabot-construction', domain: 'construction', description: 'Construction execution' },
          { name: 'keabot-land', domain: 'land', description: 'Land intelligence' },
          { name: 'keabot-feasibility', domain: 'feasibility', description: 'Feasibility analysis' },
          { name: 'keabot-finance', domain: 'finance', description: 'Finance/lending' },
          { name: 'keabot-developer', domain: 'developer', description: 'Developer/investor' },
          { name: 'keabot-permit', domain: 'permit', description: 'Permit navigation' },
          { name: 'keabot-estimate', domain: 'estimate', description: 'Estimation assistant' },
          { name: 'keabot-payments', domain: 'payments', description: 'Payments/escrow' },
          { name: 'keabot-marketplace', domain: 'marketplace', description: 'Marketplace matchmaking' },
          { name: 'keabot-operations', domain: 'operations', description: 'Maintenance/warranty' },
        ],
      }),
    });
  }

  async handleMessage(message: string, context?: Record<string, unknown>): Promise<string> {
    return this.chat(message, context);
  }

  shouldHandoff(message: string): HandoffRequest | null {
    const lower = message.toLowerCase();
    for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
      for (const keyword of keywords) {
        if (lower.includes(keyword)) {
          return { fromBot: this.name, toBot: `keabot-${domain}`, reason: `Message contains "${keyword}" which maps to the ${domain} domain`, context: {}, conversationHistory: [{ role: 'user', content: message }] };
        }
      }
    }
    return null;
  }
}
