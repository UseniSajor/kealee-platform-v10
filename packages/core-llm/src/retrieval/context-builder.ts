/**
 * core-llm/retrieval/context-builder.ts
 * Assembles the retrieved context for an LLM call.
 *
 * Context includes (in priority order):
 *   1. Normalized intake fields
 *   2. Matched intent + workflow
 *   3. Jurisdiction-specific data
 *   4. Relevant services
 *   5. Applicable rules
 *   6. Recent session memory (tool outputs, risk flags)
 *   7. Prior AI outputs
 *   8. Role context
 */

import { RetrievedContextBlock } from "../types";
import { retrieve, retrieveJurisdiction, retrieveServicesByCategory } from "./retriever";

// ─── Intake shape ─────────────────────────────────────────────────────────────

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

export interface SessionMemorySnapshot {
  riskFlags?: string[];
  toolOutputKeys?: string[];
  matchedIntent?: string;
  matchedWorkflow?: string;
  aiOutputKeys?: string[];
  roleKey?: string;
}

export interface BuiltContext {
  blocks: RetrievedContextBlock[];
  contextText: string;
  blockIds: string[];
  jurisdictionCode?: string;
  matchedWorkflow?: string;
  totalBlocks: number;
}

// ─── Context builder ──────────────────────────────────────────────────────────

export function buildContext(
  intake: NormalizedIntake,
  memory?: SessionMemorySnapshot,
  options?: { maxTokens?: number; sourceTypes?: Array<RetrievedContextBlock["sourceType"]> },
): BuiltContext {
  const maxTokens = options?.maxTokens ?? 3000;
  const blocks: RetrievedContextBlock[] = [];
  const seen = new Set<string>();

  function addBlocks(newBlocks: RetrievedContextBlock[]) {
    for (const b of newBlocks) {
      if (!seen.has(b.id)) {
        seen.add(b.id);
        blocks.push(b);
      }
    }
  }

  // 1. Build query from intake
  const queryParts = [
    intake.projectType,
    intake.scopeSummary,
    intake.city,
    intake.county,
    intake.state,
    memory?.matchedIntent,
    memory?.matchedWorkflow,
    memory?.roleKey,
  ].filter(Boolean);
  const query = queryParts.join(" ");

  // 2. Retrieve jurisdiction context first (highest priority for permit/zoning paths)
  const jurisdictionCode = intake.jurisdictionCode;
  if (jurisdictionCode) {
    addBlocks(retrieveJurisdiction(jurisdictionCode));
  }

  // 3. Retrieve intent + workflow context
  addBlocks(retrieve(query, { sourceTypes: ["intent", "workflow"], topK: 3, jurisdictionCode }));

  // 4. Retrieve relevant services
  const serviceCategory = mapProjectTypeToCategory(intake.projectType ?? "");
  if (serviceCategory) {
    addBlocks(retrieveServicesByCategory(serviceCategory));
  }
  addBlocks(retrieve(query, { sourceTypes: ["service"], topK: 4, jurisdictionCode }));

  // 5. Retrieve applicable rules
  addBlocks(retrieve(query, { sourceTypes: ["rule"], topK: 3, jurisdictionCode }));

  // 6. Retrieve tools
  addBlocks(retrieve(query, { sourceTypes: ["tool"], topK: 2, jurisdictionCode }));

  // 7. Sort by score descending
  blocks.sort((a, b) => b.score - a.score);

  // 8. Build context text (truncated to maxTokens estimate, 4 chars/token)
  let contextText = "";
  const maxChars = maxTokens * 4;
  let charCount = 0;
  const includedBlocks: RetrievedContextBlock[] = [];

  for (const block of blocks) {
    const blockText = `[${block.sourceType.toUpperCase()}:${block.seedPack}]\n${block.content}\n\n`;
    if (charCount + blockText.length > maxChars) break;
    contextText += blockText;
    charCount += blockText.length;
    includedBlocks.push(block);
  }

  // 9. Inject risk flags from memory
  if (memory?.riskFlags && memory.riskFlags.length > 0) {
    const flagsText = `[SESSION RISK FLAGS]\n${memory.riskFlags.join(", ")}\n\n`;
    contextText = flagsText + contextText;
  }

  return {
    blocks: includedBlocks,
    contextText: contextText.trim(),
    blockIds: includedBlocks.map((b) => b.id),
    jurisdictionCode,
    matchedWorkflow: memory?.matchedWorkflow,
    totalBlocks: includedBlocks.length,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapProjectTypeToCategory(projectType: string): string | null {
  const pt = projectType.toLowerCase();
  if (pt.includes("garden") || pt.includes("landscape") || pt.includes("farm")) return "design_garden";
  if (pt.includes("interior")) return "design_interior";
  if (pt.includes("adu") || pt.includes("addition") || pt.includes("renovate")) return "design";
  if (pt.includes("new") || pt.includes("build")) return "design";
  if (pt.includes("permit")) return "permits";
  if (pt.includes("feasib")) return "feasibility";
  if (pt.includes("estimate") || pt.includes("cost")) return "estimate";
  if (pt.includes("developer") || pt.includes("multifamily")) return "developer";
  return null;
}
