/**
 * KeaBot Base & Bot Registry Tests
 * Tests tool registration, tool execution, bot registry management,
 * handoff routing, tool definitions for Claude API, and chat loop.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock Anthropic SDK ──────────────────────────────────────

const mockMessagesCreate = vi.fn();

vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: {
        create: mockMessagesCreate,
      },
    })),
  };
});

// Import after mock
import { KeaBot, type BotConfig, type BotTool, type HandoffRequest } from '../keabot-base';
import { BotRegistry } from '../bot-registry';

// ── Concrete test bot implementation ────────────────────────

class TestBot extends KeaBot {
  public initializeCalled = false;
  public lastHandoffCheck: string | null = null;

  constructor(config: Partial<BotConfig> = {}) {
    super({
      name: config.name ?? 'test-bot',
      description: config.description ?? 'A test bot',
      domain: config.domain ?? 'testing',
      systemPrompt: config.systemPrompt ?? 'You are a test bot.',
      model: config.model,
      maxTokens: config.maxTokens,
      temperature: config.temperature,
    });
  }

  async initialize(): Promise<void> {
    this.initializeCalled = true;
  }

  async handleMessage(message: string, context?: Record<string, unknown>): Promise<string> {
    return this.chat(message, context);
  }

  shouldHandoff(message: string): HandoffRequest | null {
    this.lastHandoffCheck = message;

    if (message.includes('transfer to finance')) {
      return {
        fromBot: this.name,
        toBot: 'finance-bot',
        reason: 'User requested finance assistance',
        context: {},
        conversationHistory: [
          { role: 'user', content: message },
        ],
      };
    }

    return null;
  }

  // Expose protected methods for testing
  public registerToolPublic(tool: BotTool): void {
    this.registerTool(tool);
  }

  public async chatPublic(message: string, context?: Record<string, unknown>): Promise<string> {
    return this.chat(message, context);
  }
}

class FinanceBot extends KeaBot {
  constructor() {
    super({
      name: 'finance-bot',
      description: 'Finance domain bot',
      domain: 'finance',
      systemPrompt: 'You handle financial queries.',
    });
  }

  async initialize(): Promise<void> {}

  async handleMessage(message: string): Promise<string> {
    return `[finance-bot] Received: ${message}`;
  }

  shouldHandoff(): HandoffRequest | null {
    return null;
  }
}

// ── Tests ────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

// =====================================================================
// KeaBot Configuration
// =====================================================================

describe('KeaBot configuration', () => {
  it('applies default model, maxTokens, and temperature', () => {
    const bot = new TestBot();

    expect(bot.name).toBe('test-bot');
    expect(bot.domain).toBe('testing');
  });

  it('allows custom model, maxTokens, and temperature', () => {
    const bot = new TestBot({
      model: 'claude-opus-4-20250514',
      maxTokens: 8192,
      temperature: 0.7,
    });

    expect(bot.name).toBe('test-bot');
    // Config is private, but we can verify indirectly via getToolDefinitions
  });
});

// =====================================================================
// Tool Registration
// =====================================================================

describe('KeaBot tool registration', () => {
  it('registers a tool and makes it available', async () => {
    const bot = new TestBot();

    const mockHandler = vi.fn().mockResolvedValue({ result: 'success' });

    bot.registerToolPublic({
      name: 'calculate_cost',
      description: 'Calculate project cost',
      parameters: {
        sqft: { type: 'number', description: 'Square footage', required: true },
        rate: { type: 'number', description: 'Cost per sq ft', required: true },
      },
      handler: mockHandler,
    });

    const result = await bot.executeTool('calculate_cost', { sqft: 1000, rate: 150 });

    expect(result).toEqual({ result: 'success' });
    expect(mockHandler).toHaveBeenCalledWith({ sqft: 1000, rate: 150 });
  });

  it('registers multiple tools', () => {
    const bot = new TestBot();

    bot.registerToolPublic({
      name: 'tool_a',
      description: 'Tool A',
      parameters: {},
      handler: vi.fn(),
    });

    bot.registerToolPublic({
      name: 'tool_b',
      description: 'Tool B',
      parameters: {},
      handler: vi.fn(),
    });

    const defs = bot.getToolDefinitions();
    expect(defs).toHaveLength(2);
    expect(defs[0].name).toBe('tool_a');
    expect(defs[1].name).toBe('tool_b');
  });
});

// =====================================================================
// Tool Execution
// =====================================================================

describe('KeaBot tool execution', () => {
  it('executes a registered tool with correct parameters', async () => {
    const bot = new TestBot();
    const handler = vi.fn().mockResolvedValue({ cost: 150000 });

    bot.registerToolPublic({
      name: 'estimate',
      description: 'Estimate cost',
      parameters: {
        sqft: { type: 'number', description: 'Square footage', required: true },
      },
      handler,
    });

    const result = await bot.executeTool('estimate', { sqft: 1000 });
    expect(result).toEqual({ cost: 150000 });
    expect(handler).toHaveBeenCalledWith({ sqft: 1000 });
  });

  it('throws when executing a non-existent tool', async () => {
    const bot = new TestBot();

    await expect(
      bot.executeTool('nonexistent_tool', {}),
    ).rejects.toThrow('Tool not found: nonexistent_tool (bot: test-bot)');
  });

  it('propagates errors from tool handlers', async () => {
    const bot = new TestBot();

    bot.registerToolPublic({
      name: 'failing_tool',
      description: 'A tool that fails',
      parameters: {},
      handler: vi.fn().mockRejectedValue(new Error('Database connection failed')),
    });

    await expect(
      bot.executeTool('failing_tool', {}),
    ).rejects.toThrow('Database connection failed');
  });
});

// =====================================================================
// Tool Definitions (for Claude API)
// =====================================================================

describe('KeaBot.getToolDefinitions', () => {
  it('returns empty array when no tools registered', () => {
    const bot = new TestBot();
    expect(bot.getToolDefinitions()).toEqual([]);
  });

  it('formats tool definitions correctly for Claude API', () => {
    const bot = new TestBot();

    bot.registerToolPublic({
      name: 'search_parcels',
      description: 'Search available land parcels',
      parameters: {
        city: { type: 'string', description: 'City name', required: true },
        state: { type: 'string', description: 'State code', required: true },
        minAcres: { type: 'number', description: 'Minimum acreage' },
      },
      handler: vi.fn(),
    });

    const defs = bot.getToolDefinitions();

    expect(defs).toHaveLength(1);
    expect(defs[0]).toEqual({
      name: 'search_parcels',
      description: 'Search available land parcels',
      input_schema: {
        type: 'object',
        properties: {
          city: { type: 'string', description: 'City name' },
          state: { type: 'string', description: 'State code' },
          minAcres: { type: 'number', description: 'Minimum acreage' },
        },
        required: ['city', 'state'],
      },
    });
  });

  it('handles tools with no required parameters', () => {
    const bot = new TestBot();

    bot.registerToolPublic({
      name: 'get_status',
      description: 'Get current status',
      parameters: {
        verbose: { type: 'boolean', description: 'Verbose output' },
      },
      handler: vi.fn(),
    });

    const defs = bot.getToolDefinitions();
    expect(defs[0].input_schema.required).toEqual([]);
  });
});

// =====================================================================
// Chat Loop (Anthropic API interaction)
// =====================================================================

describe('KeaBot chat', () => {
  it('returns text response when no tool_use blocks', async () => {
    const bot = new TestBot();

    mockMessagesCreate.mockResolvedValue({
      content: [
        { type: 'text', text: 'Here is your feasibility analysis.' },
      ],
      stop_reason: 'end_turn',
    });

    const result = await bot.chatPublic('Analyze this project');

    expect(result).toBe('Here is your feasibility analysis.');
    expect(mockMessagesCreate).toHaveBeenCalledTimes(1);
  });

  it('executes tool calls and feeds results back', async () => {
    const bot = new TestBot();
    const toolHandler = vi.fn().mockResolvedValue({ parcels: 5 });

    bot.registerToolPublic({
      name: 'count_parcels',
      description: 'Count available parcels',
      parameters: {
        state: { type: 'string', description: 'State', required: true },
      },
      handler: toolHandler,
    });

    // First call: model wants to use a tool
    mockMessagesCreate.mockResolvedValueOnce({
      content: [
        {
          type: 'tool_use',
          id: 'toolu_001',
          name: 'count_parcels',
          input: { state: 'TX' },
        },
      ],
      stop_reason: 'tool_use',
    });

    // Second call: model returns final text after receiving tool result
    mockMessagesCreate.mockResolvedValueOnce({
      content: [
        { type: 'text', text: 'There are 5 parcels available in Texas.' },
      ],
      stop_reason: 'end_turn',
    });

    const result = await bot.chatPublic('How many parcels in TX?');

    expect(result).toBe('There are 5 parcels available in Texas.');
    expect(toolHandler).toHaveBeenCalledWith({ state: 'TX' });
    expect(mockMessagesCreate).toHaveBeenCalledTimes(2);
  });

  it('handles tool execution errors gracefully', async () => {
    const bot = new TestBot();

    bot.registerToolPublic({
      name: 'failing_tool',
      description: 'A tool that fails',
      parameters: {},
      handler: vi.fn().mockRejectedValue(new Error('Service unavailable')),
    });

    // Model calls the failing tool
    mockMessagesCreate.mockResolvedValueOnce({
      content: [
        {
          type: 'tool_use',
          id: 'toolu_002',
          name: 'failing_tool',
          input: {},
        },
      ],
      stop_reason: 'tool_use',
    });

    // Model responds to the error
    mockMessagesCreate.mockResolvedValueOnce({
      content: [
        { type: 'text', text: 'I encountered an error trying to use that tool.' },
      ],
      stop_reason: 'end_turn',
    });

    const result = await bot.chatPublic('Do the thing');

    expect(result).toBe('I encountered an error trying to use that tool.');
  });

  it('returns max iterations message when loop exhausts', async () => {
    const bot = new TestBot();

    bot.registerToolPublic({
      name: 'infinite_tool',
      description: 'Always called',
      parameters: {},
      handler: vi.fn().mockResolvedValue('ok'),
    });

    // Always return tool_use
    mockMessagesCreate.mockResolvedValue({
      content: [
        {
          type: 'tool_use',
          id: 'toolu_loop',
          name: 'infinite_tool',
          input: {},
        },
      ],
      stop_reason: 'tool_use',
    });

    const result = await bot.chatPublic('Loop forever');

    expect(result).toBe('[test-bot] Reached maximum tool-use iterations.');
    expect(mockMessagesCreate).toHaveBeenCalledTimes(10); // MAX_ITERATIONS
  });

  it('returns no response message when model returns empty content', async () => {
    const bot = new TestBot();

    mockMessagesCreate.mockResolvedValue({
      content: [],
      stop_reason: 'end_turn',
    });

    const result = await bot.chatPublic('Say nothing');

    expect(result).toBe('[test-bot] No response generated.');
  });
});

// =====================================================================
// Bot Registry
// =====================================================================

describe('BotRegistry', () => {
  it('registers and retrieves bots by name', () => {
    const registry = new BotRegistry();
    const bot = new TestBot({ name: 'land-bot', domain: 'land' });

    registry.register(bot);

    expect(registry.get('land-bot')).toBe(bot);
    expect(registry.get('nonexistent')).toBeUndefined();
  });

  it('getRequired throws for missing bots', () => {
    const registry = new BotRegistry();

    expect(() => registry.getRequired('ghost-bot')).toThrow('Bot not found: ghost-bot');
  });

  it('retrieves bots by domain', () => {
    const registry = new BotRegistry();
    const landBot = new TestBot({ name: 'land-bot', domain: 'land' });
    const financeBot = new TestBot({ name: 'finance-bot', domain: 'finance' });

    registry.register(landBot);
    registry.register(financeBot);

    expect(registry.getByDomain('land')).toBe(landBot);
    expect(registry.getByDomain('finance')).toBe(financeBot);
    expect(registry.getByDomain('unknown')).toBeUndefined();
  });

  it('lists all registered bots', () => {
    const registry = new BotRegistry();
    registry.register(new TestBot({ name: 'bot-a', domain: 'alpha' }));
    registry.register(new TestBot({ name: 'bot-b', domain: 'beta' }));

    const list = registry.list();

    expect(list).toHaveLength(2);
    expect(list).toEqual(
      expect.arrayContaining([
        { name: 'bot-a', domain: 'alpha' },
        { name: 'bot-b', domain: 'beta' },
      ]),
    );
  });

  it('initializes all registered bots', async () => {
    const registry = new BotRegistry();
    const botA = new TestBot({ name: 'bot-a' });
    const botB = new TestBot({ name: 'bot-b' });

    registry.register(botA);
    registry.register(botB);

    await registry.initializeAll();

    expect(botA.initializeCalled).toBe(true);
    expect(botB.initializeCalled).toBe(true);
  });
});

// =====================================================================
// Handoff Routing
// =====================================================================

describe('BotRegistry handoff', () => {
  it('executes a handoff from one bot to another', async () => {
    const registry = new BotRegistry();
    const sourceBot = new TestBot({ name: 'land-bot', domain: 'land' });
    const targetBot = new FinanceBot();

    registry.register(sourceBot);
    registry.register(targetBot);

    const handoffRequest: HandoffRequest = {
      fromBot: 'land-bot',
      toBot: 'finance-bot',
      reason: 'User asked about project financing',
      context: { projectId: 'proj_001' },
      conversationHistory: [
        { role: 'user', content: 'What are the financing options?' },
        { role: 'assistant', content: 'Let me transfer you to the finance specialist.' },
      ],
    };

    const result = await registry.executeHandoff(handoffRequest);

    expect(result).toContain('[finance-bot] Received:');
    expect(result).toContain('Handoff from land-bot');
    expect(result).toContain('User asked about project financing');
  });

  it('throws when target bot for handoff is not found', async () => {
    const registry = new BotRegistry();
    const sourceBot = new TestBot();
    registry.register(sourceBot);

    const handoffRequest: HandoffRequest = {
      fromBot: 'test-bot',
      toBot: 'nonexistent-bot',
      reason: 'Transfer needed',
      context: {},
      conversationHistory: [],
    };

    await expect(
      registry.executeHandoff(handoffRequest),
    ).rejects.toThrow('Bot not found: nonexistent-bot');
  });

  it('includes conversation context in handoff message', async () => {
    const registry = new BotRegistry();
    const financeBot = new FinanceBot();
    registry.register(financeBot);

    const handoffRequest: HandoffRequest = {
      fromBot: 'land-bot',
      toBot: 'finance-bot',
      reason: 'Budget question',
      context: {},
      conversationHistory: [
        { role: 'user', content: 'How much will this cost?' },
        { role: 'assistant', content: 'Estimating...' },
        { role: 'user', content: 'What about financing?' },
      ],
    };

    const result = await registry.executeHandoff(handoffRequest);

    // Should include the last messages from conversation history
    expect(result).toContain('How much will this cost?');
    expect(result).toContain('What about financing?');
  });
});

// =====================================================================
// shouldHandoff logic
// =====================================================================

describe('KeaBot.shouldHandoff', () => {
  it('returns a handoff request when trigger phrase detected', () => {
    const bot = new TestBot();

    const result = bot.shouldHandoff('I need to transfer to finance for budget questions');

    expect(result).not.toBeNull();
    expect(result!.fromBot).toBe('test-bot');
    expect(result!.toBot).toBe('finance-bot');
    expect(result!.reason).toBe('User requested finance assistance');
  });

  it('returns null when no handoff is needed', () => {
    const bot = new TestBot();

    const result = bot.shouldHandoff('What is the project schedule?');

    expect(result).toBeNull();
  });
});
