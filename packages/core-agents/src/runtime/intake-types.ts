/**
 * core-agents/runtime/intake-types.ts
 * Shared intake type used by normalizer, AI analysis, and keacore orchestrator.
 */

export interface NormalizedIntake {
  address?: string;
  city?: string;
  county?: string;
  state?: string;
  zipCode?: string;
  projectType?: string;
  scopeSummary?: string;
  budgetRange?: string;
  timeline?: string;
  stylePreferences?: string;
  hasPlans?: boolean;
  hasImages?: boolean;
  jurisdictionCode?: string;
  rawText?: string;
}
