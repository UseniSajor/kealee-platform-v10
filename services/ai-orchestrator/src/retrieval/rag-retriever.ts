import fs from "fs";
import path from "path";

let ragData: any[] = [];
let ragLoaded = false;

export function loadRAGData() {
  try {
    console.log("[RAG] Starting RAG data load...");
    console.log(`[RAG] Current working directory: ${process.cwd()}`);

    // Support multiple path formats for local + Railway
    const filePaths = [
      "data/rag/full/dmv_full_dataset.jsonl",
      path.join(process.cwd(), "data/rag/full/dmv_full_dataset.jsonl"),
      path.join(__dirname, "../../data/rag/full/dmv_full_dataset.jsonl"),
    ];

    let filePath: string | null = null;
    let raw: string = "";

    for (const tryPath of filePaths) {
      console.log(`[RAG] Attempting to read: ${tryPath}`);
      if (fs.existsSync(tryPath)) {
        console.log(`[RAG] ✅ Found file at: ${tryPath}`);
        raw = fs.readFileSync(tryPath, "utf-8");
        filePath = tryPath;
        break;
      }
    }

    if (!filePath || !raw) {
      throw new Error("JSONL file not found at any expected path");
    }

    ragData = raw
      .split("\n")
      .filter(Boolean)
      .map(line => JSON.parse(line));

    ragLoaded = true;
    console.log(`[RAG] ✅ Successfully loaded: ${ragData.length} records from ${filePath}`);

    // Log sample data for verification
    const permitCount = ragData.filter(r => r.type === "permit").length;
    const zoningCount = ragData.filter(r => r.type === "zoning").length;
    const costCount = ragData.filter(r => r.type === "cost").length;
    const workflowCount = ragData.filter(r => r.type === "workflow").length;

    console.log(`[RAG] Data breakdown: ${permitCount} permits, ${zoningCount} zoning, ${costCount} costs, ${workflowCount} workflows`);
  } catch (err) {
    ragLoaded = false;
    console.error("[RAG] ❌ Failed to load RAG data:", err instanceof Error ? err.message : err);
    ragData = [];
  }
}

export function isRAGLoaded(): boolean {
  return ragLoaded && ragData.length > 0;
}

export function getRAGStatus(): { loaded: boolean; recordCount: number } {
  return { loaded: ragLoaded, recordCount: ragData.length };
}

export function retrievePermitContext(jurisdiction: string, projectType: string) {
  return ragData.filter(r =>
    r.type === "permit" &&
    r.jurisdiction?.toLowerCase().includes(jurisdiction.toLowerCase()) &&
    r.project_types?.includes(projectType)
  ).slice(0, 10);
}

export function retrieveZoningContext(jurisdiction: string) {
  return ragData.filter(r =>
    r.type === "zoning" &&
    r.jurisdiction?.toLowerCase().includes(jurisdiction.toLowerCase())
  ).slice(0, 10);
}

export function retrieveCostContext(projectType: string) {
  return ragData.filter(r =>
    r.type === "cost" &&
    r.project_type === projectType
  ).slice(0, 10);
}

export function retrieveWorkflowContext(stage: string) {
  return ragData.filter(r =>
    r.type === "workflow" &&
    r.stage === stage
  ).slice(0, 10);
}

export function buildRAGContext(input: any) {
  // FAIL-SAFE: Prevent agents from running without RAG data
  if (!ragLoaded || ragData.length === 0) {
    console.warn("[RAG] ⚠️  buildRAGContext called but RAG data not loaded");
    return null;
  }

  const permits = retrievePermitContext(input.jurisdiction || "", input.projectType || "");
  const zoning = retrieveZoningContext(input.jurisdiction || "");
  const costs = retrieveCostContext(input.projectType || "");
  const workflows = retrieveWorkflowContext(input.stage || "");

  if (!permits.length && !zoning.length && !costs.length) {
    console.warn(`[RAG] No context found for: jurisdiction=${input.jurisdiction}, projectType=${input.projectType}`);
    return null;
  }

  return { permits, zoning, costs, workflows };
}
