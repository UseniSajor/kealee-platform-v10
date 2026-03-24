import { ToolDefinition, ToolContext } from "@kealee/core-agents";
import { z } from "zod";

const Input = z.object({
  projectType: z.string(),
  scopeSummary: z.string().optional(),
  address: z.string().optional(),
  budgetRange: z.string().optional(),
  squareFootage: z.number().optional(),
});

type In = z.infer<typeof Input>;

export interface EstimateResult {
  lowEstimate: number;
  highEstimate: number;
  midpoint: number;
  currency: "USD";
  basis: string;
  lineItems: { category: string; lowCost: number; highCost: number }[];
  caveats: string[];
  nextStep: string;
  source: "live" | "stub";
}

const COST_PER_SQFT: Record<string, { low: number; high: number }> = {
  adu: { low: 250, high: 450 },
  addition: { low: 200, high: 380 },
  renovation: { low: 80, high: 200 },
  new_construction: { low: 220, high: 420 },
  garden: { low: 15, high: 45 },
  interior: { low: 60, high: 180 },
};

function pickCostKey(projectType: string) {
  return (
    Object.keys(COST_PER_SQFT).find((k) => projectType.toLowerCase().includes(k)) ?? "renovation"
  );
}

function parseBudget(range?: string): number | undefined {
  if (!range) return undefined;
  const match = range.match(/(\d[\d,]*)/);
  if (!match) return undefined;
  return parseInt(match[1].replace(/,/g, ""), 10);
}

export const createEstimateTool: ToolDefinition<In, EstimateResult> = {
  name: "create_estimate",
  description: "Generates a rough construction cost estimate with line items and caveats.",
  version: "1.0.0",
  inputSchema: Input,
  idempotent: true,
  tags: ["estimate", "intake", "feasibility"],

  async execute(input: In, _context: ToolContext): Promise<EstimateResult> {
    // TODO: integrate estimating engine (packages/estimating) for real takeoff-based estimate
    const key = pickCostKey(input.projectType);
    const rates = COST_PER_SQFT[key];
    const sqft = input.squareFootage ?? 1200;

    let low = rates.low * sqft;
    let high = rates.high * sqft;

    // If user provided a budget range, use it as a sanity anchor
    const budgetHint = parseBudget(input.budgetRange);
    if (budgetHint && budgetHint > 0) {
      // Shrink range toward the stated budget if plausible
      if (budgetHint < low) low = Math.round(budgetHint * 0.85);
      if (budgetHint > high) high = Math.round(budgetHint * 1.15);
    }

    const midpoint = Math.round((low + high) / 2);

    return {
      lowEstimate: low,
      highEstimate: high,
      midpoint,
      currency: "USD",
      basis: `Rough estimate based on ${sqft} sf @ $${rates.low}–$${rates.high}/sf for ${input.projectType}`,
      lineItems: [
        { category: "Site / Demo", lowCost: Math.round(low * 0.05), highCost: Math.round(high * 0.08) },
        { category: "Structure / Framing", lowCost: Math.round(low * 0.25), highCost: Math.round(high * 0.3) },
        { category: "MEP (Mechanical / Electrical / Plumbing)", lowCost: Math.round(low * 0.2), highCost: Math.round(high * 0.22) },
        { category: "Finishes & Fixtures", lowCost: Math.round(low * 0.2), highCost: Math.round(high * 0.25) },
        { category: "Exterior / Landscaping", lowCost: Math.round(low * 0.1), highCost: Math.round(high * 0.12) },
        { category: "Permits & Fees", lowCost: Math.round(low * 0.03), highCost: Math.round(high * 0.05) },
        { category: "Contingency (10–15%)", lowCost: Math.round(low * 0.1), highCost: Math.round(high * 0.15) },
      ],
      caveats: [
        "This is a rough order-of-magnitude estimate. Final costs depend on design, site conditions, and contractor bids.",
        "Does not include land, financing, or architectural/engineering fees.",
        "Prices reflect general Mid-Atlantic market rates as of 2025.",
      ],
      nextStep: "Get a detailed estimate for $500–$2,000 or book a contractor consultation.",
      source: "stub",
    };
  },
};
