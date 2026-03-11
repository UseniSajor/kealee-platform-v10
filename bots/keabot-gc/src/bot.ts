import { KeaBot, BotConfig, HandoffRequest } from '@kealee/core-bots';

const CONFIG: BotConfig = {
  name: 'keabot-gc',
  description: 'Handles GC business operations: bid management, sub coordination, compliance, crew scheduling',
  domain: 'gc',
  systemPrompt: `You are KeaBot GC, a specialized assistant for general contractor business operations on the Kealee Platform.
You handle GC business operations: bid management, sub coordination, compliance, crew scheduling.

Your capabilities:
- Manage bid packages and bid comparisons
- Coordinate subcontractor communications and scheduling
- Check regulatory and insurance compliance status
- Schedule and manage crew assignments
- Prepare payment applications and draw requests

Rules:
- Always call OS service APIs for data operations (never access DB directly)
- If a request falls outside your domain, hand off to the appropriate bot
- Distinguish between GC operations (your domain) and construction execution (keabot-construction)
- Be concise and action-oriented`,
};

export class KeaBotGC extends KeaBot {
  constructor() {
    super(CONFIG);
  }

  async initialize(): Promise<void> {
    this.registerTool({
      name: 'manage_bids',
      description: 'Manage bid packages: list, create, compare, or award bids for a project scope',
      parameters: {
        projectId: { type: 'string', description: 'The project ID', required: true },
        action: { type: 'string', description: 'Action: list, create, compare, award', required: true },
        scopeId: { type: 'string', description: 'Scope/trade package ID', required: false },
      },
      handler: async (params) => {
        const action = params.action as string;
        return {
          projectId: params.projectId,
          action,
          bids: [
            { id: 'bid_001', contractor: 'Elite Plumbing', amount: 185000, status: 'submitted', score: 87 },
            { id: 'bid_002', contractor: 'Metro Plumbing Co', amount: 172000, status: 'submitted', score: 82 },
            { id: 'bid_003', contractor: 'ProPipe Services', amount: 198000, status: 'submitted', score: 91 },
          ],
          recommendation: 'bid_002 offers best value; bid_003 has highest quality score',
        };
      },
    });

    this.registerTool({
      name: 'coordinate_subs',
      description: 'Coordinate subcontractor activities: status, communications, and scheduling',
      parameters: {
        projectId: { type: 'string', description: 'The project ID', required: true },
        subId: { type: 'string', description: 'Specific subcontractor ID (optional, lists all if omitted)', required: false },
      },
      handler: async (params) => {
        return {
          projectId: params.projectId,
          subcontractors: [
            { id: 'sub_001', name: 'Elite Plumbing', trade: 'Plumbing', status: 'on_site', nextDeliverable: 'Rough-in complete', dueDate: '2026-03-20' },
            { id: 'sub_002', name: 'Sparks Electric', trade: 'Electrical', status: 'mobilizing', startDate: '2026-03-15' },
            { id: 'sub_003', name: 'AirFlow HVAC', trade: 'HVAC', status: 'awaiting_materials', eta: '2026-03-12' },
          ],
          pendingRFIs: 2,
          openChangeOrders: 1,
        };
      },
    });

    this.registerTool({
      name: 'check_compliance',
      description: 'Check compliance status for insurance, licensing, and safety requirements',
      parameters: {
        projectId: { type: 'string', description: 'The project ID', required: true },
        type: { type: 'string', description: 'Compliance type: insurance, licensing, safety, all', required: false },
      },
      handler: async (params) => {
        return {
          projectId: params.projectId,
          overall: 'compliant_with_warnings',
          items: [
            { type: 'insurance', entity: 'Elite Plumbing', status: 'compliant', expiresAt: '2026-09-15' },
            { type: 'insurance', entity: 'Sparks Electric', status: 'warning', expiresAt: '2026-03-30', note: 'Expiring in 21 days' },
            { type: 'licensing', entity: 'AirFlow HVAC', status: 'compliant', licenseNumber: 'HVAC-2024-88712' },
            { type: 'safety', entity: 'Project Site', status: 'compliant', lastAudit: '2026-03-05' },
          ],
          actionRequired: ['Remind Sparks Electric to renew insurance before 2026-03-30'],
        };
      },
    });
  }

  async handleMessage(message: string, context?: Record<string, unknown>): Promise<string> {
    return this.chat(message, context);
  }

  shouldHandoff(message: string): HandoffRequest | null {
    const lower = message.toLowerCase();

    if (/\b(daily log|progress track|inspection readiness|weather impact)\b/.test(lower)) {
      return { fromBot: this.name, toBot: 'keabot-construction', reason: 'Construction execution topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    }
    if (/\b(payment|escrow|lien waiver|draw request)\b/.test(lower)) {
      return { fromBot: this.name, toBot: 'keabot-payments', reason: 'Payments topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    }
    if (/\b(estimate|takeoff|rsmeans|cost lookup)\b/.test(lower)) {
      return { fromBot: this.name, toBot: 'keabot-estimate', reason: 'Estimation topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    }
    if (/\b(find contractor|marketplace|match skills)\b/.test(lower)) {
      return { fromBot: this.name, toBot: 'keabot-marketplace', reason: 'Marketplace topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    }

    return null;
  }
}
