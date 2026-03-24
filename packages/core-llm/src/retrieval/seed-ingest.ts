/**
 * core-llm/retrieval/seed-ingest.ts
 * Reads all seed packs from packages/seeds and converts them to retrieval-ready chunks.
 *
 * Seeds are the source of truth for:
 *   intents, workflows, tools, jurisdictions, services, roles, rules, prompts
 *
 * Called at KeaCore boot time to warm the retrieval layer.
 * No vector DB required — chunks stored in-memory with keyword + metadata for retrieval.
 *
 * TODO_DB_TABLE: add SeedChunkIndex table when a vector store (pgvector, Qdrant) is provisioned.
 */

import type { SeedChunk } from "../types";
import { createId } from "../utils/ids";

// ─── Seed chunk store ─────────────────────────────────────────────────────────

const chunkStore: SeedChunk[] = [];
let ingested = false;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    "a", "an", "the", "and", "or", "of", "to", "in", "is", "it", "for",
    "on", "at", "be", "as", "by", "we", "do", "are", "was", "has", "with",
  ]);
  return [...new Set(
    text.toLowerCase().split(/\W+/).filter((w) => w.length > 2 && !stopWords.has(w)),
  )].slice(0, 30);
}

function addChunk(partial: Omit<SeedChunk, "id" | "keywords"> & { text: string }): void {
  chunkStore.push({
    ...partial,
    id: createId("chunk"),
    keywords: extractKeywords(partial.text),
  });
}

// ─── Seed importers ───────────────────────────────────────────────────────────

function ingestIntents(): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { intentSeeds } = require("@kealee/seeds") as {
      intentSeeds: Array<{ code: string; label: string; description?: string; entrySignals?: string[]; defaultWorkflowTemplate?: string; category?: string }>;
    };
    for (const intent of intentSeeds) {
      addChunk({
        sourceType: "intent",
        seedPack: "intents",
        text: `Intent: ${intent.label}. ${intent.description ?? ""}. Signals: ${(intent.entrySignals ?? []).join(", ")}`,
        metadata: { intentCode: intent.code, category: intent.category },
        workflowCode: intent.defaultWorkflowTemplate,
      });
    }
  } catch (_) {
    console.warn("[SeedIngest] Could not load intent seeds");
  }
}

function ingestWorkflows(): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { workflowTemplateSeeds } = require("@kealee/seeds") as {
      workflowTemplateSeeds: Array<{ code: string; name: string; description?: string; appliesToIntents?: string[]; steps?: Array<{ code: string; title: string }> }>;
    };
    for (const wf of workflowTemplateSeeds) {
      addChunk({
        sourceType: "workflow",
        seedPack: "workflows",
        text: `Workflow: ${wf.name}. ${wf.description ?? ""}. Steps: ${(wf.steps ?? []).map((s) => s.title).join(", ")}`,
        metadata: { workflowCode: wf.code, appliesToIntents: wf.appliesToIntents },
        workflowCode: wf.code,
      });
    }
  } catch (_) {
    console.warn("[SeedIngest] Could not load workflow seeds");
  }
}

function ingestJurisdictions(): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { jurisdictionSeeds } = require("@kealee/seeds") as {
      jurisdictionSeeds: Array<{ code: string; name: string; permitPortalName?: string; permitPortalUrl?: string; planUploadSystem?: string; notesForKeaCore?: string }>;
    };
    for (const j of jurisdictionSeeds) {
      addChunk({
        sourceType: "jurisdiction",
        seedPack: "jurisdictions",
        text: `Jurisdiction: ${j.name}. Portal: ${j.permitPortalName} (${j.permitPortalUrl}). Plan upload: ${j.planUploadSystem}. Notes: ${j.notesForKeaCore ?? ""}`,
        metadata: { jurisdictionCode: j.code, permitPortalUrl: j.permitPortalUrl, planUploadSystem: j.planUploadSystem },
        jurisdictionCode: j.code,
      });
    }
  } catch (_) {
    console.warn("[SeedIngest] Could not load jurisdiction seeds");
  }
}

