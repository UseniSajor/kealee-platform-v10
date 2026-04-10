/**
 * services/ai-orchestrator/src/retrieval/rag-retriever.ts
 *
 * Kealee RAG Retrieval Layer
 *
 * Loads JSONL seed data files and provides keyword + scored retrieval
 * for permit/zoning and cost/workflow context injection into agent prompts.
 *
 * This is the file-based retrieval layer (Phase 1).
 * Phase 2 will replace with pgvector similarity search.
 *
 * Usage:
 *   const ctx = await retrieveContext({ jurisdiction: "Fairfax County, VA", topic: "permit_process", k: 3 });
 *   // Inject ctx.chunks into agent system prompt or user prompt
 */

import { readFileSync, existsSync } from "fs";
import { resolve, join } from "path";

// ─── Record schemas ───────────────────────────────────────────────────────────

export interface PermitZoningRecord {
  id: string;
  jurisdiction: string;
  state: string;
  region: string;
  county_or_city: string;
  document_type: string;
  topic: string;
  source_type: string;
  source_title: string;
  source_url: string;
  content: string;
  tags: string[];
  last_verified_date: string;
  retrieval_weight: number;
  confidence: string;
}

export interface CostRecord {
  type: "cost";
  region: string;
  project_type: string;
  cost_per_sqft_low: number | null;
  cost_per_sqft_high: number | null;
  cost_low: number | null;
  cost_high: number | null;
  description: string;
  assumptions: string[];
  confidence: "HIGH" | "MEDIUM" | "LOW";
  source_type: string;
  last_updated: string;
}

export interface WorkflowRecord {
  type: "workflow";
  stage: string;
  description: string;
  steps: string[];
  inputs_required: string[];
  outputs_generated: string[];
  next_stage: string;
  dependencies: string[];
  risk_flags: string[];
  confidence: "HIGH";
  last_updated: string;
}

export type RAGRecord = PermitZoningRecord | CostRecord | WorkflowRecord;

// ─── Data directory resolution ────────────────────────────────────────────────

