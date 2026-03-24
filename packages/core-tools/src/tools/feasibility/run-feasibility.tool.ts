import { ToolDefinition, ToolContext } from "@kealee/core-agents";
import { z } from "zod";

const Input = z.object({
  address: z.string().optional(),
  projectType: z.string(),
  scopeSummary: z.string().optional(),
  budgetRange: z.string().optional(),
});

type In = z.infer<typeof Input>;

export interface FeasibilityResult {
  viable: boolean;
  confidenceScore: number; // 0–100
  estimatedCostRange: { low: number; high: number };
  estimatedTimelineMonths: { min: number; max: number };
  riskFlags: string[];
  recommendations: string[];
  nextSteps: string[];
  source: "live" | "stub";
}

const COST_RANGES: Record<string, { low: number; high: number }> = {
  adu: { low: 120000, high: 280000 },
  addition: { low: 80000, high: 200000 },
  renovation: { low: 40000, high: 150000 },
  new_construction: { low: 250000, high: 600000 },
  developer_deal: { low: 500000, high: 5000000 },
  unknown: { low: 50000, high: 300000 },
};

export const runFeasibilityTool: ToolDefinition<In, FeasibilityResult> = {
  name: "run_feasibility",
  description:
    "Runs a light feasibility check: estimated cost range, timeline, risk flags, and viability score.",
  version: "1.0.0",
  inputSchema: Input,
  idempotent: true,
  tags: ["feasibility", "estimate", "intake"],

  async execute(input: In, context: ToolContext): Promise<FeasibilityResult> {
    // TODO: connect to real feasibility model (LangGraph workflow in packages/ai)
    const typeKey = Object.keys(COST_RANGES).find((k) =>
      input.projectType?.toLowerCase().includes(k),
    ) ?? "unknown";

    const costs = COST_RANGES[typeKey];
    const riskFlags: string[] = [];
    const recommendations: string[] = [];

    // Derive risk flags from prior zoning output if available
    const zoningOutput = context.memory.outputs?.check_zoning as any;
    if (zoningOutput?.riskFlags?.length) {
      riskFlags.push(...zoningOutput.riskFlags);
    }
    if (zoningOutput && !zoningOutput.adusPermitted && input.projectType?.includes("adu")) {
      riskFlags.push("adu_zoning_conflict");
      recommendations.push("Confirm ADU eligibility with local planning department before proceeding");
    }

    const result: FeasibilityResult = {
      viable: riskFlags.length < 3,
      confidenceScore: 55, // low confidence on stub
      estimatedCostRange: costs,
      estimatedTimelineMonths: { min: 4, max: 14 },
      riskFlags,
      recommendations: [
        ...recommendations,
        "Engage a licensed contractor for detailed scope review",
        "Obtain site survey before finalizing concept",
      ],
      nextSteps: [
        "Purchase concept package to see design options",
        "Book a consultation call with our PM team",
        "Request permit path analysis",
      ],
      source: "stub",
    };

    // Bubble risk flags into session memory
    for (const flag of riskFlags) {
      context.memory.riskFlags.push(flag);
    }

    return result;
  },
};
