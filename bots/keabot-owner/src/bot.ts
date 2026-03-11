import { KeaBot, BotConfig, HandoffRequest } from '@kealee/core-bots';
import { createServiceClient, ServiceClient, SERVICE_ROUTES } from '@kealee/bot-service-client';

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
- Always call OS service APIs for data operations (never access DB directly)
- If a request falls outside your domain, hand off to the appropriate bot
- Present financial data clearly with context (percentage complete, burn rate)
- Be concise and action-oriented`,
};

export class KeaBotOwner extends KeaBot {
  private api: ServiceClient;

  constructor(apiOverride?: ServiceClient) {
    super(CONFIG);
    this.api = apiOverride ?? createServiceClient();
  }

  async initialize(): Promise<void> {
    this.registerTool({
      name: 'get_my_projects',
      description: 'Get a list of all projects owned by the current user',
      parameters: {
        status: { type: 'string', description: 'Filter by status: active, completed, paused, all', required: false },
      },
      handler: async (params) => {
        const status = (params.status as string) || 'active';
        const res = await this.api.get(SERVICE_ROUTES.projects.list(), { status });
        if (!res.ok) return { error: `Failed to list projects: ${res.error}` };
        return res.data;
      },
    });

    this.registerTool({
      name: 'get_project_detail',
      description: 'Get detailed information about a specific project',
      parameters: {
        projectId: { type: 'string', description: 'The project ID', required: true },
      },
      handler: async (params) => {
        const projectId = params.projectId as string;
        const res = await this.api.get(SERVICE_ROUTES.projects.detail(projectId));
        if (!res.ok) return { error: `Failed to fetch project: ${res.error}` };
        return res.data;
      },
    });

    this.registerTool({
      name: 'get_project_timeline',
      description: 'Get the project timeline with phases and key dates',
      parameters: {
        projectId: { type: 'string', description: 'The project ID', required: true },
      },
      handler: async (params) => {
        const projectId = params.projectId as string;
        const res = await this.api.get(SERVICE_ROUTES.projects.timeline(projectId), { projectId });
        if (!res.ok) return { error: `Failed to fetch timeline: ${res.error}` };
        return res.data;
      },
    });

    this.registerTool({
      name: 'get_budget_summary',
      description: 'Get budget summary for a project including spend-to-date and forecast',
      parameters: {
        projectId: { type: 'string', description: 'The project ID', required: true },
      },
      handler: async (params) => {
        const projectId = params.projectId as string;
        const res = await this.api.get(SERVICE_ROUTES.payments.summary(projectId));
        if (!res.ok) return { error: `Failed to fetch budget: ${res.error}` };
        return res.data;
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
        const projectId = params.projectId as string;
        const status = params.status as string | undefined;
        const res = await this.api.get(SERVICE_ROUTES.payments.milestones(projectId), { status });
        if (!res.ok) return { error: `Failed to fetch milestones: ${res.error}` };
        return res.data;
      },
    });
  }

  async handleMessage(message: string, context?: Record<string, unknown>): Promise<string> {
    return this.chat(message, context);
  }

  shouldHandoff(message: string): HandoffRequest | null {
    const lower = message.toLowerCase();

    if (/\b(bid|subcontractor|crew|compliance)\b/.test(lower)) {
      return { fromBot: this.name, toBot: 'keabot-gc', reason: 'GC operations topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    }
    if (/\b(payment|escrow|lien waiver|retainage)\b/.test(lower)) {
      return { fromBot: this.name, toBot: 'keabot-payments', reason: 'Payments topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    }
    if (/\b(permit|inspection schedule|building department)\b/.test(lower)) {
      return { fromBot: this.name, toBot: 'keabot-permit', reason: 'Permit topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    }
    if (/\b(estimate|takeoff|cost lookup|rsmeans)\b/.test(lower)) {
      return { fromBot: this.name, toBot: 'keabot-estimate', reason: 'Estimation topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    }

    return null;
  }
}
