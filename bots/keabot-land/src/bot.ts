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
          results: [
            { parcelId: 'P-2026-001', address: '4500 SE Division St', acres: 1.2, zoning: 'CM2', askingPrice: 1850000, assessedValue: 1620000 },
            { parcelId: 'P-2026-002', address: '2100 NW Industrial Pkwy', acres: 3.5, zoning: 'EG2', askingPrice: 2200000, assessedValue: 1950000 },
          ],
          totalResults: 2,
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
          zoning: 'CM2',
          zoningName: 'Commercial Mixed-Use 2',
          permittedUses: ['Retail', 'Office', 'Residential (multi-family)', 'Restaurant', 'Light industrial'],
          conditionalUses: ['Drive-through', 'Gas station'],
          maxHeight: '75 feet / 6 stories',
          maxFAR: 4.0,
          setbacks: { front: 0, side: 0, rear: 5 },
          parkingRequirements: '1 space per unit + 1 per 500 sqft commercial',
          overlays: ['Design Review', 'Transit Corridor'],
          constraints: ['Historic resource adjacent', 'Environmental zone within 200ft'],
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
          overallScore: 78,
          factors: {
            zoningFit: { score: 85, note: 'CM2 supports proposed mixed-use' },
            marketDemand: { score: 82, note: 'Strong rental demand in area, 3.2% vacancy' },
            infrastructure: { score: 75, note: 'Utilities available; transit within 0.25mi' },
            entitlementRisk: { score: 65, note: 'Design review required; adjacent historic resource adds complexity' },
            financialViability: { score: 80, note: 'Land cost to project value ratio favorable at 18%' },
          },
          maxBuildableUnits: 48,
          estimatedGrossSF: 62000,
          recommendation: 'Proceed with feasibility study; entitlement risk manageable with early design review engagement',
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
