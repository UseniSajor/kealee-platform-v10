import { KeaBot, BotConfig, HandoffRequest } from '@kealee/core-bots';

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
  constructor() {
    super(CONFIG);
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
        return {
          projectId: params.projectId,
          overallProgress: 42,
          phases: [
            { name: 'Structural Steel', progress: 65, onTrack: true },
            { name: 'MEP Rough-In', progress: 20, onTrack: true },
            { name: 'Fireproofing', progress: 0, onTrack: true, startDate: '2026-04-01' },
          ],
          todayActivity: {
            crewsOnSite: 4,
            totalWorkers: 28,
            activeAreas: ['Floors 2-4 steel erection', 'Floor 1 plumbing rough-in'],
          },
          lastUpdated: new Date().toISOString(),
        };
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
        const lookAhead = (params.lookAheadDays as number) || 14;
        return {
          projectId: params.projectId,
          lookAheadDays: lookAhead,
          criticalPath: [
            { activity: 'Floor 4 Steel', duration: 5, start: '2026-03-10', end: '2026-03-14', float: 0 },
            { activity: 'Floor 5 Steel', duration: 5, start: '2026-03-17', end: '2026-03-21', float: 0 },
          ],
          delayRisks: [
            { activity: 'HVAC Equipment Delivery', risk: 'medium', note: 'Supplier confirmed 2-day delay, absorbed by float' },
          ],
          scheduledInspections: [
            { type: 'Structural Steel - Floors 1-3', date: '2026-03-13', status: 'scheduled' },
          ],
        };
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
        return {
          projectId: params.projectId,
          upcoming: [
            {
              type: 'Structural Steel - Floors 1-3',
              date: '2026-03-13',
              readiness: 85,
              checklist: [
                { item: 'Connection bolts torqued', status: 'complete' },
                { item: 'Welding inspections documented', status: 'complete' },
                { item: 'Fire-stop details ready', status: 'in_progress' },
                { item: 'Special inspection reports filed', status: 'complete' },
              ],
              blockers: ['Fire-stop details for 3 penetrations still being documented'],
            },
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
