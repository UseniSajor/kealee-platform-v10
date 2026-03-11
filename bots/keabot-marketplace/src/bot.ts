import { KeaBot, BotConfig, HandoffRequest } from '@kealee/core-bots';
import { createServiceClient, ServiceClient, SERVICE_ROUTES } from '@kealee/bot-service-client';

const CONFIG: BotConfig = {
  name: 'keabot-marketplace',
  description: 'Helps with contractor marketplace: finding, vetting, and matching contractors',
  domain: 'marketplace',
  systemPrompt: `You are KeaBot Marketplace, a specialized assistant for the contractor marketplace on the Kealee Platform.
You help with contractor marketplace: finding, vetting, and matching contractors.

Your capabilities:
- Search for contractors by trade, location, availability, and rating
- Match contractor skills and certifications to project requirements
- Verify credentials, insurance, and licensing status
- Compare contractor bids and performance history
- Track contractor performance ratings and reviews

Rules:
- Always call OS service APIs for data operations (never access DB directly)
- If a request falls outside your domain, hand off to the appropriate bot
- Always include verification status when presenting contractor information
- Be concise and action-oriented`,
};

export class KeaBotMarketplace extends KeaBot {
  private api: ServiceClient;

  constructor(apiOverride?: ServiceClient) {
    super(CONFIG);
    this.api = apiOverride ?? createServiceClient();
  }

  async initialize(): Promise<void> {
    this.registerTool({
      name: 'search_contractors',
      description: 'Search for contractors by trade, location, availability, and minimum rating',
      parameters: {
        trade: { type: 'string', description: 'Trade or specialty (e.g., Plumbing, Electrical, HVAC, General)', required: true },
        location: { type: 'string', description: 'Service area (city, zip, or radius)', required: false },
        minRating: { type: 'number', description: 'Minimum rating (1-5 scale)', required: false },
      },
      handler: async (params) => {
        const trade = params.trade as string;
        const location = params.location as string | undefined;
        const minRating = params.minRating as number | undefined;

        const res = await this.api.get(SERVICE_ROUTES.marketplace.contractors(), {
          trade, location, minRating,
        });
        if (!res.ok) return { error: `Failed to search contractors: ${res.error}` };
        return res.data;
      },
    });

    this.registerTool({
      name: 'match_skills',
      description: 'Match contractor skills and certifications to specific project requirements',
      parameters: {
        projectId: { type: 'string', description: 'The project ID with requirements', required: true },
        trade: { type: 'string', description: 'Trade to match', required: true },
        certifications: { type: 'string', description: 'Comma-separated required certifications', required: false },
      },
      handler: async (params) => {
        const projectId = params.projectId as string;
        const trade = params.trade as string;
        const certifications = params.certifications as string | undefined;

        const res = await this.api.get(SERVICE_ROUTES.marketplace.contractors(), {
          trade, projectId, certifications,
        });
        if (!res.ok) return { error: `Failed to match contractors: ${res.error}` };
        return res.data;
      },
    });

    this.registerTool({
      name: 'verify_credentials',
      description: 'Verify contractor credentials, insurance, and licensing status',
      parameters: {
        contractorId: { type: 'string', description: 'The contractor ID to verify', required: true },
      },
      handler: async (params) => {
        const contractorId = params.contractorId as string;
        const res = await this.api.get(SERVICE_ROUTES.marketplace.contractorDetail(contractorId));
        if (!res.ok) return { error: `Failed to verify credentials: ${res.error}` };
        return res.data;
      },
    });
  }

  async handleMessage(message: string, context?: Record<string, unknown>): Promise<string> {
    return this.chat(message, context);
  }

  shouldHandoff(message: string): HandoffRequest | null {
    const lower = message.toLowerCase();

    if (/\b(bid management|coordinate sub|crew scheduling)\b/.test(lower)) {
      return { fromBot: this.name, toBot: 'keabot-gc', reason: 'GC operations topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    }
    if (/\b(estimate|takeoff|cost comparison)\b/.test(lower)) {
      return { fromBot: this.name, toBot: 'keabot-estimate', reason: 'Estimation topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    }
    if (/\b(payment|escrow|lien waiver)\b/.test(lower)) {
      return { fromBot: this.name, toBot: 'keabot-payments', reason: 'Payments topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    }

    return null;
  }
}
