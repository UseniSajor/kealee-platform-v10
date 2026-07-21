import { KeaBot, BotConfig, HandoffRequest } from '@kealee/core-bots';

const CONFIG: BotConfig = {
  name: 'keabot-finance',
  description: 'Assists with project finance: capital stacks, draw management, investor reporting',
  domain: 'finance',
  systemPrompt: `You are KeaBot Finance, a specialized assistant for project finance and lending on the Kealee Platform.
You assist with project finance: capital stacks, draw management, investor reporting.

Your capabilities:
- Build and optimize capital stack structures (senior debt, mezz, equity)
- Track construction draw requests and disbursements
- Generate investor reports with returns and milestones
- Calculate project-level and fund-level returns
- Assess lending eligibility and debt service coverage

Rules:
- Always call OS service APIs for data operations (never access DB directly)
- If a request falls outside your domain, hand off to the appropriate bot
- Present financial data with proper precision and context
- Clearly distinguish between projected and actual figures
- Be concise and action-oriented`,
};

export class KeaBotFinance extends KeaBot {
  constructor() {
    super(CONFIG);
  }

  async initialize(): Promise<void> {
    this.registerTool({
      name: 'build_capital_stack',
      description: 'Build or view the capital stack structure for a project',
      parameters: {
        projectId: { type: 'string', description: 'The project ID', required: true },
        totalProjectCost: { type: 'number', description: 'Total project cost (for new stacks)', required: false },
      },
      handler: async (params) => {
        return {
          projectId: params.projectId,
          totalProjectCost: 13200000,
          stack: [
            { layer: 'Senior Debt', amount: 8500000, percent: 64.4, provider: 'First National Bank', rate: '7.25%', term: '24 months', ltc: 0.644 },
            { layer: 'Mezzanine', amount: 1500000, percent: 11.4, provider: 'Capital Bridge Fund', rate: '12.5%', term: '24 months' },
            { layer: 'Sponsor Equity', amount: 2200000, percent: 16.7, provider: 'Kealee Dev LLC' },
            { layer: 'LP Equity', amount: 1000000, percent: 7.6, provider: 'Various LPs' },
          ],
          metrics: {
            ltc: 0.644,
            ltv: 0.55,
            dscr: 1.35,
            debtYield: 0.084,
          },
        };
      },
    });

    this.registerTool({
      name: 'track_draws',
      description: 'Track construction draw requests, disbursements, and remaining balance',
      parameters: {
        projectId: { type: 'string', description: 'The project ID', required: true },
        drawNumber: { type: 'number', description: 'Specific draw number to view (optional)', required: false },
      },
      handler: async (params) => {
        return {
          projectId: params.projectId,
          loanAmount: 8500000,
          totalDrawn: 3825000,
          remainingBalance: 4675000,
          percentDrawn: 45,
          draws: [
            { number: 1, date: '2025-12-15', amount: 1275000, status: 'disbursed', description: 'Foundation' },
            { number: 2, date: '2026-01-30', amount: 1275000, status: 'disbursed', description: 'Structural 50%' },
            { number: 3, date: '2026-03-01', amount: 1275000, status: 'disbursed', description: 'Structural 100% + MEP start' },
            { number: 4, date: '2026-04-01', amount: 1275000, status: 'pending_inspection', description: 'MEP rough-in + enclosure' },
          ],
          retainage: { rate: 0.10, held: 382500 },
        };
      },
    });

    this.registerTool({
      name: 'generate_investor_report',
      description: 'Generate an investor report with project status, financials, and projected returns',
      parameters: {
        projectId: { type: 'string', description: 'The project ID', required: true },
        period: { type: 'string', description: 'Reporting period: monthly, quarterly', required: false },
      },
      handler: async (params) => {
        return {
          projectId: params.projectId,
          period: (params.period as string) || 'quarterly',
          reportDate: new Date().toISOString(),
          executive_summary: 'Project on schedule and within budget. 42% complete with no material change orders.',
          financials: {
            totalBudget: 13200000,
            costToDate: 5544000,
            commitments: 2640000,
            projectedTotal: 13100000,
            varianceToBudget: -100000,
          },
          returns: {
            projectedIRR: 0.18,
            equityMultipleProjected: 2.1,
            distributionsToDate: 0,
            nextProjectedDistribution: '2027-Q1',
          },
          schedule: {
            percentComplete: 42,
            onSchedule: true,
            targetCompletion: '2026-08-30',
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

    if (/\b(feasibility|proforma|scenario model|go.no.go)\b/.test(lower)) {
      return { fromBot: this.name, toBot: 'keabot-feasibility', reason: 'Feasibility topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    }
    if (/\b(portfolio|entitlement|development pipeline)\b/.test(lower)) {
      return { fromBot: this.name, toBot: 'keabot-developer', reason: 'Developer/investor topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    }
    if (/\b(payment|escrow|lien waiver|retainage)\b/.test(lower)) {
      return { fromBot: this.name, toBot: 'keabot-payments', reason: 'Payments topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    }

    return null;
  }
}
