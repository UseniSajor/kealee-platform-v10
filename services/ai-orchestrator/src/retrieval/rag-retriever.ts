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

// ── State ─────────────────────────────────────────────────────────────────────

let ragData: RAGRecord[] = [];
let ragLoaded = false;

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
    if (fs.existsSync(p)) {
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
  const jLower = normalize(jurisdiction);
  const ptLower = normalize(projectType);
  return (ragData.filter(
    r =>
      r.type === "permit" &&
      normalize((r as PermitRecord).jurisdiction).includes(jLower) &&
      (r as PermitRecord).project_types.some(pt => normalize(pt).includes(ptLower))
  ) as PermitRecord[]).slice(0, limit);
}

export function retrieveZoningContext(
  jurisdiction: string,
  limit = 10
): ZoningRecord[] {
  const jLower = normalize(jurisdiction);
  return (ragData.filter(
    r =>
      r.type === "zoning" &&
      normalize((r as ZoningRecord).jurisdiction).includes(jLower)
  ) as ZoningRecord[]).slice(0, limit);
}

export function retrieveCostContext(
  projectType: string,
  jurisdiction?: string,
  limit = 10
): CostRecord[] {
  const ptLower = normalize(projectType);
  const jLower = jurisdiction ? normalize(jurisdiction) : null;
  return (ragData.filter(r => {
    if (r.type !== "cost") return false;
    const c = r as CostRecord;
    if (normalize(c.project_type) !== ptLower) return false;
    if (jLower && !normalize(c.jurisdiction).includes(jLower)) return false;
    return true;
  }) as CostRecord[]).slice(0, limit);
}

export function retrieveWorkflowContext(
  stage: string,
  projectType?: string,
  limit = 10
): WorkflowRecord[] {
  const sLower = normalize(stage);
  const ptLower = projectType ? normalize(projectType) : null;
  return (ragData.filter(r => {
    if (r.type !== "workflow") return false;
    const w = r as WorkflowRecord;
    if (normalize(w.stage) !== sLower) return false;
    if (ptLower && normalize(w.project_type) !== ptLower) return false;
    return true;
  }) as WorkflowRecord[]).slice(0, limit);
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
