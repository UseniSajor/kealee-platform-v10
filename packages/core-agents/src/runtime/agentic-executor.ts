/**
 * Agentic Executor — Multi-step tool execution loop with Claude
 *
 * Core pattern: Claude generates tool_use blocks → execute tools → feed results back → repeat until end_turn.
 * Differs from KeaCoreRuntime which uses explicit plans; this is pure Claude tool orchestration.
 */

import Anthropic from '@anthropic-ai/sdk';
import { SessionMemory, ToolExecutionRecord } from '../types';
import { createId } from '../utils/ids';

export interface AgenticTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>; // JSON Schema
  execute: (input: unknown) => Promise<unknown>;
}

export interface AgenticExecutionContext {
  sessionId: string;
  userId?: string;
  projectId?: string;
  metadata?: Record<string, unknown>;
}

export interface AgenticExecutionResult {
  status: 'completed' | 'failed' | 'max_iterations_reached';
  finalText: string;
  toolHistory: ToolExecutionRecord[];
  totalIterations: number;
  error?: string;
}

const MAX_ITERATIONS = 20;
const ITERATION_TIMEOUT_MS = 30000;

/**
 * Execute a multi-step agentic task with Claude tool use.
 * Loops until Claude stops generating tool_use blocks (end_turn).
 */
export async function callModelAgentic(args: {
  systemPrompt: string;
  userMessage: string;
  tools: AgenticTool[];
  model?: string;
  maxTokens?: number;
  context?: AgenticExecutionContext;
  memory?: SessionMemory;
}): Promise<AgenticExecutionResult> {
  const {
    systemPrompt,
    userMessage,
    tools,
    model = 'claude-opus-4-8',
    maxTokens = 4096,
    context,
    memory,
  } = args;

  const toolHistory: ToolExecutionRecord[] = [];
  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: userMessage },
  ];

  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  // Convert tools to Anthropic format
  const anthropicTools: Anthropic.Tool[] = tools.map(tool => ({
    name: tool.name,
    description: tool.description,
    input_schema: {
      type: 'object' as const,
      properties: tool.inputSchema as Record<string, unknown>,
    },
  }));

  let totalIterations = 0;

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    totalIterations = iteration + 1;

    try {
      // Call Claude with timeout
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Iteration timeout')), ITERATION_TIMEOUT_MS)
      );

      const response = await Promise.race([
        client.messages.create({
          model,
          max_tokens: maxTokens,
          system: systemPrompt,
          tools: anthropicTools.length > 0 ? anthropicTools : undefined,
          messages,
        }),
        timeoutPromise,
      ]) as Anthropic.Message;

      // Check if we got tool_use blocks
      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
      );

      // If no tool_use blocks or stop_reason is not tool_use, we're done
      if (response.stop_reason !== 'tool_use' || toolUseBlocks.length === 0) {
        const textBlocks = response.content.filter(
          (block): block is Anthropic.TextBlock => block.type === 'text'
        );
        const finalText = textBlocks.map(b => b.text).join('\n');

        // Persist tool history to memory if provided
        if (memory) {
          memory.toolHistory.push(...toolHistory);
        }

        return {
          status: 'completed',
          finalText,
          toolHistory,
          totalIterations,
        };
      }

      // Append assistant's response
      messages.push({ role: 'assistant', content: response.content });

      // Execute all tools in this iteration
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      const startedAt = new Date().toISOString();

      for (const toolUse of toolUseBlocks) {
        const tool = tools.find(t => t.name === toolUse.name);
        if (!tool) {
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: `Tool not found: ${toolUse.name}`,
            is_error: true,
          });
          continue;
        }

        let output: unknown;
        let error: string | undefined;

        try {
          output = await tool.execute(toolUse.input);
        } catch (err) {
          error = err instanceof Error ? err.message : String(err);
        }

        // Record tool execution
        const record: ToolExecutionRecord = {
          id: createId('toolrun'),
          toolName: tool.name,
          input: toolUse.input as Record<string, unknown>,
          output: output as Record<string, unknown>,
          success: !error,
          startedAt,
          completedAt: new Date().toISOString(),
          error,
        };

        toolHistory.push(record);

        // Return result to Claude
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: error ? `Error: ${error}` : JSON.stringify(output),
          is_error: !!error,
        });
      }

      // Append tool results as user message
      messages.push({ role: 'user', content: toolResults });
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);

      if (memory) {
        memory.toolHistory.push(...toolHistory);
      }

      return {
        status: 'failed',
        finalText: '',
        toolHistory,
        totalIterations,
        error,
      };
    }
  }

  if (memory) {
    memory.toolHistory.push(...toolHistory);
  }

  return {
    status: 'max_iterations_reached',
    finalText: '',
    toolHistory,
    totalIterations,
    error: `Max iterations (${MAX_ITERATIONS}) reached without completion`,
  };
}
