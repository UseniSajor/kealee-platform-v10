/**
 * core-llm/confidence.ts
 * Confidence scoring and fallback threshold logic.
 *
 * Scores are 0–1 (higher = more confident).
 * If a score falls below the threshold for a given dimension,
 * the router triggers a fallback provider.
 */

// ─── Thresholds ───────────────────────────────────────────────────────────────
// Adjust these thresholds based on observed quality of internal model outputs.

export const CONFIDENCE_THRESHOLDS = {
  /** Intent classification — must be reliable to select the right workflow */
  intent_classification: 0.75,
  /** Retrieval sufficiency — did we find enough context for a grounded answer? */
  retrieval_sufficiency: 0.60,
  /** Internal summary confidence — is the summary coherent and grounded? */
  internal_summary: 0.70,
  /** Service recommendation confidence */
  recommendation: 0.65,
  /** Multimodal interpretation confidence (Qwen3-VL) */
  multimodal_interpretation: 0.60,
} as const;

export type ConfidenceDimension = keyof typeof CONFIDENCE_THRESHOLDS;

// ─── Heuristic scorer ────────────────────────────────────────────────────────
// Used when the model does not return logprob confidence.
// A production improvement is to request self-assessed confidence in the prompt.

export function heuristicConfidence(output: string): number {
  if (!output || output.trim().length === 0) return 0.05;
  const lower = output.toLowerCase();

  // Very low confidence signals
  if (lower.includes("i don't know") || lower.includes("i cannot determine")) return 0.25;
  if (lower.includes("insufficient information") || lower.includes("not enough context")) return 0.30;

  // Medium-low signals
  if (lower.includes("unclear") || lower.includes("unknown") || lower.includes("uncertain")) return 0.45;
  if (lower.includes("possibly") || lower.includes("might be") || lower.includes("could be")) return 0.55;

  // Good length and structure = baseline good
  if (output.trim().length > 500) return 0.82;
  if (output.trim().length > 200) return 0.75;
  if (output.trim().length > 50) return 0.65;
  return 0.50;
}

// ─── JSON parse confidence ────────────────────────────────────────────────────
// After parsing JSON output, score based on how many required fields are present.

export function jsonParseConfidence(
  parsed: unknown,
  requiredFields: string[],
): number {
  if (!parsed || typeof parsed !== "object") return 0.10;
  const obj = parsed as Record<string, unknown>;
  const present = requiredFields.filter((f) => obj[f] !== undefined && obj[f] !== null).length;
  return present / requiredFields.length;
}

// ─── Fallback check ───────────────────────────────────────────────────────────

export function needsFallback(score: number, dimension: ConfidenceDimension): boolean {
  return score < CONFIDENCE_THRESHOLDS[dimension];
}

// ─── Retrieval sufficiency scorer ─────────────────────────────────────────────

export function retrievalSufficiencyScore(blocksFound: number, minExpected: number): number {
  if (blocksFound === 0) return 0.0;
  if (blocksFound >= minExpected) return 0.85;
  return 0.40 + (blocksFound / minExpected) * 0.40;
}