function findDataDir(): string {
  // Walk up from this file to find the repo root (contains data/rag/)
  const candidates = [
    resolve(process.cwd(), "data/rag"),
    resolve(process.cwd(), "../../data/rag"),
    resolve(process.cwd(), "../../../data/rag"),
    resolve(process.cwd(), "../../../../data/rag"),
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  // Absolute fallback for production path
  return "/home/user/kealee-platform-v10/data/rag";
}

// ─── JSONL loader ─────────────────────────────────────────────────────────────

function loadJsonl<T>(filePath: string): T[] {
  if (!existsSync(filePath)) return [];
  const lines = readFileSync(filePath, "utf-8").split("\n").filter(Boolean);
  const records: T[] = [];
  for (const line of lines) {
    try {
      records.push(JSON.parse(line) as T);
    } catch {
      // Skip malformed lines
    }
  }
  return records;
}

// ─── In-memory index (loaded once per process) ────────────────────────────────

let _permitZoningRecords: PermitZoningRecord[] | null = null;
let _costRecords: CostRecord[] | null = null;
let _workflowRecords: WorkflowRecord[] | null = null;

function getPermitZoningRecords(): PermitZoningRecord[] {
  if (_permitZoningRecords) return _permitZoningRecords;
  const dir = findDataDir();
  _permitZoningRecords = loadJsonl<PermitZoningRecord>(join(dir, "dmv/dmv_permits_zoning_generated.jsonl"));
  return _permitZoningRecords;
}

function getCostRecords(): CostRecord[] {
  if (_costRecords) return _costRecords;
  const dir = findDataDir();
  const all = loadJsonl<CostRecord | WorkflowRecord>(join(dir, "costs/construction_costs_workflows.jsonl"));
  _costRecords = all.filter((r): r is CostRecord => r.type === "cost");
  return _costRecords;
}

function getWorkflowRecords(): WorkflowRecord[] {
  if (_workflowRecords) return _workflowRecords;
  const dir = findDataDir();
  const all = loadJsonl<CostRecord | WorkflowRecord>(join(dir, "costs/construction_costs_workflows.jsonl"));
  _workflowRecords = all.filter((r): r is WorkflowRecord => r.type === "workflow");
  return _workflowRecords;
}

/** Force reload all data (useful after updates to JSONL files) */
export function invalidateRAGCache(): void {
  _permitZoningRecords = null;
  _costRecords         = null;
  _workflowRecords     = null;
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

function scorePermitRecord(record: PermitZoningRecord, query: PermitQuery): number {
  let score = record.retrieval_weight ?? 0.5;

  // Jurisdiction match — highest signal
  if (query.jurisdiction) {
    const jNorm = query.jurisdiction.toLowerCase();
    if (record.jurisdiction.toLowerCase().includes(jNorm) ||
        record.county_or_city.toLowerCase().includes(jNorm)) {
      score += 1.0;
    } else {
      score -= 0.4; // penalize mismatched jurisdiction
    }
  }

  // Topic match
  if (query.topic && record.topic === query.topic) {
    score += 0.6;
  }

  // Tag match
  if (query.tags?.length) {
    const hits = query.tags.filter((t) => record.tags.includes(t));
    score += hits.length * 0.2;
  }

  // Keyword match in content
  if (query.keywords?.length) {
    const content = record.content.toLowerCase();
    const hits = query.keywords.filter((kw) => content.includes(kw.toLowerCase()));
    score += hits.length * 0.15;
  }

  // Confidence boost
  if (record.confidence === "high") score += 0.1;

  return score;
}

function scoreCostRecord(record: CostRecord, projectType: string): number {
  if (record.project_type === projectType) return 1.0;
  // Partial match
  if (record.project_type.includes(projectType) || projectType.includes(record.project_type)) return 0.5;
  return 0.1;
}

function scoreWorkflowRecord(record: WorkflowRecord, stage: string): number {
  if (record.stage === stage) return 1.0;
  return 0.0;
}

// ─── Query types ──────────────────────────────────────────────────────────────

export interface PermitQuery {
  jurisdiction?: string;
  topic?: string;
  tags?: string[];
  keywords?: string[];
  k?: number; // max results
}

export interface CostQuery {
  projectType: string;
  k?: number;
}

export interface WorkflowQuery {
  stage: string;
  k?: number;
}

// ─── Public retrieval API ─────────────────────────────────────────────────────

/**
 * Retrieve permit/zoning context chunks for a given jurisdiction and topic.
 * Returns the top-k records sorted by relevance score.
 */
export function retrievePermitContext(query: PermitQuery): PermitZoningRecord[] {
  const records = getPermitZoningRecords();
  if (records.length === 0) return [];

  const scored = records
    .map((r) => ({ record: r, score: scorePermitRecord(r, query) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, query.k ?? 5);

  return scored.map((s) => s.record);
}

/**
 * Retrieve cost band records for a given project type.
 */
export function retrieveCostContext(query: CostQuery): CostRecord[] {
  const records = getCostRecords();
  if (records.length === 0) return [];

  return records
    .map((r) => ({ record: r, score: scoreCostRecord(r, query.projectType) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, query.k ?? 3)
    .map((s) => s.record);
}

/**
 * Retrieve workflow stage records.
 */
export function retrieveWorkflowContext(query: WorkflowQuery): WorkflowRecord[] {
  const records = getWorkflowRecords();
  if (records.length === 0) return [];

  return records
    .map((r) => ({ record: r, score: scoreWorkflowRecord(r, query.stage) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, query.k ?? 2)
    .map((s) => s.record);
}

// ─── Combined context builder ─────────────────────────────────────────────────

export interface RAGContext {
  permitChunks: string[];
  costChunks: string[];
  workflowChunks: string[];
  sourceUrls: string[];
  recordCount: number;
}

/**
 * Build a combined RAG context string for injection into agent prompts.
 *
 * Example:
 *   const ctx = buildRAGContext({ jurisdiction: "Fairfax County, VA", projectType: "home_addition", stage: "permit" });
 *   // Inject ctx.combined into the agent prompt
 */
export function buildRAGContext(params: {
  jurisdiction?: string;
  projectType?: string;
  stage?: string;
  topic?: string;
  keywords?: string[];
  k?: number;
}): RAGContext & { combined: string } {
  const permitRecords = params.jurisdiction
    ? retrievePermitContext({
        jurisdiction: params.jurisdiction,
        topic:        params.topic,
        keywords:     params.keywords,
        k:            params.k ?? 4,
      })
    : [];

  const costRecords = params.projectType
    ? retrieveCostContext({ projectType: params.projectType, k: params.k ?? 3 })
    : [];

  const workflowRecords = params.stage
    ? retrieveWorkflowContext({ stage: params.stage, k: 2 })
    : [];

  const permitChunks = permitRecords.map(
    (r) => `[${r.jurisdiction} | ${r.topic}] ${r.content} (Source: ${r.source_title})`
  );

  const costChunks = costRecords.map(
    (r) =>
      `[Cost: ${r.project_type}] ${r.description} ` +
      `Range: ${r.cost_low ? `$${r.cost_low.toLocaleString()}` : "varies"} – ` +
      `${r.cost_high ? `$${r.cost_high.toLocaleString()}` : "varies"}. ` +
      `Assumptions: ${r.assumptions.join(", ")}.`
  );

  const workflowChunks = workflowRecords.map(
    (r) =>
      `[Workflow: ${r.stage}] ${r.description} ` +
      `Steps: ${r.steps.slice(0, 3).join(" → ")}${r.steps.length > 3 ? " ..." : ""}. ` +
      `Outputs: ${r.outputs_generated.join(", ")}.`
  );

  const sourceUrls = permitRecords.map((r) => r.source_url).filter(Boolean);

  const sections: string[] = [];
  if (permitChunks.length > 0) {
    sections.push(`PERMIT/ZONING CONTEXT:\n${permitChunks.join("\n")}`);
  }
  if (costChunks.length > 0) {
    sections.push(`COST REFERENCE DATA:\n${costChunks.join("\n")}`);
  }
  if (workflowChunks.length > 0) {
    sections.push(`WORKFLOW REFERENCE:\n${workflowChunks.join("\n")}`);
  }

  return {
    permitChunks,
    costChunks,
    workflowChunks,
    sourceUrls,
    recordCount: permitRecords.length + costRecords.length + workflowRecords.length,
    combined:    sections.join("\n\n"),
  };
}

// ─── RAG stats (for health checks) ───────────────────────────────────────────

export function getRAGStats(): {
  permitZoningRecords: number;
  costRecords: number;
  workflowRecords: number;
  dataDir: string;
} {
  return {
    permitZoningRecords: getPermitZoningRecords().length,
    costRecords:         getCostRecords().length,
    workflowRecords:     getWorkflowRecords().length,
    dataDir:             findDataDir(),
  };
}
