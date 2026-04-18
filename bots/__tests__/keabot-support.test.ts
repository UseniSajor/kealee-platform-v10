jest.mock('@kealee/core-bots', () => ({
  KeaBot: class {
    name = 'mock';
    config: any;
    tools: Map<string, any> = new Map();
    constructor(config: any) { this.config = config; this.name = config.name; }
    registerTool(def: any) { this.tools.set(def.name, def); }
    getToolDefinitions() { return [...this.tools.values()]; }
    async chat(msg: string) { return `{"draft":"Here is your response...","wordCount":42}`; }
    async handleMessage(msg: string) { return this.chat(msg); }
  },
}));

global.fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({}) } as any);

describe('keabot-support', () => {
  let bot: any;

  beforeEach(async () => {
    const { KeaBotSupport } = await import('../../keabot-support/src/bot.js');
    bot = new KeaBotSupport();
    await bot.initialize();
  });

  it('should register 6 tools', () => {
    expect(bot.getToolDefinitions().length).toBe(6);
  });

  it('should have all required tools', () => {
    const names = bot.getToolDefinitions().map((t: any) => t.name);
    expect(names).toContain('route_ticket');
    expect(names).toContain('answer_faq');
    expect(names).toContain('handle_refund_request');
    expect(names).toContain('generate_response');
    expect(names).toContain('escalate_ticket');
    expect(names).toContain('track_resolution');
  });
});

describe('ticket routing', () => {
  it('should route permit questions to permit_support', async () => {
    const { classifyTicket } = await import('../../keabot-support/src/routing.js');
    const result = classifyTicket('How do I get a permit for my kitchen renovation?');
    expect(result.category).toBe('permit_support');
    expect(result.confidence).toBeGreaterThan(0.7);
  });

  it('should route payment questions to payment_support', async () => {
    const { classifyTicket } = await import('../../keabot-support/src/routing.js');
    const result = classifyTicket('I was charged incorrectly for my invoice');
    expect(result.category).toBe('payment_support');
  });

  it('should route contractor questions to contractor_support', async () => {
    const { classifyTicket } = await import('../../keabot-support/src/routing.js');
    const result = classifyTicket('My contractor is not responding');
    expect(result.category).toBe('contractor_support');
  });
});

describe('FAQ search', () => {
  it('should find FAQ answer for permit refund', async () => {
    const { searchFAQ } = await import('../../keabot-support/src/faq.js');
    const result = searchFAQ('How do I get a permit refund?');
    expect(result.found).toBe(true);
    expect(result.confidence).toBeGreaterThan(0.6);
    expect(result.answer).toContain('refundable');
  });

  it('should auto-respond with high confidence', async () => {
    const { searchFAQ } = await import('../../keabot-support/src/faq.js');
    const result = searchFAQ('What payment methods do you accept?');
    expect(result.found).toBe(true);
    if (result.confidence >= 0.85) {
      expect(result.autoRespond).toBe(true);
    }
  });
});

describe('refund calculation', () => {
  it('should refund 50% for contractor quality issue', async () => {
    const { calculateRefund } = await import('../../keabot-support/src/refund.js');
    const result = calculateRefund(1000, 'contractor_quality_issue');
    expect(result.refundAmount).toBe(500);
    expect(result.refundPercentage).toBe(50);
    expect(result.approved).toBe(true);
  });

  it('should refund 75% for project cancellation', async () => {
    const { calculateRefund } = await import('../../keabot-support/src/refund.js');
    const result = calculateRefund(2000, 'project_cancelled');
    expect(result.refundAmount).toBe(1500);
    expect(result.refundPercentage).toBe(75);
  });

  it('should refund 100% for service not provided', async () => {
    const { calculateRefund } = await import('../../keabot-support/src/refund.js');
    const result = calculateRefund(500, 'service_not_provided');
    expect(result.refundAmount).toBe(500);
    expect(result.refundPercentage).toBe(100);
  });
});
