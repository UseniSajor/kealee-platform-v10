import { KeaBot, BotConfig, HandoffRequest } from '@kealee/core-bots';

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
- Never return sample parcels, zoning values, dimensions, scores, or market facts as live data
- When an OS service or authoritative source is unavailable, return a source-required status
- If a request falls outside your domain, hand off to the appropriate bot
- Present parcel data with context (comparable sales, market trends)
- Be concise and action-oriented`,
};

export class KeaBotLand extends KeaBot {
  constructor() {
    super(CONFIG);
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
        return {
          query: { location: params.location, minAcres: params.minAcres, maxPrice: params.maxPrice, zoning: params.zoning },
          status: 'SOURCE_REQUIRED',
          results: [],
          totalResults: 0,
          missingSource: 'OS-Land parcel-search provider',
          message: 'No authoritative parcel provider result is attached. Connect or query OS-Land before presenting parcel facts.',
        };
      },
    });

    this.registerTool({
      name: 'analyze_zoning',
      description: 'Analyze zoning designation for a parcel including permitted uses and constraints',
      parameters: {
        parcelId: { type: 'string', description: 'The parcel ID to analyze', required: true },
      },
      handler: async (params) => {
        return {
          parcelId: params.parcelId,
          status: 'SOURCE_REQUIRED',
          verified: false,
          missingSource: 'Versioned OS-Land zoning profile and authoritative ordinance citation',
          message: 'Zoning cannot be analyzed until a jurisdiction/effective-date rule source is attached.',
        };
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
        return {
          parcelId: params.parcelId,
          developmentType: params.developmentType,
          status: 'SOURCE_REQUIRED',
          score: null,
          missingSources: ['parcel geometry', 'versioned zoning rules', 'market inputs', 'utility/constraint data'],
          message: 'Development potential requires deterministic OS-Land and OS-Feasibility results with cited sources.',
        };
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
