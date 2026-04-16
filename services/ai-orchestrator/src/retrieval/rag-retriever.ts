/**
 * rag-retriever.ts
 *
 * File-based RAG retrieval layer for the Kealee construction platform.
 * Loads the full DMV dataset at startup, caches in-memory, and provides
 * typed retrieval functions for all four data types.
 *
 * FAIL HARD if dataset is missing — RAG is NOT optional.
 */

import fs from "fs";
import path from "path";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PermitRecord {
  type: "permit";
  jurisdiction: string;
  project_types: string[];
  permit_type: string;
  processing_days: number;
  requirements: string[];
  common_issues: string[];
  fee_base: number;
  fee_per_sqft?: number;
  plan_review_rounds_avg?: number;
  expedited_available?: boolean;
  online_submission?: boolean;
}

export interface ZoningRecord {
  type: "zoning";
  jurisdiction: string;
  zone: string;
  max_lot_coverage: number;
  min_lot_size_sqft: number;
  setback_front: number;
  setback_side: number;
  setback_rear?: number;
  max_height_ft: number;
  adu_allowed: boolean;
  min_adu_sqft?: number;
  max_adu_sqft?: number;
  parking_spaces_required?: number;
  by_right?: boolean;
}

export interface CostRecord {
  type: "cost";
  project_type: string;
  jurisdiction: string;
  cost_per_sqft: number;
  avg_size_sqft: number;
  total_hard_cost_est?: number;
  soft_costs_percent: number;
  contingency_percent: number;
  typical_duration_months: number;
  primary_expense_categories: string[];
  permit_fee_est?: number;
  design_fee_est?: number;
}

export interface WorkflowRecord {
  type: "workflow";
  stage: string;
  project_type: string;
  jurisdiction: string;
  key_steps: string[];
  estimated_days: number;
  deliverables: string[];
  next_stage: string | null;
  required_professionals?: string[];
  common_blockers?: string[];
}

export type RAGRecord = PermitRecord | ZoningRecord | CostRecord | WorkflowRecord;

export interface RAGContext {
  permits: PermitRecord[];
  zoning: ZoningRecord[];
  costs: CostRecord[];
  workflows: WorkflowRecord[];
}

// ── State + Indices ───────────────────────────────────────────────────────────

let ragData:   RAGRecord[] = [];
let ragLoaded = false;

/** O(1) lookup indices built at load time */
const idx = {
  permitsByJurisdiction: new Map<string, PermitRecord[]>(),
  zoningByJurisdiction:  new Map<string, ZoningRecord[]>(),
  costsByProjectType:    new Map<string, CostRecord[]>(),
  workflowsByStage:      new Map<string, WorkflowRecord[]>(),
};

function buildIndices(): void {
  idx.permitsByJurisdiction.clear();
  idx.zoningByJurisdiction.clear();
  idx.costsByProjectType.clear();
  idx.workflowsByStage.clear();

  for (const r of ragData) {
    if (r.type === "permit") {
      const key = normalize((r as PermitRecord).jurisdiction);
      const list = idx.permitsByJurisdiction.get(key) ?? [];
      list.push(r as PermitRecord);
      idx.permitsByJurisdiction.set(key, list);
    } else if (r.type === "zoning") {
      const key = normalize((r as ZoningRecord).jurisdiction);
      const list = idx.zoningByJurisdiction.get(key) ?? [];
      list.push(r as ZoningRecord);
      idx.zoningByJurisdiction.set(key, list);
    } else if (r.type === "cost") {
      const key = normalize((r as CostRecord).project_type);
      const list = idx.costsByProjectType.get(key) ?? [];
      list.push(r as CostRecord);
      idx.costsByProjectType.set(key, list);
    } else if (r.type === "workflow") {
      const key = normalize((r as WorkflowRecord).stage);
      const list = idx.workflowsByStage.get(key) ?? [];
      list.push(r as WorkflowRecord);
      idx.workflowsByStage.set(key, list);
    }
  }
  console.log(`[RAG] Indices built: ${idx.permitsByJurisdiction.size} permit jurisdictions, ${idx.zoningByJurisdiction.size} zoning jurisdictions, ${idx.costsByProjectType.size} project types, ${idx.workflowsByStage.size} workflow stages`);
}

// ── Loader ────────────────────────────────────────────────────────────────────

