import { KeaBot, BotConfig, HandoffRequest } from '@kealee/core-bots';
import { RETRIEVE_CONTEXT_TOOL_DEF } from '@kealee/ai/tools/retrieve-relevant-context';

const API_BASE = process.env.API_BASE_URL ?? 'https://kealee-platform-v10-staging.up.railway.app'

async function apiGet(path: string): Promise<unknown> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return null
    return res.json()
  } catch { return null }
}

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
- ALWAYS call retrieve_relevant_context FIRST with sourceType="JURISDICTION_GUIDE" for jurisdiction-specific questions
- Always call retrieve_relevant_context with sourceType="PERMIT_APPLICATION" to find similar past projects
- Always call OS service APIs for data operations (never access DB directly)
- If a request falls outside your domain, hand off to the appropriate bot
- Reference specific code sections and jurisdictional requirements when possible
- Be concise and action-oriented`,
};

export class KeaBotPermit extends KeaBot {
  constructor() {
    super(CONFIG);
  }

  async initialize(): Promise<void> {
    this.registerTool({
      name: RETRIEVE_CONTEXT_TOOL_DEF.name,
      description: RETRIEVE_CONTEXT_TOOL_DEF.description,
      parameters: RETRIEVE_CONTEXT_TOOL_DEF.parameters as any,
      handler: RETRIEVE_CONTEXT_TOOL_DEF.handler as any,
    });

    this.registerTool({
      name: 'check_requirements',
      description: 'Check permit requirements for a project type and jurisdiction',
      parameters: {
        projectType: { type: 'string', description: 'Project type: new_construction, renovation, tenant_improvement, demolition', required: true },
        jurisdiction: { type: 'string', description: 'City or county jurisdiction', required: true },
        scopeDescription: { type: 'string', description: 'Brief description of project scope', required: false },
      },
      handler: async (params) => {
        const data = await apiGet(
          `/api/v1/permits/requirements?jurisdiction=${encodeURIComponent(params.jurisdiction as string)}&type=${encodeURIComponent(params.projectType as string)}`
        );
        if (data) return data;
        return {
          projectType: params.projectType,
          jurisdiction: params.jurisdiction,
          note: 'Call retrieve_relevant_context with jurisdiction and sourceType="JURISDICTION_GUIDE" for detailed requirements.',
          availabilityEndpoint: `/api/v1/availability/check?service=permit-package&jurisdiction=${params.jurisdiction}`,
        };
      },
    });

    this.registerTool({
      name: 'track_permits',
      description: 'Track the status of all permits for a project',
      parameters: {
        projectId: { type: 'string', description: 'The project ID', required: true },
      },
      handler: async (params) => {
        const data = await apiGet(`/api/v1/permits/status/${params.projectId}`);
        if (data) return data;
        const projectData = await apiGet(`/projects/${params.projectId}`) as any;
        if (projectData) return { projectId: params.projectId, project: projectData, permits: [], note: 'No permit tracking data found for this project.' };
        return { projectId: params.projectId, permits: [], note: 'Use retrieve_relevant_context with projectId for permit history.' };
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
        const data = await apiGet(`/projects/${params.projectId}/inspections`);
        if (data) return data;
        return {
          projectId: params.projectId,
          note: 'Inspection scheduling via jurisdiction portal. Most require 48h advance notice.',
          jurisdictionPortals: {
            'dc': 'dcra.dc.gov',
            'montgomery-county': 'permittingservices.montgomerycountymd.gov',
            'fairfax-county': 'fairfaxcounty.gov/permits',
            'arlington': 'permits.arlingtonva.us',
            'alexandria-city': 'alexandriava.gov/permits',
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
