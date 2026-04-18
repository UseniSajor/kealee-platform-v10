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
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import {
  intentSeeds,
  workflowTemplateSeeds,
  jurisdictionSeeds,
  serviceOfferingSeeds,
  toolRegistrySeeds,
  ruleSeeds,
  promptPolicySeeds
} from '@kealee/seeds';
// ─── Seed chunk store ─────────────────────────────────────────────────────────
function loadZoningCSV() {
  // Try multiple candidate paths so the module works whether cwd is the monorepo
  // root, services/api, or any other service directory.
  const candidates = [
    path.resolve(process.cwd(), 'data/zoning/dmv_zoning_seed.csv'),
    path.resolve(process.cwd(), '../../data/zoning/dmv_zoning_seed.csv'),
    path.resolve(__dirname, '../../../../data/zoning/dmv_zoning_seed.csv'),
    path.resolve(__dirname, '../../../../../data/zoning/dmv_zoning_seed.csv'),
  ];
  const filePath = candidates.find((p) => fs.existsSync(p));

  if (!filePath) {
    console.warn('[SeedIngest] Zoning CSV not found in any of:', candidates);
    return [];
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');

  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true
  });

  return records.map((row: any) => ({
    id: `zoning_${row.Address.replace(/\s+/g, '_')}`,
    type: 'zoning',
    content: `
Address: ${row.Address}
Jurisdiction: ${row.Jurisdiction}
Zoning: ${row.ZoningCode}
Setbacks: Front ${row.FrontSetback}, Side ${row.SideSetback}, Rear ${row.RearSetback}
Height Limit: ${row.HeightLimit}
Lot Coverage: ${row.LotCoverage}
Permit Authority: ${row.PermitAuthorityURL}
Typical Timeline: ${row.TypicalPermitTimelineDays} days
Notes: ${row.Notes}
    `,
    metadata: {
      jurisdiction: row.Jurisdiction,
      zoning: row.ZoningCode
    }
  }));
}
function ingestZoning(): void {
  const zoningSeeds = loadZoningCSV();

  zoningSeeds.forEach((seed: { id: string; content: string; metadata: Record<string, unknown> }) => {
    const text = seed.content.trim();
    chunkStore.push({
      id: seed.id,
      sourceType: "zoning",
      seedPack: "zoning",
      text,
      metadata: seed.metadata,
      keywords: extractKeywords(text),
    });
  });

  console.log(`[SeedIngest] Loaded ${zoningSeeds.length} zoning seeds`);
}
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
    for (const intent of intentSeeds) {
      addChunk({
        sourceType: "intent",
        seedPack: "intents",
        text: `Intent: ${intent.label}. ${intent.description ?? ""}. Signals: ${(intent.entrySignals ?? []).join(", ")}`,
        metadata: { intentCode: intent.code, category: intent.category },
        workflowCode: intent.defaultWorkflowTemplate,
      });
    }
    console.log(`[SeedIngest] Loaded ${intentSeeds.length} intent seeds`);
  } catch (err) {
    console.warn("[SeedIngest] Could not load intent seeds:", (err as any)?.message);
  }
}

function ingestWorkflows(): void {
  try {
    for (const wf of workflowTemplateSeeds) {
      addChunk({
        sourceType: "workflow",
        seedPack: "workflows",
        text: `Workflow: ${wf.name}. ${wf.description ?? ""}. Steps: ${(wf.steps ?? []).map((s) => s.title).join(", ")}`,
        metadata: { workflowCode: wf.code, appliesToIntents: wf.appliesToIntents },
        workflowCode: wf.code,
      });
    }
    console.log(`[SeedIngest] Loaded ${workflowTemplateSeeds.length} workflow seeds`);
  } catch (err) {
    console.warn("[SeedIngest] Could not load workflow seeds:", (err as any)?.message);
  }
}

