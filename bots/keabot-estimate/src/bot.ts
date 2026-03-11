import { KeaBot, BotConfig, HandoffRequest } from '@kealee/core-bots';
import { createServiceClient, ServiceClient, SERVICE_ROUTES } from '@kealee/bot-service-client';

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
- Always call OS service APIs for data operations (never access DB directly)
- If a request falls outside your domain, hand off to the appropriate bot
- Always specify the cost basis (RSMeans year, location factor, labor rates)
- Present costs with appropriate contingency ranges
- Be concise and action-oriented`,
};

export class KeaBotEstimate extends KeaBot {
  private api: ServiceClient;

  constructor(apiOverride?: ServiceClient) {
    super(CONFIG);
    this.api = apiOverride ?? createServiceClient();
  }

  async initialize(): Promise<void> {
    this.registerTool({
      name: 'create_estimate',
      description: 'Create a new construction cost estimate for a project or scope of work',
      parameters: {
        projectId: { type: 'string', description: 'The project ID', required: true },
        scope: { type: 'string', description: 'Scope description or CSI division codes', required: true },
        estimateType: { type: 'string', description: 'Type: conceptual, schematic, detailed, bid_check', required: false },
      },
      handler: async (params) => {
        const projectId = params.projectId as string;
        const scope = params.scope as string;
        const estimateType = (params.estimateType as string) || 'schematic';

        const res = await this.api.post(SERVICE_ROUTES.estimation.estimate(), {
          projectId,
          scope,
          estimateType,
        });
        if (!res.ok) return { error: `Failed to create estimate: ${res.error}` };
        return res.data;
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
        const item = params.item as string;
        const location = params.location as string | undefined;
        const quantity = params.quantity as number | undefined;

        const res = await this.api.post(SERVICE_ROUTES.estimation.materials(), {
          item,
          location,
          quantity,
        });
        if (!res.ok) return { error: `Failed to look up costs: ${res.error}` };
        return res.data;
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
        const scopeId = params.scopeId as string;
        const projectId = params.projectId as string;

        const res = await this.api.post(SERVICE_ROUTES.bids.analyze(scopeId), { projectId });
        if (!res.ok) return { error: `Failed to analyze bids: ${res.error}` };
        return res.data;
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
