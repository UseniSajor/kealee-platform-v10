import Anthropic from '@anthropic-ai/sdk';
import { KeaBot, BotConfig, HandoffRequest } from '@kealee/core-bots';
import { RETRIEVE_CONTEXT_TOOL_DEF } from '@kealee/ai/tools/retrieve-relevant-context';

const API_BASE = process.env.API_BASE_URL ?? 'https://kealee-platform-v10-staging.up.railway.app'

async function apiPost(path: string, body: unknown): Promise<unknown> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return null
    return res.json()
  } catch { return null }
}

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

// ─── Roadmap types ───────────────────────────────────────────────────────────

export interface PermitRoadmapInput {
  projectId: string;
  jurisdiction: string;
  projectType: string;
  scope: string;
  budget: number;
  /** Optional: design data to enrich the analysis */
  conceptContext?: string;
  /** Optional: cost data to enrich the analysis */
  estimationContext?: string;
}

export interface PermitRoadmapOutput {
  permitsRequired: Array<{
    type: string;
    estimatedCost: number;
    timeline: string;
    inspectorContact?: string;
  }>;
  zoningAnalysis: {
    district: string;
    setbacks: string;
    heightLimit: string;
    farCompliant: boolean;
    notes: string;
  };
  codeCompliance: {
    ibcSections: string[];
    ircSections: string[];
    necSections: string[];
    specialRequirements: string[];
  };
  inspectionsRequired: Array<{
    name: string;
    timing: string;
    whatToCheck: string[];
    passCriteria: string[];
  }>;
  estimatedTimeline: {
    approvalDays: number;
    totalTimelineWeeks: number;
    phases: Record<string, number>;
  };
  totalPermitCost: number;
  jurisdictionNotes: string;
  confidenceScore: number;
  /** Always true — no roadmap is submitted without specialist sign-off */
  humanReviewRequired: true;
}

// ─── Bot config ───────────────────────────────────────────────────────────────

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

// ─── Roadmap system prompt (cached) ──────────────────────────────────────────

const ROADMAP_SYSTEM_PROMPT = `You are PermitBot, an expert in building permits, codes, and jurisdictional requirements for residential and commercial construction.

Your task: Analyze a project and generate a comprehensive, actionable permit roadmap.

ANALYSIS REQUIREMENTS:
1. Determine every permit required for the described scope (building, electrical, plumbing, mechanical, specialty)
2. Identify applicable code sections — IBC, IRC, NEC, IPC, and any local amendments
3. Map the full inspection sequence in construction order
4. Estimate realistic approval and total timelines based on jurisdiction norms
5. Highlight any zoning red flags, historic overlays, or special requirements
6. Reference real inspector contacts or department portals where known

JURISDICTION KNOWLEDGE (DC/MD/VA defaults if not overridden):
- DC DCRA: Online portal at permit.dc.gov | Typical review 15-21 days | Expedited +25%
- Montgomery County DPIE: Online at montgomerycountymd.gov/dpie | Typical 10-15 days
- Fairfax County: Online at fairfaxcounty.gov/permits | Typical 10-20 days
- Arlington: permits.arlingtonva.us | Typical 7-15 days
- Alexandria: alexandriava.gov/permits | Typical 10-15 days

CRITICAL CONSTRAINTS:
- Always set humanReviewRequired to true — every roadmap needs specialist review before submission
- Provide a confidenceScore 0-100 based on completeness of input data
- Include worst-case timeline estimates
- Flag anything unusual that needs specialist attention
- Output ONLY valid JSON matching the required schema — no markdown, no prose

OUTPUT SCHEMA:
{
  "permitsRequired": [{ "type": string, "estimatedCost": number, "timeline": string, "inspectorContact": string }],
  "zoningAnalysis": { "district": string, "setbacks": string, "heightLimit": string, "farCompliant": boolean, "notes": string },
  "codeCompliance": { "ibcSections": string[], "ircSections": string[], "necSections": string[], "specialRequirements": string[] },
  "inspectionsRequired": [{ "name": string, "timing": string, "whatToCheck": string[], "passCriteria": string[] }],
  "estimatedTimeline": { "approvalDays": number, "totalTimelineWeeks": number, "phases": { [phase: string]: number } },
  "totalPermitCost": number,
  "jurisdictionNotes": string,
  "confidenceScore": number,
  "humanReviewRequired": true
}`;