function ingestJurisdictions(): void {
  try {
    for (const j of jurisdictionSeeds) {
      addChunk({
        sourceType: "jurisdiction",
        seedPack: "jurisdictions",
        text: `Jurisdiction: ${j.name}. Portal: ${j.permitPortalName} (${j.permitPortalUrl}). Plan upload: ${j.planUploadSystem}. Notes: ${j.notesForKeaCore ?? ""}`,
        metadata: { jurisdictionCode: j.code, permitPortalUrl: j.permitPortalUrl, planUploadSystem: j.planUploadSystem },
        jurisdictionCode: j.code,
      });
    }
    console.log(`[SeedIngest] Loaded ${jurisdictionSeeds.length} jurisdiction seeds`);
  } catch (err) {
    console.warn("[SeedIngest] Could not load jurisdiction seeds:", (err as any)?.message);
  }
}

function ingestServices(): void {
  try {
    for (const svc of serviceOfferingSeeds) {
      addChunk({
        sourceType: "service",
        seedPack: "services",
        text: `Service: ${svc.name}. ${svc.description ?? ""}. Price: $${svc.basePrice}. Category: ${svc.category}. Outputs: ${(svc.includedOutputs ?? []).join(", ")}`,
        metadata: { serviceCode: svc.code, category: svc.category, basePrice: svc.basePrice, billingType: svc.billingType, stripePriceKey: svc.stripePriceKey },
        serviceCode: svc.code,
      });
    }
    console.log(`[SeedIngest] Loaded ${serviceOfferingSeeds.length} service seeds`);
  } catch (err) {
    console.warn("[SeedIngest] Could not load service seeds:", (err as any)?.message);
  }
}

function ingestTools(): void {
  try {
    for (const tool of toolRegistrySeeds) {
      addChunk({
        sourceType: "tool",
        seedPack: "tools",
        text: `Tool: ${tool.name}. ${tool.description ?? ""}. Tags: ${(tool.tags ?? []).join(", ")}`,
        metadata: { toolCode: tool.code, requiresApproval: tool.requiresApproval },
      });
    }
    console.log(`[SeedIngest] Loaded ${toolRegistrySeeds.length} tool seeds`);
  } catch (err) {
    console.warn("[SeedIngest] Could not load tool seeds:", (err as any)?.message);
  }
}

function ingestRules(): void {
  try {
    for (const rule of ruleSeeds) {
      addChunk({
        sourceType: "rule",
        seedPack: "rules",
        text: `Rule: ${rule.code}. ${rule.description ?? ""}. Type: ${rule.type}`,
        metadata: { ruleCode: rule.code, ruleType: rule.type, riskLevel: rule.severity },
      });
    }
    console.log(`[SeedIngest] Loaded ${ruleSeeds.length} rule seeds`);
  } catch (err) {
    console.warn("[SeedIngest] Could not load rule seeds:", (err as any)?.message);
  }
}

function ingestPrompts(): void {
  try {
    for (const prompt of promptPolicySeeds) {
      addChunk({
        sourceType: "prompt",
        seedPack: "prompts",
        text: `Prompt: ${prompt.code}. Type: ${prompt.type}. Applies to: ${(prompt.appliesTo ?? []).join(", ")}`,
        metadata: { promptCode: prompt.code, category: prompt.type },
      });
    }
    console.log(`[SeedIngest] Loaded ${promptPolicySeeds.length} prompt seeds`);
  } catch (err) {
    console.warn("[SeedIngest] Could not load prompt seeds:", (err as any)?.message);
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
  ingestZoning();
  ingested = true;
  console.log(`[SeedIngest] Ingested ${chunkStore.length} seed chunks into retrieval layer`);
}

export function getAllChunks(): SeedChunk[] {
  return chunkStore;
}

export function getChunksByType(sourceType: SeedChunk["sourceType"]): SeedChunk[] {  return chunkStore.filter((c) => c.sourceType === sourceType);
}

export function getChunkByJurisdiction(jurisdictionCode: string): SeedChunk[] {
  return chunkStore.filter((c) => c.jurisdictionCode === jurisdictionCode);
}

export function resetIngest(): void {
  chunkStore.length = 0;
  ingested = false;
}
