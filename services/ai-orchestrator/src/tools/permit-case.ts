import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const createPermitCaseTool = tool(
  async ({
    projectId,
    jurisdiction,
    permitType,
    scopeSummary,
    budgetEstimate,
    userId,
  }: {
    projectId: string;
    jurisdiction: string;
    permitType: string;
    scopeSummary?: string;
    budgetEstimate?: number;
    userId?: string;
  }) => {
    const apiBase = process.env.INTERNAL_API_URL ?? "http://localhost:3001";
    try {
      const res = await fetch(`${apiBase}/api/v1/permits`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-token": process.env.INTERNAL_API_TOKEN ?? "",
        },
        body: JSON.stringify({
          projectId,
          jurisdiction,
          permitType,
          scopeSummary,
          budgetEstimate,
          userId,
          source: "orchestrator",
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        return { error: `Permit API error: ${res.status} — ${text}` };
      }
      const data = (await res.json()) as { id?: string };
      return {
        permitCaseId: data.id,
        status: "opened",
        jurisdiction,
        permitType,
        disclaimer:
          "Permit service represents actual permit execution — " +
          "research, form prep, submission, and tracking. " +
          "This is NOT a vague research-only deliverable.",
      };
    } catch (err) {
      return { error: `Permit API unreachable: ${String(err)}` };
    }
  },
  {
    name: "create_permit_case",
    description:
      "Open a permit case for a project. Initiates the full permit execution workflow.",
    schema: z.object({
      projectId:      z.string(),
      jurisdiction:   z.string(),
      permitType:     z.string().describe("e.g. PERMIT_SIMPLE, PERMIT_PACKAGE, PERMIT_COORDINATION"),
      scopeSummary:   z.string().optional(),
      budgetEstimate: z.number().optional(),
      userId:         z.string().optional(),
    }),
  }
);
