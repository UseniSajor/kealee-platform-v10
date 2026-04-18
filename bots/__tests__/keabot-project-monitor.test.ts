jest.mock('@kealee/core-bots', () => ({
  KeaBot: class {
    name = 'mock';
    config: any;
    tools: Map<string, any> = new Map();
    constructor(config: any) { this.config = config; this.name = config.name; }
    registerTool(def: any) { this.tools.set(def.name, def); }
    getToolDefinitions() { return [...this.tools.values()]; }
    async chat(msg: string) { return `{"status":"ok"}`; }
    async handleMessage(msg: string) { return this.chat(msg); }
  },
}));

global.fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({}) } as any);

describe('keabot-project-monitor', () => {
  let bot: any;

  beforeEach(async () => {
    const { KeaBotProjectMonitor } = await import('../../keabot-project-monitor/src/bot.js');
    bot = new KeaBotProjectMonitor();
    await bot.initialize();
  });

  it('should register 5 tools', () => {
    expect(bot.getToolDefinitions().length).toBe(5);
  });

  it('should have track_project_progress tool', () => {
    const tool = bot.getToolDefinitions().find((t: any) => t.name === 'track_project_progress');
    expect(tool).toBeDefined();
  });

  it('should have detect_issues tool', () => {
    const tool = bot.getToolDefinitions().find((t: any) => t.name === 'detect_issues');
    expect(tool).toBeDefined();
  });

  it('should have manage_milestones tool', () => {
    const tool = bot.getToolDefinitions().find((t: any) => t.name === 'manage_milestones');
    expect(tool).toBeDefined();
  });
});

describe('issue detection', () => {
  it('should detect budget overrun at 110%', async () => {
    const { detectIssues } = await import('../../keabot-project-monitor/src/issues.js');
    const issues = detectIssues({ budgetSpent: 110001, budgetTotal: 100000, daysElapsed: 30, daysEstimated: 30 });
    const budgetIssue = issues.find(i => i.type === 'BUDGET_OVERRUN');
    expect(budgetIssue).toBeDefined();
    expect(budgetIssue?.severity).toBe('medium');
  });

  it('should detect schedule delay at 120%', async () => {
    const { detectIssues } = await import('../../keabot-project-monitor/src/issues.js');
    const issues = detectIssues({ budgetSpent: 50000, budgetTotal: 100000, daysElapsed: 121, daysEstimated: 100 });
    const scheduleIssue = issues.find(i => i.type === 'BEHIND_SCHEDULE');
    expect(scheduleIssue).toBeDefined();
  });

  it('should detect contractor unresponsive after 7 days', async () => {
    const { detectIssues } = await import('../../keabot-project-monitor/src/issues.js');
    const lastContact = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
    const issues = detectIssues({ budgetSpent: 0, budgetTotal: 100000, daysElapsed: 10, daysEstimated: 30, lastContractorContact: lastContact });
    const unresponsive = issues.find(i => i.type === 'CONTRACTOR_UNRESPONSIVE');
    expect(unresponsive).toBeDefined();
  });
});

describe('milestone logic', () => {
  it('should build 4 milestones', async () => {
    const { buildMilestones } = await import('../../keabot-project-monitor/src/milestones.js');
    const milestones = buildMilestones(100000);
    expect(milestones).toHaveLength(4);
    expect(milestones[0].amount).toBe(10000); // 10%
    expect(milestones[3].amount).toBe(40000); // 40%
  });

  it('should sum milestones to 100%', async () => {
    const { buildMilestones } = await import('../../keabot-project-monitor/src/milestones.js');
    const milestones = buildMilestones(200000);
    const total = milestones.reduce((s, m) => s + m.percentage, 0);
    expect(total).toBe(100);
  });
});
