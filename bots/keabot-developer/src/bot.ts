import { KeaBot, BotConfig, HandoffRequest } from '@kealee/core-bots';

const CONFIG: BotConfig = {
  name: 'keabot-developer',
  description: 'Assists developers/investors with portfolio tracking, returns analysis, and entitlements',
  domain: 'developer',
  systemPrompt: `You are KeaBot Developer, a specialized assistant for developers and investors on the Kealee Platform.
You assist developers/investors with portfolio tracking, returns, and entitlements.

Your capabilities:
- Review and analyze development portfolios across multiple projects
- Calculate and compare returns (IRR, equity multiple, cash-on-cash) across projects
- Track entitlement status and regulatory milestones
- Monitor project health metrics and flag risks
- Generate portfolio-level and project-level reports

Rules:
- Always call OS service APIs for data operations (never access DB directly)
- If a request falls outside your domain, hand off to the appropriate bot
- Present portfolio data with benchmarks and comparables
- Be concise and action-oriented`,
};

export class KeaBotDeveloper extends KeaBot {
  constructor() {
    super(CONFIG);
  }

  async initialize(): Promise<void> {
    this.registerTool({
      name: 'review_portfolio',
      description: 'Review the developer portfolio with project summaries and overall metrics',
      parameters: {
        developerId: { type: 'string', description: 'The developer or investment entity ID', required: true },
        status: { type: 'string', description: 'Filter: active, completed, pipeline, all', required: false },
      },
      handler: async (params) => {
        return {
          developerId: params.developerId,
          portfolioSummary: {
            totalProjects: 5,
            activeProjects: 3,
            totalInvested: 18500000,
            totalProjectValue: 67000000,
            weightedIRR: 0.19,
            avgEquityMultiple: 2.2,
          },
          projects: [
            { id: 'proj_001', name: 'Downtown Mixed-Use', status: 'construction', equity: 3200000, projectedIRR: 0.18, health: 'green' },
            { id: 'proj_003', name: 'Waterfront Towers', status: 'entitlement', equity: 5800000, projectedIRR: 0.22, health: 'yellow' },
            { id: 'proj_004', name: 'Tech Campus Phase 1', status: 'construction', equity: 4500000, projectedIRR: 0.16, health: 'green' },
            { id: 'proj_005', name: 'Suburban Retail', status: 'stabilized', equity: 2200000, actualIRR: 0.21, health: 'green' },
            { id: 'proj_006', name: 'Industrial Park', status: 'pipeline', equity: 2800000, projectedIRR: 0.17, health: 'green' },
          ],
        };
      },
    });

    this.registerTool({
      name: 'analyze_returns',
      description: 'Deep-dive analysis of returns for a specific project or the full portfolio',
      parameters: {
        projectId: { type: 'string', description: 'Project ID (omit for portfolio-level)', required: false },
        developerId: { type: 'string', description: 'Developer ID for portfolio analysis', required: false },
      },
      handler: async (params) => {
        return {
          projectId: params.projectId || 'portfolio',
          returns: {
            irr: 0.18,
            equityMultiple: 2.1,
            cashOnCash: 0.085,
            netProfitMargin: 0.22,
            returnOnCost: 0.084,
          },
          cashFlows: [
            { period: 'Q1-2026', invested: -1600000, distributions: 0, net: -1600000 },
            { period: 'Q2-2026', invested: -1600000, distributions: 0, net: -1600000 },
            { period: 'Q3-2026', invested: 0, distributions: 0, net: 0 },
            { period: 'Q4-2026', invested: 0, distributions: 250000, net: 250000 },
          ],
          benchmarks: {
            marketIRR: 0.15,
            peerGroupIRR: 0.17,
            riskAdjustedReturn: 0.16,
          },
        };
      },
    });

    this.registerTool({
      name: 'track_entitlements',
      description: 'Track entitlement and regulatory approval status for development projects',
      parameters: {
        projectId: { type: 'string', description: 'The project ID', required: true },
      },
      handler: async (params) => {
        return {
          projectId: params.projectId,
          entitlements: [
            { type: 'Design Review', status: 'approved', approvedDate: '2025-08-15', conditions: 2, conditionsMet: 2 },
            { type: 'Land Use Permit', status: 'approved', approvedDate: '2025-09-20', conditions: 4, conditionsMet: 4 },
            { type: 'Building Permit', status: 'issued', issuedDate: '2025-10-30', expiresAt: '2027-10-30' },
            { type: 'Stormwater Permit', status: 'in_review', submitDate: '2026-02-01', expectedDecision: '2026-04-15' },
          ],
          risks: [
            { item: 'Stormwater Permit', risk: 'medium', note: 'New DEQ requirements may require revised plan' },
          ],
          timeline: {
            entitlementStart: '2025-06-01',
            allApprovals: '2026-04-15 (projected)',
            daysRemaining: 37,
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

    if (/\b(capital stack|draw request|lending|debt service)\b/.test(lower)) {
      return { fromBot: this.name, toBot: 'keabot-finance', reason: 'Finance topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    }
    if (/\b(feasibility|proforma|scenario model)\b/.test(lower)) {
      return { fromBot: this.name, toBot: 'keabot-feasibility', reason: 'Feasibility topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    }
    if (/\b(parcel|zoning|land search|acquisition)\b/.test(lower)) {
      return { fromBot: this.name, toBot: 'keabot-land', reason: 'Land intelligence topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    }

    return null;
  }
}
