import { KeaBot, BotConfig, HandoffRequest } from '@kealee/core-bots';
import { createServiceClient, ServiceClient, SERVICE_ROUTES } from '@kealee/bot-service-client';

const CONFIG: BotConfig = {
  name: 'keabot-construction',
  description: 'Tracks construction execution: progress, schedule dependencies, inspection readiness, daily logs',
  domain: 'construction',
  systemPrompt: `You are KeaBot Construction, a specialized assistant for construction execution tracking on the Kealee Platform.
You track construction execution: progress, schedule dependencies, inspection readiness, daily logs.

Your capabilities:
- Track real-time construction progress by phase and trade
- Monitor schedule dependencies and flag delays
- Assess inspection readiness and upcoming requirements
- Generate and review daily construction summaries
- Evaluate weather impact on upcoming work

Rules:
- Always call OS service APIs for data operations (never access DB directly)
- If a request falls outside your domain, hand off to the appropriate bot
- Distinguish between construction execution (your domain) and GC business operations (keabot-gc)
- Be concise and action-oriented`,
};

export class KeaBotConstruction extends KeaBot {
  private api: ServiceClient;

  constructor(apiOverride?: ServiceClient) {
    super(CONFIG);
    this.api = apiOverride ?? createServiceClient();
  }

  async initialize(): Promise<void> {
    this.registerTool({
      name: 'track_progress',
      description: 'Get real-time construction progress by phase, trade, or overall',
      parameters: {
        projectId: { type: 'string', description: 'The project ID', required: true },
        scope: { type: 'string', description: 'Scope: overall, phase, trade', required: false },
      },
      handler: async (params) => {
        const projectId = params.projectId as string;
        const scope = params.scope as string | undefined;

        const res = await this.api.get(SERVICE_ROUTES.pm.stats(), { projectId, scope });
        if (!res.ok) return { error: `Failed to track progress: ${res.error}` };
        return res.data;
      },
    });

    this.registerTool({
      name: 'check_schedule',
      description: 'Check schedule status including critical path and delay risks',
      parameters: {
        projectId: { type: 'string', description: 'The project ID', required: true },
        lookAheadDays: { type: 'number', description: 'Number of days to look ahead (default 14)', required: false },
      },
      handler: async (params) => {
        const projectId = params.projectId as string;
        const lookAheadDays = params.lookAheadDays as number | undefined;

        const res = await this.api.get(SERVICE_ROUTES.pm.schedule(), { projectId, lookAheadDays });
        if (!res.ok) return { error: `Failed to check schedule: ${res.error}` };
        return res.data;
      },
    });

    this.registerTool({
      name: 'assess_inspection_readiness',
      description: 'Assess readiness for upcoming inspections including checklist status',
      parameters: {
        projectId: { type: 'string', description: 'The project ID', required: true },
        inspectionType: { type: 'string', description: 'Type of inspection to assess', required: false },
      },
      handler: async (params) => {
        const projectId = params.projectId as string;
        const inspectionType = params.inspectionType as string | undefined;

        const res = await this.api.get(SERVICE_ROUTES.pm.inspections(), { projectId, type: inspectionType });
        if (!res.ok) return { error: `Failed to assess inspection readiness: ${res.error}` };
        return res.data;
      },
    });
  }

  async handleMessage(message: string, context?: Record<string, unknown>): Promise<string> {
    return this.chat(message, context);
  }

  shouldHandoff(message: string): HandoffRequest | null {
    const lower = message.toLowerCase();

    if (/\b(bid|subcontractor coordination|crew scheduling|compliance check)\b/.test(lower)) {
      return { fromBot: this.name, toBot: 'keabot-gc', reason: 'GC operations topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    }
    if (/\b(permit|building department|code compliance)\b/.test(lower)) {
      return { fromBot: this.name, toBot: 'keabot-permit', reason: 'Permit topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    }
    if (/\b(payment|escrow|lien waiver)\b/.test(lower)) {
      return { fromBot: this.name, toBot: 'keabot-payments', reason: 'Payments topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    }

    return null;
  }
}
