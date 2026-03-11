import { KeaBot, BotConfig, HandoffRequest } from '@kealee/core-bots';
import { createServiceClient, ServiceClient, SERVICE_ROUTES } from '@kealee/bot-service-client';

const CONFIG: BotConfig = {
  name: 'keabot-permit',
  description: 'Navigates permit processes: requirements, tracking, inspections, compliance',
  domain: 'permit',
  systemPrompt: `You are KeaBot Permit, a specialized assistant for permit navigation on the Kealee Platform.
You navigate permit processes: requirements, tracking, inspections, compliance.

Your capabilities:
- Check permit requirements based on project type, scope, and jurisdiction
- Track permit application status through review and approval stages
- Schedule and manage inspections with building departments
- Verify code compliance status for active permits
- Generate permit applications with pre-filled data

Rules:
- Always call OS service APIs for data operations (never access DB directly)
- If a request falls outside your domain, hand off to the appropriate bot
- Reference specific code sections and jurisdictional requirements when possible
- Be concise and action-oriented`,
};

export class KeaBotPermit extends KeaBot {
  private api: ServiceClient;

  constructor(apiOverride?: ServiceClient) {
    super(CONFIG);
    this.api = apiOverride ?? createServiceClient();
  }

  async initialize(): Promise<void> {
    this.registerTool({
      name: 'check_requirements',
      description: 'Check permit requirements for a project type and jurisdiction',
      parameters: {
        projectType: { type: 'string', description: 'Project type: new_construction, renovation, tenant_improvement, demolition', required: true },
        jurisdiction: { type: 'string', description: 'City or county jurisdiction', required: true },
        scopeDescription: { type: 'string', description: 'Brief description of project scope', required: false },
      },
      handler: async (params) => {
        const projectType = params.projectType as string;
        const jurisdiction = params.jurisdiction as string;
        const scopeDescription = params.scopeDescription as string | undefined;

        const res = await this.api.get(SERVICE_ROUTES.permits.dashboard(), {
          projectType, jurisdiction, scopeDescription,
        });
        if (!res.ok) return { error: `Failed to check requirements: ${res.error}` };
        return res.data;
      },
    });

    this.registerTool({
      name: 'track_permits',
      description: 'Track the status of all permits for a project',
      parameters: {
        projectId: { type: 'string', description: 'The project ID', required: true },
      },
      handler: async (params) => {
        const projectId = params.projectId as string;
        const res = await this.api.get(SERVICE_ROUTES.permits.list(), { projectId });
        if (!res.ok) return { error: `Failed to track permits: ${res.error}` };
        return res.data;
      },
    });

    this.registerTool({
      name: 'schedule_inspections',
      description: 'Schedule or view upcoming inspections for a project',
      parameters: {
        projectId: { type: 'string', description: 'The project ID', required: true },
        inspectionType: { type: 'string', description: 'Specific inspection type to schedule', required: false },
        requestedDate: { type: 'string', description: 'Preferred date for inspection (ISO format)', required: false },
      },
      handler: async (params) => {
        const projectId = params.projectId as string;
        const inspectionType = params.inspectionType as string | undefined;
        const requestedDate = params.requestedDate as string | undefined;

        // List permits first to find the active permit
        const permitsRes = await this.api.get(SERVICE_ROUTES.permits.list(), { projectId });
        if (!permitsRes.ok) return { error: `Failed to fetch permits: ${permitsRes.error}` };

        const permits = permitsRes.data as { permits?: Array<{ id: string }> };
        const permitId = permits.permits?.[0]?.id;
        if (!permitId) return { error: 'No active permits found for this project' };

        if (inspectionType && requestedDate) {
          const res = await this.api.post(SERVICE_ROUTES.permits.scheduleInspection(permitId), {
            inspectionType, requestedDate,
          });
          if (!res.ok) return { error: `Failed to schedule inspection: ${res.error}` };
          return res.data;
        }

        const res = await this.api.get(SERVICE_ROUTES.permits.inspections(permitId));
        if (!res.ok) return { error: `Failed to fetch inspections: ${res.error}` };
        return res.data;
      },
    });
  }

  async handleMessage(message: string, context?: Record<string, unknown>): Promise<string> {
    return this.chat(message, context);
  }

  shouldHandoff(message: string): HandoffRequest | null {
    const lower = message.toLowerCase();

    if (/\b(daily log|progress track|schedule delay|weather impact)\b/.test(lower)) {
      return { fromBot: this.name, toBot: 'keabot-construction', reason: 'Construction execution topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    }
    if (/\b(zoning|parcel|land acquisition)\b/.test(lower)) {
      return { fromBot: this.name, toBot: 'keabot-land', reason: 'Land intelligence topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    }
    if (/\b(estimate|cost lookup|rsmeans)\b/.test(lower)) {
      return { fromBot: this.name, toBot: 'keabot-estimate', reason: 'Estimation topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    }

    return null;
  }
}
