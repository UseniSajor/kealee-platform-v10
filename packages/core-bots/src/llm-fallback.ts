/**
 * LLM Fallback System
 *
 * Provides graceful fallback from Claude API to local LLM (vLLM/Ollama)
 * if Claude is unavailable or fails. All responses include llmSource flag.
 */

import Anthropic from '@anthropic-ai/sdk';

export type LLMSource = 'CLAUDE' | 'LOCAL' | 'ERROR';

export interface LLMResponse {
  content: Anthropic.ContentBlock[];
  stopReason: 'end_turn' | 'tool_use' | 'max_tokens' | 'stop_sequence' | 'error';
  llmSource: LLMSource;
  error?: string;
}

interface LocalLLMResponse {
  content: string;
  stop_reason: string;
}

/**
 * Initialize local LLM provider if configured
 */
function getLocalLLMConfig() {
  return {
    enabled: process.env.INTERNAL_LLM_ENABLED === 'true',
    baseUrl: process.env.INTERNAL_LLM_BASE_URL || 'http://localhost:8000',
    model: process.env.INTERNAL_LLM_MODEL || 'meta-llama/Llama-2-7b-hf',
  };
}

/**
 * Call local LLM (vLLM/Ollama compatible)
 */
async function callLocalLLM(
  messages: Anthropic.MessageParam[],
  systemPrompt: string,
  model: string,
  maxTokens: number,
  temperature: number,
  tools?: Anthropic.Tool[],
): Promise<LLMResponse> {
  const config = getLocalLLMConfig();

  if (!config.enabled) {
    return {
      content: [{ type: 'text', text: 'Local LLM not configured.' }] as Anthropic.ContentBlock[],
      stopReason: 'error',
      llmSource: 'ERROR',
      error: 'INTERNAL_LLM_ENABLED not set to true',
    };
  }

  try {
    // Convert Anthropic messages to local LLM format
    const formattedMessages = messages.map(msg => {
      if (msg.role === 'user' && typeof msg.content === 'string') {
        return { role: 'user', content: msg.content };
      }
      if (msg.role === 'assistant' && typeof msg.content === 'string') {
        return { role: 'assistant', content: msg.content };
      }
      // Handle array content (tool results, etc.)
      if (Array.isArray(msg.content)) {
        const textContent = msg.content
          .filter((block): block is Anthropic.TextBlock => block.type === 'text')
          .map(block => block.text)
          .join('\n');
        return { role: msg.role, content: textContent || '[Tool results]' };
      }
      return { role: msg.role, content: '[Complex content]' };
    });

    const response = await fetch(`${config.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.model,
        messages: formattedMessages,
        system: systemPrompt,
        max_tokens: maxTokens,
        temperature,
        // Note: tools are not supported by most local LLM endpoints
        // Fallback will return plain text responses
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        content: [{ type: 'text', text: `Local LLM error: ${response.status}` }] as Anthropic.ContentBlock[],
        stopReason: 'error',
        llmSource: 'LOCAL',
        error: errorText.slice(0, 200),
      };
    }

    const data = (await response.json()) as LocalLLMResponse;

    return {
      content: [{ type: 'text', text: data.content }] as Anthropic.ContentBlock[],
      stopReason: (data.stop_reason === 'stop' ? 'end_turn' : 'stop_sequence') as any,
      llmSource: 'LOCAL',
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      content: [{ type: 'text', text: 'Local LLM request failed.' }] as Anthropic.ContentBlock[],
      stopReason: 'error',
      llmSource: 'LOCAL',
      error: message.slice(0, 200),
    };
  }
}

/**
 * Call Claude API with optional fallback to local LLM
 *
 * @param messages Conversation history
 * @param systemPrompt System instruction
 * @param model Claude model ID
 * @param maxTokens Maximum tokens
 * @param temperature Temperature for sampling
 * @param tools Available tools (Claude-only)
 * @returns Response with llmSource indicating which provider was used
 */
export async function callLLMWithFallback(
  messages: Anthropic.MessageParam[],
  systemPrompt: string,
  model: string,
  maxTokens: number,
  temperature: number,
  tools?: Anthropic.Tool[],
): Promise<LLMResponse> {
  // Try Claude first
  try {
    const client = new Anthropic();
    const response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      tools: tools as Anthropic.Tool[],
      messages,
    });

    return {
      content: response.content,
      stopReason: (response.stop_reason === 'tool_use' ? 'tool_use' : response.stop_reason) as any,
      llmSource: 'CLAUDE',
    };
  } catch (claudeError) {
    // Log Claude failure
    const errorMsg = claudeError instanceof Error ? claudeError.message : String(claudeError);
    console.error(`[LLM Fallback] Claude API failed: ${errorMsg.slice(0, 100)}`);

    // Try local LLM fallback
    const config = getLocalLLMConfig();
    if (config.enabled) {
      console.warn(`[LLM Fallback] Attempting fallback to local LLM at ${config.baseUrl}`);
      const localResponse = await callLocalLLM(messages, systemPrompt, model, maxTokens, temperature, tools);

      if (localResponse.llmSource === 'LOCAL' && !localResponse.error) {
        return localResponse;
      }

      // Log local LLM failure
      if (localResponse.error) {
        console.error(`[LLM Fallback] Local LLM also failed: ${localResponse.error}`);
      }
    }

    // Both failed — return error response
    return {
      content: [
        {
          type: 'text',
          text: `Both Claude API and local LLM failed. Please check your configuration. Original error: ${errorMsg.slice(0, 150)}`,
        },
      ] as Anthropic.ContentBlock[],
      stopReason: 'error',
      llmSource: 'ERROR',
      error: errorMsg.slice(0, 200),
    };
  }
}

/**
 * Get LLM configuration status
 */
export function getLLMConfig() {
  return {
    claudeEnabled: !!process.env.ANTHROPIC_API_KEY,
    localLLMEnabled: process.env.INTERNAL_LLM_ENABLED === 'true',
    localLLMConfig: getLocalLLMConfig(),
  };
}
