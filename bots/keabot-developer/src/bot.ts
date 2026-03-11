import { KeaBot, BotConfig, HandoffRequest } from '@kealee/core-bots';
import { createServiceClient, ServiceClient, SERVICE_ROUTES } from '@kealee/bot-service-client';

const CONFIG: BotConfig = {
  name: 'keabot-developer',
  description: 'Assists developers/investors with portfolio tracking, returns analysis, and entitlements',
  domain: 'developer',
  systemPrompt: `You are KeaBot Developer, a specialized assistant for developers and investors on the Kealee Platform.
You assist developers/investors with portfolio tracking, returns, and entitlements.

Your capabilities:
- Review and analyze development portfolios across multiple projects
- Calculate and compare returns (IRR, equity multiple, cash-on-cash) across projects
- Track entitlement status and regulatory milestones
- Monitor project health metrics and flag risks
- Generate portfolio-level and project-level reports

Rules:
- Always call OS service APIs for data operations (never access DB directly)
- If a request falls outside your domain, hand off to the appropriate bot
- Present portfolio data with benchmarks and comparables
- Be concise and action-oriented`,
};

export class KeaBotDeveloper extends KeaBot {
  private api: ServiceClient;

  constructor(apiOverride?: ServiceClient) {
    super(CONFIG);
    this.api = apiOverride ?? createServiceClient();
  }

  async initialize(): Promise<void> {
    this.registerTool({
      name: 'review_portfolio',
      description: 'Review the developer portfolio with project summaries and overall metrics',
      parameters: {
        developerId: { type: 'string', description: 'The developer or investment entity ID', required: true },
        status: { type: 'string', description: 'Filter: active, completed, pipeline, all', required: false },
      },
      handler: async (params) => {
        const developerId = params.developerId as string;
        const status = params.status as string | undefined;

        const res = await this.api.get(SERVICE_ROUTES.projects.list(), { ownerId: developerId, status });
        if (!res.ok) return { error: `Failed to fetch portfolio: ${res.error}` };
        return res.data;
      },
    });

    this.registerTool({
      name: 'analyze_returns',
      description: 'Deep-dive analysis of returns for a specific project or the full portfolio',
      parameters: {
        projectId: { type: 'string', description: 'Project ID (omit for portfolio-level)', required: false },
        developerId: { type: 'string', description: 'Developer ID for portfolio analysis', required: false },
      },
      handler: async (params) => {
        const projectId = params.projectId as string | undefined;

        if (projectId) {
          const res = await this.api.get(SERVICE_ROUTES.payments.summary(projectId));
          if (!res.ok) return { error: `Failed to fetch returns: ${res.error}` };
          return res.data;
        }

        const developerId = params.developerId as string | undefined;
        const res = await this.api.get(SERVICE_ROUTES.projects.list(), { ownerId: developerId });
        if (!res.ok) return { error: `Failed to fetch portfolio returns: ${res.error}` };
        return res.data;
      },
    });

    this.registerTool({
      name: 'track_entitlements',
      description: 'Track entitlement and regulatory approval status for development projects',
      parameters: {
        projectId: { type: 'string', description: 'The project ID', required: true },
      },
      handler: async (params) => {
        const projectId = params.projectId as string;
        const res = await this.api.get(SERVICE_ROUTES.dev.entitlements(projectId));
        if (!res.ok) return { error: `Failed to fetch entitlements: ${res.error}` };
        return res.data;
      },
    });
  }

  async handleMessage(message: string, context?: Record<string, unknown>): Promise<string> {
    return this.chat(message, context);
  }

  shouldHandoff(message: string): HandoffRequest | null {
    const lower = message.toLowerCase();

    if (/\b(capital stack|draw request|lending|debt service)\b/.test(lower)) {
      return { fromBot: this.name, toBot: 'keabot-finance', reason: 'Finance topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    }
    if (/\b(feasibility|proforma|scenario model)\b/.test(lower)) {
      return { fromBot: this.name, toBot: 'keabot-feasibility', reason: 'Feasibility topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    }
    if (/\b(parcel|zoning|land search|acquisition)\b/.test(lower)) {
      return { fromBot: this.name, toBot: 'keabot-land', reason: 'Land intelligence topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    }

    return null;
  }
}
