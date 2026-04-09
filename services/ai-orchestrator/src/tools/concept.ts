import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const generateConceptTool = tool(
  async ({
    projectId,
    projectType,
    style,
    budget,
    scopeSummary,
  }: {
    projectId: string;
    projectType: string;
    style?: string;
    budget?: number;
    scopeSummary?: string;
  }) => {
    // TODO: connect to packages/concept-engine or AutoDesignSession workflow
    // This triggers the AI design session pipeline
    return {
      conceptId: `concept_${projectId}_${Date.now()}`,
      status: "queued",
      estimatedDelivery: "24-48 hours",
      deliverables: [
        "3 AI-generated exterior/interior renderings",
        "Floor plan options (2 variants)",
        "Design brief with style notes",
        "Project scope summary",
      ],
      warning:
        "AI concept packages are design intent visualizations only. " +
        "They are NOT permit-ready stamped construction documents.",
      nextStep: "ESTIMATE_DETAILED",
    };
  },
  {
    name: "generate_concept",
    description:
      "Queue an AI concept design package for a project. Returns concept ID and delivery timeline.",
    schema: z.object({
      projectId:    z.string(),
      projectType:  z.string(),
      style:        z.string().optional(),
      budget:       z.number().optional(),
      scopeSummary: z.string().optional(),
    }),
  }
);
