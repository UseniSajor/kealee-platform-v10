import { KeaBot, BotConfig, HandoffRequest } from '@kealee/core-bots';
import { createServiceClient, ServiceClient, SERVICE_ROUTES } from '@kealee/bot-service-client';

const CONFIG: BotConfig = {
  name: 'keabot-finance',
  description: 'Assists with project finance: capital stacks, draw management, investor reporting',
  domain: 'finance',
  systemPrompt: `You are KeaBot Finance, a specialized assistant for project finance and lending on the Kealee Platform.
You assist with project finance: capital stacks, draw management, investor reporting.

Your capabilities:
- Build and optimize capital stack structures (senior debt, mezz, equity)
- Track construction draw requests and disbursements
- Generate investor reports with returns and milestones
- Calculate project-level and fund-level returns
- Assess lending eligibility and debt service coverage

Rules:
- Always call OS service APIs for data operations (never access DB directly)
- If a request falls outside your domain, hand off to the appropriate bot
- Present financial data with proper precision and context
- Clearly distinguish between projected and actual figures
- Be concise and action-oriented`,
};

export class KeaBotFinance extends KeaBot {
  private api: ServiceClient;

  constructor(apiOverride?: ServiceClient) {
    super(CONFIG);
    this.api = apiOverride ?? createServiceClient();
  }

  async initialize(): Promise<void> {
    this.registerTool({
      name: 'build_capital_stack',
      description: 'Build or view the capital stack structure for a project',
      parameters: {
        projectId: { type: 'string', description: 'The project ID', required: true },
        totalProjectCost: { type: 'number', description: 'Total project cost (for new stacks)', required: false },
      },
      handler: async (params) => {
        const projectId = params.projectId as string;
        const totalProjectCost = params.totalProjectCost as number | undefined;

        if (totalProjectCost) {
          const res = await this.api.post(SERVICE_ROUTES.dev.createCapitalStack(), { projectId, totalProjectCost });
          if (!res.ok) return { error: `Failed to create capital stack: ${res.error}` };
          return res.data;
        }

        const res = await this.api.get(SERVICE_ROUTES.dev.capitalStack(projectId));
        if (!res.ok) return { error: `Failed to fetch capital stack: ${res.error}` };
        return res.data;
      },
    });

    this.registerTool({
      name: 'track_draws',
      description: 'Track construction draw requests, disbursements, and remaining balance',
      parameters: {
        projectId: { type: 'string', description: 'The project ID', required: true },
        drawNumber: { type: 'number', description: 'Specific draw number to view (optional)', required: false },
      },
      handler: async (params) => {
        const projectId = params.projectId as string;
        const drawNumber = params.drawNumber as number | undefined;

        const res = await this.api.get(SERVICE_ROUTES.payments.draws(projectId), { drawNumber });
        if (!res.ok) return { error: `Failed to fetch draws: ${res.error}` };
        return res.data;
      },
    });

    this.registerTool({
      name: 'generate_investor_report',
      description: 'Generate an investor report with project status, financials, and projected returns',
      parameters: {
        projectId: { type: 'string', description: 'The project ID', required: true },
        period: { type: 'string', description: 'Reporting period: monthly, quarterly', required: false },
      },
      handler: async (params) => {
        const projectId = params.projectId as string;
        const period = (params.period as string) || 'quarterly';

        const res = await this.api.post(SERVICE_ROUTES.dev.createInvestorReport(), { projectId, period });
        if (!res.ok) return { error: `Failed to generate investor report: ${res.error}` };
        return res.data;
      },
    });
  }

  async handleMessage(message: string, context?: Record<string, unknown>): Promise<string> {
    return this.chat(message, context);
  }

  shouldHandoff(message: string): HandoffRequest | null {
    const lower = message.toLowerCase();

    if (/\b(feasibility|proforma|scenario model|go.no.go)\b/.test(lower)) {
      return { fromBot: this.name, toBot: 'keabot-feasibility', reason: 'Feasibility topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    }
    if (/\b(portfolio|entitlement|development pipeline)\b/.test(lower)) {
      return { fromBot: this.name, toBot: 'keabot-developer', reason: 'Developer/investor topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    }
    if (/\b(payment|escrow|lien waiver|retainage)\b/.test(lower)) {
      return { fromBot: this.name, toBot: 'keabot-payments', reason: 'Payments topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    }

    return null;
  }
}
