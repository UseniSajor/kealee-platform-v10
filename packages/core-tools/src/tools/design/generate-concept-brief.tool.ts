import { ToolDefinition, ToolContext } from "@kealee/core-agents";
import { z } from "zod";

const Input = z.object({
  projectType: z.string(),
  scopeSummary: z.string().optional(),
  address: z.string().optional(),
  stylePreferences: z.array(z.string()).optional(),
  budgetRange: z.string().optional(),
});

type In = z.infer<typeof Input>;

export interface ConceptBriefResult {
  conceptType: string;
  headline: string;
  scopePoints: string[];
  designDirections: string[];
  materialSuggestions: string[];
  permitPath: string;
  recommendedPackage: {
    key: string;
    name: string;
    price: number;
    checkoutPath: string;
  };
  source: "live" | "stub";
}

// Maps project type → concept engine path and recommended package
const CONCEPT_MAP: Record<
  string,
  { conceptType: string; checkoutPath: string; packageKey: string; packageName: string; price: number }
> = {
  exterior: {
    conceptType: "exterior",
    checkoutPath: "/intake/exterior_concept",
    packageKey: "EXTERIOR_PROFESSIONAL",
    packageName: "Professional Exterior Concept",
    price: 599,
  },
  garden: {
    conceptType: "garden",
    checkoutPath: "/intake/garden_concept",
    packageKey: "GARDEN_ADVANCED",
    packageName: "Advanced Garden Design",
    price: 750,
  },
  interior: {
    conceptType: "interior",
    checkoutPath: "/intake/interior_concept",
    packageKey: "INTERIOR_ADVANCED",
    packageName: "Advanced Interior Concept",
    price: 750,
  },
  whole_home: {
    conceptType: "whole_home",
    checkoutPath: "/intake/whole_home_concept",
    packageKey: "WHOLE_HOME_ADVANCED",
    packageName: "Advanced Whole Home Design",
    price: 1200,
  },
  developer: {
    conceptType: "developer",
    checkoutPath: "/intake/developer_feasibility",
    packageKey: "DEV_FEASIBILITY",
    packageName: "Full Feasibility Study",
    price: 4500,
  },
  adu: {
    conceptType: "exterior",
    checkoutPath: "/intake/exterior_concept",
    packageKey: "EXTERIOR_PROFESSIONAL",
    packageName: "Professional Exterior Concept",
    price: 599,
  },
};

function resolveConceptType(projectType: string) {
  const key = Object.keys(CONCEPT_MAP).find((k) => projectType.toLowerCase().includes(k));
  return CONCEPT_MAP[key ?? "exterior"];
}

export const generateConceptBriefTool: ToolDefinition<In, ConceptBriefResult> = {
  name: "generate_concept_brief",
  description:
    "Generates a design concept brief and recommends the appropriate concept package for purchase.",
  version: "1.0.0",
  inputSchema: Input,
  idempotent: true,
  tags: ["design", "concept", "intake"],

  async execute(input: In, context: ToolContext): Promise<ConceptBriefResult> {
    // TODO: replace with real AI brief generation (packages/ai LangGraph workflow)
    const conceptMeta = resolveConceptType(input.projectType);
    const styles = input.stylePreferences ?? ["modern", "transitional"];

    return {
      conceptType: conceptMeta.conceptType,
      headline: `${input.projectType} concept for ${input.address ?? "your property"}`,
      scopePoints: [
        `Project type: ${input.projectType}`,
        input.scopeSummary ?? "Full scope to be determined in consultation",
        `Budget range: ${input.budgetRange ?? "TBD"}`,
      ],
      designDirections: [
        `Style: ${styles.join(", ")}`,
        "Material palette to be confirmed with contractor",
        "Concept to include 3 design options for review",
      ],
      materialSuggestions: [
        "Fiber cement siding or LP SmartSide",
        "Architectural shingles or standing seam metal",
        "Composite or Ipe decking for outdoor areas",
      ],
      permitPath: "Building permit likely required. Zoning review recommended.",
      recommendedPackage: {
        key: conceptMeta.packageKey,
        name: conceptMeta.packageName,
        price: conceptMeta.price,
        checkoutPath: conceptMeta.checkoutPath,
      },
      source: "stub",
    };
  },
};
