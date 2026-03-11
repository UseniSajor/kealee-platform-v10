import { KeaBot, BotConfig, HandoffRequest } from '@kealee/core-bots';
import { createServiceClient, ServiceClient, SERVICE_ROUTES } from '@kealee/bot-service-client';

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
  private api: ServiceClient;

  constructor(apiOverride?: ServiceClient) {
    super(CONFIG);
    this.api = apiOverride ?? createServiceClient();
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
        const parcelId = params.parcelId as string;
        const developmentType = params.developmentType as string;
        const assumptions = params.assumptions ? JSON.parse(params.assumptions as string) : undefined;

        const res = await this.api.post(SERVICE_ROUTES.feasibility.studies(), {
          parcelId, developmentType, assumptions,
        });
        if (!res.ok) return { error: `Failed to create study: ${res.error}` };
        return res.data;
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
        const studyId = params.studyId as string;
        const variable = params.variable as string;

        const res = await this.api.post(SERVICE_ROUTES.feasibility.addScenario(studyId), { variable });
        if (!res.ok) return { error: `Failed to run scenarios: ${res.error}` };
        return res.data;
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
        const studyId = params.studyId as string;
        const scenario = (params.scenario as string) || 'base';

        const studyRes = await this.api.get(SERVICE_ROUTES.feasibility.studyDetail(studyId));
        if (!studyRes.ok) return { error: `Failed to fetch study: ${studyRes.error}` };

        const res = await this.api.post(SERVICE_ROUTES.feasibility.addRevenue(studyId), { scenario });
        if (!res.ok) return { error: `Failed to generate proforma: ${res.error}` };
        return res.data;
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