function ingestServices(): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { serviceOfferingSeeds } = require("@kealee/seeds") as {
      serviceOfferingSeeds: Array<{ code: string; name: string; category?: string; description?: string; basePrice?: number; billingType?: string; includedOutputs?: string[]; stripePriceKey?: string }>;
    };
    for (const svc of serviceOfferingSeeds) {
      addChunk({
        sourceType: "service",
        seedPack: "services",
        text: `Service: ${svc.name}. ${svc.description ?? ""}. Price: $${svc.basePrice}. Category: ${svc.category}. Outputs: ${(svc.includedOutputs ?? []).join(", ")}`,
        metadata: { serviceCode: svc.code, category: svc.category, basePrice: svc.basePrice, billingType: svc.billingType, stripePriceKey: svc.stripePriceKey },
        serviceCode: svc.code,
      });
    }
  } catch (_) {
    console.warn("[SeedIngest] Could not load service seeds");
  }
}

function ingestTools(): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { toolRegistrySeeds } = require("@kealee/seeds") as {
      toolRegistrySeeds: Array<{ code: string; name: string; description?: string; tags?: string[]; requiresApproval?: boolean }>;
    };
    for (const tool of toolRegistrySeeds) {
      addChunk({
        sourceType: "tool",
        seedPack: "tools",
        text: `Tool: ${tool.name}. ${tool.description ?? ""}. Tags: ${(tool.tags ?? []).join(", ")}`,
        metadata: { toolCode: tool.code, requiresApproval: tool.requiresApproval },
      });
    }
  } catch (_) {
    console.warn("[SeedIngest] Could not load tool seeds");
  }
}

function ingestRules(): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { ruleSeeds } = require("@kealee/seeds") as {
      ruleSeeds: Array<{ code: string; description?: string; type?: string; severity?: string }>;
    };
    for (const rule of ruleSeeds) {
      addChunk({
        sourceType: "rule",
        seedPack: "rules",
        text: `Rule: ${rule.code}. ${rule.description ?? ""}. Type: ${rule.type}`,
        metadata: { ruleCode: rule.code, ruleType: rule.type, riskLevel: rule.severity },
      });
    }
  } catch (_) {
    console.warn("[SeedIngest] Could not load rule seeds");
  }
}

function ingestPrompts(): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { promptPolicySeeds } = require("@kealee/seeds") as {
      promptPolicySeeds: Array<{ code: string; type?: string; appliesTo?: string[] }>;
    };
    for (const prompt of promptPolicySeeds) {
      addChunk({
        sourceType: "prompt",
        seedPack: "prompts",
        text: `Prompt: ${prompt.code}. Type: ${prompt.type}. Applies to: ${(prompt.appliesTo ?? []).join(", ")}`,
        metadata: { promptCode: prompt.code, category: prompt.type },
      });
    }
  } catch (_) {
    console.warn("[SeedIngest] Could not load prompt seeds");
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function ingestAllSeeds(): void {
  if (ingested) return;
  ingestIntents();
  ingestWorkflows();
  ingestJurisdictions();
  ingestServices();
  ingestTools();
  ingestRules();
  ingestPrompts();
  ingested = true;
  console.log(`[SeedIngest] Ingested ${chunkStore.length} seed chunks into retrieval layer`);
}

export function getAllChunks(): SeedChunk[] {
  return chunkStore;
}

export function getChunksByType(sourceType: SeedChunk["sourceType"]): SeedChunk[] {
  return chunkStore.filter((c) => c.sourceType === sourceType);
}

export function getChunkByJurisdiction(jurisdictionCode: string): SeedChunk[] {
  return chunkStore.filter((c) => c.jurisdictionCode === jurisdictionCode);
}

export function resetIngest(): void {
  chunkStore.length = 0;
  ingested = false;
}
