import { KeaBot, BotConfig, HandoffRequest } from '@kealee/core-bots';
import { createServiceClient, ServiceClient, SERVICE_ROUTES } from '@kealee/bot-service-client';

const CONFIG: BotConfig = {
  name: 'keabot-operations',
  description: 'Manages post-construction: turnover, warranties, maintenance, work orders',
  domain: 'operations',
  systemPrompt: `You are KeaBot Operations, a specialized assistant for post-construction operations on the Kealee Platform.
You manage post-construction: turnover, warranties, maintenance, work orders.

Your capabilities:
- Manage project turnover checklists and closeout documentation
- Track warranty coverage, claims, and expiration dates
- Create and manage work orders for maintenance and repairs
- Schedule preventive maintenance based on equipment and building systems
- Monitor building system health and energy performance

Rules:
- Always call OS service APIs for data operations (never access DB directly)
- If a request falls outside your domain, hand off to the appropriate bot
- Always check warranty coverage before recommending repair approaches
- Be concise and action-oriented`,
};

export class KeaBotOperations extends KeaBot {
  private api: ServiceClient;

  constructor(apiOverride?: ServiceClient) {
    super(CONFIG);
    this.api = apiOverride ?? createServiceClient();
  }

  async initialize(): Promise<void> {
    this.registerTool({
      name: 'manage_turnover',
      description: 'Manage project turnover checklist and closeout documentation status',
      parameters: {
        projectId: { type: 'string', description: 'The project ID', required: true },
        action: { type: 'string', description: 'Action: view_checklist, update_item, generate_report', required: false },
      },
      handler: async (params) => {
        const projectId = params.projectId as string;
        const action = (params.action as string) || 'view_checklist';

        if (action === 'view_checklist') {
          const res = await this.api.get(SERVICE_ROUTES.ops.checklists(), { projectId });
          if (!res.ok) return { error: `Failed to fetch checklists: ${res.error}` };
          return res.data;
        }

        // create a new checklist or report
        const res = await this.api.post(SERVICE_ROUTES.ops.checklists(), { projectId, action });
        if (!res.ok) return { error: `Failed to manage turnover: ${res.error}` };
        return res.data;
      },
    });

    this.registerTool({
      name: 'track_warranties',
      description: 'Track warranty coverage, claims, and expiration dates for building systems',
      parameters: {
        projectId: { type: 'string', description: 'The project or building ID', required: true },
        system: { type: 'string', description: 'Specific system to check (e.g., HVAC, Roofing, Elevator)', required: false },
      },
      handler: async (params) => {
        const projectId = params.projectId as string;
        const system = params.system as string | undefined;

        const res = await this.api.get(SERVICE_ROUTES.ops.maintenanceSchedules(), { projectId, system });
        if (!res.ok) return { error: `Failed to fetch warranties: ${res.error}` };
        return res.data;
      },
    });

    this.registerTool({
      name: 'create_work_order',
      description: 'Create a new work order for maintenance, repair, or warranty claim',
      parameters: {
        projectId: { type: 'string', description: 'The project or building ID', required: true },
        description: { type: 'string', description: 'Description of the work needed', required: true },
        priority: { type: 'string', description: 'Priority: emergency, high, medium, low', required: false },
        system: { type: 'string', description: 'Building system affected', required: false },
      },
      handler: async (params) => {
        const projectId = params.projectId as string;
        const description = params.description as string;
        const priority = (params.priority as string) || 'medium';
        const system = params.system as string | undefined;

        const res = await this.api.post(SERVICE_ROUTES.ops.workOrders(), {
          projectId, description, priority, system,
        });
        if (!res.ok) return { error: `Failed to create work order: ${res.error}` };
        return res.data;
      },
    });
  }

  async handleMessage(message: string, context?: Record<string, unknown>): Promise<string> {
    return this.chat(message, context);
  }

  shouldHandoff(message: string): HandoffRequest | null {
    const lower = message.toLowerCase();

    if (/\b(construction progress|daily log|schedule delay)\b/.test(lower)) {
      return { fromBot: this.name, toBot: 'keabot-construction', reason: 'Construction execution topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    }
    if (/\b(payment|escrow|retainage release)\b/.test(lower)) {
      return { fromBot: this.name, toBot: 'keabot-payments', reason: 'Payments topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    }
    if (/\b(find contractor|match skills|marketplace)\b/.test(lower)) {
      return { fromBot: this.name, toBot: 'keabot-marketplace', reason: 'Marketplace topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    }

    return null;
  }
}
