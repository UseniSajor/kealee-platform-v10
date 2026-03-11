import { KeaBot, BotConfig, HandoffRequest } from '@kealee/core-bots';
import { createServiceClient, ServiceClient, SERVICE_ROUTES } from '@kealee/bot-service-client';

const CONFIG: BotConfig = {
  name: 'keabot-payments',
  description: 'Manages construction payments: milestones, escrow, reconciliation, lien waivers',
  domain: 'payments',
  systemPrompt: `You are KeaBot Payments, a specialized assistant for construction payments and escrow on the Kealee Platform.
You manage construction payments: milestones, escrow, reconciliation, lien waivers.

Your capabilities:
- Check milestone completion status and payment eligibility
- Process milestone-based payments through escrow
- Reconcile escrow accounts with project budgets
- Generate conditional and unconditional lien waivers
- Track retainage balances and release schedules

Rules:
- Always call OS service APIs for data operations (never access DB directly)
- If a request falls outside your domain, hand off to the appropriate bot
- Always verify milestone completion before recommending payment
- Present payment amounts with proper formatting and approval chain status
- Be concise and action-oriented`,
};

export class KeaBotPayments extends KeaBot {
  private api: ServiceClient;

  constructor(apiOverride?: ServiceClient) {
    super(CONFIG);
    this.api = apiOverride ?? createServiceClient();
  }

  async initialize(): Promise<void> {
    this.registerTool({
      name: 'check_milestone_status',
      description: 'Check milestone completion status and payment eligibility',
      parameters: {
        projectId: { type: 'string', description: 'The project ID', required: true },
        milestoneId: { type: 'string', description: 'Specific milestone ID (optional, shows all if omitted)', required: false },
      },
      handler: async (params) => {
        const projectId = params.projectId as string;
        const milestoneId = params.milestoneId as string | undefined;

        const res = await this.api.get(SERVICE_ROUTES.payments.milestones(projectId), { milestoneId });
        if (!res.ok) return { error: `Failed to fetch milestones: ${res.error}` };
        return res.data;
      },
    });

    this.registerTool({
      name: 'process_payment',
      description: 'Initiate or check status of a milestone payment through escrow',
      parameters: {
        projectId: { type: 'string', description: 'The project ID', required: true },
        milestoneId: { type: 'string', description: 'The milestone ID to pay', required: true },
        action: { type: 'string', description: 'Action: initiate, approve, check_status', required: true },
      },
      handler: async (params) => {
        const projectId = params.projectId as string;
        const milestoneId = params.milestoneId as string;
        const action = params.action as string;

        if (action === 'initiate') {
          const res = await this.api.post(SERVICE_ROUTES.payments.payMilestone(projectId, milestoneId));
          if (!res.ok) return { error: `Failed to initiate payment: ${res.error}` };
          return res.data;
        }

        // check_status or approve — retrieve milestone details
        const res = await this.api.get(SERVICE_ROUTES.payments.milestones(projectId), { milestoneId });
        if (!res.ok) return { error: `Failed to fetch payment status: ${res.error}` };
        return res.data;
      },
    });

    this.registerTool({
      name: 'reconcile_escrow',
      description: 'Reconcile escrow account with project budget and payment history',
      parameters: {
        projectId: { type: 'string', description: 'The project ID', required: true },
      },
      handler: async (params) => {
        const projectId = params.projectId as string;

        const [escrowRes, summaryRes] = await Promise.all([
          this.api.get(SERVICE_ROUTES.payments.escrow(projectId)),
          this.api.get(SERVICE_ROUTES.payments.summary(projectId)),
        ]);

        if (!escrowRes.ok) return { error: `Failed to fetch escrow: ${escrowRes.error}` };

        return {
          escrow: escrowRes.data,
          budget: summaryRes.ok ? summaryRes.data : { error: summaryRes.error },
        };
      },
    });
  }

  async handleMessage(message: string, context?: Record<string, unknown>): Promise<string> {
    return this.chat(message, context);
  }

  shouldHandoff(message: string): HandoffRequest | null {
    const lower = message.toLowerCase();

    if (/\b(capital stack|investor report|lending|debt service)\b/.test(lower)) {
      return { fromBot: this.name, toBot: 'keabot-finance', reason: 'Finance topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    }
    if (/\b(bid|subcontractor|crew scheduling)\b/.test(lower)) {
      return { fromBot: this.name, toBot: 'keabot-gc', reason: 'GC operations topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    }
    if (/\b(estimate|takeoff|cost lookup)\b/.test(lower)) {
      return { fromBot: this.name, toBot: 'keabot-estimate', reason: 'Estimation topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    }

    return null;
  }
}
