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

describe('keabot-contractor-match', () => {
  let bot: any;

  beforeEach(async () => {
    const { KeaBotContractorMatch } = await import('../../keabot-contractor-match/src/bot.js');
    bot = new KeaBotContractorMatch();
    await bot.initialize();
  });

  it('should register 6 tools', () => {
    expect(bot.getToolDefinitions().length).toBe(6);
  });

  it('should have search_contractors tool', () => {
    const tool = bot.getToolDefinitions().find((t: any) => t.name === 'search_contractors');
    expect(tool).toBeDefined();
  });

  it('should have score_contractors tool', () => {
    const tool = bot.getToolDefinitions().find((t: any) => t.name === 'score_contractors');
    expect(tool).toBeDefined();
  });

  it('should have verify_license_insurance tool', () => {
    const tool = bot.getToolDefinitions().find((t: any) => t.name === 'verify_license_insurance');
    expect(tool).toBeDefined();
  });

  it('should search contractors and return results', async () => {
    const tool = bot.getToolDefinitions().find((t: any) => t.name === 'search_contractors');
    const result = await tool.handler({ trade: 'HVAC', lat: 38.9072, lng: -77.0369, city: 'Washington DC', radiusKm: 25 });
    expect(result).toHaveProperty('trade', 'HVAC');
    expect(result).toHaveProperty('contractors');
    expect(Array.isArray(result.contractors)).toBe(true);
  });

  it('should score contractors with top 5 results', async () => {
    const tool = bot.getToolDefinitions().find((t: any) => t.name === 'score_contractors');
    const result = await tool.handler({ projectId: 'proj_123', trade: 'HVAC', lat: 38.9072, lng: -77.0369, city: 'DC', budget: 50000 });
    expect(result).toHaveProperty('projectId', 'proj_123');
    expect(result).toHaveProperty('matches');
    expect(result.matches.length).toBeLessThanOrEqual(5);
  });
});

describe('contractor scoring algorithm', () => {
  it('should give exact trade match 100 points', async () => {
    const { scoreContractor } = await import('../../keabot-contractor-match/src/scoring.js');
    const contractor = {
      id: 'c1', name: 'Test', trades: ['HVAC'], serviceArea: [], lat: 38.9, lng: -77.0,
      rating: 5, reviewCount: 10, yearsExperience: 10, licenseNumber: 'X', licenseStatus: 'valid' as const,
      insuranceActive: true, insuranceExpiry: new Date('2027-01-01'), isActive: true,
      priceRangeLow: 1000, priceRangeHigh: 5000, availability: 'immediate',
    };
    const score = scoreContractor(contractor, {
      projectId: 'p1', trade: 'HVAC',
      location: { lat: 38.9, lng: -77.0, city: 'DC' }, budget: 10000,
    });
    expect(score.breakdown.tradeMatch).toBe(100);
  });

  it('should score availability correctly for immediate', async () => {
    const { scoreContractor } = await import('../../keabot-contractor-match/src/scoring.js');
    const contractor = {
      id: 'c1', name: 'Test', trades: ['electrical'], serviceArea: [], lat: 38.9, lng: -77.0,
      rating: 4, reviewCount: 5, yearsExperience: 8, licenseNumber: 'X', licenseStatus: 'valid' as const,
      insuranceActive: true, insuranceExpiry: new Date('2027-01-01'), isActive: true,
      priceRangeLow: 2000, priceRangeHigh: 8000, availability: 'immediate',
    };
    const score = scoreContractor(contractor, {
      projectId: 'p1', trade: 'electrical',
      location: { lat: 38.9, lng: -77.0, city: 'DC' }, budget: 15000,
    });
    expect(score.breakdown.availability).toBe(100);
  });
});
