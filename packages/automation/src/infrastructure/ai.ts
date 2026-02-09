import Anthropic from '@anthropic-ai/sdk';
import type { ImageBlockParam, TextBlockParam, MessageParam } from '@anthropic-ai/sdk/resources/messages';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const DEFAULT_MODEL = 'claude-sonnet-4-5-20250929';
const DEFAULT_MAX_TOKENS = 2000;
const DEFAULT_TEMPERATURE = 0.3;
const MAX_RETRIES = 3;

interface TokenUsage {
  input: number;
  output: number;
}

// ---------------------------------------------------------------------------
// Retry helper
// ---------------------------------------------------------------------------

async function withRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const status = err?.status ?? err?.statusCode;
      if (status === 429 || (status >= 500 && status < 600)) {
        const delay = Math.pow(2, attempt) * 1000;
        console.warn(
          `[AI] Retrying in ${delay}ms (attempt ${attempt + 1}/${retries}, status ${status})`,
        );
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}

// ---------------------------------------------------------------------------
// generateText
// ---------------------------------------------------------------------------

export async function generateText(opts: {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<{ text: string; usage: TokenUsage }> {
  const response = await withRetry(() =>
    client.messages.create({
      model: opts.model ?? DEFAULT_MODEL,
      max_tokens: opts.maxTokens ?? DEFAULT_MAX_TOKENS,
      temperature: opts.temperature ?? DEFAULT_TEMPERATURE,
      system: opts.systemPrompt,
      messages: [{ role: 'user', content: opts.userPrompt }],
    }),
  );

  const block = response.content[0];
  const text = block.type === 'text' ? block.text : '';

  return {
    text,
    usage: {
      input: response.usage.input_tokens,
      output: response.usage.output_tokens,
    },
  };
}

// ---------------------------------------------------------------------------
// generateJSON
// ---------------------------------------------------------------------------

export async function generateJSON<T = unknown>(opts: {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  maxTokens?: number;
}): Promise<{ data: T; usage: TokenUsage }> {
  const jsonSystemPrompt =
    opts.systemPrompt +
    '\n\nRespond ONLY with valid JSON. No markdown, no backticks, no preamble.';

  const result = await generateText({
    ...opts,
    systemPrompt: jsonSystemPrompt,
    temperature: 0.1,
  });

  try {
    const data = JSON.parse(result.text) as T;
    return { data, usage: result.usage };
  } catch {
    // Retry once with stronger instruction
    const retryResult = await generateText({
      ...opts,
      systemPrompt: jsonSystemPrompt,
      userPrompt:
        opts.userPrompt +
        '\n\nIMPORTANT: Your previous response was not valid JSON. Output ONLY a raw JSON object with no surrounding text.',
      temperature: 0,
    });

    const data = JSON.parse(retryResult.text) as T;
    return {
      data,
      usage: {
        input: result.usage.input + retryResult.usage.input,
        output: result.usage.output + retryResult.usage.output,
      },
    };
  }
}

// ---------------------------------------------------------------------------
// analyzeImage
// ---------------------------------------------------------------------------

export async function analyzeImage(opts: {
  imageUrl?: string;
  imageBase64?: string;
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp';
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  maxTokens?: number;
}): Promise<{ text: string; usage: TokenUsage }> {
  let imageBlock: ImageBlockParam;

  if (opts.imageBase64) {
    imageBlock = {
      type: 'image',
      source: {
        type: 'base64',
        media_type: opts.mediaType,
        data: opts.imageBase64,
      },
    };
  } else if (opts.imageUrl) {
    // Fetch the image and convert to base64
    const res = await fetch(opts.imageUrl);
    const buffer = Buffer.from(await res.arrayBuffer());
    imageBlock = {
      type: 'image',
      source: {
        type: 'base64',
        media_type: opts.mediaType,
        data: buffer.toString('base64'),
      },
    };
  } else {
    throw new Error('Either imageUrl or imageBase64 must be provided');
  }

  const textBlock: TextBlockParam = {
    type: 'text',
    text: opts.userPrompt,
  };

  const messages: MessageParam[] = [
    { role: 'user', content: [imageBlock, textBlock] },
  ];

  const response = await withRetry(() =>
    client.messages.create({
      model: opts.model ?? DEFAULT_MODEL,
      max_tokens: opts.maxTokens ?? DEFAULT_MAX_TOKENS,
      system: opts.systemPrompt,
      messages,
    }),
  );

  const block = response.content[0];
  const text = block.type === 'text' ? block.text : '';

  return {
    text,
    usage: {
      input: response.usage.input_tokens,
      output: response.usage.output_tokens,
    },
  };
}

// ---------------------------------------------------------------------------
// analyzeImageJSON
// ---------------------------------------------------------------------------

export async function analyzeImageJSON<T = unknown>(opts: {
  imageUrl?: string;
  imageBase64?: string;
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp';
  systemPrompt: string;
  userPrompt: string;
  model?: string;
}): Promise<{ data: T; usage: TokenUsage }> {
  const result = await analyzeImage({
    ...opts,
    systemPrompt:
      opts.systemPrompt +
      '\n\nRespond ONLY with valid JSON. No markdown, no backticks, no preamble.',
  });

  try {
    const data = JSON.parse(result.text) as T;
    return { data, usage: result.usage };
  } catch {
    // Retry once with stronger instruction
    const retryResult = await analyzeImage({
      ...opts,
      systemPrompt:
        opts.systemPrompt +
        '\n\nRespond ONLY with valid JSON. No markdown, no backticks, no preamble.',
      userPrompt:
        opts.userPrompt +
        '\n\nIMPORTANT: Output ONLY a raw JSON object with no surrounding text.',
    });

    const data = JSON.parse(retryResult.text) as T;
    return {
      data,
      usage: {
        input: result.usage.input + retryResult.usage.input,
        output: result.usage.output + retryResult.usage.output,
      },
    };
  }
}

// ---------------------------------------------------------------------------
// Cost estimation
// ---------------------------------------------------------------------------

const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'claude-sonnet-4-5-20250929': { input: 3, output: 15 },
  'claude-sonnet-4-20250514': { input: 3, output: 15 },
  'claude-haiku-3-5-20241022': { input: 0.8, output: 4 },
};

/**
 * Estimate the cost in dollars for a given token usage and model.
 * Pricing is per million tokens.
 */
export function estimateCost(
  usage: TokenUsage,
  model: string = DEFAULT_MODEL,
): number {
  const pricing = MODEL_PRICING[model] ?? MODEL_PRICING[DEFAULT_MODEL];
  const inputCost = (usage.input / 1_000_000) * pricing.input;
  const outputCost = (usage.output / 1_000_000) * pricing.output;
  return inputCost + outputCost;
}
