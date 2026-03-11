import { KeaBot, BotConfig, HandoffRequest } from '@kealee/core-bots';

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
  constructor() {
    super(CONFIG);
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
        return {
          projectType: params.projectType,
          jurisdiction: params.jurisdiction,
          requiredPermits: [
            { type: 'Building Permit', authority: 'City Building Dept', estimatedReviewTime: '6-8 weeks', fee: '$8,500' },
            { type: 'Grading Permit', authority: 'City Engineering', estimatedReviewTime: '4-6 weeks', fee: '$3,200' },
            { type: 'Stormwater Permit', authority: 'DEQ', estimatedReviewTime: '8-12 weeks', fee: '$2,100' },
            { type: 'Fire Life Safety Review', authority: 'Fire Marshal', estimatedReviewTime: '3-4 weeks', fee: '$1,800' },
          ],
          additionalReviews: [
            { type: 'Design Review', required: true, note: 'Type III review for projects over 40,000 SF' },
            { type: 'Traffic Impact Study', required: true, note: 'Required for >50 parking spaces' },
          ],
          estimatedTotalTimeline: '12-16 weeks (parallel review)',
          totalEstimatedFees: 15600,
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
        return {
          projectId: params.projectId,
          permits: [
            { id: 'pmt_001', type: 'Building Permit', number: 'BP-2025-04821', status: 'issued', issuedDate: '2025-10-30', expiresAt: '2027-10-30', inspectionsPassed: 4, inspectionsRemaining: 8 },
            { id: 'pmt_002', type: 'Grading Permit', number: 'GP-2025-01923', status: 'issued', issuedDate: '2025-09-15', expiresAt: '2026-09-15', inspectionsPassed: 2, inspectionsRemaining: 1 },
            { id: 'pmt_003', type: 'Stormwater Permit', number: 'SW-2026-00342', status: 'in_review', submitDate: '2026-02-01', reviewCycle: 2, lastComment: 'Revised calculations needed for detention basin' },
          ],
          overallStatus: 'active_with_pending',
          nextAction: 'Respond to stormwater review comments by 2026-03-15',
        };
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
        return {
          projectId: params.projectId,
          scheduled: [
            { type: 'Structural Steel - Floors 1-3', date: '2026-03-13', time: '9:00 AM', inspector: 'J. Martinez', status: 'confirmed' },
            { type: 'Plumbing Rough-In - Floor 1', date: '2026-03-20', time: '10:00 AM', inspector: 'TBD', status: 'requested' },
          ],
          upcoming_required: [
            { type: 'Structural Steel - Floors 4-5', earliest: '2026-03-25', note: 'Must pass floors 1-3 first' },
            { type: 'Fire Sprinkler Rough-In', earliest: '2026-04-10', note: 'After MEP rough-in complete' },
          ],
          jurisdictionNotes: 'Request inspections 48 hours in advance. Online portal available.',
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