// ─── KeaBotPermit class ───────────────────────────────────────────────────────

export class KeaBotPermit extends KeaBot {
  private anthropic: Anthropic;

  constructor() {
    super(CONFIG);
    this.anthropic = new Anthropic();
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

    this.registerTool({
      name: 'generate_jurisdiction_roadmap',
      description: 'Generate a complete permit roadmap for a project — lists every permit required, code sections, inspection schedule, and timeline',
      parameters: {
        projectId: { type: 'string', description: 'The project ID', required: true },
        jurisdiction: { type: 'string', description: 'City or county jurisdiction (e.g. "Washington, DC")', required: true },
        projectType: { type: 'string', description: 'Type of project (kitchen_remodel, addition, new_construction, etc.)', required: true },
        scope: { type: 'string', description: 'Detailed scope of work', required: true },
        budget: { type: 'string', description: 'Estimated project budget in dollars', required: false },
      },
      handler: async (params) => {
        const result = await this.generateRoadmap({
          projectId: params.projectId as string,
          jurisdiction: params.jurisdiction as string,
          projectType: params.projectType as string,
          scope: params.scope as string,
          budget: params.budget ? parseInt(params.budget as string) : 0,
        });
        return result;
      },
    });
  }

  /**
   * Generate a complete, structured permit roadmap for a project.
   *
   * Uses prompt caching on the jurisdiction knowledge base system prompt so
   * repeated calls for the same jurisdiction don't re-tokenize the full prompt.
   *
   * IMPORTANT: Output status is always "generated" — a human specialist must
   * review via the admin queue before any permit is submitted.
   */
  async generateRoadmap(input: PermitRoadmapInput): Promise<PermitRoadmapOutput> {
    // Fetch jurisdiction-specific context from API if available
    const jurisdictionData = await apiGet(
      `/api/v1/permits/jurisdiction?name=${encodeURIComponent(input.jurisdiction)}`
    ) as Record<string, unknown> | null;

    const jurisdictionBlock = jurisdictionData
      ? `JURISDICTION-SPECIFIC DATA (from Kealee database):\n${JSON.stringify(jurisdictionData, null, 2)}`
      : `JURISDICTION: ${input.jurisdiction} — use built-in knowledge base defaults.`;

    const userPrompt = `Generate a complete permit roadmap for this project:

PROJECT:
- ID: ${input.projectId}
- Type: ${input.projectType}
- Jurisdiction: ${input.jurisdiction}
- Scope: ${input.scope}
- Budget: $${input.budget.toLocaleString()}

${input.conceptContext ? `DESIGN CONTEXT:\n${input.conceptContext}` : ''}
${input.estimationContext ? `COST CONTEXT:\n${input.estimationContext}` : ''}

${jurisdictionBlock}

Return ONLY the JSON object matching the required schema.`;

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: [
        {
          type: 'text',
          text: ROADMAP_SYSTEM_PROMPT,
          // Cache the system prompt — jurisdiction knowledge is stable across requests
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: userPrompt }],
    });

    const textBlock = response.content.find(b => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('PermitBot: no text content in response');
    }

    // Strip any accidental markdown fences before parsing
    const raw = textBlock.text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

    let roadmap: PermitRoadmapOutput;
    try {
      roadmap = JSON.parse(raw);
    } catch {
      throw new Error(`PermitBot: failed to parse JSON output — ${raw.slice(0, 200)}`);
    }

    // Enforce business rule: human review is always required
    roadmap.humanReviewRequired = true;

    // Derive totalPermitCost if model forgot to sum it
    if (!roadmap.totalPermitCost && roadmap.permitsRequired?.length) {
      roadmap.totalPermitCost = roadmap.permitsRequired.reduce(
        (sum, p) => sum + (p.estimatedCost ?? 0), 0
      );
    }

    return roadmap;
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
