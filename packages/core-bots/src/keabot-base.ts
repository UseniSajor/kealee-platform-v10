/**
 * KeaBot Base Class — all 13 bots extend this
 */
import Anthropic from '@anthropic-ai/sdk';

export interface BotTool {
  name: string;
  description: string;
  parameters: Record<string, { type: string; description: string; required?: boolean }>;
  handler: (params: Record<string, unknown>) => Promise<unknown>;
}

export interface BotConfig {
  name: string;
  description: string;
  domain: string; // "land", "feasibility", "construction", etc.
  systemPrompt: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface BotMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  toolUse?: { name: string; input: Record<string, unknown>; output?: unknown };
}

export interface HandoffRequest {
  fromBot: string;
  toBot: string;
  reason: string;
  context: Record<string, unknown>;
  conversationHistory: BotMessage[];
}

export abstract class KeaBot {
  protected config: BotConfig;
  protected tools: BotTool[] = [];

  constructor(config: BotConfig) {
    this.config = {
      ...config,
      model: config.model ?? 'claude-sonnet-4-20250514',
      maxTokens: config.maxTokens ?? 4096,
      temperature: config.temperature ?? 0.3,
    };
  }

  get name(): string { return this.config.name; }
  get domain(): string { return this.config.domain; }

  /**
   * Register a tool that this bot can use
   */
  protected registerTool(tool: BotTool): void {
    this.tools.push(tool);
  }

  /**
   * Get tool definitions for Claude API
   */
  getToolDefinitions(): Array<{
    name: string;
    description: string;
    input_schema: { type: 'object'; properties: Record<string, unknown>; required: string[] };
  }> {
    return this.tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      input_schema: {
        type: 'object' as const,
        properties: Object.fromEntries(
          Object.entries(tool.parameters).map(([key, val]) => [key, { type: val.type, description: val.description }])
        ),
        required: Object.entries(tool.parameters)
          .filter(([_, val]) => val.required)
          .map(([key]) => key),
      },
    }));
  }

  /**
   * Execute a tool by name
   */
  async executeTool(toolName: string, params: Record<string, unknown>): Promise<unknown> {
    const tool = this.tools.find(t => t.name === toolName);
    if (!tool) throw new Error(`Tool not found: ${toolName} (bot: ${this.name})`);
    return tool.handler(params);
  }

  /**
   * Call the Anthropic Messages API with the bot's system prompt, tools, and
   * the user message. Loops through tool_use responses, executing each tool
   * and feeding results back until the model produces a final text response.
   */
  protected async chat(
    userMessage: string,
    context?: Record<string, unknown>,
  ): Promise<string> {
    const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env

    const tools = this.getToolDefinitions();

    // Build the conversation messages array
    const messages: Anthropic.MessageParam[] = [
      { role: 'user', content: userMessage },
    ];

    // Loop until we get a final text-only response (no tool_use blocks)
    const MAX_ITERATIONS = 10;
    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const response = await client.messages.create({
        model: this.config.model!,
        max_tokens: this.config.maxTokens!,
        temperature: this.config.temperature!,
        system: this.config.systemPrompt,
        tools: tools as Anthropic.Tool[],
        messages,
      });

      // Check if the response contains any tool_use blocks
      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.ContentBlockParam & { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> } =>
          block.type === 'tool_use',
      );

      // If the model is not requesting tool execution, return the text response
      if (response.stop_reason !== 'tool_use' || toolUseBlocks.length === 0) {
        const textParts = response.content
          .filter((block): block is Anthropic.TextBlock => block.type === 'text')
          .map((block) => block.text);

        return textParts.length > 0
          ? textParts.join('\n')
          : `[${this.name}] No response generated.`;
      }

      // Append the assistant turn with all content blocks
      messages.push({ role: 'assistant', content: response.content });

      // Execute each tool call and build tool_result blocks
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const toolBlock of toolUseBlocks) {
        let result: unknown;
        try {
          result = await this.executeTool(toolBlock.name, toolBlock.input);
        } catch (err) {
          result = { error: err instanceof Error ? err.message : String(err) };
        }
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolBlock.id,
          content: typeof result === 'string' ? result : JSON.stringify(result),
        });
      }

      // Append the tool results as a user turn
      messages.push({ role: 'user', content: toolResults });

      // If the model stopped because it finished (end_turn) with tool calls
      // but also had text, we already returned above. If stop_reason is
      // 'tool_use', the loop continues to let the model process results.
    }

    return `[${this.name}] Reached maximum tool-use iterations.`;
  }

  /**
   * Initialize the bot (register tools, set up connections)
   */
  abstract initialize(): Promise<void>;

  /**
   * Handle a user message
   */
  abstract handleMessage(message: string, context?: Record<string, unknown>): Promise<string>;

  /**
   * Determine if this bot should hand off to another bot
   */
  abstract shouldHandoff(message: string): HandoffRequest | null;
}
