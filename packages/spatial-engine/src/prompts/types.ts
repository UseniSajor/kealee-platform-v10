/**
 * Prompt-library types.
 *
 * Every prompt is versioned, has a stable id, declares its intended model
 * family, and carries a JSON Schema (string) describing what its output must
 * look like. Callers never inline prompts — they import from
 * `@kealee/spatial-engine/prompts` so the prompt-engineering layer can be
 * iterated independently of the call sites.
 */

export type PromptModelFamily = 'openai-gpt-4o' | 'anthropic-claude' | 'any';

export interface PromptTemplate {
  /** Stable identifier (used for logging + cache keys). */
  id: string;
  /** Bumped on every meaningful prompt change. */
  version: number;
  /** Short human description of what this prompt does. */
  description: string;
  /** Preferred model family — implementations may route differently. */
  model: PromptModelFamily;
  /** System / instruction text. */
  system: string;
  /**
   * User-message template. Substitution uses `{{key}}` markers. Call
   * `renderPrompt(template, vars)` to produce a final string.
   */
  user: string;
  /** JSON Schema (as a string) the response MUST validate against. */
  responseJsonSchema: string;
  /** Estimated max output tokens — guides the LLM client. */
  maxOutputTokens?: number;
  /** Whether to enforce JSON-only output. */
  jsonOnly: boolean;
  /** Optional vision flag — when true, the user message expects image inputs. */
  acceptsImages: boolean;
}

/**
 * Render a prompt template with positional + named substitutions.
 * `{{var}}` markers are replaced; missing keys throw to surface bugs early.
 */
export function renderPrompt(
  template: PromptTemplate,
  vars: Record<string, string | number | boolean>,
): { system: string; user: string } {
  const user = template.user.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    if (!(key in vars)) {
      throw new Error(`[prompt:${template.id}] Missing variable: ${key}`);
    }
    return String(vars[key]);
  });
  return { system: template.system, user };
}
