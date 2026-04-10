import { KeaBot, BotConfig, HandoffRequest } from '@kealee/core-bots';
import {
  checkMilestoneStatus,
  processMilestonePayout,
  getEscrowSummary,
  generateLienWaiverData,
} from './logic.js';

const CONFIG: BotConfig = {
  name: 'keabot-payments',
  description: 'Manages construction payments: milestones, escrow, payouts, lien waivers',
  domain: 'payments',
  systemPrompt: `You are KeaBot Payments, a specialized assistant for construction payments and escrow on the Kealee Platform.
You manage construction payments: milestones, escrow, payouts, and lien waivers.

Your capabilities:
- Check real milestone status and payment eligibility from the database
- Process milestone payouts via Stripe Connect to contractor accounts
- Get escrow summary showing all milestones, paid amounts, and eligible payouts
- Generate lien waiver data (conditional until paid, unconditional after)

Rules:
- ALWAYS call check_milestone_status first before recommending or processing any payment
- NEVER process a payout unless the milestone status is APPROVED and readyForPayout is true
- NEVER re-process a payout if existingPayoutId is set — a payout already exists
- If contractor does not have payoutsEnabled, explain that Stripe onboarding must be completed
- If processMilestonePayout returns success: false, explain the exact blocker clearly
- Always show amounts in dollars with proper formatting ($XX,XXX)
- Present payment eligibility with the full list of blockers if not ready
- If a request involves contractor credentials or bids, hand off to keabot-gc
- Be concise and action-oriented`,
};

export class KeaBotPayments extends KeaBot {
  constructor() {
    super(CONFIG);
  }

  async initialize(): Promise<void> {

    this.registerTool({
      name: 'check_milestone_status',
      description: 'Check real milestone status and payment eligibility from the database',
      parameters: {
        projectId:   { type: 'string', description: 'The project ID', required: true },
        milestoneId: { type: 'string', description: 'Specific milestone ID (optional, shows all if omitted)', required: false },
      },
      handler: async (params) => {
        try {
          const milestones = await checkMilestoneStatus(
            params.projectId as string,
            params.milestoneId as string | undefined,
          );
          return {
            projectId:  params.projectId,
            milestones,
            summary: {
              total:         milestones.length,
              readyForPayout: milestones.filter(m => m.readyForPayout).length,
              paid:          milestones.filter(m => m.status === 'PAID').length,
              totalEligible: milestones.filter(m => m.readyForPayout).reduce((s, m) => s + m.amount, 0),
            },
          };
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          return { error: `Failed to load milestone data: ${msg}`, projectId: params.projectId };
        }
      },
    });

    this.registerTool({
      name: 'process_payment',
      description: 'Process a milestone payout via Stripe Connect. Only works when milestone status is APPROVED and no existing payout exists.',
      parameters: {
        milestoneId:       { type: 'string', description: 'The milestone ID to pay out', required: true },
        initiatedByUserId: { type: 'string', description: 'User ID of the person initiating the payout', required: true },
      },
      handler: async (params) => {
        try {
          const result = await processMilestonePayout(
            params.milestoneId as string,
            params.initiatedByUserId as string,
          );
          return result;
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          return { success: false, error: `Unexpected error processing payout: ${msg}` };
        }
      },
    });

    this.registerTool({
      name: 'reconcile_escrow',
      description: 'Get full escrow and milestone summary for a project from the database',
      parameters: {
        projectId: { type: 'string', description: 'The project ID', required: true },
      },
      handler: async (params) => {
        try {
          const summary = await getEscrowSummary(params.projectId as string);
          return summary;
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          return { error: `Failed to load escrow summary: ${msg}`, projectId: params.projectId };
        }
      },
    });

    this.registerTool({
      name: 'get_lien_waiver_data',
      description: 'Get lien waiver data for a milestone. Returns conditional or unconditional status based on payment state.',
      parameters: {
        milestoneId: { type: 'string', description: 'The milestone ID', required: true },
      },
      handler: async (params) => {
        try {
          const data = await generateLienWaiverData(params.milestoneId as string);
          if (!data) return { error: 'Milestone not found' };
          return {
            ...data,
            waiverType: data.conditional ? 'Conditional Lien Waiver' : 'Unconditional Lien Waiver',
            note: data.conditional
              ? 'Conditional — payment has not yet been received. Becomes unconditional once paid.'
              : 'Unconditional — payment has been received. Final release of lien rights.',
          };
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          return { error: `Failed to generate lien waiver data: ${msg}` };
        }
      },
    });
  }

  async handleMessage(message: string, context?: Record<string, unknown>): Promise<string> {
    return this.chat(message, context);
  }

  shouldHandoff(message: string): HandoffRequest | null {
    const lower = message.toLowerCase();

    if (/\b(capital stack|investor report|lending|debt service|fund)\b/.test(lower)) {
      return { fromBot: this.name, toBot: 'keabot-finance', reason: 'Finance topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    }
    if (/\b(bid|subcontractor|crew scheduling|sub coordination)\b/.test(lower)) {
      return { fromBot: this.name, toBot: 'keabot-gc', reason: 'GC operations topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    }
    if (/\b(estimate|takeoff|cost lookup|rsmeans)\b/.test(lower)) {
      return { fromBot: this.name, toBot: 'keabot-estimate', reason: 'Estimation topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    }

    return null;
  }
}
