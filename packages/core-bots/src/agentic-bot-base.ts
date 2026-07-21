/**
 * AgenticBot — Base class for multi-step tool-use bots
 *
 * Extends KeaBot with agentic execution: Claude tool_use loop with RAG + browser
 * Replaces the simple chat() pattern with callModelAgentic()
 */

import { KeaBot, type BotConfig, type BotTool, type HandoffRequest } from './keabot-base';
import { callModelAgentic, type AgenticTool, type AgenticExecutionContext } from '@kealee/core-agents';
import { createRagTool } from './rag-tool';
import { createBrowserTool, getGlobalBrowserAgent } from '@kealee/core-agents';
import type { SessionMemory } from '@kealee/core-agents';

export interface AgenticBotConfig extends BotConfig {
  enableBrowserTool?: boolean; // default: false (browser is opt-in)
  systemPrompt: string; // required for agentic
}

export abstract class AgenticBot extends KeaBot {
  protected agenticConfig: AgenticBotConfig;

  constructor(config: AgenticBotConfig) {
    super(config);
    this.agenticConfig = config;

    // Always add RAG to agentic bots
    if (config.enableRagTool !== false) {
      this.registerTool(createRagTool());
    }

    // Optionally add browser tool
    if (config.enableBrowserTool) {
      const browserTool = createBrowserTool(getGlobalBrowserAgent());
      const botTool: BotTool = {
        name: browserTool.name,
        description: browserTool.description,
        parameters: browserTool.inputSchema as BotTool['parameters'],
        handler: async (params: Record<string, unknown>) => browserTool.execute(params),
      };
      this.registerTool(botTool);
    }
  }

  /**
   * Execute agentic loop: Claude + tool_use + retry
   */
  protected async callAgentic(
    userMessage: string,
    context?: AgenticExecutionContext,
    memory?: SessionMemory
  ): Promise<string> {
    // Convert BotTool to AgenticTool
    const agenticTools: AgenticTool[] = this.tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: Object.fromEntries(
        Object.entries(tool.parameters).map(([key, val]) => [
          key,
          { type: val.type, description: val.description, required: val.required },
        ])
      ),
      execute: (input: unknown) => tool.handler(input as Record<string, unknown>),
    }));

    const result = await callModelAgentic({
      systemPrompt: this.agenticConfig.systemPrompt,
      userMessage,
      tools: agenticTools,
      model: this.config.model,
      maxTokens: this.config.maxTokens,
      context,
      memory,
    });

    if (result.status === 'completed') {
      return result.finalText;
    }

    return JSON.stringify({
      error: `Agentic execution failed: ${result.error}`,
      status: result.status,
      iterations: result.totalIterations,
    });
  }

  /**
   * Implement this to define bot-specific behavior
   */
  abstract initialize(): Promise<void>;

  /**
   * Implement this to handle user messages (use callAgentic() here)
   */
  abstract handleMessage(message: string, context?: Record<string, unknown>): Promise<string>;

  /**
   * Implement this for bot handoff logic
   */
  abstract shouldHandoff(message: string): HandoffRequest | null;
}
