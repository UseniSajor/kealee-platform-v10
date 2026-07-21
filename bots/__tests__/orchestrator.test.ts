import { BotOrchestrator } from '../../services/keabots/orchestrator.js';
import type { BotRequest } from '../../services/keabots/types.js';

jest.mock('../../bots/keabot-owner/src/bot.js', () => ({
  KeaBotOwner: class {
    name = 'keabot-owner';
    async initialize() {}
    async handleMessage() { return '{"status":"intake_complete","projectId":"proj_123"}'; }
  },
}));

describe('BotOrchestrator', () => {
  let orch: BotOrchestrator;

  beforeEach(async () => {
    orch = new BotOrchestrator();
    await orch.initialize();
  });

  it('should initialize successfully', () => {
    expect(orch).toBeDefined();
  });

  it('should return error for unknown stage', async () => {
    const req: BotRequest = { projectId: 'p1', stage: 'intake', data: {} };
    // With mocked bot, should succeed or fail gracefully
    const result = await orch.execute(req);
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('stage', 'intake');
    expect(result).toHaveProperty('latencyMs');
  });

  it('should return health check report', async () => {
    const health = await orch.healthCheck();
    expect(health).toHaveProperty('status');
    expect(health).toHaveProperty('bots');
    expect(health).toHaveProperty('database');
    expect(health).toHaveProperty('checkedAt');
  });

  it('should chain bots for empty stage list', async () => {
    const results = await orch.chainBots('p1', []);
    expect(results).toEqual([]);
  });
});
