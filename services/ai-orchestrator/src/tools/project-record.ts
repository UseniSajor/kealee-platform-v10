import { tool } from "@langchain/core/tools";
import { z } from "zod";

const apiBase = () => process.env.INTERNAL_API_URL ?? "http://localhost:3001";
const internalToken = () => process.env.INTERNAL_API_TOKEN ?? "";

async function apiCall(path: string, method: string, body?: unknown) {
  const res = await fetch(`${apiBase()}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-internal-token": internalToken(),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${method} ${path} failed: ${res.status} — ${text}`);
  }
  return res.json();
}

export const createProjectRecordTool = tool(
  async ({
    orgId,
    userId,
    name,
    address,
    projectType,
    scopeSummary,
    budgetMin,
    budgetMax,
  }: {
    orgId?: string;
    userId?: string;
    name?: string;
    address?: string;
    projectType?: string;
    scopeSummary?: string;
    budgetMin?: number;
    budgetMax?: number;
  }) => {
    try {
      const data = await apiCall("/api/v1/projects", "POST", {
        orgId,
        userId,
        name: name ?? `Project — ${address ?? "Unnamed"}`,
        address,
        projectType,
        scopeSummary,
        budgetMin,
        budgetMax,
        source: "orchestrator",
      });
      return { projectId: (data as { id?: string }).id, status: "created" };
    } catch (err) {
      return { error: String(err), status: "failed" };
    }
  },
  {
    name: "create_project_record",
    description: "Create a new project record in the Kealee database.",
    schema: z.object({
      orgId:        z.string().optional(),
      userId:       z.string().optional(),
      name:         z.string().optional(),
      address:      z.string().optional(),
      projectType:  z.string().optional(),
      scopeSummary: z.string().optional(),
      budgetMin:    z.number().optional(),
      budgetMax:    z.number().optional(),
    }),
  }
);

export const updateProjectRecordTool = tool(
  async ({
    projectId,
    updates,
  }: {
    projectId: string;
    updates: Record<string, unknown>;
  }) => {
    try {
      await apiCall(`/api/v1/projects/${projectId}`, "PATCH", updates);
      return { projectId, status: "updated" };
    } catch (err) {
      return { error: String(err), status: "failed" };
    }
  },
  {
    name: "update_project_record",
    description: "Update an existing project record in the Kealee database.",
    schema: z.object({
      projectId: z.string(),
      updates:   z.record(z.unknown()),
    }),
  }
);
