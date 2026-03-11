import { KeaBot, BotConfig, HandoffRequest } from '@kealee/core-bots';
import { createServiceClient, ServiceClient, SERVICE_ROUTES } from '@kealee/bot-service-client';

const CONFIG: BotConfig = {
  name: 'keabot-command',
  description: 'Master orchestrator that routes requests to specialized bots and provides project overview',
  domain: 'command',
  systemPrompt: `You are KeaBot Command, the master orchestrator for the Kealee Platform.
You route user requests to the appropriate specialized bot and provide high-level project overview.

Your capabilities:
- Route messages to the correct specialized bot based on domain
- Provide overall project status and digital twin health metrics
- List available bots and their capabilities
- Aggregate cross-domain information for executive summaries

Rules:
- Always call OS service APIs for data operations (never access DB directly)
- Analyze the user's intent and route to the most appropriate bot
- If the request spans multiple domains, coordinate across bots
- Be concise and action-oriented
- You are the default entry point — only hand off when a specialized bot is clearly better suited`,
};

const DOMAIN_KEYWORDS: Record<string, string[]> = {
  owner: ['my project', 'my budget', 'my timeline', 'project status', 'owner dashboard'],
  gc: ['bid management', 'subcontractor', 'crew scheduling', 'compliance check', 'gc ops'],
  construction: ['daily log', 'progress tracking', 'inspection readiness', 'schedule delay', 'weather impact'],
  land: ['parcel', 'zoning', 'land acquisition', 'assessment', 'development potential'],
  feasibility: ['feasibility study', 'proforma', 'scenario', 'viability', 'go no-go'],
  finance: ['capital stack', 'draw request', 'investor report', 'lending', 'returns'],
  developer: ['portfolio', 'entitlements', 'investor', 'development pipeline'],
  permit: ['permit', 'inspection schedule', 'code compliance', 'building department'],
  estimate: ['estimate', 'takeoff', 'rsmeans', 'cost lookup', 'bid comparison', 'value engineering'],
  payments: ['payment', 'escrow', 'lien waiver', 'retainage', 'milestone payment'],
  marketplace: ['find contractor', 'match skills', 'verify credentials', 'contractor search'],
  operations: ['warranty', 'maintenance', 'work order', 'turnover', 'building monitor'],
};

export class KeaBotCommand extends KeaBot {
  private api: ServiceClient;

  constructor(apiOverride?: ServiceClient) {
    super(CONFIG);
    this.api = apiOverride ?? createServiceClient();
  }

  async initialize(): Promise<void> {
    this.registerTool({
      name: 'route_to_bot',
      description: 'Route a user message to a specialized bot by domain name',
      parameters: {
        domain: { type: 'string', description: 'Target bot domain (e.g. "land", "finance", "construction")', required: true },
        message: { type: 'string', description: 'The message to forward to the target bot', required: true },
        context: { type: 'string', description: 'Additional context for the handoff', required: false },
      },
      handler: async (params) => {
        const domain = params.domain as string;
        const message = params.message as string;
        return {
          routed: true,
          targetBot: `keabot-${domain}`,
          message: message.slice(0, 200),
          status: 'pending_handoff',
        };
      },
    });

    this.registerTool({
      name: 'get_project_status',
      description: 'Get high-level status summary of a project across all domains',
      parameters: {
        projectId: { type: 'string', description: 'The project ID to get status for', required: true },
      },
      handler: async (params) => {
        const projectId = params.projectId as string;

        const [projectRes, budgetRes, milestonesRes] = await Promise.all([
          this.api.get(SERVICE_ROUTES.projects.detail(projectId)),
          this.api.get(SERVICE_ROUTES.payments.summary(projectId)),
          this.api.get(SERVICE_ROUTES.payments.milestones(projectId)),
        ]);

        if (!projectRes.ok) return { error: `Failed to fetch project: ${projectRes.error}` };

        return {
          projectId,
          project: projectRes.data,
          budgetStatus: budgetRes.ok ? budgetRes.data : { error: budgetRes.error },
          milestones: milestonesRes.ok ? milestonesRes.data : { error: milestonesRes.error },
          lastUpdate: new Date().toISOString(),
        };
      },
    });

    this.registerTool({
      name: 'get_twin_health',
      description: 'Get the digital twin health score and component status for a project',
      parameters: {
        projectId: { type: 'string', description: 'The project ID', required: true },
      },
      handler: async (params) => {
        const projectId = params.projectId as string;
        const res = await this.api.get(SERVICE_ROUTES.twins.byProject(projectId));
        if (!res.ok) return { error: `Failed to fetch twin data: ${res.error}` };
        return res.data;
      },
    });

    this.registerTool({
      name: 'list_bots',
      description: 'List all available specialized bots and their capabilities',
      parameters: {},
      handler: async () => {
        return {
          bots: [
            { name: 'keabot-command', domain: 'command', description: 'Master orchestrator' },
            { name: 'keabot-owner', domain: 'owner', description: 'Project owner assistant' },
            { name: 'keabot-gc', domain: 'gc', description: 'GC operations' },
            { name: 'keabot-construction', domain: 'construction', description: 'Construction execution' },
            { name: 'keabot-land', domain: 'land', description: 'Land intelligence' },
            { name: 'keabot-feasibility', domain: 'feasibility', description: 'Feasibility analysis' },
            { name: 'keabot-finance', domain: 'finance', description: 'Finance/lending' },
            { name: 'keabot-developer', domain: 'developer', description: 'Developer/investor' },
            { name: 'keabot-permit', domain: 'permit', description: 'Permit navigation' },
            { name: 'keabot-estimate', domain: 'estimate', description: 'Estimation assistant' },
            { name: 'keabot-payments', domain: 'payments', description: 'Payments/escrow' },
            { name: 'keabot-marketplace', domain: 'marketplace', description: 'Marketplace matchmaking' },
            { name: 'keabot-operations', domain: 'operations', description: 'Maintenance/warranty' },
          ],
        };
      },
    });
  }

  async handleMessage(message: string, context?: Record<string, unknown>): Promise<string> {
    return this.chat(message, context);
  }

  shouldHandoff(message: string): HandoffRequest | null {
    const lower = message.toLowerCase();

    for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
      for (const keyword of keywords) {
        if (lower.includes(keyword)) {
          return {
            fromBot: this.name,
            toBot: `keabot-${domain}`,
            reason: `Message contains "${keyword}" which maps to the ${domain} domain`,
            context: {},
            conversationHistory: [{ role: 'user', content: message }],
          };
        }
      }
    }

    return null;
  }
}
