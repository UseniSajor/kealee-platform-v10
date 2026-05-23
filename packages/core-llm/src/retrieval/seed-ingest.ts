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

const SEEDS_BUILD_HINT = 'pnpm --filter @kealee/seeds build';

type SeedsModule = typeof import('@kealee/seeds');

let seedsModule: SeedsModule | null | undefined;
let seedsLoadHintLogged = false;

function loadSeedsModule(): SeedsModule | null {
  if (seedsModule !== undefined) return seedsModule;
  try {
    // Dynamic require so zoning CSV ingest still works when dist/ is missing.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    seedsModule = require('@kealee/seeds') as SeedsModule;
    return seedsModule;
  } catch (err) {
    seedsModule = null;
    const message = (err as NodeJS.ErrnoException)?.message ?? String(err);
    if (!seedsLoadHintLogged) {
      seedsLoadHintLogged = true;
      console.warn(
        `[SeedIngest] @kealee/seeds not available (${message}). Run: ${SEEDS_BUILD_HINT}`,
      );
    }
    return null;
  }
}
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
  const seeds = loadSeedsModule();
  if (!seeds?.intentSeeds?.length) {
    console.warn('[SeedIngest] Could not load intent seeds');
    return;
  }
  try {
    for (const intent of seeds.intentSeeds) {
      addChunk({
        sourceType: "intent",
        seedPack: "intents",
        text: `Intent: ${intent.label}. ${intent.description ?? ""}. Signals: ${(intent.entrySignals ?? []).join(", ")}`,
        metadata: { intentCode: intent.code, category: intent.category },
        workflowCode: intent.defaultWorkflowTemplate,
      });
    }
    console.log(`[SeedIngest] Loaded ${seeds.intentSeeds.length} intent seeds`);
  } catch (err) {
    console.warn('[SeedIngest] Could not load intent seeds:', (err as Error)?.message);
  }
}

function ingestWorkflows(): void {
  const seeds = loadSeedsModule();
  if (!seeds?.workflowTemplateSeeds?.length) {
    console.warn('[SeedIngest] Could not load workflow seeds');
    return;
  }
  try {
    for (const wf of seeds.workflowTemplateSeeds) {
      addChunk({
        sourceType: "workflow",
        seedPack: "workflows",
        text: `Workflow: ${wf.name}. ${wf.description ?? ""}. Steps: ${(wf.steps ?? []).map((s) => s.title).join(", ")}`,
        metadata: { workflowCode: wf.code, appliesToIntents: wf.appliesToIntents },
        workflowCode: wf.code,
      });
    }
    console.log(`[SeedIngest] Loaded ${seeds.workflowTemplateSeeds.length} workflow seeds`);
  } catch (err) {
    console.warn('[SeedIngest] Could not load workflow seeds:', (err as Error)?.message);
  }
}

function ingestJurisdictions(): void {
  const seeds = loadSeedsModule();
  if (!seeds?.jurisdictionSeeds?.length) {
    console.warn('[SeedIngest] Could not load jurisdiction seeds');
    return;
  }
  try {
    for (const j of seeds.jurisdictionSeeds) {
      addChunk({
        sourceType: "jurisdiction",
        seedPack: "jurisdictions",
        text: `Jurisdiction: ${j.name}. Portal: ${j.permitPortalName} (${j.permitPortalUrl}). Plan upload: ${j.planUploadSystem}. Notes: ${j.notesForKeaCore ?? ""}`,
        metadata: { jurisdictionCode: j.code, permitPortalUrl: j.permitPortalUrl, planUploadSystem: j.planUploadSystem },
        jurisdictionCode: j.code,
      });
    }
    console.log(`[SeedIngest] Loaded ${seeds.jurisdictionSeeds.length} jurisdiction seeds`);
  } catch (err) {
    console.warn('[SeedIngest] Could not load jurisdiction seeds:', (err as Error)?.message);
  }
}

function ingestServices(): void {
  const seeds = loadSeedsModule();
  if (!seeds?.serviceOfferingSeeds?.length) {
    console.warn('[SeedIngest] Could not load service seeds');
    return;
  }
  try {
    for (const svc of seeds.serviceOfferingSeeds) {
      addChunk({
        sourceType: "service",
        seedPack: "services",
        text: `Service: ${svc.name}. ${svc.description ?? ""}. Price: $${svc.basePrice}. Category: ${svc.category}. Outputs: ${(svc.includedOutputs ?? []).join(", ")}`,
        metadata: { serviceCode: svc.code, category: svc.category, basePrice: svc.basePrice, billingType: svc.billingType, stripePriceKey: svc.stripePriceKey },
        serviceCode: svc.code,
      });
    }
    console.log(`[SeedIngest] Loaded ${seeds.serviceOfferingSeeds.length} service seeds`);
  } catch (err) {
    console.warn('[SeedIngest] Could not load service seeds:', (err as Error)?.message);
  }
}

function ingestTools(): void {
  const seeds = loadSeedsModule();
  if (!seeds?.toolRegistrySeeds?.length) {
    console.warn('[SeedIngest] Could not load tool seeds');
    return;
  }
  try {
    for (const tool of seeds.toolRegistrySeeds) {
      addChunk({
        sourceType: "tool",
        seedPack: "tools",
        text: `Tool: ${tool.name}. ${tool.description ?? ""}. Tags: ${(tool.tags ?? []).join(", ")}`,
        metadata: { toolCode: tool.code, requiresApproval: tool.requiresApproval },
      });
    }
    console.log(`[SeedIngest] Loaded ${seeds.toolRegistrySeeds.length} tool seeds`);
  } catch (err) {
    console.warn('[SeedIngest] Could not load tool seeds:', (err as Error)?.message);
  }
}

function ingestRules(): void {
  const seeds = loadSeedsModule();
  if (!seeds?.ruleSeeds?.length) {
    console.warn('[SeedIngest] Could not load rule seeds');
    return;
  }
  try {
    for (const rule of seeds.ruleSeeds) {
      addChunk({
        sourceType: "rule",
        seedPack: "rules",
        text: `Rule: ${rule.code}. ${rule.description ?? ""}. Type: ${rule.type}`,
        metadata: { ruleCode: rule.code, ruleType: rule.type, riskLevel: rule.severity },
      });
    }
    console.log(`[SeedIngest] Loaded ${seeds.ruleSeeds.length} rule seeds`);
  } catch (err) {
    console.warn('[SeedIngest] Could not load rule seeds:', (err as Error)?.message);
  }
}

function ingestPrompts(): void {
  const seeds = loadSeedsModule();
  if (!seeds?.promptPolicySeeds?.length) {
    console.warn('[SeedIngest] Could not load prompt seeds');
    return;
  }
  try {
    for (const prompt of seeds.promptPolicySeeds) {
      addChunk({
        sourceType: "prompt",
        seedPack: "prompts",
        text: `Prompt: ${prompt.code}. Type: ${prompt.type}. Applies to: ${(prompt.appliesTo ?? []).join(", ")}`,
        metadata: { promptCode: prompt.code, category: prompt.type },
      });
    }
    console.log(`[SeedIngest] Loaded ${seeds.promptPolicySeeds.length} prompt seeds`);
  } catch (err) {
    console.warn('[SeedIngest] Could not load prompt seeds:', (err as Error)?.message);
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
