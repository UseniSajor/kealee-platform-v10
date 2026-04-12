import fs from "fs";

let ragData: any[] = [];

export function loadRAGData() {
  try {
    const raw = fs.readFileSync("data/rag/full/dmv_full_dataset.jsonl", "utf-8");

    ragData = raw
      .split("\n")
      .filter(Boolean)
      .map(line => JSON.parse(line));

    console.log(`RAG loaded: ${ragData.length} records`);
  } catch (err) {
    console.error("Failed to load RAG data:", err);
    ragData = [];
  }
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
  const permits = retrievePermitContext(input.jurisdiction || "", input.projectType || "");
  const zoning = retrieveZoningContext(input.jurisdiction || "");
  const costs = retrieveCostContext(input.projectType || "");
  const workflows = retrieveWorkflowContext(input.stage || "");

  if (!permits.length && !zoning.length && !costs.length) {
    return null;
  }

  return { permits, zoning, costs, workflows };
}
