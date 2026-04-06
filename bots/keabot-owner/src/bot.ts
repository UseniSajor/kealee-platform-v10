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
  name: 'keabot-owner',
  description: 'Helps project owners track their projects, understand budgets, and view progress',
  domain: 'owner',
  systemPrompt: `You are KeaBot Owner, a specialized assistant for project owners on the Kealee Platform.
You help project owners track their projects, understand budgets, and view progress.

Your capabilities:
- List and search a user's projects
- Show detailed project information including timelines, budgets, and milestones
- Provide budget summaries with spend-to-date and forecasts
- Track milestone completion and upcoming deadlines

Rules:
- ALWAYS call retrieve_relevant_context to pull relevant project history and context
- Always call OS service APIs for data operations (never access DB directly)
- If a request falls outside your domain, hand off to the appropriate bot
- Present financial data clearly with context (percentage complete, burn rate)
- Be concise and action-oriented`,
};

export class KeaBotOwner extends KeaBot {
  constructor() { super(CONFIG); }

  async initialize(): Promise<void> {
    this.registerTool({
      name: RETRIEVE_CONTEXT_TOOL_DEF.name,
      description: RETRIEVE_CONTEXT_TOOL_DEF.description,
      parameters: RETRIEVE_CONTEXT_TOOL_DEF.parameters as any,
      handler: RETRIEVE_CONTEXT_TOOL_DEF.handler as any,
    });

    this.registerTool({
      name: 'get_my_projects',
      description: 'Get a list of all projects owned by the current user',
      parameters: {
        status: { type: 'string', description: 'Filter by status: active, completed, paused, all', required: false },
        userId: { type: 'string', description: 'User ID to filter projects', required: false },
      },
      handler: async (params) => {
        const status = (params.status as string) || 'active';
        const userId = params.userId as string | undefined;
        const query = [status !== 'all' ? `status=${status}` : '', userId ? `userId=${userId}` : ''].filter(Boolean).join('&');
        const data = await apiGet(`/projects${query ? '?' + query : ''}`);
        if (data) return data;
        return { projects: [], filter: status, note: 'Use retrieve_relevant_context with projectId for project details.' };
      },
    });

    this.registerTool({
      name: 'get_project_detail',
      description: 'Get detailed information about a specific project',
      parameters: {
        projectId: { type: 'string', description: 'The project ID', required: true },
      },
      handler: async (params) => {
        const data = await apiGet(`/projects/${params.projectId}`);
        if (data) return data;
        return { id: params.projectId, note: 'Project not found via API. Use retrieve_relevant_context with projectId.' };
      },
    });

    this.registerTool({
      name: 'get_project_timeline',
      description: 'Get the project timeline with phases and key dates',
      parameters: {
        projectId: { type: 'string', description: 'The project ID', required: true },
      },
      handler: async (params) => {
        const data = await apiGet(`/projects/${params.projectId}/timeline`);
        if (data) return data;
        return { projectId: params.projectId, phases: [], note: 'Timeline unavailable via API.' };
      },
    });

    this.registerTool({
      name: 'get_budget_summary',
      description: 'Get budget summary for a project including spend-to-date and forecast',
      parameters: {
        projectId: { type: 'string', description: 'The project ID', required: true },
      },
      handler: async (params) => {
        const data = await apiGet(`/projects/${params.projectId}/budget`);
        if (data) return data;
        return { projectId: params.projectId, note: 'Budget data unavailable. Use retrieve_relevant_context with projectId for budget context.' };
      },
    });

    this.registerTool({
      name: 'get_milestones',
      description: 'Get milestone status and upcoming deadlines for a project',
      parameters: {
        projectId: { type: 'string', description: 'The project ID', required: true },
        status: { type: 'string', description: 'Filter: completed, upcoming, overdue, all', required: false },
      },
      handler: async (params) => {
        const data = await apiGet(`/projects/${params.projectId}/milestones${params.status ? `?status=${params.status}` : ''}`);
        if (data) return data;
        return { projectId: params.projectId, milestones: [], note: 'Milestone data unavailable via API.' };
      },
    });
  }

  async handleMessage(message: string, context?: Record<string, unknown>): Promise<string> {
    return this.chat(message, context);
  }

  shouldHandoff(message: string): HandoffRequest | null {
    const lower = message.toLowerCase();
    if (/\b(bid|subcontractor|crew|compliance)\b/.test(lower)) return { fromBot: this.name, toBot: 'keabot-gc', reason: 'GC operations topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    if (/\b(payment|escrow|lien waiver|retainage)\b/.test(lower)) return { fromBot: this.name, toBot: 'keabot-payments', reason: 'Payments topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    if (/\b(permit|inspection schedule|building department)\b/.test(lower)) return { fromBot: this.name, toBot: 'keabot-permit', reason: 'Permit topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    if (/\b(estimate|takeoff|cost lookup|rsmeans)\b/.test(lower)) return { fromBot: this.name, toBot: 'keabot-estimate', reason: 'Estimation topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    return null;
  }
}
