/**
 * long-term.ts
 *
 * Long-term memory namespaces for the Kealee orchestration layer.
 *
 * Stores ONLY durable business facts — not chat noise.
 *
 * Namespaces:
 * - owner_preferences:       style, budget, past project context
 * - contractor_profiles:     trade specialties, geo coverage, performance scores
 * - project_history:         completed project outcomes and lessons
 * - support_history:         recurring support patterns per user/org
 * - jurisdiction_patterns:   local permit timelines, fee structures, submission quirks
 * - deal_context:            active deal state for high-touch engagements
 * - land_analysis_history:   parcel data and feasibility outcomes by address
 */

// ─── Memory namespaces ────────────────────────────────────────────────────────

export type MemoryNamespace =
  | "owner_preferences"
  | "contractor_profiles"
  | "project_history"
  | "support_history"
  | "jurisdiction_patterns"
  | "deal_context"
  | "land_analysis_history";

// ─── In-memory store (replace with a durable store in production) ─────────────
// Production options:
//   - PostgreSQL table via prisma (AIConversation model exists)
//   - Redis with TTL for session-scoped memory
//   - @langchain/langgraph InMemoryStore backed by vector DB for semantic retrieval

type NamespaceStore = Map<string, Record<string, unknown>>;

const STORES: Record<MemoryNamespace, NamespaceStore> = {
  owner_preferences:      new Map(),
  contractor_profiles:    new Map(),
  project_history:        new Map(),
  support_history:        new Map(),
  jurisdiction_patterns:  new Map(),
  deal_context:           new Map(),
  land_analysis_history:  new Map(),
};

// ─── Save a business fact ─────────────────────────────────────────────────────

export function saveMemory(
  namespace: MemoryNamespace,
  key: string,
  value: Record<string, unknown>
): void {
  const existing = STORES[namespace].get(key) ?? {};
  STORES[namespace].set(key, { ...existing, ...value, updatedAt: new Date().toISOString() });
}

// ─── Retrieve a stored fact ───────────────────────────────────────────────────

export function getMemory(
  namespace: MemoryNamespace,
  key: string
): Record<string, unknown> | undefined {
  return STORES[namespace].get(key);
}

// ─── Domain helpers ───────────────────────────────────────────────────────────

export function saveOwnerPreferences(
  userId: string,
  prefs: { style?: string[]; budgetRange?: [number, number]; projectTypes?: string[] }
): void {
  saveMemory("owner_preferences", userId, prefs as Record<string, unknown>);
}

export function getOwnerPreferences(
  userId: string
): { style?: string[]; budgetRange?: [number, number]; projectTypes?: string[] } | undefined {
  return getMemory("owner_preferences", userId) as { style?: string[]; budgetRange?: [number, number]; projectTypes?: string[] } | undefined;
}

export function saveLandAnalysis(
  address: string,
  analysis: Record<string, unknown>
): void {
  const key = address.toLowerCase().replace(/\s+/g, "_");
  saveMemory("land_analysis_history", key, analysis);
}

export function getLandAnalysis(
  address: string
): Record<string, unknown> | undefined {
  const key = address.toLowerCase().replace(/\s+/g, "_");
  return getMemory("land_analysis_history", key);
}

export function saveJurisdictionPattern(
  jurisdiction: string,
  pattern: { avgPermitDays?: number; feeRange?: [number, number]; quirks?: string[] }
): void {
  saveMemory("jurisdiction_patterns", jurisdiction.toLowerCase(), pattern as Record<string, unknown>);
}

export function getJurisdictionPattern(
  jurisdiction: string
): { avgPermitDays?: number; feeRange?: [number, number]; quirks?: string[] } | undefined {
  return getMemory("jurisdiction_patterns", jurisdiction.toLowerCase()) as { avgPermitDays?: number; feeRange?: [number, number]; quirks?: string[] } | undefined;
}
