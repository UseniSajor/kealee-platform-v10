import { KeaBot, BotConfig, HandoffRequest } from '@kealee/core-bots';
import { createServiceClient, ServiceClient, SERVICE_ROUTES } from '@kealee/bot-service-client';

const CONFIG: BotConfig = {
  name: 'keabot-land',
  description: 'Assists with land acquisition: parcel analysis, zoning review, development scoring',
  domain: 'land',
  systemPrompt: `You are KeaBot Land, a specialized assistant for land intelligence on the Kealee Platform.
You assist with land acquisition: parcel analysis, zoning review, development scoring.

Your capabilities:
- Search and filter available parcels by location, size, zoning, and price
- Analyze zoning designations and development constraints
- Retrieve tax assessments and market valuations
- Score parcels for development potential based on multiple criteria
- Compare parcels side-by-side for acquisition decisions

Rules:
- Always call OS service APIs for data operations (never access DB directly)
- If a request falls outside your domain, hand off to the appropriate bot
- Present parcel data with context (comparable sales, market trends)
- Be concise and action-oriented`,
};

export class KeaBotLand extends KeaBot {
  private api: ServiceClient;

  constructor(apiOverride?: ServiceClient) {
    super(CONFIG);
    this.api = apiOverride ?? createServiceClient();
  }

  async initialize(): Promise<void> {
    this.registerTool({
      name: 'search_parcels',
      description: 'Search for available parcels by location, size, zoning, and price criteria',
      parameters: {
        location: { type: 'string', description: 'City, county, or zip code to search', required: true },
        minAcres: { type: 'number', description: 'Minimum lot size in acres', required: false },
        maxPrice: { type: 'number', description: 'Maximum price in dollars', required: false },
        zoning: { type: 'string', description: 'Zoning designation filter (e.g., R1, C2, MU)', required: false },
      },
      handler: async (params) => {
        const location = params.location as string;
        const minAcres = params.minAcres as number | undefined;
        const maxPrice = params.maxPrice as number | undefined;
        const zoning = params.zoning as string | undefined;

        const res = await this.api.get(SERVICE_ROUTES.land.parcels(), {
          location, minAcres, maxPrice, zoning,
        });
        if (!res.ok) return { error: `Failed to search parcels: ${res.error}` };
        return res.data;
      },
    });

    this.registerTool({
      name: 'analyze_zoning',
      description: 'Analyze zoning designation for a parcel including permitted uses and constraints',
      parameters: {
        parcelId: { type: 'string', description: 'The parcel ID to analyze', required: true },
      },
      handler: async (params) => {
        const parcelId = params.parcelId as string;
        const res = await this.api.get(SERVICE_ROUTES.land.parcelDetail(parcelId));
        if (!res.ok) return { error: `Failed to fetch parcel zoning: ${res.error}` };
        return res.data;
      },
    });

    this.registerTool({
      name: 'evaluate_development_potential',
      description: 'Score a parcel for development potential based on zoning, location, and market factors',
      parameters: {
        parcelId: { type: 'string', description: 'The parcel ID to evaluate', required: true },
        developmentType: { type: 'string', description: 'Proposed development type: residential, commercial, mixed-use, industrial', required: false },
      },
      handler: async (params) => {
        const parcelId = params.parcelId as string;
        const developmentType = params.developmentType as string | undefined;

        const res = await this.api.post(SERVICE_ROUTES.land.createAssessment(parcelId), { developmentType });
        if (!res.ok) return { error: `Failed to evaluate parcel: ${res.error}` };
        return res.data;
      },
    });
  }

  async handleMessage(message: string, context?: Record<string, unknown>): Promise<string> {
    return this.chat(message, context);
  }

  shouldHandoff(message: string): HandoffRequest | null {
    const lower = message.toLowerCase();

    if (/\b(feasibility study|proforma|scenario model|viability)\b/.test(lower)) {
      return { fromBot: this.name, toBot: 'keabot-feasibility', reason: 'Feasibility analysis topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    }
    if (/\b(capital stack|financing|lending|investor)\b/.test(lower)) {
      return { fromBot: this.name, toBot: 'keabot-finance', reason: 'Finance topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    }
    if (/\b(permit|entitlement|building department)\b/.test(lower)) {
      return { fromBot: this.name, toBot: 'keabot-permit', reason: 'Permit topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    }

    return null;
  }
}
