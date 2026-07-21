import { KeaBot, BotConfig, HandoffRequest } from '@kealee/core-bots';

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
  constructor() {
    super(CONFIG);
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
        return {
          projectId: params.projectId,
          milestones: [
            {
              id: 'ms_001',
              name: 'Foundation Complete',
              amount: 320000,
              status: 'paid',
              completedDate: '2026-02-13',
              paidDate: '2026-02-20',
              approvals: { gc: true, architect: true, owner: true, lender: true },
            },
            {
              id: 'ms_002',
              name: 'Structural Steel 50%',
              amount: 280000,
              status: 'eligible',
              completedDate: '2026-03-05',
              approvals: { gc: true, architect: true, owner: false, lender: false },
              nextStep: 'Awaiting owner approval',
            },
            {
              id: 'ms_003',
              name: 'Structural Steel 100%',
              amount: 280000,
              status: 'in_progress',
              progress: 60,
              estimatedCompletion: '2026-04-15',
            },
          ],
          escrowBalance: 1840000,
          totalPaid: 320000,
          totalRemaining: 1520000,
        };
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
        return {
          projectId: params.projectId,
          milestoneId: params.milestoneId,
          action: params.action,
          payment: {
            amount: 280000,
            retainage: 28000,
            netPayment: 252000,
            status: 'pending_approval',
            approvalChain: [
              { role: 'GC', name: 'ABC Builders', status: 'approved', date: '2026-03-06' },
              { role: 'Architect', name: 'Studio Design Co', status: 'approved', date: '2026-03-07' },
              { role: 'Owner', name: 'Project Owner LLC', status: 'pending' },
              { role: 'Lender', name: 'First National Bank', status: 'pending' },
            ],
          },
          lienWaiverRequired: true,
          estimatedDisbursement: '2-3 business days after final approval',
        };
      },
    });

    this.registerTool({
      name: 'reconcile_escrow',
      description: 'Reconcile escrow account with project budget and payment history',
      parameters: {
        projectId: { type: 'string', description: 'The project ID', required: true },
      },
      handler: async (params) => {
        return {
          projectId: params.projectId,
          escrow: {
            totalFunded: 2400000,
            totalDisbursed: 560000,
            currentBalance: 1840000,
            pendingPayments: 252000,
            availableBalance: 1588000,
          },
          budget: {
            totalContractValue: 8550000,
            completedWork: 3591000,
            retainageHeld: 359100,
            amountOwed: 280000,
          },
          reconciliation: {
            status: 'balanced',
            discrepancies: [],
            lastReconciled: '2026-03-01',
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
