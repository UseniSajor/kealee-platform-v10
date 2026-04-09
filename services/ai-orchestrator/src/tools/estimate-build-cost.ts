import { tool } from "@langchain/core/tools";
import { z } from "zod";

// Regional cost multipliers (relative to national average = 1.0)
const REGIONAL_MULTIPLIERS: Record<string, number> = {
  CA: 1.45, NY: 1.50, WA: 1.30, MA: 1.35, CO: 1.15,
  TX: 0.95, FL: 1.00, GA: 0.92, OH: 0.90, IL: 1.10,
  DEFAULT: 1.00,
};

// Base costs per sqft by project type and quality tier
const BASE_COSTS: Record<string, Record<string, number>> = {
  kitchen_remodel:    { standard: 150, mid: 250, high: 450 },
  bathroom_remodel:   { standard: 200, mid: 350, high: 600 },
  addition:           { standard: 180, mid: 280, high: 420 },
  adu:                { standard: 200, mid: 320, high: 500 },
  new_construction:   { standard: 175, mid: 275, high: 450 },
  whole_home_reno:    { standard: 120, mid: 200, high: 350 },
  structural:         { standard: 250, mid: 400, high: 650 },
  garden_landscaping: { standard: 20,  mid: 40,  high: 80  },
  default:            { standard: 150, mid: 250, high: 400 },
};

export const estimateBuildCostTool = tool(
  async ({
    projectType,
    areaSqFt,
    quality = "mid",
    stateCode = "DEFAULT",
  }: {
    projectType: string;
    areaSqFt: number;
    quality?: "standard" | "mid" | "high";
    stateCode?: string;
  }) => {
    const baseCosts = BASE_COSTS[projectType] ?? BASE_COSTS.default;
    const basePer = baseCosts[quality] ?? baseCosts.mid;
    const multiplier = REGIONAL_MULTIPLIERS[stateCode.toUpperCase()] ?? REGIONAL_MULTIPLIERS.DEFAULT;
    const low  = Math.round(basePer * areaSqFt * multiplier * 0.85);
    const high = Math.round(basePer * areaSqFt * multiplier * 1.15);
    return {
      estimatedLow: low,
      estimatedHigh: high,
      perSqFtLow: Math.round(low / areaSqFt),
      perSqFtHigh: Math.round(high / areaSqFt),
      quality,
      stateCode,
      projectType,
      areaSqFt,
      disclaimer:
        "This is a rough cost band for planning purposes only. " +
        "A certified estimate requires detailed scope review.",
    };
  },
  {
    name: "estimate_build_cost",
    description:
      "Estimate construction cost range for a project based on type, area, quality, and region.",
    schema: z.object({
      projectType: z.string().describe("e.g. kitchen_remodel, adu, new_construction"),
      areaSqFt:    z.number().positive().describe("Area in square feet"),
      quality:     z.enum(["standard", "mid", "high"]).optional(),
      stateCode:   z.string().optional().describe("Two-letter US state code for regional pricing"),
    }),
  }
);
