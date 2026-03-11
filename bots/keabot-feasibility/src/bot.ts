import { KeaBot, BotConfig, HandoffRequest } from '@kealee/core-bots';

const CONFIG: BotConfig = {
  name: 'keabot-feasibility',
  description: 'Assists with feasibility analysis: scenario modeling, proformas, go/no-go decisions',
  domain: 'feasibility',
  systemPrompt: `You are KeaBot Feasibility, a specialized assistant for feasibility analysis on the Kealee Platform.
You assist with feasibility analysis: scenario modeling, proformas, go/no-go decisions.

Your capabilities:
- Create and manage feasibility studies for development projects
- Run scenario models with variable assumptions (rents, costs, cap rates)
- Generate development proformas with full capital stack analysis
- Compare development options side-by-side
- Assess project viability with go/no-go recommendations

Rules:
- Always call OS service APIs for data operations (never access DB directly)
- If a request falls outside your domain, hand off to the appropriate bot
- Present financial scenarios with clear assumptions and sensitivity analysis
- Be concise and action-oriented`,
};

export class KeaBotFeasibility extends KeaBot {
  constructor() {
    super(CONFIG);
  }

  async initialize(): Promise<void> {
    this.registerTool({
      name: 'create_study',
      description: 'Create a new feasibility study for a project or parcel',
      parameters: {
        parcelId: { type: 'string', description: 'The parcel ID to study', required: true },
        developmentType: { type: 'string', description: 'Development type: residential, commercial, mixed-use, industrial', required: true },
        assumptions: { type: 'string', description: 'JSON string of key assumptions (optional overrides)', required: false },
      },
      handler: async (params) => {
        return {
          studyId: 'fs_001',
          parcelId: params.parcelId,
          developmentType: params.developmentType,
          status: 'draft',
          createdAt: new Date().toISOString(),
          baseAssumptions: {
            landCost: 1850000,
            hardCostPerSF: 285,
            softCostPercent: 22,
            contingencyPercent: 8,
            constructionTimeline: '18 months',
            stabilizedOccupancy: 0.95,
            exitCapRate: 0.055,
          },
        };
      },
    });

    this.registerTool({
      name: 'run_scenarios',
      description: 'Run multiple scenario models varying key assumptions',
      parameters: {
        studyId: { type: 'string', description: 'The feasibility study ID', required: true },
        variable: { type: 'string', description: 'Variable to test: rent, cost, cap_rate, occupancy', required: true },
      },
      handler: async (params) => {
        return {
          studyId: params.studyId,
          variable: params.variable,
          scenarios: [
            { label: 'Bear Case', assumption: '-10% rents', irr: 0.12, equityMultiple: 1.6, profitMargin: 0.14 },
            { label: 'Base Case', assumption: 'Market rents', irr: 0.18, equityMultiple: 2.1, profitMargin: 0.22 },
            { label: 'Bull Case', assumption: '+10% rents', irr: 0.24, equityMultiple: 2.6, profitMargin: 0.30 },
          ],
          breakeven: { occupancy: 0.82, rentPSF: 2.45 },
          recommendation: 'Base and bull cases exceed hurdle rate; bear case still positive but below 15% IRR threshold',
        };
      },
    });

    this.registerTool({
      name: 'generate_proforma',
      description: 'Generate a full development proforma with sources and uses, revenue projections, and returns',
      parameters: {
        studyId: { type: 'string', description: 'The feasibility study ID', required: true },
        scenario: { type: 'string', description: 'Scenario to use: bear, base, bull', required: false },
      },
      handler: async (params) => {
        return {
          studyId: params.studyId,
          scenario: (params.scenario as string) || 'base',
          sources: {
            seniorDebt: 8500000,
            mezzDebt: 1500000,
            equity: 3200000,
            total: 13200000,
          },
          uses: {
            landAcquisition: 1850000,
            hardCosts: 8550000,
            softCosts: 1881000,
            contingency: 684000,
            financingCosts: 235000,
            total: 13200000,
          },
          revenue: {
            grossPotentialRent: 1680000,
            vacancy: -84000,
            effectiveGrossIncome: 1596000,
            operatingExpenses: -478800,
            noi: 1117200,
          },
          returns: {
            irr: 0.18,
            equityMultiple: 2.1,
            cashOnCash: 0.085,
            stabilizedYield: 0.085,
            projectedValue: 20312727,
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

    if (/\b(parcel|zoning|land search|lot size)\b/.test(lower)) {
      return { fromBot: this.name, toBot: 'keabot-land', reason: 'Land intelligence topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    }
    if (/\b(capital stack|draw request|investor report|lending)\b/.test(lower)) {
      return { fromBot: this.name, toBot: 'keabot-finance', reason: 'Finance topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    }
    if (/\b(estimate|takeoff|rsmeans|bid comparison)\b/.test(lower)) {
      return { fromBot: this.name, toBot: 'keabot-estimate', reason: 'Estimation topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    }

    return null;
  }
}
