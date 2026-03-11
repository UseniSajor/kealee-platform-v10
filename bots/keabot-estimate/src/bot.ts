import { KeaBot, BotConfig, HandoffRequest } from '@kealee/core-bots';

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
  constructor() {
    super(CONFIG);
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
        const estimateType = (params.estimateType as string) || 'schematic';
        return {
          estimateId: 'est_001',
          projectId: params.projectId,
          type: estimateType,
          scope: params.scope,
          createdAt: new Date().toISOString(),
          summary: {
            totalCost: 8550000,
            costPerSF: 285,
            grossSF: 30000,
            accuracyRange: estimateType === 'conceptual' ? '+/- 25%' : estimateType === 'schematic' ? '+/- 15%' : '+/- 5%',
          },
          divisions: [
            { code: '03', name: 'Concrete', cost: 1282500, percentOfTotal: 15 },
            { code: '05', name: 'Metals', cost: 1539000, percentOfTotal: 18 },
            { code: '07', name: 'Thermal & Moisture', cost: 598500, percentOfTotal: 7 },
            { code: '22', name: 'Plumbing', cost: 513000, percentOfTotal: 6 },
            { code: '23', name: 'HVAC', cost: 855000, percentOfTotal: 10 },
            { code: '26', name: 'Electrical', cost: 769500, percentOfTotal: 9 },
          ],
          locationFactor: 1.08,
          costBasis: 'RSMeans 2026, Portland OR',
        };
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
        return {
          item: params.item,
          location: (params.location as string) || 'Portland, OR',
          results: [
            {
              rsmeansCode: '03 30 53.40',
              description: 'Cast-in-place concrete, 4000 PSI, with formwork',
              unit: 'CY',
              materialCost: 145.00,
              laborCost: 82.00,
              equipmentCost: 18.00,
              totalUnitCost: 245.00,
              locationFactor: 1.08,
              adjustedUnitCost: 264.60,
            },
          ],
          quantity: params.quantity,
          totalCost: params.quantity ? (params.quantity as number) * 264.60 : undefined,
          source: 'RSMeans 2026',
          lastUpdated: '2026-01-15',
        };
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
        return {
          projectId: params.projectId,
          scopeId: params.scopeId,
          scopeName: 'Mechanical (HVAC + Plumbing)',
          engineersEstimate: 1368000,
          bids: [
            { contractor: 'AirFlow Mechanical', total: 1295000, variance: -5.3, inclusions: 'Full scope', exclusions: 'Controls', qualifications: 1, score: 88 },
            { contractor: 'Pacific Systems', total: 1420000, variance: 3.8, inclusions: 'Full scope + controls', exclusions: 'None', qualifications: 0, score: 92 },
            { contractor: 'Metro Plumbing & HVAC', total: 1185000, variance: -13.4, inclusions: 'Full scope', exclusions: 'Controls, testing', qualifications: 3, score: 72 },
          ],
          analysis: {
            averageBid: 1300000,
            spread: '17.2% between low and high',
            recommendation: 'AirFlow Mechanical offers best value; Pacific Systems is most complete but premium priced; Metro is concerning low with exclusions',
          },
        };
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
