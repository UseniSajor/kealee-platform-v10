/**
 * web-main/lib/keacore.ts
 * Client SDK for calling the KeaCore service from Next.js.
 *
 * Used by intake form pages to submit projects and receive analysis.
 * All calls are server-side (API routes) or client-side with fetch.
 *
 * KeaCore base URL:
 *   - Local dev: http://localhost:3030
 *   - Railway: NEXT_PUBLIC_KEACORE_URL env var
 */

const KEACORE_URL =
  (typeof process !== "undefined" && process.env.KEACORE_URL) ||
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_KEACORE_URL) ||
  "http://localhost:3030";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface IntakePayload {
  // Identity (optional for anonymous)
  orgId?: string;
  userId?: string;
  sessionId?: string;
  source?: "web-main" | "portal-owner" | "portal-developer";

  // Core fields
  address?: string;
  city?: string;
  county?: string;
  state?: string;
  zipCode?: string;
  projectType?: string;
  scopeSummary?: string;
  description?: string;
  budgetRange?: string;
  timeline?: string;
  stylePreferences?: string;
  hasPlans?: boolean;
  hasImages?: boolean;

  // Garden-specific
  gardenType?: string;
  gardenSize?: string;

  // Developer-specific
  lotSize?: string;
  targetUnits?: number;

  // Multimodal
  imageUrl?: string;
}

export interface IntakeAnalysis {
  summary: string;
  complexity: "low" | "medium" | "high";
  riskFlags: string[];
  missingFields: string[];
  primaryService?: string;
  secondaryServices?: string[];
  requiresOperatorReview: boolean;
  disclaimers: string[];
  jurisdictionCode?: string;
  matchedIntent?: string;
  matchedWorkflow?: string;
}

export interface IntakeStartResult {
  sessionId: string;
  intake: Record<string, unknown>;
  analysis: IntakeAnalysis;
  workflow: {
    status: "completed" | "awaiting_approval" | "failed" | "blocked";
    outputs?: Record<string, unknown>;
  };
  aiMeta: {
    confidence: number;
    provider: string;
    fallbackUsed: boolean;
  };
  error?: string;
}

// ─── Client functions ─────────────────────────────────────────────────────────

/**
 * Submit intake to KeaCore.
 * Returns a structured analysis result including project path, risk flags,
 * recommended services, and operator review flags.
 *
 * Test scenario 1: ADU in DC
 *   startIntake({ address: "1234 U St NW, Washington, DC 20009", projectType: "adu", scopeSummary: "Build a 2-unit ADU in backyard" })
 *
 * Test scenario 2: Permit-only (PG County)
 *   startIntake({ address: "5678 Greenbelt Rd, College Park, MD 20740", projectType: "permit_only", hasPlans: true })
 *
 * Test scenario 3: Multimodal (uploaded plans)
 *   startIntake({ projectType: "renovation", hasImages: true, imageUrl: "https://..." })
 */
export async function startIntake(payload: IntakePayload): Promise<IntakeStartResult> {
  const response = await fetch(`${KEACORE_URL}/keacore/intake/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, source: payload.source ?? "web-main" }),
  });

  if (!response.ok) {
    const error = await response.text();
    return {
      sessionId: "",
      intake: {},
      analysis: {
        summary: "Unable to analyze project at this time.",
        complexity: "medium",
        riskFlags: [],
        missingFields: [],
        requiresOperatorReview: true,
        disclaimers: ["All onsite services must be performed by licensed contractors."],
      },
      workflow: { status: "failed" },
      aiMeta: { confidence: 0, provider: "none", fallbackUsed: false },
      error,
    };
  }

  return response.json() as Promise<IntakeStartResult>;
}

/**
 * Get full execution context for a session.
 * Used by command-center to inspect session state.
 */
export async function getSessionContext(sessionId: string): Promise<Record<string, unknown>> {
  const response = await fetch(`${KEACORE_URL}/keacore/sessions/${sessionId}/execution-context`);
  if (!response.ok) return { error: "Session not found" };
  return response.json() as Promise<Record<string, unknown>>;
}

/**
 * Get recent LLM run stats (from keacore health endpoint).
 */
export async function getHealthStatus(): Promise<{ status: string; providers: Array<{ name: string; available: boolean }> }> {
  const response = await fetch(`${KEACORE_URL}/health`);
  if (!response.ok) return { status: "unavailable", providers: [] };
  return response.json() as Promise<{ status: string; providers: Array<{ name: string; available: boolean }> }>;
}