export function loadRAGData(): void {
  console.log("[RAG] Starting RAG data load...");
  console.log(`[RAG] CWD: ${process.cwd()}`);

  const candidates = [
    "data/rag/full/dmv_full_dataset.jsonl",
    path.join(process.cwd(), "data/rag/full/dmv_full_dataset.jsonl"),
    path.join(__dirname, "../../../../../data/rag/full/dmv_full_dataset.jsonl"),
    path.join(__dirname, "../../../../../../data/rag/full/dmv_full_dataset.jsonl"),
  ];

  let raw: string | null = null;
  let usedPath: string | null = null;

  for (const p of candidates) {
    const exists = fs.existsSync(p);
    console.log(`[RAG] file exists: ${exists} → ${p}`);
    if (exists) {
      raw = fs.readFileSync(p, "utf-8");
      usedPath = p;
      break;
    }
  }

  if (!raw || !usedPath) {
    // FAIL HARD — RAG is mandatory
    const msg = `[RAG] FATAL: dmv_full_dataset.jsonl not found. Tried:\n${candidates.join("\n")}`;
    console.error(msg);
    ragData = [];
    ragLoaded = false;
    return;
  }

  ragData = raw
    .split("\n")
    .filter(Boolean)
    .map((line, i) => {
      try {
        return JSON.parse(line) as RAGRecord;
      } catch {
        console.warn(`[RAG] Skipping invalid JSON at line ${i + 1}`);
        return null;
      }
    })
    .filter((r): r is RAGRecord => r !== null);

  ragLoaded = true;

  const counts = ragData.reduce<Record<string, number>>((acc, r) => {
    acc[r.type] = (acc[r.type] ?? 0) + 1;
    return acc;
  }, {});

  console.log(`[RAG] ✅ Loaded ${ragData.length} records from ${usedPath}`);
  console.log(`[RAG] Breakdown: ${JSON.stringify(counts)}`);
  buildIndices();
}

// ── Status ────────────────────────────────────────────────────────────────────

export function isRAGLoaded(): boolean {
  return ragLoaded && ragData.length > 0;
}

export function getRAGStatus(): { loaded: boolean; recordCount: number } {
  return { loaded: ragLoaded, recordCount: ragData.length };
}

// ── Retrieval functions ───────────────────────────────────────────────────────

function normalize(s: string): string {
  return s.toLowerCase().trim();
}

export function retrievePermitContext(
  jurisdiction: string,
  projectType: string,
  limit = 10
): PermitRecord[] {
  const jLower  = normalize(jurisdiction);
  const ptLower = normalize(projectType);

  // Use index: find all jurisdictions that contain the search term
  const candidates: PermitRecord[] = [];
  for (const [key, records] of idx.permitsByJurisdiction) {
    if (key.includes(jLower)) candidates.push(...records);
  }
  const filtered = ptLower
    ? candidates.filter(p => p.project_types.some(pt => normalize(pt).includes(ptLower)))
    : candidates;
  return filtered.slice(0, limit);
}

export function retrieveZoningContext(
  jurisdiction: string,
  limit = 10
): ZoningRecord[] {
  const jLower = normalize(jurisdiction);
  const candidates: ZoningRecord[] = [];
  for (const [key, records] of idx.zoningByJurisdiction) {
    if (key.includes(jLower)) candidates.push(...records);
  }
  return candidates.slice(0, limit);
}

export function retrieveCostContext(
  projectType: string,
  jurisdiction?: string,
  limit = 10
): CostRecord[] {
  const ptLower = normalize(projectType);
  const jLower  = jurisdiction ? normalize(jurisdiction) : null;

  // Exact project_type match first via index
  let candidates = idx.costsByProjectType.get(ptLower) ?? [];

  // Partial match fallback if no exact hit
  if (!candidates.length) {
    for (const [key, records] of idx.costsByProjectType) {
      if (key.includes(ptLower) || ptLower.includes(key)) candidates.push(...records);
    }
  }

  if (jLower) {
    candidates = candidates.filter(c => normalize(c.jurisdiction).includes(jLower));
  }
  return candidates.slice(0, limit);
}

export function retrieveWorkflowContext(
  stage: string,
  projectType?: string,
  limit = 10
): WorkflowRecord[] {
  const sLower  = normalize(stage);
  const ptLower = projectType ? normalize(projectType) : null;

  const candidates = idx.workflowsByStage.get(sLower) ?? [];
  const filtered = ptLower
    ? candidates.filter(w => normalize(w.project_type) === ptLower)
    : candidates;
  return filtered.slice(0, limit);
}

// ── Context builder ───────────────────────────────────────────────────────────

export interface RAGInput {
  jurisdiction?: string;
  projectType?: string;
  stage?: string;
}

export function buildRAGContext(input: RAGInput): RAGContext | null {
  if (!isRAGLoaded()) {
    console.error("[RAG] buildRAGContext called but RAG not loaded — FAIL HARD");
    return null;
  }

  const { jurisdiction = "", projectType = "", stage = "" } = input;

  const permits   = retrievePermitContext(jurisdiction, projectType);
  const zoning    = retrieveZoningContext(jurisdiction);
  const costs     = retrieveCostContext(projectType, jurisdiction);
  const workflows = retrieveWorkflowContext(stage, projectType);

  if (!permits.length && !zoning.length && !costs.length) {
    console.warn(`[RAG] No context for jurisdiction="${jurisdiction}" projectType="${projectType}"`);
    return null;
  }

  return { permits, zoning, costs, workflows };
}
