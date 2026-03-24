import { ToolDefinition, ToolContext } from "@kealee/core-agents";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";

const Input = z.object({
  address: z.string().optional(),
  projectType: z.string(),
  scopeSummary: z.string().optional(),
  budgetRange: z.string().optional(),
  squareFootage: z.number().optional(),
});

type In = z.infer<typeof Input>;

export interface FeasibilityResult {
  viable: boolean;
  confidenceScore: number;
  estimatedCostRange: { low: number; high: number };
  estimatedTimelineMonths: { min: number; max: number };
  riskFlags: string[];
  recommendations: string[];
  nextSteps: string[];
  zoningNotes?: string;
  source: "ai" | "stub";
}

const COST_RANGES: Record<string, { low: number; high: number }> = {
  adu: { low: 120000, high: 280000 },
  addition: { low: 80000, high: 200000 },
  renovation: { low: 40000, high: 150000 },
  interior: { low: 35000, high: 130000 },
  garden: { low: 8000, high: 65000 },
  new_construction: { low: 250000, high: 600000 },
  developer_deal: { low: 500000, high: 5000000 },
  whole_home: { low: 90000, high: 350000 },
  unknown: { low: 50000, high: 300000 },
};

export const runFeasibilityTool: ToolDefinition<In, FeasibilityResult> = {
  name: "run_feasibility",
  description:
    "Runs a feasibility assessment: estimated cost range, timeline, risk flags, viability score, and actionable next steps.",
  version: "2.0.0",
  inputSchema: Input,
  idempotent: true,
  tags: ["feasibility", "estimate", "intake"],

  async execute(input: In, context: ToolContext): Promise<FeasibilityResult> {
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    // Pull prior zoning output from session memory if available
    const zoningOutput = context.memory.outputs?.check_zoning as {
      zoningCode?: string;
      adusPermitted?: boolean;
      riskFlags?: string[];
      jurisdiction?: string;
      note?: string;
    } | undefined;

    if (anthropicKey) {
      const client = new Anthropic({ apiKey: anthropicKey });

      const zoningContext = zoningOutput
        ? `\nZoning context: ${zoningOutput.zoningCode ?? "unknown"} in ${zoningOutput.jurisdiction ?? "unknown jurisdiction"}. ADUs permitted: ${zoningOutput.adusPermitted}. Existing risk flags: ${(zoningOutput.riskFlags ?? []).join(", ") || "none"}.`
        : "";

      const prompt = `You are a construction feasibility analyst specializing in the DMV (DC, Maryland, Virginia) market.

Assess feasibility for this project:
- Project type: ${input.projectType}
- Address: ${input.address ?? "not provided"}
- Scope: ${input.scopeSummary ?? "not provided"}
- Budget range: ${input.budgetRange ?? "not provided"}
- Square footage: ${input.squareFootage ?? "not specified"}${zoningContext}

Respond with ONLY valid JSON in this exact format:
{
  "viable": true/false,
  "confidenceScore": 0-100,
  "estimatedCostRange": {"low": number, "high": number},
  "estimatedTimelineMonths": {"min": number, "max": number},
  "riskFlags": ["array of risk flag codes"],
  "recommendations": ["2-4 specific action recommendations"],
  "nextSteps": ["2-3 specific next paid or free steps"],
  "zoningNotes": "brief note about zoning implications if known"
}

Risk flag codes to use when applicable: missing_address, budget_too_low, scope_unclear, adu_size_restriction, permit_complexity_high, historic_review_required, site_access_concern, structural_uncertainty, multifamily_zoning_required, lender_review_recommended.

Cost estimates should reflect current DMV market rates (2025-2026). Be realistic and specific.`;

      try {
        const response = await client.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        });

        const text = response.content[0].type === "text" ? response.content[0].text.trim() : "";
        const parsed = JSON.parse(text) as Partial<FeasibilityResult>;

        const result: FeasibilityResult = {
          viable: parsed.viable ?? true,
          confidenceScore: parsed.confidenceScore ?? 60,
          estimatedCostRange: parsed.estimatedCostRange ?? { low: 50000, high: 200000 },
          estimatedTimelineMonths: parsed.estimatedTimelineMonths ?? { min: 4, max: 12 },
          riskFlags: parsed.riskFlags ?? [],
          recommendations: parsed.recommendations ?? [],
          nextSteps: parsed.nextSteps ?? [],
          zoningNotes: parsed.zoningNotes,
          source: "ai",
        };

        // Merge new risk flags into session memory
        for (const flag of result.riskFlags) {
          if (!context.memory.riskFlags.includes(flag)) {
            context.memory.riskFlags.push(flag);
          }
        }

        return result;
      } catch (err) {
        console.warn("[run_feasibility] AI call failed, using stub:", err);
      }
    }

    // Stub fallback
    // TODO: connect to packages/ai LangGraph feasibility workflow for deeper analysis
    const typeKey =
      Object.keys(COST_RANGES).find((k) => input.projectType?.toLowerCase().includes(k)) ?? "unknown";
    const costs = COST_RANGES[typeKey];

    const riskFlags: string[] = [];
    if (!input.address) riskFlags.push("missing_address");
    if (!input.scopeSummary) riskFlags.push("scope_unclear");
    if (zoningOutput?.riskFlags?.length) riskFlags.push(...zoningOutput.riskFlags);

    return {
      viable: riskFlags.length < 3,
      confidenceScore: 40,
      estimatedCostRange: costs,
      estimatedTimelineMonths: { min: 4, max: 14 },
      riskFlags,
      recommendations: [
        "Engage a licensed contractor for detailed scope review",
        "Obtain a site survey before finalizing concept",
      ],
      nextSteps: [
        "Purchase a concept package to see design options",
        "Book a PM consultation call",
        "Request a permit path analysis",
      ],
      source: "stub",
    };
  },
};
