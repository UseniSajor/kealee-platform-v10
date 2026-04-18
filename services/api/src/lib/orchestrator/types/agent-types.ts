/**
 * services/ai-orchestrator/src/types/agent-types.ts
 *
 * Shared output types for all Kealee KeaBot agents.
 * Every agent returns AgentOutput — a structured decision with
 * a CTC (Complete Total Cost) estimate and a single priced CTA.
 */

// ── CTC (Complete Total Cost) ─────────────────────────────────────────────────

export interface CTCBreakdown {
  construction: number;   // Hard cost: cost_per_sqft × sqft
  soft: number;           // Design + engineering + permit fees
  risk: number;           // Contingency × zoning risk multiplier
  execution: number;      // Contractor overhead + platform fee
}

export interface CTCOutput {
  total: number;
  range: [number, number];       // [low_estimate, high_estimate]
  cost_per_sqft: number;
  sqft: number;
  breakdown: CTCBreakdown;
}

// ── Agent Output ──────────────────────────────────────────────────────────────

export interface AgentOutput {
  success?: boolean;
  summary: string;
  risks: string[];
  recommendations?: string[];
  confidence: "high" | "medium" | "low";
  next_step: string;
  cta: string;
  conversion_product?: string;
  ctc?: CTCOutput;
  data_used?: Record<string, unknown>;
}
