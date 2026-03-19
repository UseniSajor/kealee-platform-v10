import { tool } from "@langchain/core/tools";
import { z } from "zod";
import type {
  Complexity,
  DesignBrief,
  PermitPathSummary,
  SiteContext,
  VisionAnalysis,
} from "./types";

function id(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function imageSet(prefix: string, count: number) {
  return Array.from({ length: count }, (_, i) => {
    return `https://dummy.kealee.local/${prefix}-${i + 1}.jpg`;
  });
}

export const createIntakeRecord = tool(
  async (input) => {
    return {
      intakeId: id("intake"),
      createdAt: new Date().toISOString(),
      ...input,
    };
  },
  {
    name: "createIntakeRecord",
    description: "Create a new intake record.",
    schema: z.object({
      clientName: z.string(),
      contactEmail: z.string().email(),
      contactPhone: z.string().optional(),
      projectAddress: z.string(),
      projectType: z.string(),
    }),
  },
);

export const updateIntakeRecord = tool(
  async (input) => {
    return {
      updated: true,
      intakeId: input.intakeId,
      fields: input.fields,
      updatedAt: new Date().toISOString(),
    };
  },
  {
    name: "updateIntakeRecord",
    description: "Update an intake record.",
    schema: z.object({
      intakeId: z.string(),
      fields: z.record(z.string(), z.any()),
    }),
  },
);

export const fetchPropertyContext = tool(
  async (input): Promise<SiteContext & { jurisdiction: string }> => {
    return {
      jurisdiction: input.projectAddress.includes("DC") ? "Washington, DC" : "Prince George's County, MD",
      streetViewAvailable: true,
      satelliteViewAvailable: true,
      visibleBuildingFootprintNotes: "Approximate rectangular single-family footprint visible from map context.",
      topographyNotes: "Mostly flat front setback with minor side grade variation.",
      neighborhoodContextNotes: "Predominantly brick and siding homes with moderate front-yard landscaping.",
    };
  },
  {
    name: "fetchPropertyContext",
    description: "Fetch basic property context from address input.",
    schema: z.object({
      projectAddress: z.string(),
    }),
  },
);

export const analyzeUploadedPhotos = tool(
  async (_input): Promise<VisionAnalysis> => {
    return {
      buildingType: "single-family detached",
      estimatedStories: "2",
      roofForm: "gable",
      facadeMaterials: ["brick", "painted trim"],
      siteFeatures: ["front walk", "driveway", "small porch"],
      landscapeConditions: ["sparse foundation planting", "patchy lawn"],
      confidence: 0.81,
    };
  },
  {
    name: "analyzeUploadedPhotos",
    description: "Analyze uploaded property photos.",
    schema: z.object({
      intakeId: z.string(),
      photoUrls: z.array(z.string().url()).min(1),
    }),
  },
);

export const classifyProjectComplexity = tool(
  async (input): Promise<{ projectComplexity: Complexity; humanReviewRequired: boolean; reasons: string[] }> => {
    const reasons: string[] = [];
    let projectComplexity: Complexity = "low";

    if (
      input.projectType.toLowerCase().includes("addition") ||
      input.propertyUse?.toLowerCase().includes("multi") ||
      input.knownConstraints.some((c) => /slope|historic|retaining|structural/i.test(c)) ||
      input.visionAnalysis.confidence < 0.7
    ) {
      projectComplexity = "medium";
      reasons.push("non-trivial scope or lower confidence");
    }

    if (
      input.propertyUse?.toLowerCase().includes("mixed") ||
      input.projectType.toLowerCase().includes("multifamily")
    ) {
      projectComplexity = "high";
      reasons.push("commercial or mixed-use complexity");
    }

    return {
      projectComplexity,
      humanReviewRequired: projectComplexity !== "low",
      reasons,
    };
  },
  {
    name: "classifyProjectComplexity",
    description: "Classify project complexity.",
    schema: z.object({
      projectType: z.string(),
      propertyUse: z.string().optional().default("residential"),
      goals: z.array(z.string()).default([]),
      visionAnalysis: z.object({
        confidence: z.number(),
      }),
      knownConstraints: z.array(z.string()).default([]),
    }),
  },
);

export const generateDesignBrief = tool(
  async (input): Promise<DesignBrief> => {
    return {
      id: id("brief"),
      summary: input.projectSummary,
      facadeStrategy: "Modernized curb appeal while preserving main massing and existing structural geometry.",
      landscapeStrategy: "Layered front-yard planting, edge cleanup, path emphasis, and foundation softening.",
      materials: input.desiredMaterials?.length ? input.desiredMaterials : ["fiber cement accents", "black metal details", "stone skirt"],
      palette: input.preferredColorPalette?.length ? input.preferredColorPalette : ["warm white", "charcoal", "natural wood"],
      budgetDirection: input.budgetRange,
    };
  },
  {
    name: "generateDesignBrief",
    description: "Generate a structured design brief.",
    schema: z.object({
      intakeId: z.string(),
      projectSummary: z.string(),
      stylePreferences: z.array(z.string()),
      desiredMaterials: z.array(z.string()).optional(),
      preferredColorPalette: z.array(z.string()).optional(),
      visionAnalysis: z.record(z.string(), z.any()),
      siteContext: z.record(z.string(), z.any()),
      budgetRange: z.string(),
    }),
  },
);

export const generateExteriorConceptImages = tool(
  async (input) => {
    return {
      designBriefId: input.designBriefId,
      images: imageSet("exterior", input.variations),
    };
  },
  {
    name: "generateExteriorConceptImages",
    description: "Generate exterior concept image URLs.",
    schema: z.object({
      intakeId: z.string(),
      designBriefId: z.string(),
      variations: z.number().int().min(1).max(6),
      imageStyle: z.string().default("photoreal"),
      preserveStructure: z.boolean().default(true),
    }),
  },
);

export const generateLandscapeConceptImages = tool(
  async (input) => {
    return {
      designBriefId: input.designBriefId,
      images: imageSet("landscape", input.variations),
    };
  },
  {
    name: "generateLandscapeConceptImages",
    description: "Generate landscape concept image URLs.",
    schema: z.object({
      intakeId: z.string(),
      designBriefId: z.string(),
      zones: z.array(z.string()),
      variations: z.number().int().min(1).max(6),
    }),
  },
);

export const generatePermitPathSummary = tool(
  async (input): Promise<PermitPathSummary> => {
    return {
      likelyPermitNeeded: /addition|deck|porch|driveway/i.test(input.projectType),
      likelyDesignReviewNeeded: input.projectComplexity !== "low",
      likelyTradePermits: /lighting|electrical/i.test(input.projectType) ? ["electrical"] : [],
      notes: [
        `Preliminary path to approval for ${input.jurisdiction || "the local jurisdiction"}.`,
        "Final code, zoning, and permit requirements must be confirmed during professional review.",
      ],
    };
  },
  {
    name: "generatePermitPathSummary",
    description: "Generate a preliminary permit path summary.",
    schema: z.object({
      projectAddress: z.string(),
      jurisdiction: z.string().optional(),
      projectType: z.string(),
      propertyUse: z.string().optional(),
      projectComplexity: z.enum(["low", "medium", "high"]),
      knownConstraints: z.array(z.string()).default([]),
    }),
  },
);

export const buildClientConceptPackageDraft = tool(
  async (input) => {
    return {
      packageDraftId: id("pkg"),
      intakeId: input.intakeId,
      sections: [
        "intake_summary",
        "design_brief",
        "exterior_concepts",
        "landscape_concepts",
        "permit_path",
      ],
      exteriorImages: input.exteriorImages,
      landscapeImages: input.landscapeImages,
      permitPathSummary: input.permitPathSummary,
    };
  },
  {
    name: "buildClientConceptPackageDraft",
    description: "Build the draft client package.",
    schema: z.object({
      intakeId: z.string(),
      designBriefId: z.string(),
      exteriorImages: z.array(z.string()).default([]),
      landscapeImages: z.array(z.string()).default([]),
      permitPathSummary: z.record(z.string(), z.any()),
    }),
  },
);

export const routeToCommandCenterReview = tool(
  async (input) => {
    return {
      queued: true,
      queueId: id("review"),
      reviewReason: input.reviewReason,
      priority: input.priority,
    };
  },
  {
    name: "routeToCommandCenterReview",
    description: "Queue for PM review.",
    schema: z.object({
      intakeId: z.string(),
      reviewReason: z.string(),
      priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]),
    }),
  },
);

export const exteriorConceptTools = [
  createIntakeRecord,
  updateIntakeRecord,
  fetchPropertyContext,
  analyzeUploadedPhotos,
  classifyProjectComplexity,
  generateDesignBrief,
  generateExteriorConceptImages,
  generateLandscapeConceptImages,
  generatePermitPathSummary,
  buildClientConceptPackageDraft,
  routeToCommandCenterReview,
];
