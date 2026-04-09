import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const rankContractorsTool = tool(
  async ({
    projectId,
    projectType,
    jurisdiction,
    budgetMin,
    budgetMax,
    limit = 5,
  }: {
    projectId: string;
    projectType: string;
    jurisdiction: string;
    budgetMin?: number;
    budgetMax?: number;
    limit?: number;
  }) => {
    const apiBase = process.env.INTERNAL_API_URL ?? "http://localhost:3001";
    try {
      const params = new URLSearchParams({
        projectType,
        jurisdiction,
        limit: String(limit),
        ...(budgetMin !== undefined ? { budgetMin: String(budgetMin) } : {}),
        ...(budgetMax !== undefined ? { budgetMax: String(budgetMax) } : {}),
      });
      const res = await fetch(
        `${apiBase}/api/v1/marketplace/contractors/rank?${params}`,
        {
          headers: { "x-internal-token": process.env.INTERNAL_API_TOKEN ?? "" },
        }
      );
      if (!res.ok) {
        return { error: `Contractor ranking API error: ${res.status}` };
      }
      const data = await res.json();
      return { contractors: data, projectId };
    } catch (err) {
      return { error: `Ranking API unreachable: ${String(err)}` };
    }
  },
  {
    name: "rank_contractors",
    description:
      "Rank and return eligible contractors for a project based on type, location, and budget. " +
      "Only callable when contractorReady = true.",
    schema: z.object({
      projectId:   z.string(),
      projectType: z.string(),
      jurisdiction: z.string(),
      budgetMin:   z.number().optional(),
      budgetMax:   z.number().optional(),
      limit:       z.number().int().min(1).max(20).optional(),
    }),
  }
);

export const assignLeadTool = tool(
  async ({
    projectId,
    contractorId,
    message,
  }: {
    projectId: string;
    contractorId: string;
    message?: string;
  }) => {
    const apiBase = process.env.INTERNAL_API_URL ?? "http://localhost:3001";
    try {
      const res = await fetch(`${apiBase}/api/v1/marketplace/leads/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-token": process.env.INTERNAL_API_TOKEN ?? "",
        },
        body: JSON.stringify({ projectId, contractorId, message }),
      });
      if (!res.ok) {
        return { error: `Lead assignment API error: ${res.status}` };
      }
      return { status: "assigned", projectId, contractorId };
    } catch (err) {
      return { error: `Lead assignment API unreachable: ${String(err)}` };
    }
  },
  {
    name: "assign_lead",
    description: "Assign a project lead to a specific contractor.",
    schema: z.object({
      projectId:    z.string(),
      contractorId: z.string(),
      message:      z.string().optional(),
    }),
  }
);
