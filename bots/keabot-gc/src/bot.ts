import { KeaBot, BotConfig, HandoffRequest } from '@kealee/core-bots';
import { createServiceClient, ServiceClient, SERVICE_ROUTES } from '@kealee/bot-service-client';

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
- Always call OS service APIs for data operations (never access DB directly)
- If a request falls outside your domain, hand off to the appropriate bot
- Distinguish between GC operations (your domain) and construction execution (keabot-construction)
- Be concise and action-oriented`,
};

export class KeaBotGC extends KeaBot {
  private api: ServiceClient;

  constructor(apiOverride?: ServiceClient) {
    super(CONFIG);
    this.api = apiOverride ?? createServiceClient();
  }

  async initialize(): Promise<void> {
    this.registerTool({
      name: 'manage_bids',
      description: 'Manage bid packages: list, create, compare, or award bids for a project scope',
      parameters: {
        projectId: { type: 'string', description: 'The project ID', required: true },
        action: { type: 'string', description: 'Action: list, create, compare, award', required: true },
        scopeId: { type: 'string', description: 'Scope/trade package ID', required: false },
      },
      handler: async (params) => {
        const projectId = params.projectId as string;
        const action = params.action as string;
        const scopeId = params.scopeId as string | undefined;

        if (action === 'list') {
          const res = await this.api.get(SERVICE_ROUTES.bids.list(), { projectId, scopeId });
          if (!res.ok) return { error: `Failed to list bids: ${res.error}` };
          return res.data;
        }

        if (action === 'create') {
          const res = await this.api.post(SERVICE_ROUTES.bids.create(), { projectId, scopeId });
          if (!res.ok) return { error: `Failed to create bid: ${res.error}` };
          return res.data;
        }

        if (action === 'compare') {
          const res = await this.api.get(SERVICE_ROUTES.bids.pipeline(), { projectId, scopeId });
          if (!res.ok) return { error: `Failed to compare bids: ${res.error}` };
          return res.data;
        }

        if (scopeId) {
          const res = await this.api.post(SERVICE_ROUTES.bids.analyze(scopeId), { projectId });
          if (!res.ok) return { error: `Failed to analyze bid: ${res.error}` };
          return res.data;
        }

        return { error: `Unknown bid action: ${action}` };
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
        const projectId = params.projectId as string;
        const subId = params.subId as string | undefined;
        const res = await this.api.get(SERVICE_ROUTES.pm.tasks(), { projectId, assignee: subId, type: 'sub_coordination' });
        if (!res.ok) return { error: `Failed to fetch sub coordination data: ${res.error}` };
        return res.data;
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
        const projectId = params.projectId as string;
        const complianceType = params.type as string | undefined;
        const res = await this.api.get(SERVICE_ROUTES.compliance.alerts(), { projectId, type: complianceType });
        if (!res.ok) return { error: `Failed to fetch compliance data: ${res.error}` };
        return res.data;
      },
    });
  }

  async handleMessage(message: string, context?: Record<string, unknown>): Promise<string> {
    return this.chat(message, context);
  }

  shouldHandoff(message: string): HandoffRequest | null {
    const lower = message.toLowerCase();

    if (/\b(daily log|progress track|inspection readiness|weather impact)\b/.test(lower)) {
      return { fromBot: this.name, toBot: 'keabot-construction', reason: 'Construction execution topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    }
    if (/\b(payment|escrow|lien waiver|draw request)\b/.test(lower)) {
      return { fromBot: this.name, toBot: 'keabot-payments', reason: 'Payments topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    }
    if (/\b(estimate|takeoff|rsmeans|cost lookup)\b/.test(lower)) {
      return { fromBot: this.name, toBot: 'keabot-estimate', reason: 'Estimation topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    }
    if (/\b(find contractor|marketplace|match skills)\b/.test(lower)) {
      return { fromBot: this.name, toBot: 'keabot-marketplace', reason: 'Marketplace topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    }

    return null;
  }
}
