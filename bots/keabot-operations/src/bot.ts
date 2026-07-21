import { KeaBot, BotConfig, HandoffRequest } from '@kealee/core-bots';

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
  constructor() {
    super(CONFIG);
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
        return {
          projectId: params.projectId,
          turnoverStatus: 'in_progress',
          percentComplete: 68,
          checklist: [
            { category: 'Documentation', items: 12, completed: 10, status: 'in_progress' },
            { category: 'O&M Manuals', items: 8, completed: 4, status: 'in_progress' },
            { category: 'As-Built Drawings', items: 6, completed: 3, status: 'in_progress' },
            { category: 'Warranty Letters', items: 15, completed: 12, status: 'in_progress' },
            { category: 'Final Inspections', items: 5, completed: 5, status: 'complete' },
            { category: 'Training Sessions', items: 4, completed: 2, status: 'in_progress' },
          ],
          blockers: [
            'Awaiting HVAC O&M manual from AirFlow Mechanical',
            'Elevator as-built drawings pending final inspection',
          ],
          targetTurnover: '2026-09-15',
        };
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
        return {
          projectId: params.projectId,
          warranties: [
            { system: 'Roofing', contractor: 'Pacific Roofing', startDate: '2026-08-30', endDate: '2046-08-30', duration: '20 years', type: 'manufacturer + labor', status: 'active', claims: 0 },
            { system: 'HVAC', contractor: 'AirFlow Mechanical', startDate: '2026-08-30', endDate: '2027-08-30', duration: '1 year labor', status: 'active', claims: 0, extended: { endDate: '2031-08-30', type: 'parts only' } },
            { system: 'Elevator', contractor: 'Otis Elevator', startDate: '2026-08-30', endDate: '2028-08-30', duration: '2 years', type: 'full coverage', status: 'active', claims: 0 },
            { system: 'Plumbing', contractor: 'Elite Plumbing', startDate: '2026-08-30', endDate: '2027-08-30', duration: '1 year', type: 'labor + materials', status: 'active', claims: 1 },
          ],
          expiringWithin90Days: [],
          activeClaims: [
            { system: 'Plumbing', claimId: 'WC-001', description: 'Floor 3 bathroom leak at fitting', status: 'repair_scheduled', scheduledDate: '2026-03-14' },
          ],
        };
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
        const priority = (params.priority as string) || 'medium';
        return {
          workOrderId: 'WO-2026-0042',
          projectId: params.projectId,
          description: params.description,
          priority,
          system: params.system || 'General',
          status: 'created',
          createdAt: new Date().toISOString(),
          warrantyCheck: {
            covered: true,
            warrantyId: 'W-PLB-001',
            contractor: 'Elite Plumbing',
            note: 'Within 1-year labor + materials warranty',
          },
          assignedTo: priority === 'emergency' ? 'On-call maintenance team' : 'Pending assignment',
          estimatedResponse: priority === 'emergency' ? '2 hours' : priority === 'high' ? '24 hours' : '3-5 business days',
        };
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
