import { KeaBot, BotConfig, HandoffRequest } from '@kealee/core-bots';

const CONFIG: BotConfig = {
  name: 'keabot-owner',
  description: 'Helps project owners track their projects, understand budgets, and view progress',
  domain: 'owner',
  systemPrompt: `You are KeaBot Owner, a specialized assistant for project owners on the Kealee Platform.
You help project owners track their projects, understand budgets, and view progress.

Your capabilities:
- List and search a user's projects
- Show detailed project information including timelines, budgets, and milestones
- Provide budget summaries with spend-to-date and forecasts
- Track milestone completion and upcoming deadlines

Rules:
- Always call OS service APIs for data operations (never access DB directly)
- If a request falls outside your domain, hand off to the appropriate bot
- Present financial data clearly with context (percentage complete, burn rate)
- Be concise and action-oriented`,
};

export class KeaBotOwner extends KeaBot {
  constructor() {
    super(CONFIG);
  }

  async initialize(): Promise<void> {
    this.registerTool({
      name: 'get_my_projects',
      description: 'Get a list of all projects owned by the current user',
      parameters: {
        status: { type: 'string', description: 'Filter by status: active, completed, paused, all', required: false },
      },
      handler: async (params) => {
        const status = (params.status as string) || 'active';
        return {
          projects: [
            { id: 'proj_001', name: 'Downtown Mixed-Use', status: 'active', progress: 42, budget: 2400000 },
            { id: 'proj_002', name: 'Riverside Condos', status: 'active', progress: 78, budget: 5100000 },
          ],
          filter: status,
          total: 2,
        };
      },
    });

    this.registerTool({
      name: 'get_project_detail',
      description: 'Get detailed information about a specific project',
      parameters: {
        projectId: { type: 'string', description: 'The project ID', required: true },
      },
      handler: async (params) => {
        return {
          id: params.projectId,
          name: 'Downtown Mixed-Use',
          address: '123 Main St, Portland, OR',
          status: 'active',
          type: 'mixed-use',
          startDate: '2025-11-01',
          targetCompletion: '2026-08-30',
          gc: { name: 'ABC Builders', contact: 'john@abcbuilders.com' },
          architect: { name: 'Studio Design Co', contact: 'maria@studiodesign.com' },
          progress: 42,
          currentPhase: 'Structural Steel',
        };
      },
    });

    this.registerTool({
      name: 'get_project_timeline',
      description: 'Get the project timeline with phases and key dates',
      parameters: {
        projectId: { type: 'string', description: 'The project ID', required: true },
      },
      handler: async (params) => {
        return {
          projectId: params.projectId,
          phases: [
            { name: 'Site Prep', start: '2025-11-01', end: '2025-12-15', status: 'completed' },
            { name: 'Foundation', start: '2025-12-16', end: '2026-02-15', status: 'completed' },
            { name: 'Structural Steel', start: '2026-02-16', end: '2026-05-01', status: 'in_progress' },
            { name: 'Enclosure', start: '2026-05-02', end: '2026-06-30', status: 'upcoming' },
            { name: 'Finishes', start: '2026-07-01', end: '2026-08-30', status: 'upcoming' },
          ],
          criticalPath: ['Structural Steel', 'Enclosure'],
          daysRemaining: 174,
        };
      },
    });

    this.registerTool({
      name: 'get_budget_summary',
      description: 'Get budget summary for a project including spend-to-date and forecast',
      parameters: {
        projectId: { type: 'string', description: 'The project ID', required: true },
      },
      handler: async (params) => {
        return {
          projectId: params.projectId,
          totalBudget: 2400000,
          spent: 1008000,
          committed: 350000,
          remaining: 1042000,
          percentSpent: 42,
          contingency: { allocated: 240000, used: 45000, remaining: 195000 },
          forecast: { projectedTotal: 2380000, variance: -20000, status: 'on_budget' },
          topCategories: [
            { name: 'Structural', budgeted: 680000, spent: 510000 },
            { name: 'Mechanical', budgeted: 420000, spent: 168000 },
            { name: 'Electrical', budgeted: 310000, spent: 124000 },
          ],
        };
      },
    });

    this.registerTool({
      name: 'get_milestones',
      description: 'Get milestone status and upcoming deadlines for a project',
      parameters: {
        projectId: { type: 'string', description: 'The project ID', required: true },
        status: { type: 'string', description: 'Filter: completed, upcoming, overdue, all', required: false },
      },
      handler: async (params) => {
        return {
          projectId: params.projectId,
          milestones: [
            { id: 'ms_001', name: 'Foundation Complete', dueDate: '2026-02-15', status: 'completed', completedDate: '2026-02-13' },
            { id: 'ms_002', name: 'Steel Erection Complete', dueDate: '2026-04-15', status: 'in_progress', progress: 60 },
            { id: 'ms_003', name: 'Watertight Enclosure', dueDate: '2026-06-30', status: 'upcoming' },
            { id: 'ms_004', name: 'Substantial Completion', dueDate: '2026-08-15', status: 'upcoming' },
          ],
          nextDue: { name: 'Steel Erection Complete', dueDate: '2026-04-15', daysRemaining: 37 },
        };
      },
    });
  }

  async handleMessage(message: string, context?: Record<string, unknown>): Promise<string> {
    return this.chat(message, context);
  }

  shouldHandoff(message: string): HandoffRequest | null {
    const lower = message.toLowerCase();

    if (/\b(bid|subcontractor|crew|compliance)\b/.test(lower)) {
      return { fromBot: this.name, toBot: 'keabot-gc', reason: 'GC operations topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    }
    if (/\b(payment|escrow|lien waiver|retainage)\b/.test(lower)) {
      return { fromBot: this.name, toBot: 'keabot-payments', reason: 'Payments topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    }
    if (/\b(permit|inspection schedule|building department)\b/.test(lower)) {
      return { fromBot: this.name, toBot: 'keabot-permit', reason: 'Permit topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    }
    if (/\b(estimate|takeoff|cost lookup|rsmeans)\b/.test(lower)) {
      return { fromBot: this.name, toBot: 'keabot-estimate', reason: 'Estimation topic detected', context: {}, conversationHistory: [{ role: 'user', content: message }] };
    }

    return null;
  }
}
