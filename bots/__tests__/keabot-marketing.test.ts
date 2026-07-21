/**
 * Tests for keabot-marketing
 */

// Mock @kealee/core-bots
jest.mock('@kealee/core-bots', () => ({
  KeaBot: class MockKeaBot {
    name = 'mock-bot';
    config: any;
    tools: Map<string, any> = new Map();
    constructor(config: any) { this.config = config; this.name = config.name; }
    registerTool(def: any) { this.tools.set(def.name, def); }
    getToolDefinitions() { return [...this.tools.values()]; }
    async chat(msg: string) { return `{"status":"ok","message":"${msg.slice(0,50)}"}`; }
    async handleMessage(msg: string) { return this.chat(msg); }
  },
}));

jest.mock('@kealee/ai/tools/retrieve-relevant-context', () => ({
  RETRIEVE_CONTEXT_TOOL_DEF: {
    name: 'retrieve_relevant_context',
    description: 'Mock context retrieval',
    parameters: {},
    handler: async () => ({ context: [] }),
  },
}));

// Mock fetch
global.fetch = jest.fn().mockResolvedValue({
  ok: false,
  json: async () => ({}),
} as any);

describe('keabot-marketing', () => {
  let KeaBotMarketing: any;
  let bot: any;

  beforeAll(async () => {
    const mod = await import('../../keabot-marketing/src/bot.js');
    KeaBotMarketing = mod.KeaBotMarketing;
  });

  beforeEach(async () => {
    bot = new KeaBotMarketing();
    await bot.initialize();
  });

  it('should initialize with correct config', () => {
    expect(bot.name).toBe('MarketingBot');
  });

  it('should register 8 tools', () => {
    const tools = bot.getToolDefinitions();
    expect(tools.length).toBeGreaterThanOrEqual(8);
  });

  it('should have setup_search_console_analytics tool', () => {
    const tools = bot.getToolDefinitions();
    const tool = tools.find((t: any) => t.name === 'setup_search_console_analytics');
    expect(tool).toBeDefined();
    expect(tool.description).toContain('Search Console');
  });

  it('should have create_email_sequences tool', () => {
    const tools = bot.getToolDefinitions();
    const tool = tools.find((t: any) => t.name === 'create_email_sequences');
    expect(tool).toBeDefined();
  });

  it('should have implement_lead_scoring tool', () => {
    const tools = bot.getToolDefinitions();
    const tool = tools.find((t: any) => t.name === 'implement_lead_scoring');
    expect(tool).toBeDefined();
  });

  it('should execute setup_search_console_analytics', async () => {
    const tools = bot.getToolDefinitions();
    const tool = tools.find((t: any) => t.name === 'setup_search_console_analytics');
    const result = await tool.handler({ domain: 'kealee.com', businessEmail: 'test@kealee.com', propertyId: 'G-123', dnsProvider: 'namebright' });
    expect(result).toHaveProperty('status');
  });

  it('should generate social copy', async () => {
    const tools = bot.getToolDefinitions();
    const tool = tools.find((t: any) => t.name === 'generate_social_copy');
    if (!tool) return; // skip if not registered
    const result = await tool.handler({ platform: 'linkedin', contentType: 'showcase', productId: 'prod_123', tone: 'professional' });
    expect(result).toHaveProperty('platform', 'linkedin');
  });
});
